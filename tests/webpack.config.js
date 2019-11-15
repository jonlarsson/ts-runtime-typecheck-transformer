const { createVisitor } = require("@ts-rtc/transformer");
const path = require("path");

module.exports = (env = {}) => {
  return {
    mode: "development",
    entry: {
      tsloader: ["./src/tsloader.ts"]
    },
    output: {
      path: path.join(__dirname, "./dest"),
      filename: "[name].webpack.js"
    },
    resolve: {
      extensions: [".ts", ".js"]
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                getCustomTransformers(program) {
                  return { before: [createVisitor(program.getTypeChecker())] };
                }
              }
            }
          ]
        }
      ]
    }
    // plugins: [
    //   new HtmlWebpackPlugin({
    //     template: "./index.ejs"
    //   })
    // ],
    // devServer: {
    //   contentBase: path.join(__dirname, ".tmp"),
    //   port: 7777,
    //   compress: true,
    //   inline: true
    // }
  };
};
