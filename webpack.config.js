const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	entry: './src/index.js',
	output: {
		filename: 'engine.js',
		path: path.resolve(__dirname, 'dist'),
	},
	module: {
		rules: [
			{
				test: /\.m?js$/,
				exclude: /(node_modules)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		]
	},
	optimization: {
		minimizer: [
			new TerserPlugin({
				cache: false,
				parallel: true,
				sourceMap: true,
				terserOptions: {
					compress: {
						drop_console: true
					}
				}
			}),
		],
    }
};
