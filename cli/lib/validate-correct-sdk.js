import { version } from 'node-titanium-sdk/util';

export function validateCorrectSDK(logger, config, cli, commandName) {
	// tiapp.xml should exist by the time we get here
	const { argv, tiapp } = cli;
	const data = tiapp.data();
	let sdkName = data['sdk-version'];
	const selectedSdk = cli.sdk?.name || manifest.version;

	if (!sdkName) {
		sdkName = cli.sdk?.name || Object.keys(cli.env.sdks).sort().pop();
		data['sdk-version'] = sdkName;
		tiapp.apply(data);
	}

	if (argv.legacy !== true && (!sdkName || sdkName === selectedSdk)) {
		return true;
	}

	// check the project's preferred sdk is even installed
	if (sdkName === '__global__' || !cli.env.sdks[sdkName]) {
		logger.banner();
		logger.error('Unable to compile project because the <sdk-version> in the tiapp.xml is not installed\n');
		logger.log(`The project's <sdk-version> is currently set to '${sdkName}', which is not installed.\n`);
		logger.log(`Update the <sdk-version> in the tiapp.xml to one of the installed Titaniums SDKs:`);
		const sortedSdks = Object.keys(cli.env.sdks).sort();
		for (const ver of sortedSdks) {
			if (ver !== '__global__') {
				logger.log('    ' + ver);
			}
		}
		logger.log(`or run 'titanium sdk install ${sdkName}' to download and install Titanium SDK ${sdkName}\n`);
		process.exit(1);
	}

	// fork or die
	if (config.cli.failOnWrongSDK) {
		logger.banner();
		logger.error(`Unable to compile a ${sdkName} project with Titanium SDK ${selectedSdk}`);
		logger.error(`To build this application, set the <sdk-version> in the tiapp.xml to the current Titaniums SDK: ${selectedSdk}\n`);
		process.exit(1);
	}

	const args = argv.$_;
	const p = args.indexOf('--sdk');
	const platform = exports.resolvePlatform(argv.platform);
	const cmd = [];
	const cmdSafe = [];
	let cmdRoot;
	let hideBanner = false;
	let delayCmd = false;

	function cmdAdd(...args) {
		for (let i = 0; i < args.length; i++) {
			cmd.push(arguments[i]);
			cmdSafe.push(arguments[i]);
		}
	}

	function cmdAddSecret(_param) {
		for (let i = 0; i < arguments.length; i++) {
			cmd.push(arguments[i]);
			cmdSafe.push('*******');
		}
	}

	if (p !== -1) {
		args.splice(p, 2);
	}

	if (!argv.legacy) {
		logger.info(`tiapp.xml <sdk-version> set to ${sdkName}, but current Titanium SDK set to ${selectedSdk}`);
	}

	const sdkVersion = cli.env.sdks[sdkName].manifest && cli.env.sdks[sdkName].manifest.version || sdkName;

	if (argv.legacy || version.lt(sdkVersion, '2.2.0')) { // technically, there is no 2.2, it was released as 3.0
		// in 3.2, we renamed --password to --store-password as to not conflict with the
		// authentication --password option
		if (argv.platform === 'android' && argv['store-password']) {
			argv.password = argv['store-password'];
		}

		cmdRoot = 'python';

		const builderPy = path.join(expand(cli.env.sdks[sdkName].path), platform, 'builder.py');
		cmdAdd(builderPy);

		switch (platform) {
			case 'iphone':
				switch (argv.target) {
					case 'simulator':
						if (argv['build-only']) {
							cmdAdd('build', argv['ios-version'], argv['project-dir'], tiapp.id, tiapp.name, argv['device-family'], argv['sim-type'], argv['debug-host']);
						} else {
							cmdAdd('run', argv['project-dir'], argv['ios-version'], '', '', argv['device-family'], argv['sim-type'], argv['debug-host']);
						}
						break;

					case 'device':
						cmdAdd('install', argv['ios-version'], argv['project-dir'], tiapp.id, tiapp.name, argv['pp-uuid'], argv['developer-name'], argv['device-family'], argv.keychain, argv['debug-host']);
						break;

					case 'dist-appstore':
						cmdAdd('distribute', argv['ios-version'], argv['project-dir'], tiapp.id, tiapp.name, argv['pp-uuid'], argv['distribution-name'], '.', argv['device-family'], argv.keychain);
						break;

					case 'dist-adhoc':
						cmdAdd('adhoc', argv['ios-version'], argv['project-dir'], tiapp.id, tiapp.name, argv['pp-uuid'], argv['distribution-name'], argv['device-family'], argv.keychain, argv['debug-host']);
						break;
				}
				break;

			case 'android':
				if (argv['build-only']) {
					cmdAdd('build', tiapp.name, argv['android-sdk'], argv['project-dir'], tiapp.id);
				} else {
					if (argv.target === 'emulator') {
						if (!argv['avd-id']) {
							logger.error(`Missing required option "${'--avd-id'}"\n`);
							process.exit(1);
						}
						if (!argv['avd-skin']) {
							logger.error(`Missing required option "${'--avd-skin'}"\n`);
							process.exit(1);
						}
					}

					switch (argv.target) {
						case 'emulator':
							cmdAdd('simulator', tiapp.name, argv['android-sdk'], argv['project-dir'], tiapp.id, argv['avd-id'], argv['avd-skin']);
							delayCmd = true;

							// launch the emulator
							const emuArgs = [ builderPy, 'emulator', tiapp.name, argv['android-sdk'], argv['project-dir'], tiapp.id, argv['avd-id'], argv['avd-skin'] ];
							if (argv['avd-abi']) {
								emuArgs.push(argv['avd-abi']);
							}
							logger.info(`Launching Android emulator: "${cmdRoot}" "${emuArgs.join('" "')}"`);
							spawn(cmdRoot, emuArgs, {
								detached: true,
								stdio: 'ignore'
							}).on('exit', function (code, signal) {
								console.log('EMULATOR EXITED', code, signal);
							});
							break;

						case 'device':
							cmdAdd('install', tiapp.name, argv['android-sdk'], argv['project-dir'], tiapp.id, 1);
							break;

						case 'dist-playstore':
							cmdAdd('distribute', tiapp.name, argv['android-sdk'], argv['project-dir'], tiapp.id, argv['keystore']);
							cmdAddSecret(argv['password']);
							cmdAdd(argv['alias'], argv['output-dir']);
							break;
					}
				}

				// Add debug host if it's defined
				if (argv['debug-host']) {
					if (argv.target === 'device') {
						cmdAdd('');
					}
					cmdAdd(argv['debug-host']);
				}
				// Add profiler host if it's defined
				if (argv['profiler-host']) {
					if (argv.target === 'device') {
						cmdAdd('');
					}
					cmdAdd(argv['profiler-host']);
					cmdAdd('profiler');
				}
		}

	} else {

		// 3.0.0's iOS build does not like it if node has a full path, so we hope they have node in the path
		cmdRoot = version.gte(sdkVersion, '3.0.2') ? (process.execPath || 'node') : 'node';

		hideBanner = true;

		// If the titanium path has spaces, then we are trying to combine the paths and verify after they were split.
		const titaniumPath = (function getTitaniumPath(params) {
			const paramsArray = params.split(' ');
			let pathSegment;
			let prevPath = '';
			while ((pathSegment = paramsArray.pop())) {
				if (fs.existsSync(pathSegment + prevPath)) {
					return pathSegment + prevPath;
				}
				prevPath = ' ' + pathSegment;
			}
			// fallback to default last segment, if we fail for any reason.
			return params.split(' ').pop();
		}(argv.$0));

		cmdAdd(titaniumPath);
		cmdAdd(commandName, '--sdk', sdkName);

		const flags = {};
		const options = {};

		// mix the command and platform specific options together
		for (const ctx of [ cli.globalContext, cli.command, cli.command.platform ]) {
			if (ctx && ctx.conf) {
				if (ctx.conf.flags) {
					Object.assign(flags, ctx.conf.flags);
				}
				if (ctx.conf.options) {
					Object.assign(options, ctx.conf.options);
				}
			}
		}

		for (const name of Object.keys(flags)) {
			const def = Object.prototype.hasOwnProperty.call(flags[name], 'default') ? flags[name].default : false;
			if (argv[name] !== undefined && def !== argv[name]) {
				cmdAdd(`--${(argv[name] ? '' : 'no-')}${name}`);
			}
		}

		for (const name of Object.keys(options)) {
			if (name !== 'sdk' && argv[name] !== undefined) {
				// in 3.2, we renamed --password to --store-password as to not conflict with the
				// authentication --password option
				let arg = name;
				if (argv.platform === 'android' && arg === 'store-password' && version.lt(sdkVersion, '3.2.0')) {
					arg = 'password';
				}

				cmdAdd(`--${arg}`);
				if (options[name].secret) {
					cmdAddSecret(argv[name]);
				} else {
					cmdAdd(argv[name]);
				}
			}
		}
	}

	// trim off the empty trailing args
	while (!cmd[cmd.length - 1]) {
		cmd.pop();
		cmdSafe.pop();
	}

	if (argv.legacy) {
		logger.info(`Forking legacy SDK command: ${cmdRoot} "${cmdSafe.join('" "')}"\n`);
	} else {
		logger.info(`Forking correct SDK command: "${cmdRoot}" "${cmdSafe.join('" "')}"\n`);
	}

	if (hideBanner) {
		cmd.push('--no-banner');
	}

	// when doing a legacy Android build (1.X or 2.X), then we delay the build to
	// allow the emulator to start because there is a bug where the builder.py
	// doesn't like to be run concurrently
	setTimeout(() => {
		spawn(cmdRoot, cmd, {
			stdio: 'inherit'
		}).on('close', (code, _signal) => {
			if (code) {
				process.exit(code);
			}
		});
	}, delayCmd ? 1000 : 0);
}
