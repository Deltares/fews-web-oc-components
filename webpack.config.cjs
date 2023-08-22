/* eslint-disable */
const path = require('path');
const { VueLoaderPlugin } = require('vue-loader')

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'fews-web-oc-components.umd.js',
    libraryTarget: 'umd',
    library: 'fews-web-oc-components'
  },
  resolve: {
    extensions: ['.ts','.tsx', '.js', '.json', '.vue']
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
            //Then there are settings for a ts-loader, which helps load the TypeScript with Vue.
            //We also specified the appendTsSuffixTo: [/\.vue$/], option to ts-loader in our webpack.config.js file, 
            //which allows TypeScript to process the code extracted from a single file component.
            //https://github.com/TypeStrong/ts-loader#appendtssuffixto
            appendTsSuffixTo: [/\.vue$/],
        },
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ],
  externals: {
    vue: 'vue'
  }
}
