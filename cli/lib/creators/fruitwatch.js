/**
 * @overview
 * Logic for creating new Apple® Watch™ apps.
 *
 * @copyright
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	Creator = require('../creator'),
	DOMParser = require('xmldom').DOMParser,
	fields = require('fields'),
	fs = require('fs'),
	moment = require('moment'),
	path = require('path'),
	ti = require('titanium-sdk'),
	tiappxml = require('titanium-sdk/lib/tiappxml'),
	util = require('util'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__;

/**
 * Creates Apple® Watch™ projects.
 *
 * @module lib/creators/fruitwatch
 */

module.exports = FruitWatchCreator;

/**
 * Constructs the Apple® Watch™ app creator.
 * @class
 * @classdesc Creates a module project.
 * @constructor
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config
 * @param {Object} cli - The CLI instance
 */
function FruitWatchCreator(logger, config, cli) {
	Creator.apply(this, arguments);

	this.title = __('Apple® Watch™ App');
	this.titleOrder = 3;
	this.type = 'fruitwatch';
}

util.inherits(FruitWatchCreator, Creator);

/**
 * Initializes the Apple® Watch™ app creator.
 */
FruitWatchCreator.prototype.init = function init() {
	if (process.platform !== 'darwin') {
		throw new Error(__('Platform "%s" is not supported', process.platform));
	}

	return this.conf = {
		options: {
			'project-dir': this.configOptionProjectDir(130),
			'name':        this.configOptionAppName(140),
			'template':    this.configOptionTemplate(160, 'watchos1')
		}
	};
};

/**
 * Defines the --project-dir option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
FruitWatchCreator.prototype.configOptionProjectDir = function configOptionProjectDir(order) {
	var cli = this.cli,
		config = this.config,
		logger = this.logger;

	function validate(projectDir, callback) {
		var dir = appc.fs.resolvePath(projectDir),
			file = path.join(dir, 'tiapp.xml'),
			root = path.resolve('/');

		if (!fs.existsSync(dir)) {
			logger.error(__('Project directory does not exist') + '\n');
			return callback(true);
		}

		// we could be in the project's Resources directory, so we go up the tree until we find a tiapp.xml
		while (!fs.existsSync(file)) {
			dir = path.dirname(dir);
			if (dir === root) {
				if (projectDir !== '.') {
					logger.error(__('Invalid project directory "%s" because the tiapp.xml is not found', projectDir));
				}
				return callback(true);
			}
			file = path.join(dir, 'tiapp.xml');
		}

		callback(null, dir);
	}

	return {
		abbr: 'd',
		callback: function (projectDir) {
			if (projectDir === '') {
				// no option value was specified
				// set project dir to current directory
				projectDir = conf.options['project-dir'].default;
			}

			projectDir = appc.fs.resolvePath(projectDir);

			// load the tiapp.xml
			try {
				this.tiapp = new tiappxml(path.join(projectDir, 'tiapp.xml'));
			} catch (ex) {
				logger.error(ex);
				logger.log();
				process.exit(1);
			}

			this.tiapp.properties || (this.tiapp.properties = {});

			// make sure the tiapp.xml is sane
			ti.validateTiappXml(this.logger, this.config, this.tiapp);

			// set the --name default to the app's name
			this.conf.options.name.default = appc.string.capitalize(this.tiapp.name);

			return projectDir;
		}.bind(this),
		desc: __('the directory containing the project'),
		default: '.',
		order: order,
		prompt: function (callback) {
			callback(fields.file({
				promptLabel: __('Where is the __project directory__?'),
				complete: true,
				showHidden: true,
				ignoreDirs: new RegExp(config.get('cli.ignoreDirs')),
				ignoreFiles: /.*/,
				validate: validate
			}));
		},
		required: true,
		validate: validate
	};
};

/**
 * Defines the --name option.
 *
 * @param {Integer} order - The order to apply to this option.
 *
 * @returns {Object}
 */
FruitWatchCreator.prototype.configOptionAppName = function configOptionAppName(order) {
	var cli = this.cli,
		config = this.config,
		logger = this.logger;

	function validate(name, callback) {
		if (!name) {
			logger.error(__('Please specify an app name') + '\n');
			return callback(true);
		}

		var dest = path.join(cli.argv['project-dir'], 'extensions', name);
		if (!cli.argv.force && fs.existsSync(dest)) {
			logger.error(__('Watch app already exists: %s', dest));
			return callback(true);
		}

		callback(null, name);
	}

	var conf = {
		abbr: 'n',
		desc: __('the name of the watch app'),
		order: order,
		prompt: function (callback) {
			callback(fields.text({
				promptLabel: __('Watch app name'),
				default: conf.default,
				validate: validate
			}));
		},
		required: true,
		validate: validate
	};

	return conf;
};

/**
 * Creates the project directory and copies the project files.
 *
 * @param {Function} callback - A function to call after the project has been created
 */
