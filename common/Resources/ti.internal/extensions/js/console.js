import { formatWithOptions, inspect } from '../node/internal/util/inspect';
import { isStackOverflowError } from '../node/internal/errors';

function noop() {}

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

let tableWarned; // boolean flag for one-time warning about console.table not being implemented

// Make a function that can serve as the callback passed to `stream.write()`.
function createWriteErrorHandler(stream) {
	return (err) => {
		// This conditional evaluates to true if and only if there was an error
		// that was not already emitted (which happens when the _write callback
		// is invoked asynchronously).
		if (err !== null && !stream._writableState.errorEmitted) {
			// If there was an error, it will be emitted on `stream` as
			// an `error` event. Adding a `once` listener will keep that error
			// from becoming an uncaught exception, but since the handler is
			// removed after the event, non-console.* writes won't be affected.
			// we are only adding noop if there is no one else listening for 'error'
			if (stream.listenerCount('error') === 0) {
				stream.once('error', noop);
			}
		}
	};
}

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
			this._ignoreErrors = options.ignoreErrors !== false;
			if (this._ignoreErrors) {
				this._stdoutErrorHandler = createWriteErrorHandler(this._stdout);
				this._stderrErrorHandler = createWriteErrorHandler(this._stderr);
			}
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
			const useStdErr = (level === 'warn' || level === 'error' || level === 'trace');
			const stream = useStdErr ? this._stderr : this._stdout;

			if (this._ignoreErrors === false) {
				return stream.write(string);
			}

			// There may be an error occurring synchronously (e.g. for files or TTYs
			// on POSIX systems) or asynchronously (e.g. pipes on POSIX systems), so
			// handle both situations.
			try {
				// Add and later remove a noop error handler to catch synchronous errors.
				if (stream.listenerCount('error') === 0) {
					stream.once('error', noop);
				}

				const errorHandler = useStdErr ? this._stderrErrorHandler : this._stdoutErrorHandler;
				stream.write(string, errorHandler);
			} catch (e) {
				// Console is a debugging utility, so it swallowing errors is not desirable
				// even in edge cases such as low stack space.
				if (isStackOverflowError(e)) {
					throw e;
				}
				// Sorry, there's no proper way to pass along the error here.
			} finally {
				stream.removeListener && stream.removeListener('error', noop);
			}
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

	trace(...args) {
		this._writeToConsole('trace', formatWithOptions(kColorInspectOptions, ...args));
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

	// TODO: implement console.table()
	table() {
		if (!tableWarned) {
			tableWarned = true;
			process.emitWarning('"console.table" is not yet implemented in Titanium!');
		}
	}
}
Console.prototype.log = Console.prototype.info; // Treat log as alias to info
Console.prototype.dirxml = Console.prototype.log; // Treat dirxml as alias to log
Console.prototype.groupCollapsed = Console.prototype.group;

global.console = new Console(Ti.API);

export default Console;
