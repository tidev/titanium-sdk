import assertArgumentType from './_errors';
import path from './path';

const isAndroid = Ti.Platform.name === 'android';

// Keep track of printing out one-time warning messages for unsupported operations/options/arguments
const printedWarnings = {};
function oneTimeWarning(key, msg) {
	if (!printedWarnings[key]) {
		console.warn(msg);
		printedWarnings[key] = true;
	}
}
/**
 * Prints a one-time warning message that we do not support the given API and performs an effective no-op
 * @param {string} moduleName name of the module/object
 * @param {string} name name of the function.property we don't support
 * @returns {Function} no-op function
 */
function unsupportedNoop(moduleName, name) {
	return () => {
		const fqn = `${moduleName}.${name}`;
		oneTimeWarning(fqn, `"${fqn}" is not supported yet on Titanium and uses a no-op fallback.`);
		return undefined;
	};
}

/**
 * @param {string} moduleName name of the module/object
 * @param {string} name name of the function.property we don't support
 * @param {Function} callback async callback we call in a quick setTimeout
 */
function asyncUnsupportedNoop(moduleName, name, callback) {
	callback = maybeCallback(callback); // enforce we have a valid callback
	unsupportedNoop(moduleName, name)();
	setTimeout(callback, 1);
}

// Used to choose the buffer/chunk size when pumping bytes during copies
const COPY_FILE_CHUNK_SIZE = 8092; // what should we use here?

// Keep track of integer -> FileStream mappings
const fileDescriptors = new Map();
let fileDescriptorCount = 4; // global counter used to report file descriptor integers

// Map file system access flags to Ti.Filesystem.MODE_* constants
const FLAGS_TO_TI_MODE = new Map();
FLAGS_TO_TI_MODE.set('a', Ti.Filesystem.MODE_APPEND);
FLAGS_TO_TI_MODE.set('ax', Ti.Filesystem.MODE_APPEND);
FLAGS_TO_TI_MODE.set('a+', Ti.Filesystem.MODE_APPEND);
FLAGS_TO_TI_MODE.set('ax+', Ti.Filesystem.MODE_APPEND);
FLAGS_TO_TI_MODE.set('as+', Ti.Filesystem.MODE_APPEND);
FLAGS_TO_TI_MODE.set('r', Ti.Filesystem.MODE_READ);
FLAGS_TO_TI_MODE.set('r+', Ti.Filesystem.MODE_READ);
FLAGS_TO_TI_MODE.set('rs+', Ti.Filesystem.MODE_READ);
FLAGS_TO_TI_MODE.set('w', Ti.Filesystem.MODE_WRITE);
FLAGS_TO_TI_MODE.set('wx', Ti.Filesystem.MODE_WRITE);
FLAGS_TO_TI_MODE.set('w+', Ti.Filesystem.MODE_WRITE);
FLAGS_TO_TI_MODE.set('wx+', Ti.Filesystem.MODE_WRITE);

// Common errors
const permissionDenied = (syscall, path) => makeError('EACCES', 'permission denied', -13, syscall, path);
const noSuchFile = (syscall, path) => makeError('ENOENT', 'no such file or directory', -2, syscall, path);
const fileAlreadyExists = (syscall, path) => makeError('EEXIST', 'file already exists', -17, syscall, path);
const notADirectory = (syscall, path) => makeError('ENOTDIR', 'not a directory', -20, syscall, path);
const directoryNotEmpty = (syscall, path) => makeError('ENOTEMPTY', 'directory not empty', -66, syscall, path);
const illegalOperationOnADirectory = (syscall, path) => makeError('EISDIR', 'illegal operation on a directory', -21, syscall, path);

const fs = {
	constants: {
		O_RDONLY: 0,
		O_WRONLY: 1,
		O_RDWR: 2,
		S_IFMT: 61440,
		S_IFREG: 32768,
		S_IFDIR: 16384,
		S_IFCHR: 8192,
		S_IFBLK: 24576,
		S_IFIFO: 4096,
		S_IFLNK: 40960,
		S_IFSOCK: 49152,
		O_CREAT: 512,
		O_EXCL: 2048,
		O_NOCTTY: 131072,
		O_TRUNC: 1024,
		O_APPEND: 8,
		O_DIRECTORY: 1048576,
		O_NOFOLLOW: 256,
		O_SYNC: 128,
		O_DSYNC: 4194304,
		O_SYMLINK: 2097152,
		O_NONBLOCK: 4,
		S_IRWXU: 448,
		S_IRUSR: 256,
		S_IWUSR: 128,
		S_IXUSR: 64,
		S_IRWXG: 56,
		S_IRGRP: 32,
		S_IWGRP: 16,
		S_IXGRP: 8,
		S_IRWXO: 7,
		S_IROTH: 4,
		S_IWOTH: 2,
		S_IXOTH: 1,
		F_OK: 0,
		R_OK: 4,
		W_OK: 2,
		X_OK: 1,
		UV_FS_COPYFILE_EXCL: 1,
		COPYFILE_EXCL: 1
	}
};

class Stats {
	constructor (path) {
		this._file = null;
		this.dev = 0;
		this.ino = 0;
		this.mode = 0;
		this.nlink = 0;
		this.uid = 0;
		this.gid = 0;
		this.rdev = 0;
		this.size = 0;
		this.blksize = 4096; // FIXME: https://stackoverflow.com/questions/1315311/what-is-the-block-size-of-the-iphone-filesystem
		this.blocks = 0;
		this.atimeMs = this.mtimeMs = this.ctimeMs = this.birthtimeMs = 0;
		this.atime = this.mtime = this.ctime = this.birthtime = new Date(0);

		if (path) {
			this._file = getTiFileFromPathLikeValue(path);

			// TODO: use lazy getters here?
			this.ctime = this.birthtime = this._file.createdAt();
			this.atime = this.mtime = this._file.modifiedAt();
			this.atimeMs = this.atime.getTime();
			this.birthtimeMs = this.birthtime.getTime();
			this.ctimeMs = this.ctime.getTime();
			this.mtimeMs = this.mtime.getTime();
			this.size = this._file.size;
			this.blocks = Math.ceil(this.size / this.blksize);
			// TODO: Can we fake out the mode based on the readonly/writable/executable properties?
		}
	}

	isFile() {
		return this._file.isFile();
	}

	isDirectory() {
		return this._file.isDirectory();
	}

	isBlockDevice() {
		return false;
	}

	isCharacterDevice() {
		return false;
	}

	isSymbolicLink() {
		return this._file.symbolicLink;
	}

	isFIFO() {
		return false;
	}

	isSocket() {
		return false;
	}
}
fs.Stats = Stats;

class ReadStream {

}
fs.ReadStream = ReadStream;

class WriteStream {

}
fs.WriteStream = WriteStream;

/**
 * @callback statsCallback
 * @param {Error} err - Error if one occurred
 * @param {fs.Stats} stats - file stats
 */

/**
 * @param {string|URL|Buffer} path file path
 * @param {integer} [mode=fs.constants.F_OK] accessibility mode/check
 * @param {function} callback async callback
 */
