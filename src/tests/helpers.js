export const createMockSnapshot = (val, ...otherProps) => ({
  ...otherProps,
  val: () => val,
})

const defaultDatabaseProps = {
  ref: path => ({
    on: (event, callback) => (
      callback(createMockSnapshot(`${path} value`))
    ),
  }),
}

export const createMockApp = (dataBaseProps = defaultDatabaseProps, ...otherProps) => ({
  ...otherProps,
  database: () => dataBaseProps,
})
