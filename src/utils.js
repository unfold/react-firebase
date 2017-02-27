export const mapValues = (object, iteratee) => {
  const result = {}

  Object.keys(object).forEach(key => (
    result[key] = iteratee(object[key], key, object)
  ))

  return result
}

export const pickBy = (object, predicate) => {
  const result = {}

  Object.keys(object).forEach(key => {
    const value = object[key]

    if (predicate(value, key)) {
      result[key] = value
    }
  })

  return result
}

export const createQueryRef = (ref, query) => (
  Object.keys(query).reduce((queryRef, key) => {
    const value = query[key]
    const args = Array.isArray(value) ? value : [value]

    return queryRef[key](...args)
  }, ref)
)

export const getDisplayName = Component => (
  Component.displayName || Component.name || 'Component'
)
