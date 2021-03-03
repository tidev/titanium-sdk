const boxen = require('boxen');
const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const util = require('util');

const { ProgressBarReporter, SimpleReporter } = require('./reporter');

const STATE_READY = 'ready';
const STATE_BUILDING = 'building';
const STATE_STOPPED = 'stopped';
const STATE_ERROR = 'error';

/**
 * @typedef ServiceOptions
 * @property {object} client Appcd client
 * @property {object} builder Platform speciifc builder
 * @property {object} cli Titanium CLI
 * @property {object} logger CLI logger
 * @property {string} projectType Type of the current project
 */

/**
 * Service communicating with @appcd/plugin-webpack to start/stop Webpack
 * builds, query current build status and stream progress/status changes.
 */
class WebpackService extends EventEmitter {
	/**
	 * Constructs a new Webpack service instance.
	 *
	 * @param {ServiceOptions} options Webpack service options
	 */
	constructor({ client, builder, cli, logger, projectType }) {
		super();

		this.client = client;
		this.logger = logger;
		this.builder = builder;
		const tiapp = cli.tiapp;
		this.type = projectType;
		this.projectData = {
			path: cli.argv['project-dir'],
			name: tiapp.name,
		};
		this.loadBuildSettings(builder, cli);
		this.shouldWatch = builder.deployType !== 'production' && !builder.buildOnly;

		this.forceRebuild = this.shouldForceRebuild(builder, cli);
		this.jobIdentifier = this.generateJobIdentifier();
		this.pluginVersion = process.env.APPCD_WEBPACK_VERSION || 'latest';
		this.basePath = `/webpack/${this.pluginVersion}`;
		this.webpackStatus = { state: 'unknown' };
		this.reporter = (!cli.argv.quiet && cli.argv['progress-bars'])
			? new ProgressBarReporter()
			: new SimpleReporter(logger);
		this.webUiUrl = null;
		this.updateTimeout = null;
	}

	/**
	 * Loads various builds settings from the Builder and CLI.
	 *
	 * @param {object} builder Platform builder
	 * @param {object} cli Titanium CLI
	 */
	loadBuildSettings(builder, cli) {
		const platform = cli.argv.platform;
		const buildSettings = {
			platform,
			deployType: builder.deployType,
			target: cli.argv.target,
			sdk: {
				path: cli.sdk.path,
				version: cli.sdk.name,
				gitHash: cli.sdk.manifest.githash,
				buildDate: cli.sdk.manifest.timestamp
			}
		};

		if (platform === 'ios') {
			buildSettings.ios = {
				deviceFamily: builder.deviceFamily
			};
		}

		this.buildSettings = buildSettings;
	}

	/**
	 * Checks whether the build should be forcefully restarted.
	 *
	 * @param {object} builder Platform builder
	 * @param {object} cli Titanium CLI
	 * @return {boolean} True when a Webpack rebuild should be forced, false if not.
	 */
	shouldForceRebuild(builder, cli) {
		if (cli.argv.force) {
			this.logger.debug('Force flag is set, starting new Webpack build.');
			return true;
		}

		if (!fs.existsSync(path.join(this.projectData.path, 'Resources'))) {
			this.logger.debug('Resources directory doesn\'t exist, starting new Webpack build.');
			return true;
		}

		return false;
	}

	/**
	 * Runs a Webpack build via the daemon.
	 */
	async build() {
		await this.ensureDaemonIsRunning();
		await this.notifyPluginUpdateIfAvailable();
		this.printWebUiUrl();
		await this.ensureWebpackIsRunning();
		await this.waitForCompilationComplete();
	}

	/**
	 * Checks if the daemon is running and, if not, automatically starts it.
	 */
	async ensureDaemonIsRunning() {
		try {
			await this.client.connect();
		} catch (e) {
			if (e.code === 'ECONNREFUSED') {
				this.logger.info('Starting Appcelerator Daemon (subsequent builds will be faster) ...');
				await this.client.connect({ startDaemon: true });
			} else {
				throw e;
			}
		}
	}

	async notifyPluginUpdateIfAvailable() {
		const update = await this.client.get(`${this.basePath}/update/info`);
		if (update.available && !update.fromCache) {
			const { current, latest } = update;
			const updateCommand = 'npm i -g @appcd/plugin-webpack';
			const message = `Update available ${current.dim} → ${latest.green}\nRun ${updateCommand.cyan} to update`;
			const output = boxen(message, {
				padding: 1,
				margin: 1,
				align: 'center',
				borderColor: 'yellow',
				borderStyle: 'round'
			});
			output.split('\n').forEach(l => this.logger.info(l));
		}
	}

	/**
	 * Ensures that Webpack is running.
	 *
	 * If Webpack is not already running it will be started. If Webpack is
	 * already running the current options will be validated. If they do not
	 * match with the options from this build, Webpack will be restarted.
	 */
	async ensureWebpackIsRunning() {
		const options = {
			identifier: this.jobIdentifier,
			type: this.type,
			task: 'build', // this.buildSettings.deployType === 'production' ? 'build' : 'serve',
			watch: this.shouldWatch,
			project: this.projectData,
			build: this.buildSettings
		};

		if (this.forceRebuild) {
			return this.startWebpack(options);
		}

		let response;
		try {
			response = await this.client.get(`${this.basePath}/status/${options.identifier}`);
		} catch (e) {
			if (e.status === 404) {
				return this.startWebpack(options);
			}
			throw e;
		}
		this.webpackStatus = response;

		if (this.webpackStatus.state === STATE_STOPPED || this.webpackStatus.state === STATE_ERROR) {
			this.logger.debug('Webpack not running, starting new Webpack build.');
			return this.startWebpack(options);
		}

		if (!this.validateOptions(response.options, options)) {
			this.logger.debug('Build options changed, restarting Webpack build.');
			return this.startWebpack(options);
		}

		if (this.webpackStatus.state === STATE_READY) {
			this.builder.tiSymbols = response.tiSymbols;
		}
	}

