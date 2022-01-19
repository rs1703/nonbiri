import { FollowState, Task } from "./constants";

interface Result<T = any> {
  response?: T;
  error?: string;
}

type TaskHandler<T = any> = (message: IncomingMessage<T>) => void;
const taskHandlers: { [idx: number]: TaskHandler[] } = {};

let instance: WebSocket;
let identifier = 1;

const Init = (): Promise<void> => {
  if (instance && instance.readyState === WebSocket.OPEN) {
    return Promise.resolve();
  }

  let resolved = false;
  return new Promise(r => {
    const resolve = () => {
      if (!resolved) {
        resolved = true;
        r();
      }
    };

    instance = new WebSocket(`ws://${window.location.host}/ws`);
    identifier = 1;

    instance.addEventListener("open", () => {
      resolve();

      instance.addEventListener("message", (ev: MessageEvent) => {
        const message: IncomingMessage = JSON.parse(ev.data);
        const handlers = taskHandlers[message.task];
        if (Array.isArray(handlers)) {
          handlers.forEach(handler => handler(message));
        }
      });

      instance.addEventListener("close", () => {
        instance = undefined;
        // Reconnect every 10s
        const reconnectInterval = window.setInterval(() => {
          if (instance && instance.readyState === WebSocket.OPEN) clearInterval(reconnectInterval);
          else Init().then(resolve);
        }, 10000);
      });
    });
  });
};

const SendMessage = <T>(task: Task, body?: any): Promise<Result<T>> => {
  const promise = new Promise<Result<T>>((resolve, reject) => {
    if (instance?.readyState !== WebSocket.OPEN) {
      reject(Error("WebSocket is closed"));
      return;
    }

    const message: OutgoingMessage = { identifier, task, body };
    identifier++;

    const onReply = (ev: MessageEvent) => {
      const response: IncomingMessage<T> = JSON.parse(ev.data);
      if (response.identifier === message.identifier) {
        instance.removeEventListener("message", onReply);
        if (response.error) {
          reject(response.error);
        } else {
          resolve({ response: response.body });
        }
      }
    };

    instance.addEventListener("message", onReply);
    instance.send(JSON.stringify(message));
  });
  return promise.catch(error => ({ error }));
};

type RemoveHandler = () => void;
const Handle = <T>(task: Task, handler: TaskHandler<T>): RemoveHandler => {
  if (!Array.isArray(taskHandlers[task])) {
    taskHandlers[task] = [];
  }
  taskHandlers[task].push(handler);
  return () => {
    const handlers = taskHandlers[task];
    for (let i = 0; i < handlers.length; i++) {
      if (handlers[i] === handler) {
        taskHandlers[task].splice(i, 1);
        break;
      }
    }
  };
};

//

export const GetManga = (mangaId: string) => SendMessage<Manga>(Task.GetManga, mangaId);

export const UpdateManga = (mangaId: string) => SendMessage<Manga>(Task.UpdateManga, mangaId);

export const FollowManga = (mangaId: string, followState: FollowState) =>
  SendMessage<Manga>(Task.FollowManga, { mangaId, followState });

export const UnfollowManga = (mangaId: string) => SendMessage<Manga>(Task.UnfollowManga, mangaId);

//

export const GetChapter = (chapterId: string) => SendMessage<Chapter>(Task.GetChapter, chapterId);

export const UpdateChapter = (chapterId: string) => SendMessage<Chapter>(Task.UpdateChapter, chapterId);

export const GetChapters = (mangaId: string) => SendMessage<Chapter[]>(Task.GetChapters, mangaId);

export const UpdateChapters = (mangaId: string) => SendMessage<Chapter[]>(Task.UpdateChapters, mangaId);

//

export const ReadPage = (chapterId: string, page: number) => SendMessage<ReadState>(Task.ReadPage, { chapterId, page });

export const ReadChapter = (...chapterIds: string[]) =>
  SendMessage<ReadState[]>(Task.ReadChapter, chapterIds.length > 1 ? { chapterIds } : { chapterId: chapterIds[0] });

export const UnreadChapter = (...chapterIds: string[]) =>
  SendMessage<ReadState[]>(Task.UnreadChapter, chapterIds.length > 1 ? { chapterIds } : { chapterId: chapterIds[0] });

export const GetPages = (chapterId: string) => SendMessage<Chapter>(Task.GetPages, chapterId);

//

export const GetLibrary = () => SendMessage<Manga[]>(Task.Library);

export const GetBrowse = (q: BrowseQuery) => SendMessage<BrowseData>(Task.Browse, q);

export const GetTags = () => SendMessage<Tag[]>(Task.Tags);

export const GetUpdates = () => SendMessage<Chapter[]>(Task.Updates);

export const GetHistory = () => SendMessage<ReadState[]>(Task.History);

//

export const GetPrefs = () => SendMessage<Prefs>(Task.GetPrefs);

export const GetBrowsePreference = () => SendMessage<BrowsePreference>(Task.GetBrowsePreference);

export const GetLibraryPreference = () => SendMessage<LibraryPreference>(Task.GetLibraryPreference);

export const GetReaderPreference = () => SendMessage<ReaderPreference>(Task.GetReaderPreference);

//

export const UpdateBrowsePreference = (data: BrowsePreference) =>
  SendMessage<BrowsePreference>(Task.UpdateBrowsePreference, data);

export const UpdateLibraryPreference = (data: LibraryPreference) =>
  SendMessage<LibraryPreference>(Task.UpdateLibraryPreference, data);

export const UpdateReaderPreference = (data: ReaderPreference) =>
  SendMessage<ReaderPreference>(Task.UpdateReaderPreference, data);

//

export const UpdateLibrary = () => SendMessage<LibraryUpdateState>(Task.UpdateLibrary);

export const GetUpdateLibraryState = () => SendMessage<LibraryUpdateState>(Task.GetUpdateLibraryState);

//

export default {
  Init,
  Handle
};
