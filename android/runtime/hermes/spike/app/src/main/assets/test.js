/* global log, View, Label, __init, __wrap, __gc, __created, __finalized */
'use strict';

function test(name, fn) {
	try {
		const detail = fn();
		log((detail === false ? 'FAIL ' : 'PASS ') + name + (typeof detail === 'string' ? ': ' + detail : ''));
	} catch (e) {
		log('FAIL ' + name + ': ' + e);
	}
}

// --- Question 6: constructors -----------------------------------------------------------------

test('new on a host function is rejected (expected)', () => {
	try {
		new __init();
		return false;
	} catch (e) {
		return String(e);
	}
});

test('new on a native-made constructor', () => {
	const label = new Label();
	return label instanceof Label && label instanceof View && label.constructor === Label;
});

// --- Question 4: the proxy model --------------------------------------------------------------

test('accessor round trip through Java', () => {
	const label = new Label();
	label.text = 'hello';
	return label.text === 'hello' && Object.getOwnPropertyNames(label).length === 0;
});

test('method inherited from the parent prototype', () => {
	const a = new Label();
	const b = new View();
	return typeof a.nativeId() === 'number' && a.nativeId() !== b.nativeId();
});

test('JS code extends a proxy prototype', () => {
	View.prototype.extra = function () {
		return 'id' + this.nativeId();
	};
	return new Label().extra().startsWith('id');
});

test('JS code overrides an accessor and calls the original', () => {
	const original = Object.getOwnPropertyDescriptor(View.prototype, 'text');
	let calls = 0;
	Object.defineProperty(Label.prototype, 'text', {
		get() {
			calls++;
			return original.get.call(this);
		},
		set(value) {
			original.set.call(this, value.toUpperCase());
		},
		configurable: true
	});
	const label = new Label();
	label.text = 'abc';
	const ok = label.text === 'ABC' && calls === 1;
	delete Label.prototype.text;
	return ok;
});

test('expando property on a proxy instance', () => {
	const label = new Label();
	label.custom = { a: 1 };
	return label.custom.a === 1 && Object.keys(label).join() === 'custom';
});

test('proxy method on a non-proxy receiver throws a JS error', () => {
	try {
		View.prototype.nativeId.call({});
		return false;
	} catch (e) {
		return e instanceof Error && String(e.message);
	}
});

test('constructor defined in JS with a native init function', () => {
	function Button() {
		__init(this);
	}
	Button.prototype = Object.create(View.prototype);
	Button.prototype.constructor = Button;
	const button = new Button();
	button.text = 'ok';
	return button instanceof View && button.text === 'ok';
});

test('ES class extends a host constructor', () => {
	class MyLabel extends Label {
		shout() {
			return this.text + '!';
		}
	}
	const label = new MyLabel();
	label.text = 'hey';
	return label instanceof Label && label.shout() === 'hey!';
});

test('native code wraps a proxy that Java created', () => {
	const label = __wrap();
	label.text = 'wrapped';
	return label instanceof Label && label.text === 'wrapped';
});

// --- Question 5: finalizers -------------------------------------------------------------------

test('garbage collection runs the native finalizers', () => {
	const createdBefore = __created();
	const finalizedBefore = __finalized();
	const start = Date.now();
	(function () {
		for (let i = 0; i < 20000; i++) {
			new Label().text = 'x' + i;
		}
	}());
	const loopMs = Date.now() - start;
	__gc();
	const created = __created() - createdBefore;
	const finalized = __finalized() - finalizedBefore;
	return finalized >= created * 0.9 ? `created ${created}, finalized ${finalized} after one collection, create and set took ${loopMs} ms` : false;
});

// --- Microtasks: the native side reads this flag before and after drainMicrotasks() -----------

globalThis.__microtaskRan = false;
Promise.resolve().then(() => {
	globalThis.__microtaskRan = true;
});

// --- Language support of this Hermes version --------------------------------------------------

function supports(name, source) {
	let result;
	try {
		const value = new Function(source)();
		result = value === false ? 'NO (wrong result)' : 'yes' + (typeof value === 'string' ? ' (' + value + ')' : '');
	} catch (e) {
		result = 'NO (' + String(e).slice(0, 90) + ')';
	}
	log('LANG ' + name + ': ' + result);
}

