import { formatWithOptions, inspect } from '../node/internal/util/inspect';

function logTime(self, label, logData) {
	label = `${label}`;
	const startTime = self._times.get(label);
	if (!startTime) {
		process.emitWarning(`Label "${label}" does not exist`);
		return true;
	}
	const duration = Date.now() - startTime;
	if (logData) {
		self.log(`${label}: ${duration}ms`, ...logData);
	} else {
		self.log(`${label}: ${duration}ms`);
	}
	return false;
}

const kColorInspectOptions = { colors: true };
const kNoColorInspectOptions = {};

class Console {
	constructor(options) {
		// Allow passing in a fake Ti.API that we can hijack the info/warn/error/debug calls!
		if (options && options.apiName === 'Ti.API') {
			this._apiModule = options;
		} else {
			// if (!options || typeof options.write === 'function') {
			// 	options = {
			// 	  stdout: options,
			// 	  stderr: arguments[1],
			// 	  ignoreErrors: arguments[2]
			// 	};
			// }
			// TODO: Support stdout/stderr streams passed in!
			// TODO: Sniff options. It may be an object like so:
			// const {
			// 	stdout,
			// 	stderr = stdout,
			// 	ignoreErrors = true,
			// 	colorMode = 'auto',
			// 	inspectOptions
			//   } = options;
			// or it might be a Ti.API module instance (or stub)
			// or user may have passed in args like: stdout, [stderr, [ignoreErrors = true]]
		}

		this._times = new Map();
		this._counts = new Map();
		this._groupIndent = '';
	}

	_writeToConsole(level, string) {
		if (this._groupIndent.length !== 0) {
			if (string.includes('\n')) {
				string = string.replace(/\n/g, `\n${this._groupIndent}`);
			}
			string = this._groupIndent + string;
		}
		// FIXME: Support stdout/stderr streams
		this._apiModule[level](string);
	}

	info(...args) {
		this._writeToConsole('info', formatWithOptions(kColorInspectOptions, ...args));
	}

	warn(...args) {
		this._writeToConsole('warn', formatWithOptions(kNoColorInspectOptions, ...args));
	}

	error(...args) {
		this._writeToConsole('error', formatWithOptions(kNoColorInspectOptions, ...args));
	}

	debug(...args) {
		this._writeToConsole('debug', formatWithOptions(kColorInspectOptions, ...args));
	}

	clear() {} // no-op

	group(...data) {
		if (data.length > 0) {
			this.log(...data);
		}
		this._groupIndent += '  ';
	}

	groupEnd() {
		this._groupIndent = this._groupIndent.slice(0, this._groupIndent.length - 2);
	}

	dir(obj, options) {
		this._writeToConsole('info', inspect(obj, {
			customInspect: false,
			...options
		}));
	}

	assert(value, ...args) {
		if (!value) {
			args[0] = `Assertion failed${args.length === 0 ? '' : `: ${args[0]}`}`;
			this.warn(...args);  // The arguments will be formatted in warn() again
		}
	}

	count(label = 'default') {
		// Ensures that label is a string, and only things that can be
		// coerced to strings. e.g. Symbol is not allowed
		label = `${label}`;
		let count = this._counts.get(label);
		if (count === undefined) {
			count = 1;
		} else {
			count++;
		}
		this._counts.set(label, count);
		this.log(`${label}: ${count}`);
	}

	countReset(label = 'default') {
		if (!this._counts.has(label)) {
			process.emitWarning(`Count for '${label}' does not exist`);
			return;
		}
		this._counts.delete(`${label}`);
	}

	time(label = 'default') {
		label = `${label}`;
		if (this._times.has(label)) {
			process.emitWarning(`Label ${label}" already exists`);
			return;
		}
		this._times.set(label, Date.now());
	}

	timeEnd(label = 'default') {
		const warned = logTime(this, label);
		if (!warned) {
			this._times.delete(label);
		}
	}

	timeLog(label = 'default', ...logData) {
		logTime(this, label, logData);
	}
	// TODO: console.table()
}
Console.prototype.log = Console.prototype.info; // Treat log as alias to info
Console.prototype.dirxml = Console.prototype.log; // Treat dirxml as alias to log
Console.prototype.groupCollapsed = Console.prototype.group;

global.console = new Console(Ti.API);

export default Console;