fs.access = function (path, mode, callback) {
	if (typeof mode === 'function') {
		callback = mode;
		mode = fs.constants.F_OK;
	}
	callback = maybeCallback(callback);

	setTimeout(() => {
		try {
			fs.accessSync(path, mode);
		} catch (e) {
			callback(e);
			return;
		}
		callback();
	}, 1);
};

/**
 * @param {string|URL|Buffer} path file path
 * @param {integer} [mode=fs.constants.F_OK] accessibility mode/check
 */
fs.accessSync = function (path, mode = fs.constants.F_OK) {
	// F_OK is just whether file exists or not, no permissions check
	// R_OK is read check
	// W_OK is write check
	// X_OK is execute check (acts like F_OK on Windows)
	const fileHandle = getTiFileFromPathLikeValue(path);
	if (!fileHandle.exists()) {
		throw noSuchFile('access', path);
	}

	// TODO: We have no means of testing if a file is readable. It's assumed all files that exist under the app are?
	if ((mode & fs.constants.W_OK) && !fileHandle.writable) {
		throw permissionDenied('access', path);
	}
	if ((mode & fs.constants.X_OK) && !fileHandle.executable && fileHandle.isFile()) {
		throw permissionDenied('access', path);
	}
};

/**
 * Asynchronously append data to a file, creating the file if it does not yet exist. data can be a string or a Buffer.
 * @param {string|Buffer|URL|FileStream} file filepath to file
 * @param {string|Buffer} data data to append to file
 * @param {object|string} [options] options
 * @param {string} [options.encoding='utf8'] encoding to use
 * @param {integer} [options.mode=0o666] mode to create file, if not created
 * @param {string} [options.flag='a'] file system flag
 * @param {Function} callback function to call back with error if failed
 */
fs.appendFile = (file, data, options, callback) => {
	callback = maybeCallback(callback || options);
	options = mergeDefaultOptions(options, { encoding: 'utf8', mode: 0o666, flag: 'a' });
	fs.writeFile(file, data, options, callback);
};

/**
 * Synchronously append data to a file, creating the file if it does not yet exist. data can be a string or a Buffer.
 * @param {string|Buffer|URL|FileStream} file filepath to file
 * @param {string|Buffer} data data to append to file
 * @param {object|string} [options] options
 * @param {string} [options.encoding='utf8'] encoding to use
 * @param {integer} [options.mode=0o666] mode to create file, if not created
 * @param {string} [options.flag='a'] file system flag
 */
fs.appendFileSync = (file, data, options) => {
	options = mergeDefaultOptions(options, { encoding: 'utf8', mode: 0o666, flag: 'a' });
	fs.writeFileSync(file, data, options);
	// TODO: Use Ti.Filesystem.File.append() instead?
};

fs.chmod = (path, mode, callback) => asyncUnsupportedNoop('fs', 'chmod', callback);
fs.chmodSync = unsupportedNoop('fs', 'chmodSync');

fs.chown = (path, uid, gid, callback) => asyncUnsupportedNoop('fs', 'chown', callback);
fs.chownSync = unsupportedNoop('fs', 'chownSync');

/**
 * Callback for functions that can only throw errors
 *
 * @callback errorCallback
 * @param {Error} [err] - Error thrown
 */

/**
 * @param {integer} fd file descriptor
 * @param {errorCallback} callback callback function
 */
fs.close = (fd, callback) => {
	callback = maybeCallback(callback);
	setTimeout(() => {
		try {
			fs.closeSync(fd);
		} catch (e) {
			callback(e);
			return;
		}
		callback();
	}, 1);
};

/**
 * @param {integer} fd file descriptor
 */
fs.closeSync = (fd) => {
	const stream = streamForDescriptor(fd);
	stream.close();
};

// Rather than use a hack to wrap sync version in setTimeout, use actual async APIs!
/**
 * @param {string|Buffer|URL} src source filename to copy
 * @param {string|Buffer|URL} dest destination filename of the copy operation
 * @param {number} [flags=0] modifiers for copy operation
 * @param {errorCallback} callback callback called at end of operation
 */
fs.copyFile = function (src, dest, flags, callback) {
	if (typeof flags === 'function') {
		callback = flags;
		flags = 0;
	}
	callback = maybeCallback(callback);

	// FIXME: I don't know why, but changing this to use Ti.Filesystem.openStream(mode, path) fails (at least on iOS)
	const srcFile = Ti.Filesystem.getFile(src);
	const srcStream = srcFile.open(Ti.Filesystem.MODE_READ);
	const destFile = Ti.Filesystem.getFile(dest);
	const destStream = destFile.open(Ti.Filesystem.MODE_WRITE);

	pipe(srcStream, destStream, callback);
};

/**
 * @param {string|Buffer|URL} src source filename to copy
 * @param {string|Buffer|URL} dest destination filename of the copy operation
 * @param {number} [flags=0] modifiers for copy operation
 */
fs.copyFileSync = function (src, dest, flags = 0) {
	const srcFile = Ti.Filesystem.getFile(src);
	if (flags === fs.constants.COPYFILE_EXCL && fs.existsSync(dest)) {
		throw fileAlreadyExists('copyFile', dest);
	}
	if (!srcFile.copy(dest)) {
		throw new Error(`Unable to copy ${src} to ${dest}`); // FIXME: What error should we give?
	}
};

// TODO: fs.createReadStream(path, options)
// /**
//  * @param {string|Buffer|URL} path path like
//  * @param {string|object} [options] options, if a string, it's the encoding
//  * @param {string} [options.flags='r'] See support of file system flags.
//  * @param {string} [options.encoding=null] encoding
//  * @param {integer} [options.fd=null] file descriptor, if specified, `path` is ignored
//  * @param {integer} [options.mode=0o666] permissions to set if file is created
//  * @param {boolean} [options.autoClose=true] if false, file descriptor will not be closed; if true even on error it will be closed
//  * @param {integer} [options.start] start index of range of bytes to read from file
//  * @param {integer} [options.end=Infinity] end index of range of bytes to read from file
//  * @param {integer} [options.highWaterMark=64 * 1024]
//  * @returns {fs.ReadStream}
//  */
// fs.createReadStream = (path, options) => {
// 	options = mergeDefaultOptions(options, { flags: 'r', encoding: null, fd: null, mode: 0o666, autoClose: true, end: Infinity, highWaterMark: 64 * 1024 });

// 	// FIXME: If options.fd, use that in place of path!
// 	const tiFile = getTiFileFromPathLikeValue(path);
// };
// TODO: fs.createWriteStream(path, options)

/**
 * @callback existsCallback
 * @param {boolean} exists - whether path exists
 */

/**
 * @param {string} path path to check
 * @param {existsCallback} callback callback function
 * @returns {void}
 */
fs.exists = function (path, callback) {
	callback = maybeCallback(callback);
	setTimeout(() => {
		callback(fs.existsSync(path));
	}, 1);
};

/**
 * @param {string} path path to check
 * @returns {boolean} whether a file or directory exists at that path
 */
fs.existsSync = function (path) {
	try {
		fs.accessSync(path);
		return true;
	} catch (e) {
		return false;
	}
};

