/* global TestProxy, IndexedProxy, InterceptProxy, Titanium, Ti, kroll */
// Functional tests for the Hermes runtime. The script evaluates to the report text.
(function () {
	'use strict';
	const lines = [];
	function test(name, fn) {
		try {
			const detail = fn();
			lines.push((detail === false ? 'FAIL ' : 'PASS ') + name + (typeof detail === 'string' ? ': ' + detail : ''));
		} catch (e) {
			lines.push('FAIL ' + name + ': ' + e + (e && e.stack ? '\n' + e.stack : ''));
		}
	}
	function same(a, b) {
		return JSON.stringify(a) === JSON.stringify(b);
	}

	test('kernel ran and bindings exist', () => typeof TestProxy === 'function' && kroll.runtime === 'hermes'
		&& kroll.binding('natives').bootstrap === 'exports.bootstrapLoaded = true;');

	test('create a proxy from JS', () => {
		const p = new TestProxy();
		return p instanceof TestProxy && p instanceof Ti.Proxy && p instanceof kroll.EventEmitter
			&& Object.keys(p).length === 0 && p.constructor.name === 'TestProxy';
	});

	test('constructor without new throws', () => {
		try {
			TestProxy();
			return false;
		} catch (e) {
			return String(e);
		}
	});

	test('Java accessor', () => {
		const p = new TestProxy();
		p.text = 'hällo \u{1F600}';
		return p.text === 'hällo \u{1F600}';
	});

	test('stored property reaches Java and reads back', () => {
		const p = new TestProxy();
		p.title = 'T';
		return p.title === 'T' && p._properties.title === 'T';
	});

	test('read-only accessor and constants', () => {
		const p = new TestProxy();
		let threw = false;
		try {
			p.five = 6;
		} catch (e) {
			threw = true;
		}
		return p.five === 5 && threw && p.TEN === 10 && TestProxy.ELEVEN === 11;
	});

	test('creation properties: known name goes to _properties, unknown name is set on the proxy', () => {
		const p = new TestProxy({ title: 'from dict', custom: 9 });
		const info = p.creationInfo();
		return p._properties.title === 'from dict' && p.title === 'from dict' && p.custom === 9
			&& Object.keys(p).join() === 'custom' && info[0] === 1;
	});

	test('creation through a createXYZ style call with ScopeVars', () => {
		function ScopeVars(vars) {
			this.sourceUrl = vars.sourceUrl;
		}
		function create() {
			return new TestProxy(arguments);
		}
		const p = create(new ScopeVars({ sourceUrl: 'app://x.js' }), { title: 'c', other: 1 });
		const info = p.creationInfo();
		return p.title === 'c' && p.other === 1 && info[0] === 1 && info[1] === 'app://x.js';
	});

	test('type conversion round trips', () => {
		const p = new TestProxy();
		const date = new Date(1700000000000);
		const checks = [
			p.echo(1) === 1, p.echo(1.5) === 1.5, p.echo(-0.25) === -0.25, p.echo(true) === true, p.echo(false) === false,
			p.echo(null) === null, p.echo(undefined) === null, p.echo('s€') === 's€',
			same(p.echo([ 1, 'a', [ 2 ], { k: null } ]), [ 1, 'a', [ 2 ], { k: null } ]),
			same(p.echo({ a: 1, b: { c: [ true ] } }), { a: 1, b: { c: [ true ] } }),
			p.echo(date) instanceof Date && p.echo(date).getTime() === 1700000000000,
			p.echo(p) === p,
			p.describe(3) === 'Integer:3', p.describe(3.5) === 'Double:3.5', p.describe(2147483648) === 'Double:2.147483648E9',
			p.describe('x') === 'String:x', p.describe([ 1, 2 ]) === 'Object[](2)', p.describe(true) === 'Boolean:true',
			p.describe(function () {}).startsWith('HermesFunction'), p.describe({}).startsWith('HashMap')
		];
		const failed = checks.map((ok, i) => (ok ? null : i)).filter(i => i !== null);
		return failed.length === 0 ? true : 'failed checks: ' + failed.join();
	});

	test('Java calls a JS function with the proxy as this', () => {
		const p = new TestProxy();
		p.tag = 'me';
		const result = p.callBack(function (value) {
			return this.tag + ':' + value;
		}, 'arg');
		return result === 'me:arg';
	});

	test('Java exception becomes a JS Error with nativeStack and custom properties', () => {
		const p = new TestProxy();
		try {
			p.fail('boom');
			return false;
		} catch (e) {
			return e instanceof Error && e.message === 'boom' && typeof e.nativeStack === 'string' && e.code === 7;
		}
	});

	test('proxy that Java created first', () => {
		const p = new TestProxy();
		const child = p.makeChild();
		child.text = 'child';
		return child instanceof TestProxy && child !== p && child.text === 'child' && p.echo(child) === child;
	});

	test('events from JS reach listeners, and Java learns about the listener', () => {
		const p = new TestProxy();
		let got = null;
		p.addEventListener('ping', function (e) {
			got = [ this === p, e.n ];
		});
		return p.emit('ping', { n: 3 }) === true && same(got, [ true, 3 ]);
	});

	test('JS code extends a proxy prototype and subclasses with inherit()', () => {
		TestProxy.prototype.shout = function () {
			return this.text.toUpperCase();
		};
		const Child = TestProxy.inherit(function Child() {});
		const c = new Child();
		c.text = 'abc';
		return c instanceof TestProxy && c instanceof Child && c.shout() === 'ABC' && Child.name === 'Child';
	});

	test('module instance and a method without receiver', () => {
		const echo = Titanium.echo;
		return typeof Titanium === 'object' && echo(4) === 4;
	});

	test('an object that inherits from a proxy acts as the proxy', () => {
		// The Titanium kernel wraps each module this way, once per JS file.
		const p = new TestProxy();
		const wrapper = Object.create(p);
		wrapper.text = 'via wrapper';
		wrapper.title = 'stored';
		let got = null;
		wrapper.addEventListener('ping', e => {
			got = e.n;
		});
		return p.text === 'via wrapper' && wrapper.text === 'via wrapper' && wrapper.echo(5) === 5
			&& wrapper.emit('ping', { n: 1 }) === true && got === 1 && Object.keys(p).length === 0;
	});

	test('a property write on a prototype is a plain assignment', () => {
		// The accessors are on the prototype. A write with a receiver that is not a proxy must not
		// reach Java and must not throw.
		const Child = TestProxy.inherit(function Child() {});
		Child.prototype.title = 'on prototype';
		Child.prototype.text = 'also plain';
		const descriptor = Object.getOwnPropertyDescriptor(Child.prototype, 'title');
		return descriptor.value === 'on prototype' && TestProxy.prototype.title === undefined
			&& TestProxy.prototype.text === undefined;
	});

	test('indexed properties', () => {
		const p = new IndexedProxy();
		p[3] = 'x';
		p.text = 'plain';
		return p[21] === 42 && p.text === 'plain' && p instanceof IndexedProxy && p.echo(p) === p;
	});

	test('property interceptor', () => {
		const p = new InterceptProxy();
		p.text = 'plain';
		return p.xyz === 'intercepted:xyz' && p.text === 'plain' && p.other === undefined;
	});

	test('Ti.API logs and inherits from KrollModule', () => {
		Ti.API.info('harness', 'info line');
		return Ti.API.apiName === 'Ti.API' && typeof Ti.API.debug === 'function';
	});

	test('assets binding', () => {
		const assets = kroll.binding('assets');
		return assets.readAsset('a.js') === 'asset:a.js ä€' && assets.readAsset('missing.js') === null;
	});

	test('evals binding', () => {
		const Script = kroll.binding('evals').Script;
		const fn = Script.runInThisContext('(function (a) { return a * 2; })', 'ti:/x.js', true);
		let syntaxError = null;
		try {
			Script.runInThisContext('(function (', 'ti:/bad.js', true);
		} catch (e) {
			syntaxError = e;
		}
		return fn(4) === 8 && syntaxError instanceof SyntaxError;
	});

	globalThis.promiseResult = 'pending';
	Promise.resolve(5).then(v => {
		globalThis.promiseResult = 'resolved:' + v;
	});

	return lines.join('\n');
}());
