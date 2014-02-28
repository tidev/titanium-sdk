var appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	fs = require('fs'),
	path = require('path'),
	windows = require('titanium-sdk/lib/windows');

exports.name = 'mobileweb';

exports.title = __('Mobile Web');

exports.detect = function (types, config, next) {
	if (process.platform != 'win32') {
		return next();
	}

	windows.detect(config, null, function (results) {
		if (results.issues.length) {
			this.issues = this.issues.concat(results.issues);
		}

		results.tisdk = path.basename((function scan(dir) {
			var file = path.join(dir, 'manifest.json');
			if (fs.existsSync(file)) {
				return dir;
			}
			dir = path.dirname(dir);
			return dir != '/' && scan(dir);
		}(__dirname)));

		next(null, this.data = results);
	}.bind(this));
};

exports.render = function (logger, config, rpad, styleHeading, styleValue, styleBad) {
	var data = this.data;
	if (!data) return;

	// Visual Studio
	logger.log(styleHeading(__('Microsoft (R) Visual Studio')));
	if (Object.keys(data.visualstudio).length) {
		Object.keys(data.visualstudio).sort().forEach(function (ver) {
			var supported = data.visualstudio[ver].supported ? '' : styleBad(' **' + __('Not supported by Titanium SDK %s', data.tisdk) + '**');
			logger.log(
				'  ' + String(ver).cyan + (data.visualstudio[ver].selected ? ' (' + __('selected') + ')' : '').grey + supported + '\n' +
				'  ' + rpad('  ' + __('Path')) + ' = ' + styleValue(data.visualstudio[ver].path) + '\n' +
				'  ' + rpad('  ' + __('CLR Version')) + ' = ' + styleValue(data.visualstudio[ver].clrVersion) + '\n' +
				'  ' + rpad('  ' + __('Windows Phone SDKs')) + ' = ' + styleValue(data.visualstudio[ver].wpsdk ? Object.keys(data.visualstudio[ver].wpsdk).join(', ') : __('not installed'))
			);
		});
		logger.log();
	} else {
		logger.log('  ' + __('No versions found').grey + '\n');
	}

	logger.log(styleHeading(__('Microsoft (R) Windows Phone SDK')));
	if (Object.keys(data.windowsphone).length) {
		Object.keys(data.windowsphone).sort().forEach(function (ver) {
			var supported = data.windowsphone[ver].supported ? '' : styleBad(' **' + __('Not supported by Titanium SDK %s', data.tisdk) + '**');
			logger.log(
				'  ' + String(ver).cyan + (data.windowsphone[ver].selected ? ' (' + __('selected') + ')' : '').grey + supported + '\n' +
				'  ' + rpad('  ' + __('Path')) + ' = ' + styleValue(data.windowsphone[ver].path)
			);
		});
		logger.log();
	} else {
		logger.log('  ' + __('No versions found').grey + '\n');
	}

	logger.log(styleHeading(__('Microsoft (R) Build Engine')));
	if (data.msbuild) {
		logger.log('  ' + rpad(__('MSBuild Version')) + ' = ' + styleValue(data.msbuild.version) + '\n');
	} else {
		logger.log('  ' + __('Not installed').grey + '\n');
	}

	logger.log(styleHeading(__('Windows Phone 8 Devices')));
	if (Object.keys(data.devices).length) {
		logger.log(Object.keys(data.devices).map(function (id) {
			return '  ' + data.devices[id].cyan + '\n' +
				'  ' + rpad('  ' + __('ID')) + ' = ' + styleValue(id);
		}).join('\n') + '\n');
	} else {
		logger.log('  ' + __('None').grey + '\n');
	}
};