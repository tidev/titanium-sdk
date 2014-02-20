var appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	fs = require('fs'),
	path = require('path'),
	winstore = require('titanium-sdk/lib/winstore'),
	wp8 = require('titanium-sdk/lib/wp8');

exports.name = 'mobileweb';

exports.title = __('Mobile Web');

exports.detect = function (types, config, next) {
	if (process.platform != 'win32') {
		return next();
	}

	winstore.detect(function (winstoreEnv) {
		wp8.detect(function (wp8Env) {
			winstoreEnv.title = __('Windows Store SDK');
			if (winstoreEnv.issues.length) {
				this.issues = this.issues.concat(winstoreEnv.issues);
			}

			wp8Env.title = __('Windows Phone 8 SDK');
			if (wp8Env.issues.length) {
				this.issues = this.issues.concat(wp8Env.issues);
			}

			next(null, this.data = {
				winstore: winstoreEnv,
				wp8: wp8Env
			});
		}.bind(this));
	}.bind(this));
};

exports.render = function (logger, config, rpad, styleHeading, styleValue, styleBad) {
	var data = this.data;
	if (!data) return;

	// Windows Store
	logger.log(styleHeading(this.data.winstore.title));
	logger.log(
		'  ' + rpad(__('Visual Studio Path')) + ' = ' + styleValue(this.data.winstore.visualStudioPath || __('not found')) + '\n' +
		'  ' + rpad(__('MSBuild version')) + ' = ' + styleValue(this.data.winstore.msbuildVersion || __('not found')) + '\n'
	);

	// Windows Phone 8
	logger.log(styleHeading(this.data.wp8.title));
	logger.log(
		'  ' + rpad(__('Visual Studio Path')) + ' = ' + styleValue(this.data.wp8.visualStudioPath || __('not found')) + '\n' +
		'  ' + rpad(__('MSBuild version')) + ' = ' + styleValue(this.data.wp8.msbuildVersion || __('not found')) + '\n' +
		'  ' + rpad(__('SDK path')) + ' = ' + styleValue(this.data.wp8.sdkPath || __('not found')) + '\n'
	);

	var devices = this.data.wp8.devices;
	logger.log(styleHeading(__('Windows Phone 8 Devices')));
	if (Object.keys(devices).length) {
		logger.log(Object.keys(devices).map(function (id) {
			return '  ' + devices[id].cyan + '\n' +
				'  ' + rpad('  ' + __('ID')) + ' = ' + styleValue(id);
		}).join('\n') + '\n');
	} else {
		logger.log('  ' + __('None').grey + '\n');
	}
};