/**
 * Installs, configures, and runs gradle in a root project directory.
 *
 * @module lib/gradle-wrapper
 *
 * @copyright
 * Copyright (c) 2009-2019 by Axway, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const appc = require('node-appc');
const exec = require('child_process').exec; // eslint-disable-line security/detect-child-process
const fs = require('fs-extra');
const path = require('path');
const url = require('url');

/**
 * Determines if we're running on a Windows machine.
 * @constant {Boolean}
 */
const isWindows = (process.platform === 'win32');

/** Class used to install, configure, and run gradle in a root project directory. */
class GradleWrapper {
	/**
	 * Creates an object used to install/configure/run the "gradlew" script at the given root project directory.
	 * @param {String} gradlePath
	 * Path to the directory where the "gradlew" scripts are to be located.
	 * Cannot be null/undefined or else an exception will be thrown.
	 * @param {String} projectPath
	 * Path to the Titanium project
	 * Cannot be null/undefined or else an exception will be thrown.
	 */
	constructor(gradlePath, projectPath) {
		// Validate argument.
		if (!gradlePath || !projectPath) {
			throw new Error('Arguments "gradlePath" and "projectPath" cannot be null/undefined.');
		}

		/** @private @type {String} */
		this._gradlewDirPath = gradlePath;

		/** @private @type {String} */
		this._projectDirPath = projectPath;

		/** @private @type {Object} */
		this._logger = null;
	}

	/**
	 * Gets the path to the directory the gradle wrapper batch/shell script files are located in.
	 * This would be the root directory of a gradle based project.
	 * @type {String}
	 */
	get directoryPath() {
		return this._gradlewDirPath;
	}

	/**
	 * Gets the path to the directory the gradle wrapper batch/shell script files are located in.
	 * This would be the root directory of a gradle based project.
	 * @type {String}
	 */
	get projectPath() {
		return this._projectDirPath;
	}

	/**
	 * Gets/Sets the "appc-logger" object that gradle will output to. Can be null/undefined.
	 * @type {Object}
	 */
	get logger() {
		return this._logger;
	}
	set logger(value) {
		this._logger = value;
	}

	/**
	 * Runs the gradle "clean" command on the project, deleting all intermediate files and build artifacts.
	 * @param {String} [subprojectName]
	 * Optional name of the gradle subproject to clean, such as 'app'. This will not clean its dependency projects.
	 * Can be null/undefined, in which case all subprojects will be cleaned.
	 */
	async clean(subprojectName) {
		subprojectName = isNonEmptyString(subprojectName) ? `:${subprojectName}:` : '';
		await this.run(`${subprojectName}clean --console plain`);
	}

	/**
	 * Builds a debug version of the project.
	 * @param {String} [subprojectName]
	 * Optional name of the gradle subproject to build, such as 'app'. Will build all of its dependency projects too.
	 * Can be null/undefined, in which case all subprojects will be built.
	 */
	async assembleDebug(subprojectName) {
		subprojectName = isNonEmptyString(subprojectName) ? `:${subprojectName}:` : '';
		await this.run(`${subprojectName}assembleDebug --console plain --warning-mode all`);
	}

	/**
	 * Builds a release version of the project.
	 * @param {String} [subprojectName]
	 * Optional name of the gradle subproject to build, such as 'app'. Will build all of its dependency projects too.
	 * Can be null/undefined, in which case all subprojects will be built.
	 */
	async assembleRelease(subprojectName) {
		subprojectName = isNonEmptyString(subprojectName) ? `:${subprojectName}:` : '';
		await this.run(`${subprojectName}assembleRelease --console plain --warning-mode all`);
	}

