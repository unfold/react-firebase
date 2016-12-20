import { castArray, reduce } from 'lodash'

export const applyMethods = (object, methods) => (
  reduce(methods, (result, value, key) => (
    result[key](...castArray(value))
  ), object)
)

export const getDisplayName = Component => (
  Component.displayName || Component.name || 'Component'
)

export const getQueryKey = (path, query) => (
  JSON.stringify({ path, ...query })
)
