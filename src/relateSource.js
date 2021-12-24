/**
 * @param {Array} unit1 
 * @param {Array} unit2 
 * @param {Boolean} force 
 * @returns {Function}
 */
export default function relateSource([a, b], [c, d], makePayload, pubKeys) {
  if (a === c && b === d) {
    // will lead infinite loop;
  }
  if (a.isDiscrete() && c.isDiscrete()) {
    a.add('b', (ds, action) => {
      const payload = makePayload(ds, action);
      if (pubKeys) {
        verfyShape(payload, pubKeys);
      }
      c.dispatch({
        type: "b",
        payload,
      })
    })
  }
}