FruitWatchCreator.prototype.run = function run(callback) {
	Creator.prototype.run.apply(this, arguments);

	// download/install the project template
	this.processTemplate(function (err, templateDir) {
		if (err) {
			return callback(err);
		}

		var projectDir = this.cli.argv['project-dir'],
			extName = this.cli.argv.name,
			dest = path.join(projectDir, 'extensions', extName),
			isWatchOSv1 = this.cli.argv.template === 'watchos1',
			watchkitExtName = extName + (isWatchOSv1 ? ' WatchKit Extension' : ' WatchApp Extension'),
			watchkitAppName = extName + (isWatchOSv1 ? ' WatchKit App' : ' WatchApp'),
			watchkitExtId = this.tiapp.id + (isWatchOSv1 ? '' : '.watchkitapp') + '.watchkitextension',
			watchkitAppId = this.tiapp.id + '.watchkitapp';

		this.cli.argv.force && fs.existsSync(dest) && wrench.rmdirSyncRecursive(dest);
		fs.existsSync(dest) || wrench.mkdirSyncRecursive(dest);

		this.copyDir(path.join(templateDir, 'template'), dest, function () {
			// add the extension to the tiapp.xml
			var tiappFile = path.join(projectDir, 'tiapp.xml'),
				projectPath = 'extensions/' + extName + '/' + extName + '.xcodeproj',
				dom = (new DOMParser({ errorHandler: function(){} }).parseFromString(fs.readFileSync(tiappFile).toString(), 'text/xml')),
				doc = dom.documentElement,
				useSpaces,
				iosNode,
				extensionsNode,
				extensionNode,
				child;

			function whitespace(indent) {
				return dom.createTextNode('\r\n' + new Array(indent+1).join(useSpaces ? '  ' : '\t'));
			}

			// check if we should use spaces or tabs
			for (child = doc.firstChild; child; child = child.nextSibling) {
				if (child.nodeType === 3) {
					useSpaces = child.data.indexOf('\t') === -1;
					break;
				}
			}

			// find or create the <ios> node
			for (child = doc.firstChild; child; child = child.nextSibling) {
				if (child.nodeType === 1 && child.tagName === 'ios') {
					iosNode = child;
					break;
				}
			}
			if (!iosNode) {
				iosNode = dom.createElement('ios');
				doc.appendChild(iosNode);
			}

			// find or create the <extensions> node
			for (child = iosNode.firstChild; child; child = child.nextSibling) {
				if (child.nodeType === 1 && child.tagName === 'extensions') {
					extensionsNode = child;
					break;
				}
			}
			if (extensionsNode) {
				// remove existing conflicting extension
				for (child = extensionsNode.firstChild; child; child = child.nextSibling) {
					if (child.nodeType === 1 && child.tagName === 'extension' && child.getAttribute('projectPath') === projectPath) {
						if (child.previousSibling.nodeType === 3) {
							extensionsNode.removeChild(child.previousSibling);
						}
						extensionsNode.removeChild(child);
					}
				}
				if (extensionsNode.lastChild.nodeType === 3) {
					extensionsNode.removeChild(extensionsNode.lastChild);
				}
				extensionsNode.appendChild(whitespace(3));
			} else {
				extensionsNode = dom.createElement('extensions');
				extensionsNode.appendChild(whitespace(3));
				iosNode.insertBefore(whitespace(2), iosNode.lastChild);
				iosNode.insertBefore(extensionsNode, iosNode.lastChild);
			}

			// create the <extension> node
			extensionNode = dom.createElement('extension');
			extensionNode.setAttribute('projectPath', projectPath);
			extensionsNode.appendChild(extensionNode);
			extensionsNode.appendChild(whitespace(2));

			// create the <target> nodes
			function createTargetNode(name) {
				var target = dom.createElement('target'),
					pp = dom.createElement('provisioning-profiles');
				extensionNode.appendChild(whitespace(4));
				extensionNode.appendChild(target);
				target.setAttribute('name', name);
				target.appendChild(whitespace(5));
				target.appendChild(pp);
				target.appendChild(whitespace(4));
				pp.appendChild(whitespace(6));
				pp.appendChild(dom.createElement('device'));
				pp.appendChild(whitespace(6));
				pp.appendChild(dom.createElement('dist-appstore'));
				pp.appendChild(whitespace(6));
				pp.appendChild(dom.createElement('dist-adhoc'));
				pp.appendChild(whitespace(5));
			}
			createTargetNode(watchkitExtName);
			createTargetNode(watchkitAppName);

			extensionNode.appendChild(whitespace(3));

			fs.writeFileSync(tiappFile, '<?xml version="1.0" encoding="UTF-8"?>\r\n' + dom.documentElement.toString());

			callback();
		}, {
			appId: this.tiapp.id,
			extName: extName,
			watchkitExtName: watchkitExtName,
			watchkitExtId: watchkitExtId,
			watchkitAppName: watchkitAppName,
			watchkitAppId: watchkitAppId,
			author: this.tiapp.publisher || '',
			date: moment().format('l'),
			copyright: this.tiapp.copyright ? (this.tiapp.copyright + (/\.$/.test(this.tiapp.copyright) ? '' : '.')) : ('Copyright © ' + (new Date).getFullYear() + '.')
		});
	}.bind(this));
};
