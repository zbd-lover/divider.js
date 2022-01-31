# Topic
Divide a set of relevant operation and side effects in JavaScript apps.
You can use Divider together with [React](https://reactjs.org/), or with any other view library.
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
      // this operation will be ignore
       notify();
     }
  }
}