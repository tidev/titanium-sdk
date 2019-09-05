/**
 * Ti.SwiftSupport
 * Copyright (c) 2018-present by Axway Appcelerator.
 * All Rights Reserved.
 */

'use strict';

exports.id = 'ti.swiftsupport';
exports.cliVersion = '>=3.2';
exports.init = init;

/**
 * Main entry point for our plugin which looks for the platform specific
 * plugin to invoke.
 *
 * @param {Object} logger The logger instance.
 * @param {Object} config The hook config.
 * @param {Object} cli The Titanium CLI instance.
 * @param {Object} appc The Appcelerator CLI instance.
 */
// eslint-disable-next-line no-unused-vars
function init(logger, config, cli, appc) {
	cli.on('build.ios.xcodeproject', {
		pre: function (data) {
			var xobjs = data.args[0].hash.project.objects;

			Object.keys(xobjs.PBXNativeTarget).forEach(function (targetUuid) {
				var target = xobjs.PBXNativeTarget[targetUuid];
				if (target && typeof target === 'object') {
					xobjs.XCConfigurationList[target.buildConfigurationList].buildConfigurations.forEach(function (buildConf) {
						var buildSettings = xobjs.XCBuildConfiguration[buildConf.value].buildSettings;
						buildSettings.ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = 'YES';
					});
				}
			});
		}
	});
}
