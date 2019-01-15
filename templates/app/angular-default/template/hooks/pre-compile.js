'use strict';

const path = require('path');
const spawn = require('child_process').spawn;

exports.id = 'ti.angular';
exports.init = (logger, config, cli) => {
	const bundler = new WebpackBundler(cli, logger);
	bundler.initialize();
};

class WebpackBundler {
	constructor(cli, logger) {
		this.cli = cli;
		this.logger = logger;
	}

	initialize() {
		this.cli.on('build.pre.compile', (builder, callback) => {
			this.runWebpack(builder).then(callback).catch(callback);
		});
	}

	runWebpack(builder) {
		const config = {
			production: builder.deployType !== 'development',
			targetPlatform: this.cli.argv.platform
		};

		const args = [
			'--preserve-symlinks',
			path.resolve(__dirname, '..', 'app', 'node_modules', 'webpack', 'bin', 'webpack.js'),
			'--progress',
			...this.generateEnvFlags(config)
		];

		return new Promise((resolve, reject) => {
			this.logger.info('Running initial Webpack build');
			this.logger.trace(`Executing: node ${args.join(' ')}`);
			const child = spawn('node', args, {
				stdio: 'inherit',
				cwd: path.join(this.cli.argv['project-dir'], 'app')
			});
			child.on('close', code => {
				if (code === 0) {
					resolve();
				} else {
					const error = new Error(`Webpack exited with non-zero exit code ${code}`);
					error.code = code;
					reject(error);
				}
			});
		});
	}

	generateEnvFlags(config) {
		return Object.keys(config).filter(settingName => config[settingName]).map(settingName => {
			let envFlag = `--env.${settingName}=`;
			switch (typeof config[settingName]) {
				case 'boolean': {
					envFlag += '1';
					break;
				}
				default: envFlag += config[settingName];
			}

			return envFlag;
		});
	}
}
