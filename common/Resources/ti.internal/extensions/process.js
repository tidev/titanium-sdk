'use strict';

const process = {
	arch: Ti.Platform.architecture,
	cwd: function () {
		return __dirname;
	},
	platform: Ti.Platform.name
};
global.process = process;
module.exports = process;
