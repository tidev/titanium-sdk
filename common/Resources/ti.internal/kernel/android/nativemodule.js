/**
 * This is used by Android to require "baked-in" source.
 * SDK and module builds will bake in the raw source as c strings, and this will wrap
 * loading that code in via kroll.NativeModule.require(<id>)
 * For more information, see the bootstrap.js.ejs template.
 */
/* globals OS_IOS, OS_ANDROID */
import invoker from './invoker';

export default function NativeModuleBootstrap(global, kroll) {
	const evaluate = kroll.binding(OS_ANDROID ? 'evals' : 'Script');

	function NativeModule(id) {
		this.filename = id + '.js';
		this.id = id;
		this.exports = {};
		this.loaded = false;
	}

	/**
	 * This should be an object with string keys (baked in module ids) -> string values (source of the baked in js code)
	 */
	NativeModule._source = kroll.binding('natives');
	NativeModule._cache = {};

	NativeModule.require = function (id) {
		if (id === 'native_module') {
			return NativeModule;
		}
		if (id === 'invoker') {
			return invoker; // Android native modules use a bootstrap.js file that assumes there's a builtin 'invoker'
		}

		const cached = NativeModule.getCached(id);
		if (cached) {
			return cached.exports;
		}

		if (!NativeModule.exists(id)) {
			throw new Error('No such native module ' + id);
		}

		const nativeModule = new NativeModule(id);

		nativeModule.compile();
		nativeModule.cache();

		return nativeModule.exports;
	};

	NativeModule.getCached = function (id) {
		return NativeModule._cache[id];
	};

	NativeModule.exists = function (id) {
		return (id in NativeModule._source);
	};

	NativeModule.getSource = function (id) {
		return NativeModule._source[id];
	};

	NativeModule.wrap = function (script) {
		return NativeModule.wrapper[0] + script + NativeModule.wrapper[1];
	};

	NativeModule.wrapper = [
		'(function (exports, require, module, __filename, __dirname, Titanium, Ti, global, kroll) {',
		'\n});' ];

	NativeModule.prototype.compile = function () {

		// All native modules have their filename prefixed with ti:/
		const filename = `ti:/${this.filename}`;

		let source = NativeModule.getSource(this.id);

		if (OS_IOS) {
			source = NativeModule.wrap(source);

			const f = evaluate.runInThisContext(source, filename, true);
			f(this.exports, NativeModule.require, this, this.filename, null, global.Ti, global.Ti, global, kroll);

		} else if (OS_ANDROID) {
			const result = evaluate.runAsModule(source, filename, {
				exports: this.exports,
				require: NativeModule.require,
				module: this,
				__filename: filename,
				__dirname: null,
				Ti: global.Ti,
				Titanium: global.Ti,
				kroll
			});
			if (result) {
				kroll.extend(this.exports, result);
			}
		}

		this.loaded = true;
	};

	NativeModule.prototype.cache = function () {
		NativeModule._cache[this.id] = this;
	};
	return NativeModule;
}
