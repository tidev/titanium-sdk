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
	constructor(options, stderr, ignoreErrors) {
		if (options && options.apiName === 'Ti.API') {
			// Passing in Ti.API module where we retain log levels
			this._apiModule = options;
		} else {
			// Node.JS streams
			if (!options || typeof options.write === 'function') {
				// no args, or first arg is a stream
				options = {
					stdout: options,
					stderr,
					ignoreErrors
				};
			}
			this._stdout = options.stdout; // TODO: enforce has write function?
			this._stderr = options.stderr || this._stdout;
			this._ignoreErrors = options.ignoreErrors || true;
			this._colorMode = options.colorMode || 'auto'; // TODO: enforce boolean or 'auto'
			this._inspectOptions = options.inspectOptions; // TODO: enforce undefined or typeof 'object'
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

		// Support wrapping Ti.API (which retains log level)
		if (this._apiModule) {
			this._apiModule[level](string);
		} else {
			// Support Node.JS streams like stdout/stderr which don't have log levels
			const stream = (level === 'warn' || level === 'error') ? this._stderr : this._stdout;
			// TODO: Handle this._ignoreErrors by doing try/catch/finally, hanging error handlers
			stream.write(string);
		}
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
