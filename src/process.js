const makeProcessor = () => {
  let  name = 'zbd';
  
  const update = (name) => {
    name = name
  }

  const query = () => name;

  return (action, notify) => {
    update(action.payload);
    notify(query(), action);
  }
}

export default makeProcessor();