fs.fchmod = (fd, mode, callback) => asyncUnsupportedNoop('fs', 'fchmod', callback);
fs.fchmodSync = unsupportedNoop('fs', 'fchmodSync');

fs.fchown = (fd, uid, gid, callback) => asyncUnsupportedNoop('fs', 'fchown', callback);
fs.fchownSync = unsupportedNoop('fs', 'fchownSync');

fs.fdatasync = (fd, callback) => asyncUnsupportedNoop('fs', 'fdatasync', callback);
fs.fdatasyncSync = unsupportedNoop('fs', 'fdatasyncSync');

/**
 * @param {integer} fd file descriptor
 * @param {object} [options] options
 * @param {boolean} [options.bigint] whether stat values should be bigint
 * @param {function} callback async callback function
 */
fs.fstat = (fd, options, callback) => {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	callback = maybeCallback(callback);

	setTimeout(() => {
		let stats;
		try {
			stats = fs.fstatSync(fd, options);
		} catch (e) {
			callback(e);
			return;
		}
		callback(null, stats);
	}, 1);
};
/**
 * @param {integer} fd file descriptor
 * @param {object} [_options] options
 * @param {boolean} [_options.bigint] whether stat values should be bigint
 * @returns {fs.Stats} stats for file descriptor
 */
fs.fstatSync = (fd, _options) => {
	const path = pathForFileDescriptor(fd);
	return fs.statSync(path);
};

// TODO: Add versions of these APIs:
// fs.fsync(fd, callback)
// fs.fsyncSync(fd)
// fs.ftruncate(fd[, len], callback)
// fs.ftruncateSync(fd[, len])
// fs.futimes(fd, atime, mtime, callback)
// fs.futimesSync(fd, atime, mtime)
// fs.lchmod(path, mode, callback)
// fs.lchmodSync(path, mode)
// fs.lchown(path, uid, gid, callback)
// fs.lchownSync(path, uid, gid)
// fs.link(existingPath, newPath, callback)
// fs.linkSync(existingPath, newPath)

// FIXME: If symbolic link we need to follow link to target to get stats! Our API doesn't support that!
fs.lstat = (path, options, callback) => fs.stat(path, options, callback);
fs.lstatSync = (path, options) => fs.statSync(path, options);

/**
 * @param {string|Buffer|URL} path file path
 * @param {string|object} [options] options
 * @param {boolean} [options.recursive=false] recursivley create dirs?
 * @param {integer} [options.mode=0o777] permissions
 * @param {errorCallback} callback async callback
 */
fs.mkdir = (path, options, callback) => {
	if (typeof options === 'function') {
		callback = options;
		options = { recursive: false, mode: 0o777 };
	}
	callback = maybeCallback(callback);

	setTimeout(() => {
		try {
			fs.mkdirSync(path, options);
		} catch (e) {
			callback(e);
			return;
		}
		callback(null);
	}, 1);
};

/**
 * @param {string|Buffer|URL} path file path
 * @param {string|object} [options] options
 * @param {boolean} [options.recursive=false] recursivley create dirs?
 * @param {integer} [options.mode=0o777] permissions
 */
fs.mkdirSync = (path, options) => {
	const tiFile = getTiFileFromPathLikeValue(path);
	if (typeof options === 'number') {
		options = { recursive: false, mode: options };
	} else {
		options = mergeDefaultOptions(options, { recursive: false, mode: 0o777 });
	}
	if (!tiFile.createDirectory(options.recursive) && !options.recursive) {
		if (tiFile.exists()) {
			// already existed!
			throw fileAlreadyExists('mkdir', path);
		}
		// We failed, probably because we didn't ask for recursive and parent doesn't exist, so reproduce node's error
		throw noSuchFile('mkdir', path);
	}
};

/**
 * @callback tempDirCallback
 * @param {Error} err - Error if one occurred
 * @param {string} folder - generated folder name
 */

/**
 * @param {string} prefix directory name prefix
 * @param {string|object} [options] options
 * @param {string} [options.encoding='utf-8'] prefix encoding
 * @param {tempDirCallback} callback async callback
 */
fs.mkdtemp = (prefix, options, callback) => {
	assertArgumentType(prefix, 'prefix', 'string');
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	callback = maybeCallback(callback);
	options = mergeDefaultOptions(options, { encoding: 'utf-8' });

	// try to be all async
	const tryMkdtemp = () => {
		const generated = randomCharacters(6, options.encoding); // generate six random characters
		const path = `${prefix}${generated}`;
		fs.mkdir(path, 0o700, err => {
			if (err) {
				if (err.code === 'EEXIST') {
					// retry!
					setTimeout(tryMkdtemp, 1);
					return;
				}
				// bubble up error
				callback(err);
				return;
			}
			// succeeded! Hurray!
			callback(null, path);
		});
	};
	setTimeout(tryMkdtemp, 1);
};

/**
 * Creates a unique temporary directory.
 * @param {string} prefix directory name prefix
 * @param {string|object} [options] options
 * @param {string} [options.encoding='utf-8'] prefix encoding
 * @returns {string} path to created directory
 */
fs.mkdtempSync = (prefix, options) => {
	assertArgumentType(prefix, 'prefix', 'string');
	options = mergeDefaultOptions(options, { encoding: 'utf-8' });

	let retryCount = 0;
	const MAX_RETRIES = 100;
	while (retryCount < MAX_RETRIES) {
		const generated = randomCharacters(6, options.encoding); // generate six random characters
		const path = `${prefix}${generated}`;
		try {
			fs.mkdirSync(path, 0o700); // don't try recursive
			return path;
		} catch (e) {
			if (e.code !== 'EEXIST') {
				throw e; // bubble up error
			}
			// name was not unique, so retry
			retryCount++;
		}
	}
	throw new Error(`Failed to create a unique directory name with prefix ${prefix}`);
};

/**
 * @callback fileDescriptorCallback
 * @param {Error} err - Error if one occurred
 * @param {integer} fileDescriptor - generated file descriptor
 */

/**
 * @param {string|Buffer|URL} path path to file
 * @param {string} [flags='r'] file system access flags
 * @param {integer} [mode=0o666] file mode to use when creating file
 * @param {fileDescriptorCallback} callback async callback
 */
fs.open = (path, flags, mode, callback) => {
	// flags and mode are optional, we need to handle if not supplied!
	if (typeof flags === 'function') {
		callback = flags;
		flags = 'r';
		mode = 0o666;
	} else if (typeof mode === 'function') {
		callback = mode;
		mode = 0o666;
	}
	callback = maybeCallback(callback);

	setTimeout(() => {
		let fileDescriptor;
		try {
			fileDescriptor = fs.openSync(path, flags, mode);
		} catch (e) {
			callback(e);
			return;
		}
		callback(null, fileDescriptor);
	}, 1);
};

/**
 * @param {string|Buffer|URL} path path to file
 * @param {string} [flags='r'] file system access flags
 * @param {integer} [_mode=0o666] file mode to use when creating file
 * @returns {integer}
 */
