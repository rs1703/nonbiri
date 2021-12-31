import React, { useEffect, useMemo, useState } from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route, Switch, useLocation } from "react-router-dom";
import AppContext from "./AppContext";
import Browse from "./Components/Browse";
import History from "./Components/History";
import Library from "./Components/Library";
import Manga from "./Components/Manga";
import Reader from "./Components/Reader";
import Updates from "./Components/Updates";
import { routes } from "./Config";
import { Task } from "./constants";
import "./styles/App.less";
import { deepClone } from "./utils/encoding";
import Sync from "./utils/Sync";
import websocket, { GetLibrary, GetPrefs, GetTags } from "./websocket";

const App = (initialContext: AppContext) => {
  const [context, setContext] = useState<AppContext>(initialContext);
  const { pathname } = useLocation();

  useEffect(() => {
    const updateData = ({ body }: IncomingMessage<Manga>) => {
      if (!body) return;
      console.info("[Global] Synchronizing data...");
      setContext(prevState => {
        const library = Array.from(prevState.library ?? []);

        const data = library.find(m => m.id === body.id);
        if (data) {
          Object.assign(data, body);
        } else if (body.followed) {
          library.push(body);
        }

        return { ...prevState, library };
      });
    };

    const updateChapters = ({ body }: IncomingMessage<Chapter[]>) => {
      if (!body) return;
      console.info("[Global] Synchronizing chapters...");
      setContext(prevState => {
        const library = Array.from(prevState.library ?? []);

        const data = library.find(m => m.id === body[0].mangaId);
        if (data) {
          for (let i = 0; i < body.length; i++) {
            const chapter = data.chapters?.find(c => c.id === body[i].id);
            if (chapter) {
              Object.assign(chapter, body[i]);
            } else {
              if (!Array.isArray(data.chapters)) {
                data.chapters = [];
              }
              data.chapters.push(body[i]);
            }
          }
        }

        return { ...prevState, library };
      });
    };

    const updateHistories = ({ body }: IncomingMessage<ReadState[]>) => {
      if (!body) return;
      console.info("[Global] Synchronizing histories...");
      setContext(prevState => {
        const library = Array.from(prevState.library ?? []);

        const data = library.find(m => m.id === body[0].mangaId);
        if (data?.chapters?.length) {
          let isCloned = false;
          for (let i = 0; i < body.length; i++) {
            const history = body[i];

            const idx = data.chapters.findIndex(c => c.id === history.chapterId);
            if (idx >= 0) {
              if (!isCloned) {
                isCloned = true;
                data.chapters = deepClone(data.chapters);
              }

              const chapter = data.chapters[idx];
              if (chapter) {
                if (history.readed) {
                  if (!chapter.history?.readed) {
                    data.readedChapters += 1;
                  }
                } else if (chapter.history?.readed) {
                  data.readedChapters -= 1;
                }
                Object.assign((chapter.history ??= {} as ReadState), history);
              }
            }
          }
        }

        return { ...prevState, library };
      });
    };

    websocket.Handle(Task.GetManga, updateData);
    websocket.Handle(Task.UpdateManga, updateData);
    websocket.Handle(Task.FollowManga, updateData);
    websocket.Handle(Task.UnfollowManga, updateData);

    websocket.Handle(Task.GetChapters, updateChapters);
    websocket.Handle(Task.UpdateChapters, updateChapters);

    websocket.Handle(Task.ReadPage, ({ body }: IncomingMessage<ReadState>) => {
      if (!body) return;
      console.info("[Global] Synchronizing history...");
      setContext(prevState => {
        const library = Array.from(prevState.library ?? []);

        const data = library.find(m => m.id === body.mangaId);
        if (data?.chapters?.length) {
          data.chapters = Sync.History(deepClone(data.chapters), body);
        }

        return { ...prevState, library };
      });
    });
    websocket.Handle(Task.ReadChapter, updateHistories);
    websocket.Handle(Task.UnreadChapter, updateHistories);

    websocket.Handle<Manga[]>(Task.Library, ({ body }) => {
      console.info("[Global] Synchronizing library...");
      setContext(prevState => {
        const library = Sync.All(prevState.library, body);
        return { ...prevState, library };
      });
    });

    websocket.Handle<BrowsePreference>(Task.UpdateBrowsePreference, ({ body }) => {
      if (!body) return;
      console.info("[Global] Synchronizing browse preference...");
      setContext(prevState => ({ ...prevState, prefs: { ...prevState.prefs, browse: { ...body } } }));
    });

    websocket.Handle<LibraryPreference>(Task.UpdateLibraryPreference, ({ body }) => {
      if (!body) return;
      console.info("[Global] Synchronizing library preference...");
      setContext(prevState => ({ ...prevState, prefs: { ...prevState.prefs, library: { ...body } } }));
    });

    websocket.Handle<ReaderPreference>(Task.UpdateReaderPreference, ({ body }) => {
      if (!body) return;
      console.info("[Global] Synchronizing reader preference...");
      setContext(prevState => ({ ...prevState, prefs: { ...prevState.prefs, reader: { ...body } } }));
    });
  }, []);

  return (
    <AppContext.Provider value={useMemo(() => ({ context, setContext }), [context])}>
      <Switch>
        <Route path={routes.browse} component={Browse} />
        <Route path={`${routes.manga}/:id`} component={Manga} key={pathname} />
        <Route path={`${routes.reader}/:id/:cid`} component={Reader} key={pathname} />
        <Route path={routes.updates} component={Updates} />
        <Route path={routes.history} component={History} />
        <Route path={routes.library} component={Library} />
      </Switch>
    </AppContext.Provider>
  );
};

// Entry point
const main = async () => {
  const container = document.getElementById("app");
  if (!container) return;

  await websocket.Init();

  let prefs: Prefs;
  let tags: Tag[];
  let library: Manga[];
  let error: string;

  // eslint-disable-next-line prefer-const
  ({ response: prefs, error } = await GetPrefs());
  if (error) {
    console.error(error);
    container.textContent = error;
    return;
  }

  // eslint-disable-next-line prefer-const
  ({ response: tags, error } = await GetTags());
  if (error) {
    console.error(error);
    container.textContent = error;
    return;
  }

  // eslint-disable-next-line prefer-const
  ({ response: library, error } = await GetLibrary());
  if (error) {
    console.error(error);
    container.textContent = error;
    return;
  }

  render(
    <Router>
      <App prefs={prefs} tags={tags} library={library} />
    </Router>,
    container
  );
};
main();
