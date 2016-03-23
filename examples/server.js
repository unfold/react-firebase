import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackConfig from './webpack.config';

const app = express();
app.use(webpackDevMiddleware(webpack(webpackConfig), {
  publicPath: '/build/',
  stats: {
    colors: true,
  },
}));

app.use(express.static(__dirname));

app.listen(8080, () => console.log('Server listening on http://localhost:8080, Ctrl+C to stop')); // eslint-disable-line no-console
