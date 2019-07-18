/**
 * @prettier
 */

import path from 'path'
import deepExtend from 'deep-extend'
import TerserPlugin from 'terser-webpack-plugin'
import nodeExternals from 'webpack-node-externals'

const baseRules = [
  {
    test: /\.js/,
    loader: 'babel-loader?retainLines=true',
    exclude: [/node_modules/],
  },
]

export default function buildConfig(
  {minimize = true, mangle = true, sourcemaps = true, includeDependencies = true},
  customConfig
) {
  const plugins = []

  const completeConfig = deepExtend(
    {},
    {
      mode: 'production',

      entry: {
        'swagger-client': ['./src/index.js'],
      },

      devtool: 'source-map',

      output: {
        path: path.join(__dirname, '../dist'),
        libraryTarget: 'commonjs2',
        library: 'SwaggerClient',
        filename: 'index.js',
      },

      externals: includeDependencies ? [] : [nodeExternals()],

      module: {
        rules: baseRules,
      },

      resolve: {
        modules: ['node_modules'],
        extensions: ['.js', '.json'],
      },

      optimization: {
        minimize: !!minimize,
        minimizer: [
          compiler =>
            new TerserPlugin({
              cache: true,
              sourceMap: sourcemaps,
              terserOptions: {
                mangle: !!mangle,
              },
            }).apply(compiler),
        ],
      },
    },

    customConfig
  )

  // deepExtend mangles Plugin instances, this doesn't
  completeConfig.plugins = plugins.concat(customConfig.plugins || [])

  return completeConfig
}
