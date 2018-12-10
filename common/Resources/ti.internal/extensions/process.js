'use strict';

const process = {
	arch: Ti.Platform.architecture,
	cwd: function () {
		return __dirname;
	},
	// FIXME: Should we try and adopt 'windowsphone'/'windowsstore' to 'win32'?
	// FIXME: Should we try and adopt 'ipad'/'iphone' to 'darwin'? or 'ios'?
	platform: Ti.Platform.osname
};
global.process = process;
module.exports = process;