	/**
	 * Executes the gradle script's "publishing" task for the project.
	 *
	 * Typically used to create a maven repository directory tree for the last built library project
	 * containing its AAR library and a "*.pom" XML file defining that library's dependencies.
	 *
	 * This method is expected to be called after calling assembleRelease().
	 * @param {String} [subprojectName]
	 * Optional name of the gradle subproject to publish.
	 *
	 * Can be null/undefined, in which case all subprojects will be published if they have a "publishing"
	 * block in their "build.gradle" file.
	 */
	async publish(subprojectName) {
		subprojectName = isNonEmptyString(subprojectName) ? `:${subprojectName}:` : '';
		await this.run(`${subprojectName}publish --console plain`);
	}

	/**
	 * Runs the "gradlew" command line tool with the given command line arguments string.
	 * @param {String} [argsString]
	 * Optional string to be passed as arguments to the "gradlew" command line tool.
	 *
	 * For example, set this to "assembleRelease --console plain" to do a release build and
	 * output gradle's stdout/stderr as plain text to this GradleWrapper object's assigned "logger".
	 */
	async run(argsString) {
		// Set up the "gradlew" command line string.
		const gradlewFilePath = path.join(this._gradlewDirPath, isWindows ? 'gradlew.bat' : 'gradlew');
		let commandLineString = `"${gradlewFilePath}"`;
		if (argsString) {
			commandLineString += ' ' + argsString;
		}

		// Function which returns a stdout/stderr "data" reading function object and outputs it to given "logFunction".
		// The "logFunction" argument is expected to be an appc "logger.info" or "logger.error" object.
		const createReadableDataHandlerUsing = (logFunction) => {
			let stringBuffer = '';
			return (data) => {
				// Append the received string data to existing buffer.
				stringBuffer += data.toString();

				// Check if a line ending exists. If it does, then we log messages to output.
				const index = stringBuffer.lastIndexOf('\n');
				if (index <= 0) {
					return;
				}

				// Log the received messages, split by newline. (Strip out carriage returns on Windows.)
				const messageArray = stringBuffer.substr(0, index).split('\n');
				for (const nextMessage of messageArray) {
					logFunction('[GRADLE] ' + nextMessage.replace(/\r/g, ''));
				}

				// Remove the above logged strings from the buffer.
				// This keeps the trailing characters that don't end with a newline (yet).
				if ((index + 1) < stringBuffer.length) {
					stringBuffer = stringBuffer.substr(index + 1);
				} else {
					stringBuffer = '';
				}
			};
		};

		// Run the gradlew command line async.
		await new Promise((resolve, reject) => {
			const childProcess = exec(commandLineString, { cwd: this._gradlewDirPath });
			if (this._logger) {
				childProcess.stdout.on('data', createReadableDataHandlerUsing(this._logger.info));
				childProcess.stderr.on('data', createReadableDataHandlerUsing(this._logger.error));
			}
			childProcess.on('error', reject);
			childProcess.on('exit', (exitCode) => {
				if (exitCode === 0) {
					resolve();
				} else {
					reject(`"gradlew" tool returned exit code: ${exitCode}`);
				}
			});
		});
	}

