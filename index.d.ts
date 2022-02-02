interface Action {
  type: String;
}

interface ActionWithPayload<T> extends Action {
  payload?: T;
  [key: string]: any;
}

interface Dispatch<T> {
  (arg: T): void;
}

declare interface Cancel {
  (): void;
}

export interface ListenerJustWithAction<T> {
  (action: ActionWithPayload<T>): void;
}

export declare interface ListenerForEnd<T, U> {
  (response: T, action: ActionWithPayload<U>): void;
}

type Tag = "ignore" | "start" | "ignore";

export function Subscribe(target: string, tag: Tag, fn: (...args: any[]) => void): Cancel;
export function Subscribe<T>(target: string, tag: "ignore" | "start", fn: ListenerJustWithAction<T>): Cancel;
export function Subscribe<T, U>(target: string, tag: "end", fn: ListenerForEnd<T, U>): Cancel;
export function Subscribe<T>(tag: "start" | "ignore", fn: ListenerJustWithAction<T>): Cancel;
export function Subscribe<T, U>(tag: "end", fn: ListenerForEnd<T, U>): Cancel;

export declare interface DivderErrorHandler {
  <T>(error: Error, action: ActionWithPayload<T>): void;
}

export interface Divider {
  subscribe: typeof Subscribe,
  dispatch: <T>(action: ActionWithPayload<T>) => Dispatch<T>;
  canDispatch: () => boolean;
  hasTask: (name?: string) => boolean;
  getStatus: () => string[];
  isDiscrete: () => boolean;
  setErrorHandler: (handler?: DivderErrorHandler) => void;
}

interface Notify<T> {
  (datasource?: T): void;
}

export declare interface ActionHandler<T, U> {
  (action: ActionWithPayload<T>, notify: Notify<U>): void
}

export interface ActionObj {
  [key: string]: ActionHandler<any, any>;
}

export declare interface Decorator {
  (prevHandler: ActionHandler<any, any>): ActionHandler<any, any>
}

export function createDivider(action: ActionObj, discrete?: boolean): Divider;
export function decorate(actionObj: ActionObj, ...decorator: Decorator[]): ActionObj;