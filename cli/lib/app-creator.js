/**
 * @overview
 * Logic for creating new Titanium apps.
 *
 * @copyright
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	Creator = require('./creator'),
	fs = require('fs'),
	http = require('http'),
	path = require('path'),
	request = require('request'),
	temp = require('temp'),
	ti = require('titanium-sdk'),
	util = require('util'),
	uuid = require('node-uuid'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__;

module.exports = AppCreator;

function AppCreator() {
	Creator.apply(this, arguments);
}

util.inherits(AppCreator, Creator);

AppCreator.prototype.run = function run(callback) {
	this.logger.info(__('Creating Titanium Mobile application project'));

	var i, l, dir,
		template = this.cli.argv.template || 'default',
		searchPaths = [ appc.fs.resolvePath(this.sdk.path, 'templates', this.cli.argv.type) ],
		additionalPaths = this.config.get('paths.templates');

	this.cli.env.os.sdkPaths.forEach(function (dir) {
		if (fs.existsSync(dir = appc.fs.resolvePath(dir)) && searchPaths.indexOf(dir) == -1) {
			searchPaths.push(dir);
		}
	});

	if (additionalPaths) {
		(Array.isArray(additionalPaths) ? additionalPaths : [ additionalPaths ]).forEach(function (p) {
			if (p && fs.existsSync(p = appc.fs.resolvePath(p)) && searchPaths.indexOf(p) == -1) {
				searchPaths.push(p);
			}
		});
	}

	if (fs.existsSync(template)) {
		if (fs.statSync(template).isDirectory()) {
			copyFiles.call(this, template, callback);
			return;
		}

		if (/\.zip$/.test(template)) {
			unzipFile.call(this, template, callback);
			return;
		}
	} else {
		if (/^https?\:\/\/.+/.test(template)) {
			downloadFile.call(this, template, callback);
			return;
		}

		for (i = 0, l = searchPaths.length; i < l; i++) {
			if (fs.existsSync(dir = path.join(searchPaths[i], template))) {
				copyFiles.call(this, dir);
				return;
			}
		}
	}

	this.logger.error(__('Unable to find template "%s"', template));
	callback(true);
};

function copyFiles(templateDir, alldone) {
	this.templateDir = templateDir;
	this.cli.scanHooks(path.join(this.templateDir, 'hooks'));

	appc.async.series(this, [
		function (next) {
			var dir = path.join(this.templateDir, 'template');
			if (fs.existsSync(dir)) {
				this.cli.createHook('create.copyFiles', this, function (templateDir, projectDir, opts, done) {
					appc.fs.copyDirSyncRecursive(templateDir, projectDir, opts);
					done();
				})(dir, this.projectDir, { logger: this.logger.debug }, next);
			} else {
				next();
			}
		},

		function (next) {
			var params = {
					id: this.id,
					name: this.projectName,
					url: this.url,
					version: '1.0',
					guid: uuid.v4(),
					'deployment-targets': {},
					'sdk-version': this.sdk.name
				},
				tiappFile = path.join(this.projectDir, 'tiapp.xml');

			if (this.platforms.original.indexOf('ios') != -1) {
				this.platforms.original.indexOf('ipad') != -1 || this.platforms.original.push('ipad');
				this.platforms.original.indexOf('iphone') != -1 || this.platforms.original.push('iphone');
			}

			ti.availablePlatformsNames.forEach(function (p) {
				if (p != 'ios') {
					params['deployment-targets'][p] = this.platforms.original.indexOf(p) != -1;
				}
			}, this);

			this.cli.createHook('create.populateTiappXml', this, function (tiapp, params, done) {
				// read and populate the tiapp.xml
				this.projectConfig = appc.util.mix(tiapp, params);
				this.projectConfig.save(tiappFile);
				done();
			}.bind(this))(fs.existsSync(tiappFile) ? new ti.tiappxml(tiappFile) : new ti.tiappxml(), params, next);
		},

		function (next) {
			var dir = path.join(this.projectDir, 'Resources');
			fs.existsSync(dir) || wrench.mkdirSyncRecursive(dir);
			next();
		},

		function (next) {
			this.cli.addAnalyticsEvent('project.create.mobile', {
				dir: this.projectDir,
				name: this.projectName,
				publisher: this.projectConfig.publisher,
				url: this.projectConfig.url,
				image: this.projectConfig.image,
				appid: this.id,
				description: this.projectConfig.description,
				type: 'mobile',
				guid: this.projectConfig.guid,
				version: this.projectConfig.version,
				copyright: this.projectConfig.copyright,
				runtime: '1.0',
				date: (new Date()).toDateString()
			});
			next();
		}
	], alldone);
}

function unzipFile(zipFile, alldone) {
	var dir = temp.mkdirSync({ prefix: 'titanium-' });
	fs.existsSync(dir) || wrench.mkdirSyncRecursive(dir);
	this.logger.info(__('Extracting %s', zipFile.cyan));
	appc.zip.unzip(zipFile, dir, null, function() {
		copyFiles.call(this, dir, function () {
			wrench.rmdirSyncRecursive(dir);
			alldone();
		});
	}.bind(this));
}

function downloadFile(url, alldone) {
	var _t = this,
		tempName = temp.path({ suffix: '.zip' }),
		tempDir = path.dirname(tempName);
	fs.existsSync(tempDir) || wrench.mkdirSyncRecursive(tempDir);

	this.logger.info(__('Downloading %s', url.cyan));

	var tempStream = fs.createWriteStream(tempName),
		req = request({
			url: url,
			proxy: this.config.get('cli.httpProxyServer'),
			rejectUnauthorized: this.config.get('cli.rejectUnauthorized', true)
		});

	req.pipe(tempStream);

	req.on('error', function (err) {
		fs.existsSync(tempName) && fs.unlinkSync(tempName);
		this.logger.log();
		this.logger.error(__('Failed to download template: %s', url) + '\n');
		alldone(true);
	}.bind(this));

	req.on('response', function (req) {
		if (req.statusCode >= 400) {
			// something went wrong, abort
			_t.logger.error(__('Request failed with HTTP status code %s %s', req.statusCode, http.STATUS_CODES[req.statusCode] || ''));
			alldone(true);
			return;
		}

		tempStream.on('close', function () {
			unzipFile.call(_t, tempName, alldone);
		});
	});
}