const path = require('path')
const glob = require('glob')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const config = {
  entry: {},
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].js',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          context: 'src/assets',
          from: '**/*',
        },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 0,
      cacheGroups: {
        vendors: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
}

function getEnt(filepath) {
  const files = glob.sync(filepath)
  const ents = []

  files.forEach((item) => {
    const extname = path.extname(item)
    const basename = path.basename(item, extname)
    const filename = basename + extname
    ents.push({ path: item, basename, filename })
  })

  return ents
}

getEnt('./src/ent/*.ts').forEach((item) => {
  const { path, basename } = item
  config.entry[basename] = path
})

getEnt('./src/ent/*.html').forEach((item) => {
  const { path, basename, filename } = item
  config.plugins.push(
    new HtmlWebpackPlugin({
      template: path,
      chunks: [basename],
      filename: filename,
    })
  )
})

module.exports = config
