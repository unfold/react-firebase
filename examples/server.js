import express from 'express'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackConfig from './webpack.config'

const port = process.env.PORT || 8080
const app = express()
app.use(webpackDevMiddleware(webpack(webpackConfig), {
  publicPath: '/build/',
  stats: {
    colors: true,
  },
}))

app.use(express.static(__dirname))

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}, Ctrl+C to stop`) // eslint-disable-line no-console
})
