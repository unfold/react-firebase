import webpack from 'webpack'
import { createHash } from 'crypto'
import { hostname } from 'os'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

const SANDBOX_PATH = createHash('md5').update(hostname()).digest('hex')

const entries = readdirSync(__dirname).reduce((result, filename) => {
  const filepath = join(__dirname, filename)

  if (statSync(filepath).isDirectory()) {
    return {
      ...result,
      [filename]: filepath,
    }
  }

  return result
}, {})

module.exports = {
  devtool: 'inline-source-map',
  entry: entries,

  output: {
    path: join(__dirname, 'build'),
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    publicPath: '/build/',
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },
    ],
  },

  resolve: {
    alias: {
      'react-firebase': join(__dirname, '..', 'src'),
    },
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin('shared.js'),
    new webpack.DefinePlugin({
      'process.env.SANDBOX_PATH': JSON.stringify(SANDBOX_PATH),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
  ],
}
