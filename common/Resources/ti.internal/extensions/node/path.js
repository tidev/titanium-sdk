import assertArgumentType from './_errors';

const FORWARD_SLASH = 47; // '/'
const BACKWARD_SLASH = 92; // '\\'

/**
 * Is this [a-zA-Z]?
 * @param  {number}  charCode value from String.charCodeAt()
 * @return {Boolean}          [description]
 */
function isWindowsDeviceName(charCode) {
	return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
}

/**
 * [isAbsolute description]
 * @param  {boolean} isPosix whether this impl is for POSIX or not
 * @param  {string} filepath   input file path
 * @return {Boolean}          [description]
 */
function isAbsolute(isPosix, filepath) {
	assertArgumentType(filepath, 'path', 'string');

	const length = filepath.length;
	// empty string special case
	if (length === 0) {
		return false;
	}

	const firstChar = filepath.charCodeAt(0);
	if (firstChar === FORWARD_SLASH) {
		return true;
	}
	// we already did our checks for posix
	if (isPosix) {
		return false;
	}
	// win32 from here on out
	if (firstChar === BACKWARD_SLASH) {
		return true;
	}
	if (length > 2 && isWindowsDeviceName(firstChar) && filepath.charAt(1) === ':') {
		const thirdChar = filepath.charAt(2);
		return thirdChar === '/' || thirdChar === '\\';
	}
	return false;
}

/**
 * [dirname description]
 * @param  {string} separator  platform-specific file separator
 * @param  {string} filepath   input file path
 * @return {string}            [description]
 */
function dirname(separator, filepath) {
	assertArgumentType(filepath, 'path', 'string');

	const length = filepath.length;
	if (length === 0) {
		return '.';
	}

	// ignore trailing separator
	let fromIndex = length - 1;
	const hadTrailing = filepath.endsWith(separator);
	if (hadTrailing) {
		fromIndex--;
	}

	const foundIndex = filepath.lastIndexOf(separator, fromIndex);
	// no separators
	if (foundIndex === -1) {
		// handle special case of root windows paths
		if (length >= 2 && separator === '\\' && filepath.charAt(1) === ':') {
			const firstChar = filepath.charCodeAt(0);
			if (isWindowsDeviceName(firstChar)) {
				return filepath; // it's a root windows path
			}
		}
		return '.';
	}
	// only found root separator
	if (foundIndex === 0) {
		return separator; // if it was '/', return that
	}
	// Handle special case of '//something'
	if (foundIndex === 1 && separator === '/' && filepath.charAt(0) === '/') {
		return '//';
	}

	return filepath.slice(0, foundIndex);
}

/**
 * [extname description]
 * @param  {string} separator  platform-specific file separator
 * @param  {string} filepath   input file path
 * @return {string}            [description]
 */
function extname(separator, filepath) {
	assertArgumentType(filepath, 'path', 'string');

	const index = filepath.lastIndexOf('.');
	if (index === -1 || index === 0) {
		return '';
	}
	// ignore trailing separator
	let endIndex = filepath.length;
	if (filepath.endsWith(separator)) {
		endIndex--;
	}
	return filepath.slice(index, endIndex);
}

function lastIndexWin32Separator(filepath, index) {
	for (let i = index; i >= 0; i--) {
		const char = filepath.charCodeAt(i);
		if (char === BACKWARD_SLASH || char === FORWARD_SLASH) {
			return i;
		}
	}
	return -1;
}

/**
 * [basename description]
 * @param  {string} separator  platform-specific file separator
 * @param  {string} filepath   input file path
 * @param  {string} [ext]      file extension to drop if it exists
 * @return {string}            [description]
 */
