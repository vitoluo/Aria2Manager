const { merge } = require('webpack-merge')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const common = require('./webpack.common.js')

const config = {
  mode: 'production',
  plugins: [new CleanWebpackPlugin()],
}

module.exports = merge(common, config)
