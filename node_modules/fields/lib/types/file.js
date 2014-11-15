var common = require('../common'),
	Prompter = require('../prompter'),
	fs = require('fs'),
	path = require('path'),
	util = require('util'),
	trailingSepRegExp = /[\/\\]$/;

module.exports = File;

function File(opts) {
	if (!(this instanceof File)) return new File(opts);
	File.super_.call(this);
	this.showHidden = true;
	common.mix(this, this._defaults, opts);
}

util.inherits(File, Prompter);

File.prototype._complete = function _complete(value, callback) {
	var isWin = process.platform === 'win32',
		caseSensitive = !isWin,
		p = (isWin ? Math.max(value.lastIndexOf('/'), value.lastIndexOf('\\')) : value.lastIndexOf(path.sep)) + 1,
		filename = p === 0 ? '' : caseSensitive ? value.substring(p) : value.substring(p).toLowerCase(),
		dir = p === 0 ? value : value.substring(0, p),
		absDir = common.resolvePath(isWin ? dir.replace(/\//g, '\\') : dir.replace(/\\ /g, ' ')),
		matches = [],
		shortestMatch = null;

	if (fs.existsSync(absDir) && fs.statSync(absDir).isDirectory()) {
		// we have to try/catch just in case we don't have access
		try {
			fs.readdirSync(absDir).forEach(function (name) {
				var file = path.join(absDir, name),
					isDirectory = fs.existsSync(file) && fs.statSync(file).isDirectory();
				if ((!isDirectory || !this.ignoreDirs || !this.ignoreDirs.test(name))
					&& (isDirectory || !this.ignoreFiles || !this.ignoreFiles.test(name))
					&& (this.showHidden || name.charAt(0) !== '.')
					&& (filename === ''
						|| (caseSensitive && name.indexOf(filename) === 0)
						|| (!caseSensitive && name.toLowerCase().indexOf(filename) === 0))
				) {
					try {
						if (isDirectory) {
							matches.push([name, true]);
						} else {
							matches.push([name, false]);
						}
					} catch (ex) {
						matches.push([name, false]);
					}
					if (filename) {
						if (shortestMatch === null) {
							shortestMatch = name;
						} else {
							for (var i = 0; i < name.length && i < shortestMatch.length; i++) {
								if (name[i] !== shortestMatch[i]) {
									shortestMatch = shortestMatch.substring(0, i);
									break;
								}
							}
						}
					}
				}
			}.bind(this));
		} catch (ex) {}
	}

	if (matches.length === 1) {
		// only 1 match, so just return it now
		callback(path.join(dir, matches[0][0]) + (matches[0][1] ? path.sep : ''));
	} else if (matches.length > 1) {
		if (shortestMatch) {
			value += shortestMatch.substring(filename.length);
		}
		callback(value, matches.map(function (f) {
			return f[0] + (f[1] ? path.sep : '');
		}));
	} else {
		callback(value);
	}
};

File.prototype.prompt = function prompt(callback) {
	this.emit('pre-prompt', this);
	this.title && this._println(this.formatters.title ? this.formatters.title(this) : this._format('title'));
	this.desc && this._println(this.formatters.desc ? this.formatters.desc(this) : this._format('desc'));
	this._get(callback);
};
