'use strict';

const path = require('path');

module.exports = config => {
	config.set({
		basePath: '../..',
		frameworks: ['jasmine'],
		files: [
			'test/unit/specs/**/*.js'
		],
		reporters: ['progress', 'junit'],
		junitReporter: {
			outputDir: 'reports/junit',
			outputFile: 'junit.xml'
		},
		customLaunchers: {
			android: {
				base: 'Titanium',
				browserName: 'Android Emulator',
				displayName: 'android',
				platform: 'android'
			}
		},
		logLevel: config.LOG_DEBUG,
		browsers: ['android'],
		singleRun: true,
		retryLimit: 0,
		captureTimeout: 300000
	});
};
