/**
 * @overview
 * The base class for platform specific build commands. This ensures some
 * commonality between build commands so that hooks can consistently
 * access build properties.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	async = require('async'),
	ejs = require('ejs'),
	fs = require('fs'),
	path = require('path'),
	ti = require('titanium-sdk'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__;

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
 * derived creator's constructor.
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

	this.platforms = ti.scrubPlatforms(cli.argv.platforms);
	this.projectType = cli.argv.type;
	this.projectName = cli.argv.name;
	this.id = cli.argv.id;
	this.url = cli.argv.url || '';
	this.sdk = cli.env.getSDK(cli.argv.sdk);
	this.projectDir = appc.fs.resolvePath(cli.argv['workspace-dir'], this.projectName);
	this.projectConfig = null;

	this.template = cli.argv.template;
	// the templateDir is populated by the create command after determining where it actual is
	this.templateDir = null;
}

Creator.availablePlatforms = [];
Creator.validPlatforms = {};

/**
 * Run stub function. Meant to be overwritten.
 * @param {Function} callback - A function to call after the function finishes
 */
Creator.prototype.run = function run(callback) {
	// stub
	callback();
};

/**
 * Recursively copies files and directories to the destintion. When an .ejs file
 * is encountered, the contents is substituted and the .ejs extension is removed.
 * @param {String} srcDir - The directory to copy
 * @param {String} destDir - The directory to copy the files to
 * @param {Function} callback - A function to call after all of the files have been copied
 * @param {Object} variables - An object to resolve filename substitutions and .ejs templates
 */
Creator.prototype.copyDir = function copyDir(srcDir, destDir, callback, variables) {
	if (!fs.existsSync(srcDir)) return callback();

	variables || (variables = {});

	fs.existsSync(destDir) || wrench.mkdirSyncRecursive(destDir);

	var _t = this,
		ejsRegExp = /\.ejs$/,
		nameRegExp = /\{\{(\w+?)\}\}/g,
		ignoreDirs = new RegExp(this.config.get('cli.ignoreDirs')),
		ignoreFiles = new RegExp(this.config.get('cli.ignoreFiles'));

	async.each(fs.readdirSync(srcDir), function (filename, next) {
		var src = path.join(srcDir, filename);
		if (!fs.existsSync(src)) return next();

		var destName = filename.replace(nameRegExp, function (match, name) {
				return variables[name] || variables[name.substring(0, 1).toLowerCase() + name.substring(1)] || match;
			}),
			dest = path.join(destDir, destName);

		if (fs.statSync(src).isDirectory() && !ignoreDirs.test(filename)) {
			_t.copyDir(src, dest, next, variables);

		} else if (!ignoreFiles.test(filename)) {
			if (ejsRegExp.test(filename)) {
				dest = dest.replace(ejsRegExp, '');
				this.logger.debug(__('Copying %s => %s', src.cyan, dest.cyan));
				// strip the .ejs extension and render the template
				fs.writeFile(dest, ejs.render(fs.readFileSync(src).toString(), variables), next);
			} else {
				this.logger.debug(__('Copying %s => %s', src.cyan, dest.cyan));
				fs.writeFile(dest, fs.readFileSync(src), next);
			}

		} else {
			// ignore
			next();
		}

	}.bind(this), callback);
};