fs.openSync = (path, flags = 'r', _mode = 0o666) => {
	const tiFile = getTiFileFromPathLikeValue(path);
	if (!tiFile.exists()) {
		// TODO: Support creating file with specific mode
		oneTimeWarning('fs.openSync.mode', 'fs.openSync\'s mode parameter is unsupported in Titanium and will be ignored');

		if (!tiFile.createFile()) {
			// Oh crap, we failed to create the file. why?
			if (!tiFile.parent.exists()) {
				// parent does not exist!
				throw noSuchFile('open', path);
			}

			throw new Error(`failed to create file at path ${path}`);
		}
	} else if (flags) {
		// file/dir exists...
		if ((flags.charAt(0) === 'w' || flags.charAt(0) === 'a') && tiFile.isDirectory()) {
			// If user is trying to write or append and it's a directory, fail
			throw illegalOperationOnADirectory('open', path);
		}
		if (flags.length > 1 && flags.charAt(1) === 'x') {
			// If user has "exclusive" flag on, fail if file already exists
			throw fileAlreadyExists('open', path);
		}
	}
	const tiMode = FLAGS_TO_TI_MODE.get(flags);
	if (tiMode === undefined) {
		// TODO: Make use of common error type/code for this once we have internal/errors.js
		const err = new TypeError(`The value "${String(flags)}" is invalid for option "flags"`);
		err.code = 'ERR_INVALID_OPT_VALUE';
		throw err;
	}
	return createFileDescriptor(path, tiFile.open(tiMode));
};

/**
 * @callback readCallback
 * @param {Error} err - Error if one occurred
 * @param {integer} bytesRead - number of bytes read
 * @param {Buffer} buffer buffer
 */

/**
 * @param {integer} fd file descriptor
 * @param {Buffer|Ti.Buffer} buffer buffer to read into
 * @param {integer} offset the offset in the buffer to start writing at.
 * @param {integer} length integer specifying the number of bytes to read.
 * @param {integer} position where to begin reading from in the file
 * @param {readCallback} callback async callback
 */
fs.read = (fd, buffer, offset, length, position, callback) => {
	callback = maybeCallback(callback);

	const tiFileStream = streamForDescriptor(fd);
	if (!Buffer.isBuffer(buffer)) {
		buffer = Buffer.from(buffer);
	}
	// FIXME: Allow using position argument!
	if (position !== null) {
		oneTimeWarning('fs.readSync.position', 'fs.readSync\'s position argument is unsupported by Titanium and will be treated as null');
	}
	tiFileStream.read(buffer.toTiBuffer(), offset, length, readObj => {
		if (!readObj.success) {
			callback(new Error(readObj.error));
			return;
		}
		callback(null, readObj.bytesProcessed, buffer);
	});
};

/**
 * @param {integer} fd file descriptor
 * @param {Buffer|Ti.Buffer} buffer buffer to read into
 * @param {integer} offset the offset in the buffer to start writing at.
 * @param {integer} length integer specifying the number of bytes to read.
 * @param {integer} _position where to begin reading from in the file
 * @returns {integer} bytes read
 */
fs.readSync = (fd, buffer, offset, length, _position) => {
	const fileStream = streamForDescriptor(fd);
	if (!Buffer.isBuffer(buffer)) {
		buffer = Buffer.from(buffer);
	}

	// FIXME: Allow using position argument!
	if (_position !== null) {
		oneTimeWarning('fs.readSync.position', 'fs.readSync\'s position argument is unsupported by Titanium and will be treated as null');
	}
	return fileStream.read(buffer.toTiBuffer(), offset, length);
};

/**
 * @callback filesCallback
 * @param {Error} err - Error if one occurred
 * @param {string[]|Buffer[]|fs.Dirent[]} files - file listing
 */

/**
 * @param {string} path directory to list
 * @param {string|object} [options] optional options
 * @param {string} [options.encoding='utf8'] encoding to use for filenames, if `'buffer'`, returns `Buffer` objects
 * @param {boolean} [options.withFileTypes=false] if true, returns `fs.Dirent` objects
 * @param {filesCallback} callback async callback
 */
fs.readdir = (path, options, callback) => {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	callback = maybeCallback(callback);

	setTimeout(() => {
		let result;
		try {
			result = fs.readdirSync(path, options);
		} catch (e) {
			callback(e);
			return;
		}
		callback(null, result);
	}, 1);
};

/**
 * @param {string} filepath directory to list
 * @param {string|object} [options] optional options
 * @param {string} [options.encoding='utf8'] encoding to use for filenames, if `'buffer'`, returns `Buffer` objects
 * @param {boolean} [options.withFileTypes=false] if true, returns `fs.Dirent` objects
 * @returns {string[]|Buffer[]|fs.Dirent[]}
 */
fs.readdirSync = (filepath, options) => {
	const file = getTiFileFromPathLikeValue(filepath);
	if (!file.exists()) {
		throw noSuchFile('scandir', filepath);
	}
	if (!file.isDirectory()) {
		throw notADirectory('scandir', filepath);
	}
	options = mergeDefaultOptions(options, { encoding: 'utf-8', withFileTypes: false });
	const listing = file.getDirectoryListing();
	if (options.withFileTypes === true) {
		// TODO: if options.withFileTypes === true, return fs.Dirent objects
		oneTimeWarning('fs.readdir\'s options.withFileTypes is unsupported by Titanium and strings will be returned');
	} else if (options.encoding === 'buffer') {
		return listing.map(name => Buffer.from(name));
	}

	return listing;
};

/**
 * @callback readFilePostOpenCallback
 * @param {Error} err - Error if one occurred
 * @param {Ti.Buffer} buffer
 */
/**
 * @param {integer} fileDescriptor file descriptor
 * @param {readFilePostOpenCallback} callback async callback
 */
function readFilePostOpen(fileDescriptor, callback) {
	callback = maybeCallback(callback);
	fs.fstat(fileDescriptor, (err, stats) => {
		if (err) {
			callback(err);
			return;
		}

		const fileSize = stats.size;

		// Create a Ti.Buffer to read into
		const buffer = Ti.createBuffer({ length: fileSize });

		// Use Ti.Stream.readAll(sourceStream, buffer, callback) which spins off a separate thread to read in while loop!
		const sourceStream = streamForDescriptor(fileDescriptor);
		Ti.Stream.readAll(sourceStream, buffer, readAllObj => {
			if (!readAllObj.success) {
				callback(new Error(readAllObj.error));
				return;
			}
			callback(null, buffer);
		});
	});
}

/**
 * @callback readFileCallback
 * @param {Error} err - Error if one occurred
 * @param {string|Buffer} data
 */
/**
 * Asynchronously read entire contents of file
 * @param {string|Buffer|URL|integer} path filename or file descriptor
 * @param {object|string} [options] options
 * @param {string} [options.encoding=null] encoding to use
 * @param {string} [options.flag='r'] file system flag
 * @param {readFileCallback} callback async callback
 */
