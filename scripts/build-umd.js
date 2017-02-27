/* eslint-disable no-console, import/no-extraneous-dependencies */

import webpack from 'webpack'

webpack({
  entry: './lib',
  output: {
    filename: './lib/umd.js',
    libraryTarget: 'umd',
    library: 'reactFirebase',
  },
  externals: {
    react: {
      root: 'React',
      commonjs: 'react',
      commonjs2: 'react',
    },
    'firebase/database': {
      root: 'firebase',
      commonjs: 'firebase/database',
      commonjs2: 'firebase/database',
    },
    'firebase/app': {
      root: 'firebase',
      commonjs: 'firebase/app',
      commonjs2: 'firebase/app',
    },
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin(),
  ],
}, (error, stats) => {
  if (error) {
    console.log(error)
    return
  }

  console.log(stats.toString({
    colors: true,
    chunks: false,
    version: false,
    hash: false,
  }))
})
