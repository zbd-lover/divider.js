# Topic
Let's divide our external data, bridge each one easily.

# Installation
`npm i divider.js`

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

# API

``` javascript
function createSource(processor:Function, discrete:boolean): Source;
```

+  *processor* : accepts parameter called action and notify, it works by the action, then calls the notify to notify its observers with some responses (manually)
+  *discrete*   : whether the processor can do multiple tasks at one time or not.
+  *Source*     : it's allow us to observe the processor and dispatch tasks to processor.
+  note        : if processor do asynchronous operation, we must promise that notify called happened at     operation is done.

keys of source are `createDispatch` and `observe`;

``` javascript
const source:Source = createSource((a, b) => {}, true);
```

``` javascript
// creates a function that dispatches specific task to our processor.
function createDispatch(type: string): Dispatch
```
+  *type*: task name, we need keep it unique (not global). 
+  *Dispatch*: dispatches task to our processor.

``` javascript
// create some dispatches.
function createDispatched(...types:string): Dispatch[];
```

``` javascript
function observe(type:string, tag: "0" | "before" | 0 | "1" | "after" | 1 , fn: Function): type
```
+  *type*: Whom our target is, usually be parameter called type of `createDisptach`.
+  *tag* : What time we observe one action, started processing or after processed. "0" ,"before" and 0 are the former. "1","after" and 1 are the latter.
+  *fn*  : What we do, at time one action is observed on specified time. If at "before", accepts one param called action, otherwise , two parameters called data source and action.
+  *type*: value of param called type.

``` javascript
function observe(tag: "0" | "before" | 0 | "1" | "after" | 1 , fn: Function): void;
```

+  *tag* : What time we observe all action, started processing or after processed. "0" ,"before" and 0 are the former. "1","after" and 1 are the latter.
+  *fn*  : What we do, at time any action is observed on specified time. If at "before", accepts one parameter called action, otherwise , two parameters called data source and action.
+  *note*: Let's associate with middleware.

# Final
Please understand my expressing of English.