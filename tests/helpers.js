export const createMockSnapshot = (value, ...otherProps) => ({
  ...otherProps,
  val: () => value,
})

const defaultDatabaseProps = {
  ref: path => ({
    on: (event, callback) => (
      callback(createMockSnapshot(`${path} value`))
    ),
    off: () => {},
  }),
}

export const createMockApp = (dataBaseProps = defaultDatabaseProps, ...otherProps) => ({
  ...otherProps,
  database: () => dataBaseProps,
})