	/**
	 * Copies the "gradlew" file tree from the given "templateDirPath" to this object's assigned "directoryPath".
	 * This must be done before calling this object's clean(), assembleRelease(), assembleDebug(), or run() methods
	 * since the "gradlew" scripts and libraries must be copied to the root project's directory.
	 * @param {String} templateDirPath
	 * Path to a directory tree containing the "gradlew" scripts and libraries. Cannot be null/undefined.
	 *
	 * Expected to be set to: "<RootFolder>/Titanium/mobilesdk/<Platform>/<Version>/android/templates/gradle"
	 */
	async installTemplate(templateDirPath) {
		// Validate argument.
		if (typeof templateDirPath !== 'string') {
			throw new Error('Argument "templateDirPath" must be set to a string.');
		}

		// Copy the gradle template directory tree to the directory this object references.
		// Note: The copy function does not copy file permissions. So, we must re-add execute permissions.
		//       0o755 = User Read/Write/Exec, Group Read/Execute, Others Read/Execute
		const destinationDirPath = this._gradlewDirPath;
		const platformDirPath = path.join(this._projectDirPath, 'platform', 'android');

		await fs.copy(templateDirPath, destinationDirPath);
		await fs.chmod(path.join(destinationDirPath, 'gradlew'), 0o755);
		await fs.chmod(path.join(destinationDirPath, 'gradlew.bat'), 0o755);

		// Fetch proxy server information, if configured.
		let proxyUrl = null;
		await new Promise((resolve) => {
			const runOptions = { shell: true, windowsHide: true };
			appc.subprocess.run('appc', [ '-q', 'config', 'get', 'proxyServer' ], runOptions, (exitCode, out) => {
				try {
					if (!exitCode && out && (out.length > 0)) {
						proxyUrl = url.parse(out.trim());
					}
				} catch (ex) {
					if (this._logger) {
						this._logger.warn('Failed to parse configured "proxerServer" URL. Reason: ' + ex.message);
					}
				} finally {
					resolve();
				}
			});
		});

		// Write a "gradle.properties" file.
		const properties = [ { comment: 'This file was generated by Titanium\'s build tools.' }, { comment: 'Include your own configuration by creating a "gradle.properties" in the platform/android folder.' } ];

		if (proxyUrl) {
			if (proxyUrl.hostname) {
				properties.push({ key: 'systemProp.http.proxyHost', value: proxyUrl.hostname });
				properties.push({ key: 'systemProp.https.proxyHost', value: proxyUrl.hostname });
			}
			if (proxyUrl.port) {
				properties.push({ key: 'systemProp.http.proxyPort', value: proxyUrl.port });
				properties.push({ key: 'systemProp.https.proxyPort', value: proxyUrl.port });
			}
			if (proxyUrl.auth) {
				const authArray = proxyUrl.auth.split(':');
				properties.push({ key: 'systemProp.http.proxyUser', value: authArray[0] });
				properties.push({ key: 'systemProp.https.proxyUser', value: authArray[0] });
				if (authArray.length > 1) {
					properties.push({ key: 'systemProp.http.proxyPassword', value: authArray[1] });
					properties.push({ key: 'systemProp.https.proxyPassword', value: authArray[1] });
				}
			}
		}

		await writeJavaPropertiesFile(path.join(destinationDirPath, 'gradle.properties'), platformDirPath, properties);
	}

	/**
	 * Creates a "local.properties" file at the gradle project's root location,
	 * providing the given Android SDK/NDK directory paths needed to do an Android build.
	 * @param {String} androidSdkDirPath Path to the Android SDK directory. Cannot be null/undefined.
	 * @param {String} [androidNdkDirPath] Optional path to the Android NDK directory. Can be null/undefined.
	 */
	async writeLocalPropertiesFile(androidSdkDirPath, androidNdkDirPath) {
		const filePath = path.join(this._gradlewDirPath, 'local.properties');
		const platformDirPath = path.join(this._projectDirPath, 'platform', 'android');

		const properties = [
			{ comment: 'This file was generated by Titanium\'s build tools.' },
			{ key: 'sdk.dir', value: androidSdkDirPath }
		];
		if (androidNdkDirPath) {
			properties.push({ key: 'ndk.dir', value: androidNdkDirPath });
		}
		await writeJavaPropertiesFile(filePath, platformDirPath, properties);
	}
}

/**
 * Determines if given argument is of type string and contains at least 1 character.
 * @param {Object} [value] The object to be tested. Can be null/undefined.
 * @returns {Boolean}
 * Returns true if given object is of type string and contains at least 1 character. Returns false if not.
 */
function isNonEmptyString(value) {
	if (typeof value === 'string') {
		return (value.length > 0);
	}
	return false;
}