function basename(separator, filepath, ext) {
	assertArgumentType(filepath, 'path', 'string');
	if (ext !== undefined) {
		assertArgumentType(ext, 'ext', 'string');
	}
	const length = filepath.length;
	if (length === 0) {
		return '';
	}

	const isPosix = separator === '/';

	let endIndex = length;
	// drop trailing separator (if there is one)
	const lastCharCode = filepath.charCodeAt(length - 1);
	if (lastCharCode === FORWARD_SLASH || (!isPosix && lastCharCode === BACKWARD_SLASH)) {
		endIndex--;
	}

	// Find last occurence of separator
	let lastIndex = -1;
	if (isPosix) {
		lastIndex = filepath.lastIndexOf(separator, endIndex - 1);
	} else {
		// On win32, handle *either* separator!
		lastIndex = lastIndexWin32Separator(filepath, endIndex - 1);
		// handle special case of root path like 'C:' or 'C:\\'
		if ((lastIndex === 2 || lastIndex === -1) && filepath.charAt(1) === ':' && isWindowsDeviceName(filepath.charCodeAt(0))) {
			return '';
		}
	}

	// Take from last occurrence of separator to end of string (or beginning to end if not found)
	const base = filepath.slice(lastIndex + 1, endIndex);

	// drop trailing extension (if specified)
	if (ext === undefined) {
		return base;
	}
	return base.endsWith(ext) ? base.slice(0, base.length - ext.length) : base;
}

/**
 * The `path.normalize()` method normalizes the given path, resolving '..' and '.' segments.
 *
 * When multiple, sequential path segment separation characters are found (e.g.
 * / on POSIX and either \ or / on Windows), they are replaced by a single
 * instance of the platform-specific path segment separator (/ on POSIX and \
 * on Windows). Trailing separators are preserved.
 *
 * If the path is a zero-length string, '.' is returned, representing the
 * current working directory.
 *
 * @param  {string} separator  platform-specific file separator
 * @param  {string} filepath  input file path
 * @return {string} [description]
 */
