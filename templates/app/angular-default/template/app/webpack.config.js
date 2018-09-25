'use strict';

const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {
	GenerateAppJsPlugin,
	TitaniumAngularCompilerPlugin,
	titaniumTarget,
	WatchStateNotifierPlugin
} = require('webpack-dev-titanium');

const projectRootDirectory = path.resolve('..');
const outputDirectory = path.join(projectRootDirectory, 'Resources');

module.exports = env => {
	// AoT is currently broken, see https://jira.appcelerator.org/browse/FRAME-6
	const enableAot =  false; // env & env.production;
	const tsConfigPath = enableAot ? 'tsconfig.aot.json' : 'tsconfig.json';
	const config = {
		context: __dirname,
		target: titaniumTarget,
		entry: {
			bundle: enableAot ? './src/main.aot.ts' : './src/main.ts',
			vendor: './vendor/vendor.js',
		},
		output: {
			pathinfo: true,
			path: outputDirectory,
			libraryTarget: 'commonjs2',
			filename: '[name].js',
		},
		resolve: {
			extensions: [ '.ts', '.js', '.scss', '.css' ],
			modules: [ path.resolve(__dirname, 'node_modules') ],
			symlinks: false
		},
		resolveLoader: {
			symlinks: false
		},
		node: {
			fs: 'empty'
		},
		module: {
			rules: [
				{
					test: /\.html$|\.xml$/,
					use: 'raw-loader'
				},
				{
					test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
					loader: '@ngtools/webpack'
				}
			]
		},
		plugins: [
			new CleanWebpackPlugin(
				[
					path.join(outputDirectory, '*.*'),
					path.join(projectRootDirectory, 'platform')
				],
				{
					allowExternal: true
				}
			),
			new webpack.optimize.CommonsChunkPlugin({
				name: 'vendor'
			}),
			new CopyWebpackPlugin([
				{ context: 'assets', from: '**/*' },
				{ from: 'platform/**/*', to: '..' }
			]),
			new GenerateAppJsPlugin([
				'vendor',
				'bundle'
			]),
			new TitaniumAngularCompilerPlugin({
				tsConfigPath: tsConfigPath,
				basePath: path.resolve('./src'),
				entryModule: path.resolve('./src/app.module#AppModule'),
				skipCodeGeneration: !enableAot,
				targetPlatform: env.targetPlatform
			})
		]
	};

	if (env && !env.production) {
		config.plugins.push(new WatchStateNotifierPlugin());
	}

	return config;
};