fs.readFile = (path, options, callback) => {
	if (typeof options === 'function') {
		callback = options;
		options = { encoding: null, flag: 'r' };
	} else {
		options = mergeDefaultOptions(options, { encoding: null, flag: 'r' });
	}
	callback = maybeCallback(callback);

	const wasFileDescriptor = (typeof path === 'number');

	let fileDescriptor = path; // may be overriden later
	/**
	 * @param {Error} err possible Error
	 * @param {Ti.Buffer} buffer Ti.Buffer instance
	 */
	const handleBuffer = (err, buffer) => {
		if (err) {
			callback(err);
			return;
		}

		// fs.closeSync if it was not originally a file descriptor
		if (!wasFileDescriptor) {
			fs.closeSync(fileDescriptor);
		}

		// TODO: trim buffer if we didn't read full size?

		callback(null, encodeBuffer(options.encoding, buffer));
	};

	if (!wasFileDescriptor) {
		fs.open(path, options.flag, (err, fd) => {
			if (err) {
				callback(err);
				return;
			}
			fileDescriptor = fd;
			readFilePostOpen(fd, handleBuffer);
		});
	} else {
		readFilePostOpen(path, handleBuffer);
	}
};

/**
 * Returns the contents of the path.
 * @param {string|Buffer|URL|integer} path path to file
 * @param {object|string} [options] options
 * @param {string} [options.encoding=null] encoding to use
 * @param {string} [options.flag='r'] file system flag
 * @returns {string|Buffer} string if encoding is specified, otherwise Buffer
 */
fs.readFileSync = (path, options) => {
	options = mergeDefaultOptions(options, { encoding: null, flag: 'r' });

	const wasFileDescriptor = (typeof path === 'number');
	const fileDescriptor = wasFileDescriptor ? path : fs.openSync(path, options.flag); // use default mode

	const tiFileStream = streamForDescriptor(fileDescriptor);
	// Just use our own API that reads full stream in
	const buffer = Ti.Stream.readAll(tiFileStream);

	// fs.closeSync if it was not originally a file descriptor
	if (!wasFileDescriptor) {
		fs.closeSync(fileDescriptor);
	}

	// TODO: trim buffer if we didn't read full size?

	return encodeBuffer(options.encoding, buffer);
};

// TODO: fs.readlink(path[, options], callback)
// TODO: fs.readlinkSync(path[, options])

/**
 * @callback realpathCallback
 * @param {Error} err - Error if one occurred
 * @param {string|Buffer} resolvedPath the resolved path
 */
/**
 * @param {string|Buffer|URL} filepath original filepath
 * @param {object} [options] optiosn object
 * @param {string} [options.encoding='utf8'] encoding used for returned object. If 'buffer", we'll return a Buffer in palce of a string
 * @param {realpathCallback} callback async callback
 */
fs.realpath = (filepath, options, callback) => {
	callback = maybeCallback(callback || options);
	options = mergeDefaultOptions(options, { encoding: 'utf8' });
	setTimeout(() => {
		// FIXME: This assumes no symlinks, which we really don't have full support for in our SDK anyways.
		const result = path.normalize(filepath);
		fs.exists(result, resultExists => {
			if (resultExists) {
				if (options.encoding === 'buffer') {
					return callback(null, Buffer.from(result));
				}
				return callback(null, result);
			}

			// this path doesn't exist, try each segment until we find first that doesn't
			const segments = result.split(path.sep); // FIXME: Drop last segment as we already know the full path doesn't exist?
			let partialFilePath = '';
			let index = 0;
			// handle typical case of empty first segment so we don't need to do an async setTimeout to get to first real case
			if (segments[index].length === 0) {
				index++;
			}
			setTimeout(tryPath, 1);

			function tryPath() {
				if (index >= segments.length) {
					// don't run past end of segments, throw error for resolved path
					return callback(noSuchFile(result));
				}

				// grab next segment
				const segment = segments[index++];
				if (segment.length === 0) { // if it's an empty segment...
					// try again at next index
					return setTimeout(tryPath, 1);
				}

				// normal case
				partialFilePath += path.sep + segment;
				// check if path up to this point exists...
				fs.exists(partialFilePath, partialExists => {
					if (!partialExists) { // nope, throw the Error
						return callback(noSuchFile('lstat', partialFilePath));
					}
					// try again at next depth of dir tree
					setTimeout(tryPath, 1);
				});
			}
		});
	}, 1);
};
fs.realpath.native = (path, options, callback) => {
	fs.realpath(path, options, callback);
};

/**
 * @param {string|Buffer|URL} filepath original filepath
 * @param {object} [options] options object
 * @param {string} [options.encoding='utf8'] encoding used for returned object. If 'buffer", we'll return a Buffer in palce of a string
 * @returns {string|Buffer}
 */
fs.realpathSync = (filepath, options) => {
	options = mergeDefaultOptions(options, { encoding: 'utf8' });
	// FIXME: This assumes no symlinks, which we really don't have full support for in our SDK anyways.
	const result = path.normalize(filepath);
	if (!fs.existsSync(result)) {
		// this path doesn't exist, try each segment until we find first that doesn't
		const segments = result.split(path.sep);
		let partialFilePath = '';
		for (const segment of segments) {
			if (segment.length === 0) {
				continue;
			}
			partialFilePath += path.sep + segment;
			if (!fs.existsSync(partialFilePath)) {
				throw noSuchFile('lstat', partialFilePath);
			}
		}
	}
	if (options.encoding === 'buffer') {
		return Buffer.from(result);
	}
	return result;
};
fs.realpathSync.native = (path, options) => {
	fs.realpathSync(path, options);
};

/**
 * @param {string|Buffer|URL} oldPath source filepath
 * @param {string|Buffer|URL} newPath destination filepath
 * @param {errorCallback} callback async callback
 */
fs.rename = (oldPath, newPath, callback) => {
	callback = maybeCallback(callback);
	setTimeout(() => {
		try {
			fs.renameSync(oldPath, newPath);
		} catch (e) {
			callback(e);
			return;
		}
		callback();
	}, 1);
};

/**
 * @param {string|Buffer|URL} oldPath source filepath
 * @param {string|Buffer|URL} newPath destination filepath
 */
fs.renameSync = (oldPath, newPath) => {
	const tiFile = getTiFileFromPathLikeValue(oldPath);
	// src doesn't actually exist?
	if (!tiFile.exists()) {
		const err = noSuchFile('rename', oldPath);
		err.message = `${err.message} -> '${newPath}'`;
		err.dest = newPath;
		throw err;
	}

	const destFile = getTiFileFromPathLikeValue(newPath);
	if (destFile.isDirectory()) {
		// dest is a directory that already exists
		const err = illegalOperationOnADirectory('rename', oldPath);
		err.message = `${err.message} -> '${newPath}'`;
		err.dest = newPath;
		throw err;
	}

	let tempPath;
	if (destFile.isFile()) {
		// destination file exists, we should overwrite
		// Our APIs will fail if we try, so first let's make a backup copy and delete the the original
		tempPath = path.join(fs.mkdtempSync(path.join(Ti.Filesystem.tempDirectory, 'rename-')), path.basename(newPath));
		destFile.move(tempPath);
	}

	let success = false;
	try {
		success = tiFile.move(newPath);
	} finally {
		if (tempPath) {
			// we temporarily copied the existing destination to back it up...
			if (success) {
				// move worked, so we can wipe it away whenever...
				fs.unlink(tempPath, _err => {});
			} else {
				// move it back, because we failed!
				const tmpFile = getTiFileFromPathLikeValue(tempPath);
				tmpFile.move(newPath);
			}
		}
	}
};

