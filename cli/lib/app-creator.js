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
	ti = require('titanium-sdk'),
	util = require('util'),
	uuid = require('node-uuid'),
	__ = appc.i18n(__dirname).__;

module.exports = AppCreator;

function AppCreator() {
	Creator.apply(this, arguments);
}

util.inherits(AppCreator, Creator);

AppCreator.prototype.run = function run(callback) {
	this.logger.info(__('Creating Titanium Mobile application project'));

	appc.fs.copyDirSyncRecursive(this.templateDir, this.projectDir, { logger: this.logger.debug });

	// read and populate the tiapp.xml
	this.projectConfig = new ti.tiappxml(this.projectDir + '/tiapp.xml');
	this.projectConfig.id = this.id;
	this.projectConfig.name = this.projectName;
	this.projectConfig.url = this.url;
	this.projectConfig.version = '1.0';
	this.projectConfig.guid = uuid.v4();
	this.projectConfig['deployment-targets'] = {};
	if (this.platforms.original.indexOf('ios') != -1) {
		this.platforms.original.indexOf('ipad') != -1 || this.platforms.original.push('ipad');
		this.platforms.original.indexOf('iphone') != -1 || this.platforms.original.push('iphone');
	}
	ti.availablePlatformsNames.forEach(function (p) {
		if (p != 'ios') {
			this.projectConfig['deployment-targets'][p] = this.platforms.original.indexOf(p) != -1;
		}
	}, this);
	this.projectConfig['sdk-version'] = this.sdk.name;
	this.projectConfig.save(this.projectDir + '/tiapp.xml');

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

	callback();
};
