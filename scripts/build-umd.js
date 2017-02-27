/* eslint-disable no-console, import/no-extraneous-dependencies */

import webpack from 'webpack'

webpack({
  entry: './src',
  output: {
    filename: './umd.js',
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
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
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