/**
 * @param {string|Buffer|URL} path file path
 * @param {errorCallback} callback async callback
 */
fs.rmdir = (path, callback) => {
	callback = maybeCallback(callback);
	setTimeout(() => {
		try {
			fs.rmdirSync(path);
		} catch (e) {
			callback(e);
			return;
		}
		callback();
	}, 1);
};
/**
 * @param {string|Buffer|URL} path file path
 */
fs.rmdirSync = path => {
	const tiFile = getTiFileFromPathLikeValue(path);
	if (!tiFile.deleteDirectory(false)) { // do not delete contents!
		// we failed to delete, but why?
		// does it exist?
		if (!tiFile.exists()) {
			throw noSuchFile('rmdir', path);
		}
		// is it a file?
		if (tiFile.isFile()) {
			throw notADirectory('rmdir', path);
		}
		// is it not empty?
		const subFiles = tiFile.getDirectoryListing();
		if (subFiles && subFiles.length > 0) {
			throw directoryNotEmpty('rmdir', path);
		}
	}
};

/**
 * @param {string|Buffer|URL} path file path
 * @param {object} [options] options
 * @param {boolean} [options.bigint] whether stat values should be bigint
 * @param {statsCallback} callback async callback
 */
fs.stat = (path, options, callback) => {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	callback = maybeCallback(callback);

	setTimeout(() => {
		callback(null, new fs.Stats(path));
	}, 1);
};
/**
 * @param {string|Buffer|URL|integer} path filepath or file descriptor
 * @param {object} [_options] options
 * @param {boolean} [_options.bigint] whether stat values should be bigint
 * @returns {fs.Stats}
 */
fs.statSync = (path, _options) => new fs.Stats(path);

fs.symlink = (target, path, type, callback) => asyncUnsupportedNoop('fs', 'symlink', callback);
fs.symlinkSync = unsupportedNoop('fs', 'symlinkSync');

/**
 * @param {string} path file path
 * @param {integer} [len=0] bytes to trim to
 * @param {errorCallback} callback async callback
 */
fs.truncate = (path, len, callback) => {
	callback = maybeCallback(callback || len);
	if (typeof len !== 'number') {
		len = 0;
	}

	if (len <= 0) {
		fs.writeFile(path, '', callback); // empty the file
		return;
	}

	// we have to retain some of the file!
	// yuck, so let's read what we need to retain, then overwrite file with it
	fs.open(path, (err, fd) => {
		if (err) {
			return callback(err);
		}
		const buffer = Buffer.alloc(len);
		fs.read(fd, buffer, 0, len, null, (err, bytesRead, buffer) => {
			if (err) {
				fs.closeSync(fd);
				return callback(err);
			}
			fs.close(fd, err => {
				if (err) {
					return callback(err);
				}
				fs.writeFile(path, buffer, callback);
			});
		});
	});
};

/**
 * @param {string} path file path
 * @param {integer} [len=0] bytes to trim to
 */
fs.truncateSync = (path, len = 0) => {
	if (len <= 0) {
		// empty the file
		fs.writeFileSync(path, '');
		return;
	}

	// we have to retain some of the file!
	// yuck, so let's read what we need to retain, then overwrite file with it
	const fd = fs.openSync(path);
	const buffer = Buffer.alloc(len);
	fs.readSync(fd, buffer, 0, len, null);
	fs.closeSync(fd);
	fs.writeFileSync(path, buffer);
};

/**
 * @param {string|Buffer|URL} path file path
 * @param {errorCallback} callback async callback
 */
fs.unlink = (path, callback) => {
	callback = maybeCallback(callback);
	setTimeout(() => {
		try {
			fs.unlinkSync(path);
		} catch (err) {
			callback(err);
			return;
		}
		callback();
	}, 1);
};
/**
 * @param {string|Buffer|URL} path file path
 * @returns {undefined}
 */
fs.unlinkSync = (path) => {
	const tiFile = getTiFileFromPathLikeValue(path);
	if (!tiFile.deleteFile()) {
		// we failed, but why?
		if (!tiFile.exists()) {
			throw noSuchFile('unlink', path);
		}
		if (tiFile.isDirectory()) {
			throw illegalOperationOnADirectory('unlink', path);
		}
	}
};

fs.unwatchFile = unsupportedNoop('fs', 'unwatchFile');
fs.utimes = (path, atime, mtime, callback) => asyncUnsupportedNoop('fs', 'utimes', callback);
fs.utimesSync = unsupportedNoop('fs', 'utimesSync');
fs.watch = unsupportedNoop('fs', 'watch');
fs.watchFile = unsupportedNoop('fs', 'watchFile');

/**
 * @param {string|Buffer|URL|integer} file file path or descriptor
 * @param {string|Buffer|TypedArray|DataView} data data to write
 * @param {object|string} [options] options, encoding if string
 * @param {string|null} [options.encoding='utf-8'] options
 * @param {object} [options.mode=0o666] options
 * @param {object} [options.flag='w'] options
 * @param {errorCallback} callback async callback
 */
fs.writeFile = (file, data, options, callback) => {
	callback = maybeCallback(callback || options);
	options = mergeDefaultOptions(options, { encoding: 'utf8', mode: 0o666, flag: 'w' });

	// Turn into file descriptor
	const wasFileDescriptor = typeof file === 'number';

	let fileDescriptor = file; // may be overriden later
	const finish = (err) => {
		if (err) {
			callback(err);
			return;
		}

		if (wasFileDescriptor) {
			callback();
			return;
		}

		// fs.close if it was not originally a file descriptor
		fs.close(fileDescriptor, callback);
	};

	if (!wasFileDescriptor) {
		fs.open(file, options.flag, options.mode, (err, fd) => {
			if (err) {
				callback(err);
				return;
			}
			fileDescriptor = fd;
			fs.write(fileDescriptor, data, finish);
		});
	} else {
		fs.write(fileDescriptor, data, finish);
	}
};

/**
 * @param {string|Buffer|URL|integer} file file path or descriptor
 * @param {string|Buffer|TypedArray|DataView} data data to write
 * @param {object|string} [options] options, encoding if string
 * @param {string} [options.encoding='utf-8'] options
 * @param {object} [options.mode=0o666] options
 * @param {object} [options.flag='w'] options
 */
fs.writeFileSync = (file, data, options) => {
	options = mergeDefaultOptions(options, { encoding: 'utf8', mode: 0o666, flag: 'w' });

	// Turn into file descriptor
	const wasFileDescriptor = typeof file === 'number';
	const fileDescriptor = wasFileDescriptor ? file : fs.openSync(file, options.flag, options.mode);

	// if data is a string, make it a buffer first
	if (!Buffer.isBuffer(data)) {
		data = Buffer.from('' + data, options.encoding); // force data to be a string, handles case where it's undefined and writes 'undefined' to file!
	}
	fs.writeSync(fileDescriptor, data);

	// close if user didn't give us file descriptor
	if (!wasFileDescriptor) {
		fs.closeSync(fileDescriptor);
	}
};

