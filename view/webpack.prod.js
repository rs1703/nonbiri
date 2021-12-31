const config = require("./webpack.dev.js");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

config.mode = "production";
config.optimization = {
  minimize: true,
  minimizer: [new UglifyJsPlugin(), new CssMinimizerPlugin()]
};

module.exports = config;
