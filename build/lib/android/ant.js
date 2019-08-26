'use strict';

const promisify = require('util').promisify;
const spawn = require('child_process').spawn; // eslint-disable-line security/detect-child-process
const exec = promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const LIB_DIR = path.join(__dirname, '../../../android/build/lib');
const CLASSPATH = [
	path.join(LIB_DIR, 'ant.jar'),
	path.join(LIB_DIR, 'ant-launcher.jar'),
	path.join(LIB_DIR, 'xercesImpl.jar'),
	path.join(LIB_DIR, 'xml-apis.jar'),
	path.join(LIB_DIR, 'ant-nodeps.jar')
];

async function getJavaHome() {
	// TODO: Use same code as node-appc's jdk detection!
	if (process.env.JAVA_HOME) {
		return process.env.JAVA_HOME;
	}

	// TODO: Sniff possible locations on Windows?
	if (os.platform() !== 'darwin') {
		throw new Error('No JAVA_HOME environmnet variable set. Please set JAVA_HOME before building for Android.');
	}

	if (!await fs.exists('/usr/libexec/java_home')) {
		throw new Error();
	}

	const { stdout } = await exec('/usr/libexec/java_home');
	const possible = stdout.trim();
	if (!await fs.exists(possible)) {
		throw new Error(`invalid JAVA_HOME detected using /usr/libexec/java_home: ${possible}`);
	}

	CLASSPATH.push(path.join(possible, 'lib', 'tools.jar'));
	return possible;
}

/**
 * Runs an ant build script with given target(s) and java system properties
 * @param {string} script build.xml file path
 * @param {string[]} targets ant targets to build/run
 * @param {Object} properties java system properties to inject to process/build
 * @returns {Promise<void>}
 */
async function build(script, targets, properties) {
	const javaHome = await getJavaHome();

	const basedir = path.dirname(script);
	const args = [
		'-cp', CLASSPATH.join(path.delimiter),
		'org.apache.tools.ant.launch.Launcher',
		'-Dant.home=build',
		`-DJAVA_HOME="${javaHome}"`
	];

	// add properties
	for (const k in properties) {
		if (Object.prototype.hasOwnProperty.call(properties, k)) {
			args.push('-D' + k + '=' + properties[k]);
		}
	}

	args.push('-buildfile', path.basename(script));
	// Add targets
	args.push(targets);

	return new Promise((resolve, reject) => {
		const prc = spawn('java', args, { cwd: basedir, env: process.env });
		prc.stdout.on('data', data => console.log(data.toString().trim()));
		prc.stderr.on('data', data => console.error(data.toString().trim()));

		prc.on('close', code => {
			if (code !== 0) {
				return reject(`Ant build failed with exit code: ${code}`);
			}
			resolve();
		});
	});
}

module.exports = { build };