/**
 * @callback writeTiFileStreamCallback
 * @param {Error} err - Error if one occurred
 * @param {integer} written - bytes written
 */

/**
 * @param {Ti.Filesystem.FileStream} tiFileStream file stream
 * @param {Buffer} buffer buffer we're writing
 * @param {writeTiFileStreamCallback} callback async callback
 */
function writeTiFileStream(tiFileStream, buffer, callback) {
	callback = maybeCallback(callback);
	Ti.Stream.write(tiFileStream, buffer.toTiBuffer(), (writeObj) => {
		if (!writeObj.success) {
			callback(new Error(writeObj.error));
			return;
		}
		callback(null, writeObj.bytesProcessed);
	});
}

/**
 * @param {integer} fd file descriptor
 * @param {string|Buffer} buffer contents to write: Buffer or string
 * @param {integer} [offset] offset within Buffer to write; OR offset from the beginning of the file where this data should be written (if string)
 * @param {string|integer} [length] length of bytes to write if Buffer; OR expected string encoding
 * @param {writeCallback|integer} [position] offset from the beginning of the file where this data should be written (if Buffer); OR async callback if string
 * @param {writeCallback} [callback] async callback (if Buffer)
 */
fs.write = (fd, buffer, offset, length, position, callback) => {
	const isBuffer = Buffer.isBuffer(buffer);
	if (isBuffer) {
		writeBuffer(fd, buffer, offset, length, position, callback);
	} else {
		writeString(fd, buffer, offset, length, position);
	}
};

/**
 * @param {integer} fd file descriptor
 * @param {string|Buffer} buffer contents to write
 * @param {integer} [offset] offset from the beginning of the file where this data should be written
 * @param {string|integer} [length]  expected string encoding
 * @param {integer} [position] position
 * @returns {integer} number of bytes written
 */
fs.writeSync = (fd, buffer, offset, length, position) => {
	const isBuffer = Buffer.isBuffer(buffer);
	if (isBuffer) {
		return writeBufferSync(fd, buffer, offset, length, position);
	}
	return writeStringSync(fd, buffer, offset, length);
};

// TODO: Add FileHandle class to match Node's wrapper for file descriptors. Re-purpose our own wrapper?
// TODO: Add the fs.promises API!

// TODO: Define fs.Dirent class, which can simply wrap a Ti.Filesystem.File (and is very similar to fs.Stats!)

// Helper functions
// --------------------------------------------------------

/**
 * Tracks the pairing of the number we use to represent the file externally, the filepath it's pointing at, and the stream pointing at it.
 */
class FileDescriptor {
	constructor (number, path, stream) {
		this.path = path;
		this.number = number;
		this.stream = stream;
	}
}

/**
 * @param {Ti.IOStream} srcStream input stream we're reading from
 * @param {Ti.IOStream} destStream output stream we're writing to
 * @param {errorCallback} callback async callback
 */
function pipe(srcStream, destStream, callback) {
	if (isAndroid) {
		// Android is probably better off with Ti.Stream.writeStream, less overhead back and forth the bridge
		// Though Android does support the Ti.Stream.pump/Ti.Stream.write pattern using both APIs async
		pipeViaWriteStream(srcStream, destStream, callback);
		return;
	}
	// iOS has some... issues with writeStream calling the callback every iteration of the loop *and* at the end
	// it also doesn't play as expected when doing Ti.Stream.pump and Ti.Stream.write async each
	// it ends up doing all reads first and then all writes
	// so we have to hack here and do Ti.Stream.pump async, but each time the read callback happens we do a *sync* write inside it
	// See https://jira.appcelerator.org/browse/TIMOB-27321
	pipeViaPump(srcStream, destStream, callback);
}

/**
 * @param {Ti.IOStream} srcStream input stream we're reading from
 * @param {Ti.IOStream} destStream output stream we're writing to
 * @param {errorCallback} callback async callback
 */
function pipeViaWriteStream(srcStream, destStream, callback) {
	Ti.Stream.writeStream(srcStream, destStream, COPY_FILE_CHUNK_SIZE, result => {
		if (!result.success) {
			return callback(new Error(result.error));
		}

		// Android will only call this at the end or error, so we can safely assume we're done here.
		// iOS will call per loop iteration, see https://jira.appcelerator.org/browse/TIMOB-27320
		callback();
	});
}

/**
 * @param {Ti.IOStream} srcStream input stream we're reading from
 * @param {Ti.IOStream} destStream output stream we're writing to
 * @param {errorCallback} callback async callback
 */
function pipeViaPump(srcStream, destStream, callback) {
	Ti.Stream.pump(srcStream, obj => {
		if (!obj.success) {
			return callback(new Error(obj.error)); // TODO: set code via writeObj.code?
		}

		if (obj.bytesProcessed === -1) { // reached EOF
			return callback();
		}

		// we read some segment of the input stream and have not reached EOF yet
		let bytesWritten = 0;
		let offset = 0;
		let length = obj.bytesProcessed;
		try {
			while (true) {
				// try to write all of the current buffer
				const bytesWrittenThisChunk = destStream.write(obj.buffer, offset, length);
				bytesWritten += bytesWrittenThisChunk;
				if (bytesWritten === obj.bytesProcessed) {
					// wrote same amount of bytes as we read, move on
					break;
				}
				// NOTE: This shouldn't ever happen because our APIs should write the entire byte array or fail, but just in case...
				// we didn't write it all, so move on to try and write the rest of buffer...
				offset = bytesWritten;
				length = obj.bytesProcessed - bytesWritten;
			}
		} catch (e) {
			return callback(e);
		}
	}, COPY_FILE_CHUNK_SIZE, true);
}

/**
 * @param {string|Buffer|URL} path file path
 * @param {Ti.Filesystem.FileStream} fileStream file stream
 * @returns {integer} file descriptor
 */
function createFileDescriptor(path, fileStream) {
	const pointer = fileDescriptorCount++; // increment global counter
	const fd = new FileDescriptor(pointer, path, fileStream);
	fileDescriptors.set(pointer, fd); // use it to refer to this file stream as the "descriptor"
	return pointer;
}

/**
 * @param {integer} fd file descriptor
 * @returns {Ti.Filesystem.FileStream} matching stream
 */
function streamForDescriptor(fd) {
	const wrapper = fileDescriptors.get(fd);
	return wrapper.stream;
}

/**
 * @param {integer} fd file descriptor
 * @returns {string} matching stream
 */
function pathForFileDescriptor(fd) {
	const wrapper = fileDescriptors.get(fd);
	return wrapper.path;
}

/**
 * Used to merge the user-supplied options with the defaults for a function. Special cases a string to be encoding.
 * @param {*} options user-supplied options
 * @param {object} defaults defaults to use
 * @return {object}
 */
