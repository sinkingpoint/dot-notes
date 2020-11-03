const path = require("path");
const webpack = require("webpack");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  entry: {
    note_editor_page: "./src/note_editor_page.tsx",
    note_schedule_page: "./src/note_schedule_page.tsx"
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: 'ts-loader',
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        options: { presets: ["@babel/env"] }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /node_modules\/vfile\/core\.js/,
        use: [{
          loader: 'imports-loader',
          options: {
            type: 'commonjs',
            imports: ['single process/browser process'],
          },
        }],
      }
    ]
  },
  resolve: {
    fallback: { "path": require.resolve("path-browserify") },
    extensions: ["*", ".js", ".jsx", ".ts", ".tsx"] 
  },
  output: {
    path: path.resolve(__dirname, "dist/"),
    publicPath: "/dist/",
    filename: "[name]-bundle.js"
  },
  devServer: {
    contentBase: path.join(__dirname, "dist/"),
    port: 3000,
    publicPath: "http://localhost:3000",
    hotOnly: true,
    proxy: {
      '/note': {
        bypass: function() {
          return '/index.html';
        }
      },
      '/config/schedule': {
        bypass: function() {
          return '/config.html';
        }
      }
    }
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new BundleAnalyzerPlugin()
  ]
};