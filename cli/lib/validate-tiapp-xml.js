export function validateTiappXml(logger, config, tiapp) {
	const data = tiapp.data();
	if (!data.id) {
		logger.error('tiapp.xml is missing the <id> element');
		logger.error('The app id must consist of letters, numbers, and underscores.');
		logger.error('Note: Android does not allow dashes and iOS does not allow underscores.');
		logger.error('The first character must be a letter or underscore.');
		logger.error('Usually the app id is your company\'s reversed Internet domain name. (i.e. com.example.myapp)\n');
		process.exit(1);
	}

	if (!data.name) {
		logger.error('tiapp.xml is missing the <name> element');
		logger.error('The project name must consist of letters, numbers, dashes, and underscores.');
		logger.error('The first character must be a letter.\n');
		process.exit(1);
	}

	if (!data.guid) {
		logger.error('tiapp.xml is missing the <guid> element');
		logger.error('The guid must be in the format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX and consist of letters and numbers.\n');
		logger.log('If you need a new guid, below are 5 freshly generated new ones that you can choose from:');
		for (let i = 0; i < 5; i++) {
			logger.log('    ' + uuid.v4());
		}
		logger.log();
		process.exit(1);
	}

	if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(data.guid)) {
		logger.error(`tiapp.xml contains an invalid guid "${data.guid}"`);
		logger.error('The guid must be in the format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX and consist of letters and numbers.\n');
		logger.log('If you need a new guid, below are 5 freshly generated new ones that you can choose from:');
		for (let i = 0; i < 5; i++) {
			logger.log('    ' + uuid.v4());
		}
		logger.log();
		process.exit(1);
	}

	if (!data.version) {
		data.version = '1.0';
	}

	if (!config.get('app.skipVersionValidation') && !data.properties['ti.skipVersionValidation']) {
		if (!/^\d+(\.\d+(\.\d+(\..+)?)?)?$/.test(data.version)) {
			logger.error(`tiapp.xml contains an invalid version "${data.version}"`);
			logger.error('The version must consist of three positive integers in the format "X.Y.Z".\n');
			process.exit(1);
		}

		if (('' + data.version).charAt(0) == '0') { // eslint-disable-line eqeqeq
			logger.warn(`tiapp.xml contains an invalid version "${data.version}"`);
			logger.warn('The app version major number must be greater than zero.');
		}
	}
}
