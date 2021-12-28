interface Action {
  type: String;
}

interface ActionWithPayload<T> extends Action {
  payload?: T;
}

type Dispatch<T> = (arg: T) => void;

type Observe = (target: Dispatch | string, tag: Tag, fn: HookForS | HookForE) => void;
type Observe = (tag: Tag, fn: HookForS | HookForE) => void;

interface Source {
  observe: Observe;
  isDiscrete: () => boolean;
  isWaiting: () => boolean;
  createDispatch<T>(type: string): Dispatch<T>;
}

type Notify<T> = (datasource: T, action: ActionWithPayload) => void;

type Processor<T, U> = (action: ActionWithPayload<T>, notify: Notify<U>) => void;

type Tag = "before" | 0 | "0" | "after" | 1 | "1";

type HookForS<T> = (action: ActionWithPayload<T>) => void;
type HookForE<T, U> = (datasource: T, action: ActionWithPayload<U>) => void;

function createDivider(): Divider;

interface Divider {
  CURRENT_SOURCES_MAP: [string, Source][];
  createSource<T>(name: string, processor: Processor<T>, discrete: boolean): Source;
}
