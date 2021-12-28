export interface Action {
  type: String;
}

export interface ActionWithPayload<T> extends Action {
  payload?: T;
}

export type Dispatch<T> = (arg: T) => void;

export function Observe<T, U>(
  tag: Tag,
  fn: ((action: ActionWithPayload<T>) => void) | ((datasource: T, action: ActionWithPayload<U>) => void)
): void;

export function Observe<T, U>(
  target: string,
  tag: Tag,
  fn: ((action: ActionWithPayload<T>) => void) | ((datasource: T, action: ActionWithPayload<U>) => void)
): string;

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

declare interface SourceCreator {
  (processor: Processor, discrete: boolean): Source
}

export const createSource: SourceCreator;