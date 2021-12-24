export default function compareAndRun(a, b, fn) {
  if (a === b) {
    fn()
  }
}