import { applyMiddleware } from './../index.d';
import { Processor, createSource, ActionWithPayload, MiddleWare, CreateDispatch } from '../index';

interface Person {
  name: string
}

const processor: Processor = (action, notify) => {
  if (action.type === 'query-person') {
    notify<Person>(
      { name: "123" },
      action
    )
  }
  if (action.type === 'ohter') {
    notify<any>(
      { data: [] },
      action as ActionWithPayload<Person>
    );
  }
}

const source = createSource(processor, true)

const dispatch = source.createDispatch<Person>("123")

// the typeof param is Person
dispatch({
  name: "zbd"
})

// Examples of `observe` api

// Observes all actions.
source.observe("interrupt", (name) => {
  console.log('name:', name);
})

source.observe<Person>("start", (action) => {
  // action.payload: Person
  console.log(action.payload.name)
});

source.observe<Person[], Person>("end", (ds, action) => {
  // ds: Person[]
  // action.payload: Person
  console.log(ds.every);
  console.log(action.type);
})

// Observes a specific action
source.observe("add", "interrupt", (name) => {
  console.log('name:', name);
})

// Observes a specific action
source.observe<Person>("add", "start", (action) => {
  // action.payload: Person
  console.log(action.payload.name)
})

// Observes a specific action
source.observe<Person[], Person>("add", "end", (ds, action) => {
  // ds: Person[]
  // action.payload: Person
  console.log(ds.every);
  console.log(action.type);
});

const middleware: MiddleWare = (src) => {
  return (type) => {
    console.log(`${type} is created.`);
    return src.createDispatch(type)
  }
}