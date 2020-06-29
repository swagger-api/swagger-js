import path from 'path';
import webpack from 'webpack';
import { StatsWriterPlugin } from 'webpack-stats-plugin';
import { DuplicatesPlugin } from 'inspectpack/plugin';
import { WebpackBundleSizeAnalyzerPlugin } from 'webpack-bundle-size-analyzer';
import LodashModuleReplacementPlugin from 'lodash-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

const browser = {
  mode: 'production',
  entry: ['./src/index.js'],
  target: 'web',
  performance: {
    hints: false,
  },
  output: {
    path: path.resolve('./dist'),
    filename: 'swagger-client.browser.js',
    libraryTarget: 'umd',
    library: 'SwaggerClient',
    libraryExport: 'default',
    globalObject: 'window',
  },
  externals: {
    esprima: true,
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(js)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: true,
          },
        },
      },
    ],
  },
  plugins: [
    new LodashModuleReplacementPlugin(),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
    new DuplicatesPlugin({
      // emit compilation warning or error? (Default: `false`)
      emitErrors: true,
      // display full duplicates information? (Default: `false`)
      verbose: true,
    }),
    new WebpackBundleSizeAnalyzerPlugin('swagger-client.browser-sizes.txt'),
    new StatsWriterPlugin({
      filename: path.join('swagger-client.browser-stats.json'),
      fields: null,
    }),
  ],
  optimization: {
    minimize: false,
    usedExports: false,
    concatenateModules: false,
  },
};

const browserMin = {
  mode: 'production',
  entry: ['./src/index.js'],
  target: 'web',
  devtool: 'source-map',
  performance: {
    hints: 'error',
    maxEntrypointSize: 270000,
    maxAssetSize: 1300000,
  },
  output: {
    path: path.resolve('./dist'),
    filename: 'swagger-client.browser.min.js',
    libraryTarget: 'umd',
    library: 'SwaggerClient',
    libraryExport: 'default',
    globalObject: 'window',
  },
  externals: {
    esprima: true,
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(js)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: true,
          },
        },
      },
    ],
  },
  plugins: [
    new LodashModuleReplacementPlugin(),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            warnings: false,
          },
          output: {
            comments: false,
          },
          sourceMap: true,
        },
      }),
    ],
  },
};

export default [browser, browserMin];
