const path = require('path')
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const WebExtPlugin = require('web-ext-plugin')

const config = {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [new WebExtPlugin({ sourceDir: path.resolve(__dirname, 'dist') })],
}

module.exports = merge(common, config)
