import { castArray, reduce } from 'lodash'

export const applyMethods = (object, methods) => (
  reduce(methods, (result, value, key) => {
    const args = castArray(value)
    const method = object[key]

    return method(...args)
  }, object)
)

export const getDisplayName = Component => (
  Component.displayName || Component.name || 'Component'
)