supports('let/const, arrow, template', 'const a = 1; let b = () => `${a}`; return b() === "1";');
supports('class with fields and private members', 'class A { x = 1; #y = 2; static z = 3; get y() { return this.#y; } } return new A().y === 2 && A.z === 3;');
supports('async/await', 'return (async () => { await null; })() instanceof Promise;');
supports('generators', 'function* g() { yield 1; } return g().next().value === 1;');
supports('async generators, for await', 'async function* g() { yield 1; } (async () => { for await (const x of g()) {} })(); return true;');
supports('destructuring, spread, default params', 'const {a, ...r} = {a: 1, b: 2}; const f = (x = 2, ...y) => x; return a === 1 && r.b === 2 && f() === 2;');
supports('optional chaining, nullish', 'const o = null; return (o?.a ?? 5) === 5;');
supports('logical assignment', 'let a = null; a ??= 3; return a === 3;');
supports('exponent operator', 'return 2 ** 3 === 8;');
supports('BigInt', 'return typeof BigInt(1) === "bigint" && 2n ** 64n > 0n;');
supports('Symbol, Map, Set, WeakMap', 'return new Map([[Symbol.iterator, 1]]).size === 1 && !!new WeakMap() && new Set([1, 1]).size === 1;');
supports('Proxy and Reflect', 'return new Proxy({}, { get: () => 7 }).x === 7 && Reflect.ownKeys({a: 1}).length === 1;');
supports('WeakRef', 'return typeof WeakRef === "function";');
supports('FinalizationRegistry', 'return typeof FinalizationRegistry === "function";');
supports('typed arrays, ArrayBuffer, DataView', 'return new Uint8Array(new ArrayBuffer(4)).length === 4 && !!new DataView(new ArrayBuffer(1));');
supports('SharedArrayBuffer', 'return typeof SharedArrayBuffer === "function";');
supports('Atomics', 'return typeof Atomics === "object";');
supports('RegExp named groups, lookbehind, unicode', 'return /(?<y>\\d{4})/.exec("2026").groups.y === "2026" && /(?<=a)b/.test("ab") && /\\p{L}/u.test("x");');
supports('String.prototype.replaceAll, at', 'return "aa".replaceAll("a", "b") === "bb" && [1, 2].at(-1) === 2;');
supports('Array findLast', 'return [1, 2].findLast(x => x) === 2;');
supports('Array toSorted', 'return [2, 1].toSorted()[0] === 1;');
supports('Array flat, includes, Object.entries, fromEntries', 'return [[1]].flat().includes(1) && Object.fromEntries(Object.entries({a: 1})).a === 1;');
supports('Object.hasOwn', 'return Object.hasOwn({a: 1}, "a");');
supports('structuredClone is built in', 'return typeof structuredClone === "function";');
supports('Promise.allSettled, any', 'return typeof Promise.allSettled === "function" && typeof Promise.any === "function";');
supports('TextEncoder, TextDecoder are built in', 'return typeof TextEncoder === "function" && typeof TextDecoder === "function";');
supports('globalThis', 'return typeof globalThis === "object";');
supports('tagged template, raw', 'return String.raw`a\\n` === "a\\\\n";');
supports('label, getter/setter, computed keys', 'const k = "x"; const o = { [k]: 1, get y() { return 2; } }; return o.x + o.y === 3;');
supports('with statement', 'var o = {a: 1}; with (o) { return a === 1; }');
supports('indirect eval', 'return (0, eval)("1 + 1") === 2;');
supports('direct eval reads local variables', 'var secret = 41; return eval("secret + 1") === 42;');
supports('new Function', 'return new Function("a", "return a + 1")(1) === 2;');
supports('Function.prototype.toString keeps source', 'function f() { return 12345; } return String(f).includes("12345");');
supports('Error.stack and captureStackTrace', 'return typeof new Error("x").stack === "string" && typeof Error.captureStackTrace === "function";');
supports('Date and JSON', 'return JSON.parse(JSON.stringify({d: new Date(0)})).d === "1970-01-01T00:00:00.000Z";');
supports('Intl.NumberFormat', 'return new Intl.NumberFormat("de-DE").format(1234.5);');
supports('Intl.DateTimeFormat', 'return new Intl.DateTimeFormat("en-US", { timeZone: "UTC" }).format(new Date(0));');
supports('Intl.Collator', 'return new Intl.Collator("de").compare("a", "b") < 0;');
supports('Intl.PluralRules, RelativeTimeFormat, ListFormat', 'return [typeof Intl.PluralRules, typeof Intl.RelativeTimeFormat, typeof Intl.ListFormat].join();');
supports('toLocaleString', 'return (1234.5).toLocaleString("en-US");');
supports('setTimeout is built in', 'return typeof setTimeout === "function";');
supports('console is built in', 'return typeof console === "object";');
supports('queueMicrotask is built in', 'return typeof queueMicrotask === "function";');
supports('HermesInternal', 'return typeof HermesInternal === "object" && JSON.stringify(HermesInternal.getRuntimeProperties());');
