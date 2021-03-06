# Topic
Divide a set of relevant operation and side effects in JavaScript apps.
Divider is nice as async solution for [Redux](https://redux.js.org/).

# Installation
`npm i divider.js`

# Example
``` javascript
import {createDivider, decorate} from "divider.js";

function createDivider(ao: ActionObj, discrete: boolean): Divider

const divider = createDivider({}, true);
// Properities of divder: 
// 1、subscribe: (type: string, tag: "end" | "start" | "ignore", listener: Function) => Cancel;
// 2、dispatch: (action: ActionWithPayload) => void
// 3、getStatus: () => string[]
// 4、isDiscrete: () => boolean
// 5、hasTask: (name?: string) => boolean
// 6、canDispatch: () => boolean

// ActionObj Example:
const UserAO = {
  "UPDATE": async (action, notify) => {
     const data = await request(action.payload);
     if (data.success) {
       notify(data.data);
     } else {
      // This operation will be ignore
      // listeners of 'end' will not receive response.
       notify();
     }
  },
  "SMOKE": () => {}
}
// See the example/index.html to learn more.

// With Redux
const validTypes = ["UPDATE", "SMOKE"];
function reducer(state, {type, payload}) {
  if (!validTypes.includes(type)) {
    if (typeof state === "undefined") {
      return {};
    }
    return state;
  }
  if (type === "UPDATE") {
    return {
      ...state,
      ...payload
    }
  }
}
const store = createStore(reducer);

const divider = createDivider(UserAO);
divider.subscribe("UPDATE", "end", (response, action) => {
  if (response.success) { 
    store.dispatch(action);
  }
});

// Advance api: decorate
function checkDecorator(lastHandler) {
  const hanlder = (action, notify) => {
    if (action.payload.permission.expire) {
      action.payload.permission = recalc();
    }
    lastHandler(action, notify);
  }
}

function prohibitDecorator(lastHandler) {
  const handler = (action, notify) => {
    if (action.type === "SMOKE") {
      notify();
      return;
    }
    lastHandler(action, notify);
  }
}

const AO = decorate(UserAO, checkDecorator, prohibitDecorator);

const divider1 = createDivider(AO, true);
divider1.subscribe("SMOKE", "end", () => {
  console.log("you will not see me.");
})
divider1.dispatch({type: "SMOKE"});

// See the example/decorate.html to learn more.
```

The important
`subscribe` api used to do some effects.
`decorate` api is used to organize your operations, prohibit, intercept and so on.