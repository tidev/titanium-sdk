/*
 * build.js: Titanium IOS CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var fs = require('fs'),
	path = require('path'),
	exec = require('child_process').exec,
	wrench = require('wrench'),
	appc = require('node-appc'),
	afs = appc.fs,
	ios = appc.ios,
	hitch = appc.util.hitch,
	parallel = appc.async.parallel,
	series = appc.async.series;

function build(opts) {
	var logger = opts.logger,
		config = opts.config,
		cli = opts.cli,
		sdkVersion = opts.sdkVersion,
		lib = opts.lib,
		finished = opts.finished;
	
	logger.info(__('Compiling "%s" build', cli.argv['build-type']));
	
	this.logger = logger;
	this.iphoneSdkPath = afs.resolvePath(path.dirname(module.filename) + '/../..');
	this.projectDir = afs.resolvePath(cli.argv.dir);
	this.buildDir = this.projectDir + '/build/iphone';
	this.env = {};
	
	parallel(this, [
		function (callback) {
			ios.detect(hitch(this, function (env) {
				this.env = env;
				if (!env.xcodePath) {
					logger.error(__('Unable to locate Xcode. Please verify that you have properly installed Xcode.') + '\n');
					process.exit(1);
				}
				
				// TODO: validate we have an SDK installed
				
				logger.debug(__('Xcode installation: %s', env.xcodePath));
				logger.debug(__('Installed iOS SDKs: %s', env.sdks.join(', ')));
				logger.debug(__('Installed iOS Simulators: %s', env.simulators.join(', ')));
				logger.debug(__('iOS development certificates: %s', env.dev ? env.devNames.join(', ') : __('not found')));
				logger.debug(__('iOS distribution certificates: %s', env.dist ? env.distNames.join(', ') : __('not found')));
				logger.debug(__('iOS WWDR certificate: %s', env.wwdr ? __('installed') : __('not found')));
				callback();
			}), {
				minsdk: '4.0.0'
			});
		},
		
		function (callback) {
			this.tiapp = new appc.tiappxml(path.join(cli.argv.dir, 'tiapp.xml'));
			wrench.mkdirSyncRecursive(this.buildDir);
			this.createInfoPlist();
			callback();
		},
		
		function (callback) {
			// TODO: detect modules
			callback();
		}
	], function () {
		dump(cli.argv);
		finished();
	});
}

build.config = function (logger, config, cli) {
	return {
		options: {
			'target-type': {
				abbr: 'T',
				default: 'universal',
				desc: __('the target device family type'),
				hint: __('type'),
				required: true,
				values: ['universal', 'iphone', 'ipad']
			}
		}
	};
};

build.prototype = {

	createXcodeProject: function () {
		// project = Projector(self.name,version,template_dir,project_dir,self.id)
		// project.create(template_dir,iphone_dir)
	},
	
	createInfoPlist: function () {
		var src = this.projectDir + '/Info.plist';
		// if the user has a Info.plist in their project directory, consider that a custom override
		if (afs.exists(src)) {
			this.logger.info('Copying Info.plist');
			afs.copyFileSync(src, this.buildDir + '/Info.plist', { logger: this.logger.debug });
		} else {
			this.logger.info('Building Info.plist');
			
			var iphone = this.tiapp.iphone,
				ios = this.tiapp.ios,
				fbAppId = this.tiapp.properties && this.tiapp.properties['ti.facebook.appid'],
				iconName = (this.tiapp.appicon || 'appicon.png').replace(/(.+)(\..*)$/, '$1'),
				consts = {
					'__APPICON__': iconName,
					'__PROJECT_NAME__': this.tiapp.name,
					'__PROJECT_ID__': this.tiapp.id,
					'__URL__': this.tiapp.id,
					'__URLSCHEME__': this.tiapp.name.replace(/\./g, '_').replace(/ /g, '').toLowerCase(),
					'__ADDITIONAL_URL_SCHEMES__': fbAppId ? '<string>fb' + fbAppId + '</string>' : ''
				},
				plist = new appc.plist();
			
			if (afs.exists(this.iphoneSdkPath + '/Info.plist')) {
				plist.parse(fs.readFileSync(this.iphoneSdkPath + '/Info.plist').toString().replace(/(__.+__)/g, function (match, key, format) {
					return consts.hasOwnProperty(key) ? consts[key] : '<!-- ' + key + ' -->'; // if they key is not a match, just comment out the key
				}));
			}
			
			this.tiapp['persistent-wifi'] === true && (plist.UIRequiresPersistentWiFi = true);
			this.tiapp['prerendered-icon'] === true && (plist.UIPrerenderedIcon = true);
			this.tiapp['statusbar-hidden'] === true && (plist.UIStatusBarHidden = true);
			
			if (/opaque_black|opaque|black/.test(this.tiapp['statusbar-style'])) {
				plist.UIStatusBarStyle = 'UIStatusBarStyleBlackOpaque';
			} else if (/translucent_black|transparent|translucent/.test(this.tiapp['statusbar-style'])) {
				plist.UIStatusBarStyle = 'UIStatusBarStyleBlackTranslucent';
			} else {
				plist.UIStatusBarStyle = 'UIStatusBarStyleDefault';
			}
			
			if (iphone) {
				if (iphone.orientations) {
					Object.keys(iphone.orientations).forEach(function (key) {
						var arr = plist['UISupportedInterfaceOrientations' + (key == 'ipad' ? '~ipad' : '')] = [];
						iphone.orientations[key].forEach(function (name) {
							arr.push(name);
						});
					});
				}
				
				if (iphone.backgroundModes) {
					plist.UIBackgroundModes = [].concat(iphone.backgroundModes);
				}
				
				if (iphone.requires) {
					plist.UIRequiredDeviceCapabilities = [].concat(iphone.requiredFeatures);
				}
				
				if (iphone.types) {
					var types = plist.CFBundleDocumentTypes = [];
					iphone.types.forEach(function (type) {
						types.push({
							CFBundleTypeName: type.name,
							CFBundleTypeIconFiles: type.icon,
							LSItemContentTypes: type.uti,
							LSHandlerRank: type.owner ? 'Owner' : 'Alternate'
						});
					});
				}
			}
			
			ios && ios.plist && Object.keys(ios.plist).forEach(function (prop) {
				if (!/^\+/.test(prop)) {
					plist[prop] = ios.plist[prop];
				}
			});
			
			plist.CFBundleIdentifier = this.tiapp.id;
			plist.CFBundleVersion = appc.version.format(this.tiapp.version || 1, 2);
			plist.CFBundleShortVersionString = appc.version.format(this.tiapp.version || 1, 3, 3);
			
			plist.CFBundleIconFiles = [];
			['.png', '@2x.png', '-72.png', '-Small-50.png', '-72@2x.png', '-Small-50@2x.png', '-Small.png', '-Small@2x.png'].forEach(function (name) {
				name = iconName + name;
				if (afs.exists(this.projectDir, 'Resources', name) || afs.exists(this.projectDir, 'Resources', 'iphone', name)) {
					plist.CFBundleIconFiles.push(name);
				}
			}, this);
			
			fs.writeFileSync(this.buildDir + '/Info.plist', plist.toString('xml'));
		}
		
	}

};

module.exports = build;