# Topic
Let's divide our external data, bridge each one easily.

# Installation
`npm i divider.js`

# Links
React bindings
+ npm: https://www.npmjs.com/package/react-divider.js
+ git: https://github.com/zbd-lover/react-divider

# API

``` javascript
// processor: Accepts parameter called action and notify, it works by the action, then calls the notify to notify its observers with some responses (manually)
// discrete:  Whether the processor can do multiple tasks at one time or not.
// Source:    It's allow us to observe the processor and dispatch tasks to processor.
function createSource(processor:Function, discrete:boolean): Source;
```

**Note: if processor do asynchronous operation, we must promise that notify is called when operation was done.**

``` javascript
// Creates a function that dispatches specific task to our processor.
function createDispatch(type: string): Dispatch
```
+  *type*: task name, we need keep it unique (not global). 
+  *Dispatch*: dispatches task to our processor.

``` javascript
// create some dispatches.
function createDispatched(...types:string): Dispatch[];
```

``` javascript
// tag: What time we observe all action, started processing or after processed. "0" ,"before" and 0 are the former. 
//     "1","after" and 1 are the latter. If tag is 2, we can observe interrupting of action.
// fn: What we do, at time any action is observed. At "before", accepts one parameter called action; At "after" , 
//     two parameters called data source and action; At "interrupt" accepts the type.
function observe(tag: "0" | "before" | 0 | "1" | "after" | 1 | "2" | "interrupt" | 2 , fn: Function): Cancel;
```

``` javascript
// type: delimit our callback
// tag:  please see the above observe
// fn:   please see the above observe
function observe(type: string, tag: "0" | "before" | 0 | "1" | "after" | 1 | "2" | "interrupt" | 2 , fn: Function): Cancel
```
**Note: Observations of any action must be created before dispatch created. We only observe specific action after dispatch created.**

``` javascript
// Interrupts action, must called after working and before worked.
// Interrupting of action means that callback of 'after' will not be called, your processor still works normally.
function interrupt(type: string): void;
``` 
**Note: Normally, we will make good effect, interrupt asynchronous action by it.**

``` javascript
// If exists one dispatch that is bound with 'action.type', then call and return it.
// otherwise creates a new dispatch with action.type, then call and return it.
// Think of it as grammar sugar.
function dispatch(action: Action): Dispatch
```

The followings are advance API, Please see the example folder.

``` javascript
function applyMiddleware(source: Source, ...middlewares: MiddleWare[]): Source;
```

``` javascript
function combineProcessors(...processors: Processors[]): Processor;
```

``` javascript
function decorateProcessor(processor: Processor, types: string[]): Processor;
```

# Example
Below example is traditional in web.
Let's query server's data and update `dom`.

``` javascript
function getBooks() {
  // fetched result
  const res = [
    {id:1, name: "red"},
    {id: 2, name: "black"}
  ];

  const list = document.getElementById("book-list");
  for (let i = 0; i < res.length; i++) {
    let li = documenet.createElement("li");
    li.textContent = res[i].name;
    li.classList.add("book-item");
    // ...
  }
}
```
We can understand: fetching operation and appending operation is closely.
It's true: we have other requests, e.g update, delete and create,
if we continue the above, **one** function means do **two** task at least.
Let's rewrite it by `divider.js`, first, construct our processor for all related operations.

``` javascript
const makeProcessor = () => {
  const update = async (param) => {// fetchs...}
  const delete = async (param) => {// fetchs...}
  const query = async (param) => {// fetchs...}
  
  // arg0: what processor do？
  // arg1: notify processor's observer with response.
  const process = async (action, notify) => {
    const {type, payload} = action;
    switch (type) {
      case 'update':
        await update(payload);
        notify({
          success: true,
          message: "the a is udpated."
        });
        break;
      case 'delete':
	      await delete(payload);
        notify({
          success: true,
          message: "the d is deleted."
        })
        break;
      case 'query': 
        notify(await query(payload));
        break;
      default:
        break;
    }
  }

  return (action, notify) => {
     process(action, notify);
  }

}
  
// Creates a observer by `createSource` api, and binds above processor.
// import {createSource} from 'divider.js';
const source = createSource(makeProcessor(), true);

const {observe, createDispatch} = source;
// observe specific action
observe("query", (datasource, action) => {
  // ...
  // updates dom like first example in doc.
});

// Creates target dispatch to activate our processor. (Don't call it directly)
const query = createDispatch("query");
query();
```
Now, we all know: fetching of external data separates with our processing for it.
What's more, all operation of external data comes together, sounds good.
We should see the place  of `divider.js`  in our programs clearly.

# Final
Please understand my expressing of English.