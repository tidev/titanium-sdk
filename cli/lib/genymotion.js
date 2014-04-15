var appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	fs = require('fs'),
	path = require('path'),
	genymotion = require('titanium-sdk/lib/emulators/genymotion');

exports.name = 'genymotion';

exports.title = 'Genymotion';

exports.detect = function (types, config, next) {
	var tisdk = path.basename((function scan(dir) {
		var file = path.join(dir, 'manifest.json');
		if (fs.existsSync(file)) {
			return dir;
		}
		dir = path.dirname(dir);
		return dir != '/' && scan(dir);
	}(__dirname)));

	genymotion.detect(config, null, function (err, result) {
		if (err) {
			next(err);
		} else {
			result.tisdk = tisdk;
			this.data = result;
			if (result.issues.length) {
				this.issues = this.issues.concat(result.issues);
			}
			next(null, { genymotion: result });
		}
	}.bind(this));
};

exports.render = function (logger, config, rpad, styleHeading, styleValue, styleBad) {
	var data = this.data;
	if (!data) return;

	logger.log(styleHeading(__('Genymotion')) + '\n' +
		'  ' + rpad(__('Path'))                  + ' = ' + styleValue(data.path || __('not found')) + '\n' +
		'  ' + rpad(__('Genymotion Executable')) + ' = ' + styleValue(data.executables && data.executables.genymotion || __('not found')) + '\n' +
		'  ' + rpad(__('Genymotion Player'))     + ' = ' + styleValue(data.executables && data.executables.player || __('not found')) + '\n' +
		'  ' + rpad(__('Home'))                  + ' = ' + styleValue(data.home || __('not found')) + '\n'
	);

	logger.log(styleHeading(__('VirtualBox')) + '\n' +
		'  ' + rpad(__('Executable')) + ' = ' + styleValue(data.executables && data.executables.vboxmanage || __('not found')) + '\n' +
		'  ' + rpad(__('Version'))    + ' = ' + styleValue(data.virtualbox || __('unknown')) + '\n'
	);
};
