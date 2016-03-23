import { isPlainObject, filter, reduce } from 'lodash';

export default function flattenObject(object, parentPath, separator = '.') {
  return reduce(object, (changes, value, key) => {
    const path = filter([parentPath, key]).join(separator);
    const childValues = isPlainObject(value) ? flattenObject(value, path) : {
      [path]: value,
    };

    return {
      ...changes,
      ...childValues,
    };
  }, {});
}
