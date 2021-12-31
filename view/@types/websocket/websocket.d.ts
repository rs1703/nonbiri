import { Task } from "../../src/constants";

declare global {
  interface WebSocketError {
    code: number;
    message?: string;
  }

  interface IncomingMessage<T = any> {
    identifier?: number;
    task: Task;
    body?: T;
    error?: WebSocketError;
  }

  interface OutgoingMessage<T = any> {
    identifier: number;
    task: Task;
    body?: T;
  }
}
