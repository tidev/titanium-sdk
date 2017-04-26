var exec = require('child_process').exec,
	spawn = require('child_process').spawn,
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
	ROOT_DIR = path.join(__dirname, '..'),
	DOC_DIR = path.join(ROOT_DIR, 'apidoc');

function Documentation(outputDir) {
	this.outputDir = outputDir;
	this.hasWindows = fs.existsSync(path.join(ROOT_DIR, 'windows'));
}

Documentation.prototype.prepare = function(next) {
	exec('npm install', {cwd: DOC_DIR}, function (err, stdout, stderr) {
		if (err) {
			return next(err);
		}
		next();
	});
};

Documentation.prototype.generateParityReport = function (next) {
	var args = [path.join(DOC_DIR, 'docgen.js'), '-f', 'parity'],
		prc;
	if (this.hasWindows) {
		args = args.concat(['-a', path.join(ROOT_DIR, 'windows', 'doc', 'Titanium'),
							'-a', path.join(ROOT_DIR, 'windows', 'doc', 'WindowsOnly')]);
	}

	console.log('Generating parity report...');

	prc = spawn('node', args, {cwd: DOC_DIR});

	prc.stdout.on('data', function (data) {
		console.log(data.toString().trim());
	});
	prc.stderr.on('data', function (data) {
		console.error(data.toString().trim());
	});
	prc.on('close', function (code) {
		if (code != 0) {
			return next('Failed');
		}
		next();
	});
};

Documentation.prototype.generateJSCA = function (next) {
	var args = [path.join(DOC_DIR, 'docgen.js'), '-f', 'jsca', '-o', this.outputDir + path.sep],
		prc;
	if (this.hasWindows) {
		args = args.concat(['-a', path.join(ROOT_DIR, 'windows', 'doc', 'Titanium'),
							'-a', path.join(ROOT_DIR, 'windows', 'doc', 'WindowsOnly')]);
	}
	console.log('Generating JSCA...');

	prc = spawn('node', args, {cwd: DOC_DIR});

	prc.stdout.on('data', function (data) {
		console.log(data.toString().trim());
	});
	prc.stderr.on('data', function (data) {
		console.error(data.toString().trim());
	});
	prc.on('close', function (code) {
		if (code != 0) {
			return next('Failed to generate JSCA JSON.');
		}
		next(null, path.join(this.outputDir, 'api.jsca'));
	}.bind(this));
};

Documentation.prototype.generate = function(next) {
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
