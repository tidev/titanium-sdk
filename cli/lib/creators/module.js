/**
 * @overview
 * Logic for creating new Titanium modules.
 *
 * @copyright
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	Creator = require('../creator'),
	fs = require('fs'),
	path = require('path'),
	util = require('util'),
	uuid = require('node-uuid'),
	__ = appc.i18n(__dirname).__;

module.exports = ModuleCreator;

function ModuleCreator() {
	Creator.apply(this, arguments);
}

util.inherits(ModuleCreator, Creator);

ModuleCreator.type = 'module';

ModuleCreator.prototype.run = function run(callback) {
	this.logger.info(__('Creating Titanium Mobile module project') + '\n');

	this.logger.log('WARNING! This functionality is incomplete.'.red);
	this.logger.log('Please use titanium.py to create module projects.'.red + '\n');

	this.templateDir = appc.fs.resolvePath(this.sdk.path, 'templates', cli.argv.type, cli.argv.template);
	appc.fs.copyDirSyncRecursive(this.templateDir, this.projectDir, { logger: this.logger.debug });

	var year = (new Date).getFullYear();

	this.projectConfig = {
		'___PROJECTNAMEASIDENTIFIER___': this.projectName.toLowerCase().split(/\./).map(function (s) { return appc.string.capitalize(s); }).join(''),
		'___MODULE_NAME_CAMEL___': this.projectName.toLowerCase().split(/[\W_]/).map(function (s) { return appc.string.capitalize(s); }).join(''),
		'___MODULE_ID_AS_FOLDER___': this.id.replace(/\./g, path.sep),
		'___PROJECTNAME___': this.projectName.toLowerCase(),
		'__MODULE_ID__': this.id,
		'__PROJECT_SHORT_NAME__': this.projectName,
		'__VERSION__': this.sdk.name,
		'__SDK__': this.sdk.path,
		'__SDK_ROOT__': this.sdk.path,
		'__GUID__': uuid.v4(),
		'__YEAR__': year
	};

	// create the manifest file
	fs.writeFileSync(this.projectDir + '/manifest', [
		'#',
		'# this is your module manifest and used by Titanium',
		'# during compilation, packaging, distribution, etc.',
		'#',
		'version: 1.0',
		'apiversion: 2',
		'description: ' + this.projectName,
		'author: ' + this.config.get('user.name', 'Your Name'),
		'license: Specify your license',
		'copyright: Copyright (c) ' + year + ' by ' + this.config.get('user.name', 'Your Company'),
		'',
		'# these should not be edited',
		'name: ' + this.projectName,
		'moduleid: ' + this.id,
		'guid: ' + this.projectConfig.__GUID__,
		'platforms: ' + this.platforms.original.join(', ')
	].join('\n'));

	this.cli.addAnalyticsEvent('project.create.module', {
		dir: this.projectDir,
		name: this.projectName,
		author: this.config.get('user.name', 'Your Name'),
		moduleid: this.id,
		description: this.projectName,
		guid: this.projectConfig.__GUID__,
		version: '1.0',
		copyright: 'copyright: Copyright (c) ' + year + ' by ' + this.config.get('user.name', 'Your Company'),
		minsdk: this.sdk.name,
		platforms: this.platforms.original.join(', '),
		date: (new Date()).toDateString()
	});

	callback();
}