/* eslint-disable no-console, import/no-extraneous-dependencies */

import webpack from 'webpack'

webpack({
  entry: './lib',
  output: {
    filename: './lib/umd.js',
    library: 'reactFirebase',
  },
  externals: {
    react: 'React',
    'firebase/database': 'firebase',
    'firebase/app': 'firebase',
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
