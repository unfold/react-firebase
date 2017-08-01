export const mapValues = (object, iteratee) => {
  const result = {}

  Object.keys(object).forEach(key => (result[key] = iteratee(object[key], key, object)))

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

export const createQueryRef = (ref, query) =>
  Object.keys(query).reduce((queryRef, key) => {
    const value = query[key]
    const args = Array.isArray(value) ? value : [value]

    return queryRef[key](...args)
  }, ref)

export const getDisplayName = Component => Component.displayName || Component.name || 'Component'

export const mapSubscriptionsToQueries = subscriptions =>
  mapValues(subscriptions, value => (typeof value === 'string' ? { path: value } : value))

const containsOrderBy = query => Object.keys(query).some(key => key.startsWith('orderBy'))

export const mapQuerySnapshotToValue = (query, snapshot) => {
  if (!containsOrderBy(query)) {
    return snapshot.val()
  }

  const result = {}

  snapshot.forEach(child => {
    result[child.key] = child.val()
  })

  return result
}

export const wrapActionProps = (props, onError) =>
  mapValues(props, (value, key) => (...args) => {
    const result = value(...args)

    if (result && typeof result === 'object' && typeof result.catch === 'function') {
      return result.catch(error => onError(key, error))
    }

    return result
  })
