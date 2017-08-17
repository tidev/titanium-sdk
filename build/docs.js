'use strict';

const spawn = require('child_process').spawn, // eslint-disable-line security/detect-child-process
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
	ROOT_DIR = path.join(__dirname, '..'),
	DOC_DIR = path.join(ROOT_DIR, 'apidoc');

/**
 * @param       {string} outputDir output directory for generated documentation
 * @constructor
 */
function Documentation(outputDir) {
	this.outputDir = outputDir;
	this.hasWindows = fs.existsSync(path.join(ROOT_DIR, 'windows'));
}

Documentation.prototype.prepare = function (next) {
	// no-op now...
	next();
};

Documentation.prototype.generateParityReport = function (next) {
	let args = [ path.join(DOC_DIR, 'docgen.js'), '-f', 'parity' ];
	if (this.hasWindows) {
		args = args.concat([
			'-a', path.join(ROOT_DIR, 'windows', 'doc', 'Titanium'),
			'-a', path.join(ROOT_DIR, 'windows', 'doc', 'WindowsOnly')
		]);
	}

	console.log('Generating parity report...');

	const prc = spawn('node', args, { cwd: DOC_DIR });
	prc.stdout.on('data', function (data) {
		console.log(data.toString().trim());
	});
	prc.stderr.on('data', function (data) {
		console.error(data.toString().trim());
	});
	prc.on('close', function (code) {
		if (code !== 0) {
			return next('Failed');
		}
		next();
	});
};

Documentation.prototype.generateJSCA = function (next) {
	let args = [ path.join(DOC_DIR, 'docgen.js'), '-f', 'jsca', '-o', this.outputDir + path.sep ];
	if (this.hasWindows) {
		args = args.concat([
			'-a', path.join(ROOT_DIR, 'windows', 'doc', 'Titanium'),
			'-a', path.join(ROOT_DIR, 'windows', 'doc', 'WindowsOnly')
		]);
	}
	console.log('Generating JSCA...');

	const prc = spawn('node', args, { cwd: DOC_DIR });
	prc.stdout.on('data', function (data) {
		console.log(data.toString().trim());
	});
	prc.stderr.on('data', function (data) {
		console.error(data.toString().trim());
	});
	prc.on('close', function (code) {
		if (code !== 0) {
			return next('Failed to generate JSCA JSON.');
		}
		next(null, path.join(this.outputDir, 'api.jsca'));
	}.bind(this));
};

Documentation.prototype.generate = function (next) {
	this.prepare(function (err) {
		if (err) {
			return next(err);
		}
		async.parallel([
			this.generateParityReport.bind(this),
			this.generateJSCA.bind(this)
		], next);
	}.bind(this));
};
module.exports = Documentation;
