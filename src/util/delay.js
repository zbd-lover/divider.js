export default function delay(fn) {
  return () => {
    fn()
  }
}