/**
 * Creates a Java style properties file with the given array of property information.
 * If referenced file already exists, then it will be overwritten.
 * @param {String} filePath
 * Path to the file to be written. Cannot be null/undefined or else an exception will be thrown.
 * @param {String} platformPath
 * Path to the local android/platform directory which can be used to override Java properties.
 * Cannot be null/undefined or else an exception will be thrown.
 * @param {[{ comment: {String}, key: {String}, value: {String} }]} properties
 * Array of property dictionary objects describing what to be written to file.
 * Order matters. First array entry is written to file first. Last array entry is written last.
 * Given array can be null/undefined, in which case an empty file will be created.
 *
 * Null or empty entries will write empty lines to file.
 *
 * An entry with a "comment" property will write a #-prefixed string to file.
 *
 * An entry having "key" and "value" properties will be written to file as "myKey=myValue".
 * You can set a "key" without a "value" which will write "myKey=" to file.
 */
async function writeJavaPropertiesFile(filePath, platformPath, properties) {
	// Validate arguments.
	if (typeof filePath !== 'string') {
		throw new Error('Argument "filePath" must be of type string.');
	}
	if (typeof platformPath !== 'string') {
		throw new Error('Argument "platformPath" must be of type string.');
	}
	if (properties && !Array.isArray(properties)) {
		throw new Error('Argument "properties" must be an array of dictionaries.');
	}

	// Returns given string where non-ASCII characters are replaced with "\uXXXX" escaped unicode hex codes.
	function escapeUnicodeString(message) {
		if (message) {
			message = message.replace(/[\u0080-\uFFFF]/g, (match) => {
				return '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4);
			});
		}
		return message;
	}

	// Returns the given property string key in escaped form.
	function escapeKey(key) {
		if (key) {
			key = key.replace(/\\/g, '\\\\');
			key = key.replace(/:/g, '\\:');
			key = key.replace(/[=]/g, '\\=');
			key = key.replace(/[\r\n]/g, ''); // Remove '\r' and '\n' characters.
			key = escapeUnicodeString(key);
		}
		return key;
	}

	// Returns the given property string value in escaped form.
	function escapeValue(value) {
		if (typeof value === 'string') {
			value = value.replace(/\\/g, '\\\\');
			value = value.replace(/[\r\n]/g, ''); // Remove '\r' and '\n' characters.
			value = escapeUnicodeString(value);
		}
		return value;
	}

	// Turn the given property entries into an array of text lines to be written to file later.
	let fileLines = [];
	if (properties) {
		for (let nextProperty of properties) {
			// Handle the next property row entry.
			let hasAddedLine = false;
			if (typeof nextProperty === 'object') {
				// Create a "comment" line if defined in the property entry.
				if (typeof nextProperty.comment === 'string') {
					let comment = nextProperty.comment;
					comment = comment.replace(/[\r\n]/g, '');
					if (!comment.startsWith('#') && !comment.startsWith('!')) {
						comment = '# ' + comment;
					}
					fileLines.push(comment);
					hasAddedLine = true;
				}

				// Create a "key=value" line if defined in property entry. ("value" is optional.)
				if (typeof nextProperty.key === 'string') {
					let modifiedKey = nextProperty.key.trim();
					if (modifiedKey.length > 0) {
						let modifiedValue = escapeValue(nextProperty.value);
						if (!modifiedValue) { // eslint-disable-line max-depth
							modifiedValue = '';
						}
						modifiedKey = escapeKey(modifiedKey);
						fileLines.push(modifiedKey + '=' + modifiedValue);
						hasAddedLine = true;
					}
				}
			}

			// If the property entry is null/empty, then create an empty line in the file.
			if (!hasAddedLine) {
				fileLines.push('');
			}
		}
	}

	// Create the properties files with the text lines generated above.
	await fs.writeFile(filePath, fileLines.join('\n') + '\n');

	// Add own configuration is provided. Following a proper format is on own risk!
	const fileName = filePath.split('/').pop();
	const gradlePropertiesOverwriteFile = path.join(platformPath, fileName);

	if (await fs.exists(gradlePropertiesOverwriteFile)) {
		await fs.appendFile(filePath, (await fs.readFile(gradlePropertiesOverwriteFile, 'utf-8')).toString() + '\n');
	}
}

module.exports = GradleWrapper;