function normalize(separator, filepath) {
	assertArgumentType(filepath, 'path', 'string');
	if (filepath.length === 0) {
		return '.';
	}

	// Windows can handle '/' or '\\' and both should be turned into separator
	const isWindows = separator === '\\';
	if (isWindows) {
		filepath = filepath.replace(/\//g, separator);
	}

	const hadLeading = filepath.startsWith(separator);
	// On Windows, need to handle UNC paths (\\host-name\\resource\\dir) special to retain leading double backslash
	const isUNC = hadLeading && isWindows && filepath.length > 2 && filepath.charAt(1) === '\\';
	const hadTrailing = filepath.endsWith(separator);

	const parts = filepath.split(separator);
	const result = [];
	for (const segment of parts) {
		if (segment.length !== 0 && segment !== '.') {
			if (segment === '..') {
				result.pop(); // FIXME: What if this goes above root? Should we throw an error?
			} else {
				result.push(segment);
			}
		}
	}
	let normalized = hadLeading ? separator : '';
	normalized += result.join(separator);
	if (hadTrailing) {
		normalized += separator;
	}
	if (isUNC) {
		normalized = '\\' + normalized;
	}
	return normalized;
}

/**
 * [assertSegment description]
 * @param  {*} segment [description]
 * @return {void}         [description]
 */
function assertSegment(segment) {
	if (typeof segment !== 'string') {
		throw new TypeError(`Path must be a string. Received ${segment}`);
	}
}

/**
 * The `path.join()` method joins all given path segments together using the
 * platform-specific separator as a delimiter, then normalizes the resulting path.
 * Zero-length path segments are ignored. If the joined path string is a zero-
 * length string then '.' will be returned, representing the current working directory.
 * @param  {string} separator platform-specific file separator
 * @param  {string[]} paths [description]
 * @return {string}       The joined filepath
 */
function join(separator, paths) {
	const result = [];
	// naive impl: just join all the paths with separator
	for (const segment of paths) {
		assertSegment(segment);

		if (segment.length !== 0) {
			result.push(segment);
		}
	}

	return normalize(separator, result.join(separator));
}

/**
 * The `path.resolve()` method resolves a sequence of paths or path segments into an absolute path.
 *
 * @param  {string} separator platform-specific file separator
 * @param  {string[]} paths [description]
 * @return {string}       [description]
 */
function resolve(separator, paths) {
	let resolved = '';
	let hitRoot = false;
	const isPosix = (separator === '/');
	// go from right to left until we hit absolute path/root
	for (let i = paths.length - 1; i >= 0; i--) {
		const segment = paths[i];
		assertSegment(segment);

		if (segment.length === 0) {
			continue; // skip empty
		}

		resolved = segment + separator + resolved; // prepend new segment
		if (isAbsolute(isPosix, segment)) { // have we backed into an absolute path?
			hitRoot = true;
			break;
		}
	}
	// if we didn't hit root, prepend cwd
	if (!hitRoot) {
		resolved = process.cwd() + separator + resolved;
	}
	const normalized = normalize(separator, resolved);
	if (normalized.charAt(normalized.length - 1) === separator) {
		// FIXME: Handle UNC paths on Windows as well, so we don't trim trailing separator on something like '\\\\host-name\\resource\\'
		// Don't remove trailing separator if this is root path on windows!
		if (!isPosix && normalized.length === 3 && normalized.charAt(1) === ':' && isWindowsDeviceName(normalized.charCodeAt(0))) {
			return normalized;
		}
		// otherwise trim trailing separator
		return normalized.slice(0, normalized.length - 1);
	}
	return normalized;
}

/**
 * The `path.relative()` method returns the relative path `from` from to `to` based
 * on the current working directory. If from and to each resolve to the same
 * path (after calling `path.resolve()` on each), a zero-length string is returned.
 *
 * If a zero-length string is passed as `from` or `to`, the current working directory
 * will be used instead of the zero-length strings.
 *
 * @param  {string} separator platform-specific file separator
 * @param  {string} from [description]
 * @param  {string} to   [description]
 * @return {string}      [description]
 */
function relative(separator, from, to) {
	assertArgumentType(from, 'from', 'string');
	assertArgumentType(to, 'to', 'string');

	if (from === to) {
		return '';
	}

	from = resolve(separator, [ from ]);
	to = resolve(separator, [ to ]);

	if (from === to) {
		return '';
	}

	// we now have two absolute paths,
	// lets "go up" from `from` until we reach common base dir of `to`
	// const originalFrom = from;
	let upCount = 0;
	let remainingPath = '';
	while (true) {
		if (to.startsWith(from)) {
			// match! record rest...?
			remainingPath = to.slice(from.length);
			break;
		}
		// FIXME: Break/throw if we hit bad edge case of no common root!
		from = dirname(separator, from);
		upCount++;
	}
	// remove leading separator from remainingPath if there is any
	if (remainingPath.length > 0) {
		remainingPath = remainingPath.slice(1);
	}
	return ('..' + separator).repeat(upCount) + remainingPath;
}

/**
 * The `path.parse()` method returns an object whose properties represent
 * significant elements of the path. Trailing directory separators are ignored,
 * see `path.sep`.
 *
 * The returned object will have the following properties:
 *
 * - dir <string>
 * - root <string>
 * - base <string>
 * - name <string>
 * - ext <string>
 * @param  {string} separator platform-specific file separator
 * @param  {string} filepath [description]
 * @return {object}
 */
function parse(separator, filepath) {
	assertArgumentType(filepath, 'path', 'string');

	const result = { root: '', dir: '', base: '', ext: '', name: '' };
	const length = filepath.length;
	if (length === 0) {
		return result;
	}

	// Cheat and just call our other methods for dirname/basename/extname?
	result.base = basename(separator, filepath);
	result.ext = extname(separator, result.base);
	const baseLength = result.base.length;
	result.name = result.base.slice(0, baseLength - result.ext.length);
	const toSubtract = baseLength === 0 ? 0 : baseLength + 1;
	result.dir = filepath.slice(0, filepath.length - toSubtract); // drop trailing separator!
	const firstCharCode = filepath.charCodeAt(0);
	// both win32 and POSIX return '/' root
	if (firstCharCode === FORWARD_SLASH) {
		result.root = '/';
		return result;
	}
	// we're done with POSIX...
	if (separator === '/') {
		return result;
	}
	// for win32...
	if (firstCharCode === BACKWARD_SLASH) {
		// FIXME: Handle UNC paths like '\\\\host-name\\resource\\file_path'
		// need to retain '\\\\host-name\\resource\\' as root in that case!
		result.root = '\\';
		return result;
	}
	// check for C: style root
	if (length > 1 && isWindowsDeviceName(firstCharCode) && filepath.charAt(1) === ':') {
		if (length > 2) { // is it like C:\\?
			const thirdCharCode = filepath.charCodeAt(2);
			if (thirdCharCode === FORWARD_SLASH || thirdCharCode === BACKWARD_SLASH) {
				result.root = filepath.slice(0, 3);
				return result;
			}
		}
		// nope, just C:, no trailing separator
		result.root = filepath.slice(0, 2);
	}
	return result;
}

/**
 * The `path.format()` method returns a path string from an object. This is the
 * opposite of `path.parse()`.
 *
 * @param  {string} separator platform-specific file separator
 * @param  {object} pathObject object of format returned by `path.parse()`
 * @param  {string} pathObject.dir directory name
 * @param  {string} pathObject.root file root dir, ignored if `pathObject.dir` is provided
 * @param  {string} pathObject.base file basename
 * @param  {string} pathObject.name basename minus extension, ignored if `pathObject.base` exists
 * @param  {string} pathObject.ext file extension, ignored if `pathObject.base` exists
 * @return {string}
 */
function format(separator, pathObject) {
	assertArgumentType(pathObject, 'pathObject', 'object');

	const base = pathObject.base || `${pathObject.name || ''}${pathObject.ext || ''}`;

	// append base to root if `dir` wasn't specified, or if
	// dir is the root
	if (!pathObject.dir || pathObject.dir === pathObject.root) {
		return `${pathObject.root || ''}${base}`;
	}
	// combine dir + / + base
	return `${pathObject.dir}${separator}${base}`;
}

/**
 * On Windows systems only, returns an equivalent namespace-prefixed path for
 * the given path. If path is not a string, path will be returned without modifications.
 * See https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#namespaces
 * @param  {string} filepath [description]
 * @return {string}          [description]
 */
function toNamespacedPath(filepath) {
	if (typeof filepath !== 'string') {
		return filepath;
	}

	if (filepath.length === 0) {
		return '';
	}

	const resolvedPath = resolve('\\', [ filepath ]);
	const length = resolvedPath.length;
	if (length < 2) { // need '\\\\' or 'C:' minimum
		return filepath;
	}

	const firstCharCode = resolvedPath.charCodeAt(0);
	// if start with '\\\\', prefix with UNC root, drop the slashes
	if (firstCharCode === BACKWARD_SLASH && resolvedPath.charAt(1) === '\\') {
		// return as-is if it's an aready long path ('\\\\?\\' or '\\\\.\\' prefix)
		if (length >= 3) {
			const thirdChar = resolvedPath.charAt(2);
			if (thirdChar === '?' || thirdChar === '.') {
				return filepath;
			}
		}
		return '\\\\?\\UNC\\' + resolvedPath.slice(2);
	} else if (isWindowsDeviceName(firstCharCode) && resolvedPath.charAt(1) === ':') {
		return '\\\\?\\' + resolvedPath;
	}

	return filepath;
}

const Win32Path = {
	sep: '\\',
	delimiter: ';',
	basename: function (filepath, ext) {
		return basename(this.sep, filepath, ext);
	},
	normalize: function (filepath) {
		return normalize(this.sep, filepath);
	},
	join: function (...paths) {
		return join(this.sep, paths);
	},
	extname: function (filepath) {
		return extname(this.sep, filepath);
	},
	dirname: function (filepath) {
		return dirname(this.sep, filepath);
	},
	isAbsolute: function (filepath) {
		return isAbsolute(false, filepath);
	},
	relative: function (from, to) {
		return relative(this.sep, from, to);
	},
	resolve: function (...paths) {
		return resolve(this.sep, paths);
	},
	parse: function (filepath) {
		return parse(this.sep, filepath);
	},
	format: function (pathObject) {
		return format(this.sep, pathObject);
	},
	toNamespacedPath: toNamespacedPath
};

const PosixPath = {
	sep: '/',
	delimiter: ':',
	basename: function (filepath, ext) {
		return basename(this.sep, filepath, ext);
	},
	normalize: function (filepath) {
		return normalize(this.sep, filepath);
	},
	join: function (...paths) {
		return join(this.sep, paths);
	},
	extname: function (filepath) {
		return extname(this.sep, filepath);
	},
	dirname: function (filepath) {
		return dirname(this.sep, filepath);
	},
	isAbsolute: function (filepath) {
		return isAbsolute(true, filepath);
	},
	relative: function (from, to) {
		return relative(this.sep, from, to);
	},
	resolve: function (...paths) {
		return resolve(this.sep, paths);
	},
	parse: function (filepath) {
		return parse(this.sep, filepath);
	},
	format: function (pathObject) {
		return format(this.sep, pathObject);
	},
	toNamespacedPath: function (filepath) {
		return filepath; // no-op
	}
};

const path = PosixPath;
path.win32 = Win32Path;
path.posix = PosixPath;

export default path;
