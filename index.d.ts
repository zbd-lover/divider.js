export interface Action {
  type: String;
}

export interface ActionWithPayload<T> extends Action {
  payload?: T;
}

export type Dispatch<T> = (arg: T) => void;

export function Observe(target: string, tag: Tag, fn: HookForS<any> | HookForE<any, any>): string;
export function Observe(tag: Tag, fn: HookForS<any> | HookForE<any, any>): void;

export interface Source {
  observe: typeof Observe;
  isDiscrete: () => boolean;
  isWaiting: () => boolean;
  createDispatch<T>(type: string): Dispatch<T>;
}

export interface Notify {
  <T, U>(datasource: T, action: ActionWithPayload<U>): void;
}

export interface Processor {
  (action: ActionWithPayload<any>, notify: Notify): void;
}

export type Tag = "before" | 0 | "0" | "after" | 1 | "1";

export type HookForS<T> = (action: ActionWithPayload<T>) => void;
export type HookForE<T, U> = (datasource: T, action: ActionWithPayload<U>) => void;

declare interface SourceCreator {
  (processor: Processor, discrete: boolean): Source
}

export const createSource: SourceCreator;