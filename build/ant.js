var Ant = {},
	spawn = require('child_process').spawn,
	exec = require('child_process').exec,
	fs = require('fs'),
	os = require('os'),
	path = require('path'),
	async = require('async'),
	LIB_DIR = path.join(__dirname, '..', 'android', 'build', 'lib'),
	CLASSPATH = [
		path.join(LIB_DIR, 'ant.jar'),
		path.join(LIB_DIR, 'ant-launcher.jar'),
		path.join(LIB_DIR, 'xercesImpl.jar'),
		path.join(LIB_DIR, 'xml-apis.jar'),
		path.join(LIB_DIR, 'ant-nodeps.jar')
	];

function getJavaHome(next) {
	if (process.env.JAVA_HOME) {
		return next(null, process.env.JAVA_HOME);
	}

	if (os.platform() === 'darwin' && fs.existsSync('/usr/libexec/java_home')) {
		exec('/usr/libexec/java_home', function (err, stdout, stderr) {
			if (err) {
				return next(err);
			}
			var possible = stdout.trim();
			if (fs.existsSync(possible)) {
				CLASSPATH.push(path.join(possible, 'lib', 'tools.jar'));
				return next(null, possible);
			}
			return next('invalid JAVA_HOME detected using /usr/libexec/java_home');
		});
	}
}

/**
 * [function description]
 * @param  {Array[String]} targets    [description]
 * @param  {Object} properties [description]
 */
Ant.build = function(script, targets, properties, next) {
	var javaHome;
	async.series([
		function (cb) {
			getJavaHome(function (err, home) {
				if (err) {
					return cb(err);
				}
				javaHome = home;
				cb();
			});
		}, function (cb) {
			var basedir = path.dirname(script),
				args = [
					'-cp', CLASSPATH.join(path.delimiter),
					'org.apache.tools.ant.launch.Launcher',
					'-Dant.home=build',
					'-DJAVA_HOME="' + javaHome + '"'
				],
				prc;

			// add properties
			for (var k in properties) {
				if (properties.hasOwnProperty(k)) {
					args.push('-D' + k + '=' + properties[k]);
				}
			}

			args.push('-buildfile', path.basename(script));
			// Add targets
			args = args.concat(targets);

			prc = spawn('java', args, {cwd: basedir, env: process.env});
			prc.stdout.on('data', function(data) {
				console.log(data.toString().trim());
			});

			prc.stderr.on('data', function(data) {
				console.log(data.toString().trim());
			});

			prc.on('close', function(code) {
				if (code !== 0) {
					return cb('Ant build failed: ' + code);
				}
				cb();
			});
		}
	], next);
};

module.exports = Ant;
