const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, 'src/main.js'),
  optimization: {
    minimize: false
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.js$/, use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [['@babel/plugin-transform-react-jsx', { pragma: 'createElement' }]]
          }
        }
      }
    ]
  }
}