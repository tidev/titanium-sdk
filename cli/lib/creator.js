/**
 * @overview
 * The base class for platform specific build commands. This ensures some
 * commonality between build commands so that hooks can consistently
 * access build properties.
 *
 * @copyright
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	ti = require('titanium-sdk');

/**
 * The base class for project creators (i.e. apps, modules).
 *
 * General usage is to extend the Creator class and override the run(), methods.
 *
 * @module lib/creator
 */

module.exports = Creator;

/**
 * Constructs the creator state. This needs to be explicitly called from the
 * derived builder's constructor.
 * @class
 * @classdesc Base class for all project creators.
 * @constructor
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 */
function Creator(logger, config, cli) {
	this.logger = logger;
	this.config = config;
	this.cli = cli;

	this.projectType = cli.argv.type;
	this.projectName = cli.argv.name;
	this.platforms = ti.scrubPlatforms(cli.argv.platforms);
	this.id = cli.argv.id;
	this.url = cli.argv.url || '';
	this.sdk = cli.env.getSDK(cli.argv.sdk);
	this.projectDir = appc.fs.resolvePath(cli.argv['workspace-dir'], this.projectName);
	this.templateDir = appc.fs.resolvePath(this.sdk.path, 'templates', cli.argv.type, cli.argv.template);
	this.projectConfig = null;
}

/**
 * Run stub function. Meant to be overwritten.
 *
 * @param {Function} finished - A function to call after the function finishes
 */
Creator.prototype.run = function run(finished) {
	// stub
	finished();
};
