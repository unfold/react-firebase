import { reduce, set } from 'lodash'

export default function expandObject(object) {
  return reduce(object, (expanded, value, key) => set(expanded, key, value), {})
}