	/**
	 * Prints the url to the web ui.
	 */
	printWebUiUrl() {
		const { host, port } = this.client;
		this.webUiUrl = `http://${host}:${port}${this.basePath}/web`;
		this.logger.info(`Web UI ready on ${this.webUiUrl.cyan}`);
	}

	/**
	 * Waits for the Webpack build to signal that compilation is complete.
	 */
	async waitForCompilationComplete() {
		if (this.webpackStatus.state === STATE_READY) {
			this.logger.info(`Build is up-to-date and ${'ready'.green}!`);
			if (this.shouldWatch) {
				await this.subcribeToWebpackStatusChanges();
			} else {
				this.client.disconnect();
			}
			return;
		}

		await this.subcribeToWebpackStatusChanges();

		return new Promise((resolve, reject) => {
			const handler = e => {
				if (e.state === STATE_READY || e.state === STATE_ERROR) {
					this.off('status', handler);

					if (e.state === STATE_READY) {
						if (!this.shouldWatch) {
							this.client.disconnect();
							this.off('timeout', showTimeoutInfo);
						}
						return resolve();
					}

					return reject(new Error('Webpack compilation failed.'));
				}
			};
			const showTimeoutInfo = () => {
				const buildUrl = `${this.webUiUrl}/build/${this.jobIdentifier}`.cyan;
				const logcatCommand = `${process.env.APPC_ENV ? 'appc ' : ''}appcd logcat "*webpack*"`;
				this.logger.info('Did not receive any Webpack status updates in the last 30 seconds while waiting');
				this.logger.info('for the build to complete.');
				this.logger.info('');
				this.logger.info(`  - Open ${buildUrl.cyan} to see full build details`);
				this.logger.info(`  - Use ${'--force'.grey} to restart the Webpack build`);
				this.logger.info(`  - View Daemon logs from Webpack with ${logcatCommand.grey}`);
				this.logger.info('');
				const error = new Error('Timeout while waiting for the Webpack build to complete.');
				reject(error);
			};
			this.on('status', handler);
			this.on('timeout', showTimeoutInfo);
		});
	}

	/**
	 * Starts a Webpack build with the given options.
	 *
	 * @param {object} options Webpack build options
	 * @return {Promise}
	 */
	startWebpack(options) {
		this.logger.debug(`Starting Webpack with options: ${util.inspect(options, { breakLength: Infinity, colors: true })}`);
		this.logger.info('Initial build may take a while');
		this.webpackStatus = { state: STATE_BUILDING };
		this.reporter.start();
		return this.client.post(`${this.basePath}/start`, options);
	}

	/**
	 * Subscribes to status updates of the Webpack build for the current project.
	 */
	async subcribeToWebpackStatusChanges() {
		const subscription = await this.client.subscribe(`${this.basePath}/status/${this.jobIdentifier}`);
		subscription.on('message', data => {
			if (this.updateTimeout) {
				clearTimeout(this.updateTimeout);
			}

			if (data.event === 'state') {
				this.webpackStatus = data;
				this.emit('status', data);
			} else if (data.event === 'output') {
				data.output
					.replace(/\s+$/, '')
					.split('\n')
					.forEach(m => this.logger.info(m));
			} else if (data.event === 'progress') {
				this.reporter.progress(data.progress);
			} else if (data.event === 'done') {
				this.reporter.done(data);
			} else if (data.event === 'api-usage') {
				this.builder.tiSymbols = data.tiSymbols;
			}

			if (this.webpackStatus.state === STATE_BUILDING) {
				this.updateTimeout = setTimeout(() => {
					this.emit('timeout');
				}, 30000);
			}
		});
		subscription.on('close', () => {
			this.logger.warn('Daemon connection lost');
		});
		subscription.on('error', e => {
			this.logger.error(e);
			this.webpackStatus.state = STATE_ERROR;
			this.emit('status');
		});
	}

	/**
	 * Generates a unique identifier for the Webpack build.
	 *
	 * @return {string}
	 */
	generateJobIdentifier() {
		const hash = crypto.createHash('sha1');
		hash.update(this.projectData.path);
		return hash.digest('hex');
	}

	/**
	 * Validates options from already running Webpack build to match expected
	 * options determined from current Titanium build.
	 *
	 * @param {object} currentOptions Currently active Webpack options
	 * @param {object} newOptions New options based on current build
	 * @return {boolean}
	 */
	validateOptions(currentOptions, newOptions) {
		const checkProperties = [
			'project',
			'build'
		];
		const pluck = (obj, props) => {
			return props.reduce((acc, prop) => {
				acc[prop] = obj[prop];
				return acc;
			}, {});
		};
		return util.isDeepStrictEqual(
			pluck(currentOptions, checkProperties),
			pluck(newOptions, checkProperties)
		);
	}
}

module.exports = WebpackService;