function mergeDefaultOptions(options, defaults) {
	if (options === null) {
		return defaults;
	}

	const optionsType = typeof options;
	switch (optionsType) {
		case 'undefined':
		case 'function':
			return defaults;
		case 'string':
			// Use copy of defaults but with encoding set to the 'options' value!
			const merged = Object.assign({}, defaults);
			merged.encoding = options;
			return merged;
		case 'object':
			return options;
		default:
			assertArgumentType(options, 'options', 'object');
			return null; // should never get reached
	}
}

/**
 * Enforces that we have a valid callback function. Throws TypeError if not.
 * @param {*} cb possible callback function
 * @returns {Function}
 * @throws {TypeError}
 */
function maybeCallback(cb) {
	if (typeof cb === 'function') {
		return cb;
	}

	const err = new TypeError(`Callback must be a function. Received ${cb}`);
	err.code = 'ERR_INVALID_CALLBACK';
	throw err;
}

/**
 * returns randomly generated characters of given length 1-16
 * @param {integer} length 1 - 16
 * @param {string} [_encoding='utf8'] encoding of the string generated
 * @returns {string}
 */
function randomCharacters(length, _encoding = 'utf8') {
	// FIXME: use the encoding specified!
	return (Math.random().toString(36) + '00000000000000000').slice(2, length + 2);
}

function makeError(code, message, errno, syscall, path) {
	const error = new Error(`${code}: ${message}, ${syscall} '${path}'`);
	error.errno = errno;
	error.syscall = syscall;
	error.code = code;
	error.path = path;
	return error;
}

/**
 * @param {string} encoding what we're encoding to
 * @param {Ti.Buffer} tiBuffer Ti.Buffer instance
 * @returns {Buffer} node-compatible Buffer instance
 */
function encodeBuffer(encoding, tiBuffer) {
	switch (encoding) {
		case 'buffer':
		case null:
		case undefined:
			// In this case we're always reading a file into a Ti.Buffer
			// Wrapping Ti.Buffer is super-slow and should really only be if we're going to write to it
			// Go the faster path by converting to ArrayBuffer and wrapping that
			// TODO: Explicitly release the blob after conversion?
			return Buffer.from(tiBuffer.toBlob().toArrayBuffer());
		default:
			// here' were converting to a string based on encoding. Internally our faster Buffer impl still delegates to Ti.Buffer in most cases
			// so I don't think there's much benefit from converting to ArrayBuffer first
			return Buffer.from(tiBuffer).toString(encoding);
	}
}

/**
 * @param {string|Buffer|URL} path file path
 * @return {Ti.Filesystem.File}
 */
function getTiFileFromPathLikeValue(path) {
	// This is a hack that is likely to work in most cases?
	// Basically assumes Buffer is holding a utf-8 string filename/path
	// Node just copies the bytes from the buffer as-is on the native side and adds a null terminator
	if (Buffer.isBuffer(path)) {
		path = path.toString(); // assumes utf-8 string
	}
	// FIXME: Handle URLs! We don't have an URL shim yet, so no way to handle those yet
	assertArgumentType(path, 'path', 'string');
	return Ti.Filesystem.getFile(path);
}

/**
 * @callback writeBufferCallback
 * @param {Error} err - Error if one occurred
 * @param {integer} written - bytes written
 * @param {Buffer} buffer - original Buffer being written
 */

/**
 * @param {integer} fd file descriptor
 * @param {Buffer} buffer contents to write
 * @param {integer} [offset] offset within Buffer to write
 * @param {integer} [length] length of bytes to write if Buffer
 * @param {integer} [position] offset from the beginning of the file where this data should be written
 * @param {writeBufferCallback} callback async callback
 */
function writeBuffer(fd, buffer, offset, length, position, callback) {
	callback = maybeCallback(callback || position || length || offset);
	if (typeof offset !== 'number') {
		offset = 0;
	}
	if (typeof length !== 'number') {
		length = buffer.length - offset;
	}
	if (typeof position !== 'number') {
		position = null;
	}
	// ok now what?
	const tiFileStream = streamForDescriptor(fd);
	// Make use of the buffer slice that's specified by offset/length
	if (offset !== 0 || length !== buffer.length) {
		buffer = buffer.slice(offset, length);
	}
	// TODO: Support use of position argument. I assume we'd need a way to add a method to move to stream position somehow
	writeTiFileStream(tiFileStream, buffer, (err, bytesProcessed) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null, bytesProcessed, buffer);
	});
}

/**
 * @param {integer} fd file descriptor
 * @param {Buffer} buffer contents to write
 * @param {integer} [offset] offset within Buffer to write
 * @param {integer} [length] length of bytes to write if Buffer
 * @param {integer} [position] offset from the beginning of the file where this data should be written
 * @returns {integer} number of bytes written
 */
function writeBufferSync(fd, buffer, offset, length, position) {
	if (typeof offset !== 'number') {
		offset = 0;
	}
	if (typeof length !== 'number') {
		length = buffer.length - offset;
	}
	if (typeof position !== 'number') {
		position = null;
	}
	// ok now what?
	const tiFileStream = streamForDescriptor(fd);
	// Make use of the buffer slice that's specified by offset/length
	if (offset !== 0 || length !== buffer.length) {
		buffer = buffer.slice(offset, length);
	}
	// TODO: Support use of position argument. I assume we'd need a way to add a method to move to stream position somehow
	return tiFileStream.write(buffer.toTiBuffer());
}

/**
 * @callback writeStringCallback
 * @param {Error} err - Error if one occurred
 * @param {integer} written - bytes written
 * @param {string} string - original string being written
 */

/**
 * @param {integer} fd file descriptor
 * @param {string} string contents to write
 * @param {integer} [position] offset from the beginning of the file where this data should be written
 * @param {string} [encoding='utf8'] expected string encoding
 * @param {writeStringCallback} [callback] async callback
 */
function writeString(fd, string, position, encoding, callback) {
	callback = maybeCallback(callback || encoding || position);
	// position could be: number, function (callback)
	if (typeof position !== 'number') {
		position = null;
	}
	// encoding could be: function (callback) or string
	if (typeof encoding !== 'string') {
		encoding = 'utf8';
	}
	const tiFileStream = streamForDescriptor(fd);
	string += ''; // coerce to string
	const buffer = Buffer.from(string, encoding);
	// TODO: Support use of position argument. I assume we'd need a way to add a method to move to stream position somehow
	writeTiFileStream(tiFileStream, buffer, (err, bytesProcessed) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null, bytesProcessed, string);
	});
}

/**
 * @param {integer} fd file descriptor
 * @param {string} string contents to write
 * @param {integer} [position] offset from the beginning of the file where this data should be written
 * @param {string} [encoding='utf8'] expected string encoding
 * @returns {integer} number of bytes written
 */
function writeStringSync(fd, string, position, encoding) {
	if (typeof position !== 'number') {
		position = null;
	}
	if (typeof encoding !== 'string') {
		encoding = 'utf8';
	}
	const tiFileStream = streamForDescriptor(fd);
	string += ''; // coerce to string
	const buffer = Buffer.from(string, encoding);
	// TODO: Support use of position argument. I assume we'd need a way to add a method to move to stream position somehow
	return tiFileStream.write(buffer.toTiBuffer());
}

export default fs;
