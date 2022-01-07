type _Pick<T, K extends keyof T> = {
  [key in K]: T[key];
};

export interface Action {
  type: String;
}

export interface ActionWithPayload<T> extends Action {
  payload?: T;
  [key: string]: any;
}

export interface Dispatch<T> {
  (arg: T): void;
}

export declare interface Cancel {
  (): void;
}

export declare interface HookForStart<T> {
  (action: ActionWithPayload<T>): void;
}

export declare interface HookForEnd<T, U> {
  (datasource: T, action: ActionWithPayload<U>): void;
}

export declare interface HookForInterrupt {
  (type: string): void
}

export function Observe(target: string, tag: "interrupt" | 2 | "2", fn: HookForInterrupt): Cancel;
export function Observe<T>(target: string, tag: "start" | 0 | "0", fn: HookForStart<T>): Cancel;
export function Observe<T, U>(target: string, tag: "end" | 1 | "1", fn: HookForEnd<T, U>): Cancel;
export function Observe(tag: "interrupt" | 2 | "2", fn: HookForInterrupt): Cancel;
export function Observe<T>(tag: "start" | 0 | "0", fn: HookForStart<T>): Cancel;
export function Observe<T, U>(tag: "end" | 1 | "1", fn: HookForEnd<T, U>): Cancel;

export function DispatchesCreator<T>(t1: string): [Dispatch<T>];
export function DispatchesCreator<T, U>(t1: string, t2: string): [Dispatch<T>, Dispatch<U>];
export function DispatchesCreator<T, U, S>(t1: string, t2: string, t3: string): [Dispatch<T>, Dispatch<U>, Dispatch<S>];
export function DispatchesCreator<T, U, S, E>(t1: string, t2: string, t3: string, t4: string): [Dispatch<T>, Dispatch<U>, Dispatch<S>, Dispatch<E>];
export function DispatchesCreator<T, U, S, E, C>(t1: string, t2: string, t3: string, t4: string, t5: string): [Dispatch<T>, Dispatch<U>, Dispatch<S>, Dispatch<E>, Dispatch<C>];
export function DispatchesCreator<T, U, S, E, C, G>(t1: string, t2: string, t3: string, t4: string, t5: string, t6: string): [Dispatch<T>, Dispatch<U>, Dispatch<S>, Dispatch<E>, Dispatch<C>, Dispatch<G>];
export function DispatchesCreator<T, U, S, E, C, G, H>(t1: string, t2: string, t3: string, t4: string, t5: string, t7: string): [Dispatch<T>, Dispatch<U>, Dispatch<S>, Dispatch<E>, Dispatch<C>, Dispatch<G>, Dispatch<H>];
export function DispatchesCreator<T, U, S, E, C, G, H, I>(t1: string, t2: string, t3: string, t4: string, t5: string, t7: string, t8: string): [Dispatch<T>, Dispatch<U>, Dispatch<S>, Dispatch<E>, Dispatch<C>, Dispatch<G>, Dispatch<H>, Dispatch<I>];
export function DispatchesCreator(...args: string[]): Dispatch<any>[];

export declare interface CreateDispatch {
  <T>(type: string): Dispatch<T>;
}

export declare interface ReplaceDispatch {
  (type: string, dispatch: Dispatch<any>): void;
}

export interface Source {
  observe: typeof Observe;
  createDispatch: CreateDispatch;
  createDispatches: typeof DispatchesCreator;
  replaceDispatch: ReplaceDispatch,
  dispatch<T>(action: ActionWithPayload<T>): Dispatch<T>;
  interrupt: (type: string) => void;
  hasType: (type: string) => boolean;
  isDiscrete: () => boolean;
  isWaiting: () => boolean;
  reset: () => void;
}

export interface Notify {
  <T>(datasource: T, action: ActionWithPayload<any>): void;
}

export interface Processor {
  (action: ActionWithPayload<any>, notify: Notify): void | boolean;
}

export interface Option {
  tip: {
    statemachine: boolean
  },
}

declare interface SourceCreator {
  (processor: Processor, discrete?: boolean, option?: Option): Source
}
export const createSource: SourceCreator;

declare interface ProcessorCombiner {
  (...processors: Processor[]): Processor
}
export const combineProcessor: ProcessorCombiner;

interface MDSource extends Source {
  _PURE_createDispatch: CreateDispatch,
  _PURE_createDispatches: typeof DispatchesCreator
}

export declare interface MiddleWare {
  (source: _Pick<MDSource, 'observe' | 'createDispatch' | 'createDispatches' | 'hasType' | 'isDiscrete' | 'isWaiting' | '_PURE_createDispatch' | '_PURE_createDispatches'>)
    :
    <T>(type: string) => Dispatch<T>
}

declare interface MiddleWareApplier {
  (source: Source, ...middlewares: MiddleWare[]): Source
}
export const applyMiddleware: MiddleWareApplier;

declare interface ProcessorDecorater {
  // previous result: (action: ActionWithPayload<any>, notify: Notify): void | boolean;
  (processor: Processor, types: string[]): (action: ActionWithPayload<any>, notify: Notify) => boolean;
}

export const decorateProcessor: ProcessorDecorater;

// deprecated
export type Tag = "start" | 0 | "0" | "end" | 1 | "1" | "2" | "interrupt" | 2;
export type TagForStart = "start" | 0 | "0";
export type TagForEnd = "end" | 1 | "1";
export type TagForInterrupt = "interrupt" | 2 | "2";