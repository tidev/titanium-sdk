import { expect } from 'chai';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import ti from 'node-titanium-sdk';
import { run } from '../commands/project.js';

// The Titanium CLI installs the color getters on String, Number *and* Boolean
// before running an SDK command (see `assignColors()` in titanium/src/cli.js).
// Deployment target values parse as booleans, so without the Boolean prototype
// these tests would report a styling bug that does not exist at runtime.
const COLOR_PROPS = [ 'blue', 'bold', 'cyan', 'gray', 'green', 'grey', 'magenta', 'red', 'yellow' ];

function assignColors() {
	const descriptors = Object.fromEntries(
		COLOR_PROPS.map(name => [ name, { get() { return `${this}`; }, configurable: true } ])
	);
	for (const proto of [ String.prototype, Number.prototype, Boolean.prototype ]) {
		Object.defineProperties(proto, descriptors);
	}
}

function removeColors() {
	for (const proto of [ String.prototype, Number.prototype, Boolean.prototype ]) {
		for (const name of COLOR_PROPS) {
			delete proto[name];
		}
	}
}

const TIAPP = `<?xml version="1.0" encoding="UTF-8"?>
<ti:app xmlns:ti="http://ti.appcelerator.org">
	<id>com.example.app</id>
	<name>Demo</name>
	<version>1.0.0</version>
	<guid>abc-123</guid>
	<sdk-version>14.0.0</sdk-version>
	<deployment-targets>
		<target device="android">true</target>
		<target device="iphone">true</target>
		<target device="ipad">false</target>
	</deployment-targets>
	<property name="secret" type="string">hunter2</property>
	<modules>
		<module platform="android">ti.foo</module>
	</modules>
</ti:app>
`;

/**
 * Mirrors the device family derivation in iphone/cli/commands/_build.js so the
 * tests assert the map the build actually consumes, not just the keys written.
 *
 * @param {Object} targets - The tiapp.xml `deployment-targets`
 * @returns {String}
 */
function deviceFamily(targets) {
	if (targets.ipad && !targets.iphone) {
		return 'ipad';
	}
	if (targets.iphone && !targets.ipad) {
		return 'iphone';
	}
	return 'universal';
}

describe('project run()', () => {
	let projectDir;
	let sdkDir;
	let output;
	let logger;
	let realExit;
	let realTiappxml;
	let tiapp;

	before(assignColors);
	after(removeColors);

	beforeEach(() => {
		projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ti-project-'));
		fs.writeFileSync(path.join(projectDir, 'tiapp.xml'), TIAPP);

		// a fake SDK with a shared template and an iphone-specific one, so the
		// ipad -> iphone alias resolution is observable
		sdkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ti-sdk-'));
		fs.outputFileSync(path.join(sdkDir, 'templates', 'app', 'default', 'template', 'base.txt'), 'base');
		fs.outputFileSync(path.join(sdkDir, 'iphone', 'templates', 'app', 'default', 'template', 'ios.txt'), 'ios');
		fs.outputFileSync(path.join(sdkDir, 'android', 'templates', 'app', 'default', 'template', 'droid.txt'), 'droid');

		output = [];
		logger = {
			log: (...args) => output.push(args.length ? args.join(' ') : ''),
			error: (...args) => output.push(`ERROR: ${args.join(' ')}`),
			banner: () => output.push('<banner>')
		};

		// run() builds its own tiappxml, so capture the instance it mutates
		realTiappxml = ti.tiappxml;
		tiapp = null;
		ti.tiappxml = function (file) {
			tiapp = new realTiappxml(file);
			return tiapp;
		};

		realExit = process.exit;
		process.exit = code => {
			const err = new Error(`process.exit(${code})`);
			err.exitCode = code;
			throw err;
		};
	});

	afterEach(() => {
		process.exit = realExit;
		ti.tiappxml = realTiappxml;
		fs.removeSync(projectDir);
		fs.removeSync(sdkDir);
	});

	/**
	 * @param {String[]} args - The positional args
	 * @param {Object} [argv] - Extra argv overrides
	 * @returns {Promise<Object>} The captured exit error, if any
	 */
	async function exec(args, argv = {}) {
		const cli = {
			argv: {
				output: 'report',
				'project-dir': projectDir,
				template: 'default',
				_: args,
				...argv
			},
			sdk: { path: sdkDir },
			env: { sdks: { '14.0.0': {}, '13.0.0': {} } }
		};
		try {
			await run(logger, {}, cli);
		} catch (err) {
			if (err.exitCode === undefined) {
				throw err;
			}
			return err;
		}
		return null;
	}

	const text = () => output.join('\n');

	describe('reporting', () => {
		it('prints deployment target values rather than a styled non-string', async () => {
			await exec([]);

			const start = output.indexOf('Deployment Targets:') + 1;
			expect(output.slice(start, start + 3)).to.deep.equal([
				'  android = true',
				'  iphone  = true',
				'  ipad    = false'
			]);
			expect(text()).to.not.include('undefined');
		});

		it('prints every known project property', async () => {
			await exec([]);

			expect(text()).to.match(/^ {2}name {8}= Demo$/m);
			expect(text()).to.match(/^ {2}publisher {3}= not specified$/m);
		});

		it('limits -o json to the deployment targets and known properties', async () => {
			await exec([], { output: 'json' });

			const result = JSON.parse(text());
			expect(Object.keys(result)).to.deep.equal([
				'deployment-targets', 'sdk-version', 'id', 'name', 'version', 'guid'
			]);
			// tiapp.xml sections outside the whitelist must not leak into the output
			expect(result).to.not.have.property('properties');
			expect(result).to.not.have.property('modules');
			expect(text()).to.not.include('hunter2');
		});
	});

	describe('getting a key', () => {
		it('wraps deployment targets in -o json', async () => {
			await exec([ 'deployment-targets' ], { output: 'json' });

			expect(JSON.parse(text())).to.deep.equal({
				'deployment-targets': { android: true, iphone: true, ipad: false }
			});
		});

		it('joins deployment targets in -o text', async () => {
			await exec([ 'deployment-targets' ], { output: 'text' });

			expect(text()).to.equal('android=true,iphone=true,ipad=false');
		});

		it('prints a single property', async () => {
			await exec([ 'name' ]);

			expect(text()).to.equal('Demo');
		});

		it('exits non-zero for an unknown key', async () => {
			const err = await exec([ 'bogus' ]);

			expect(err.exitCode).to.equal(1);
			expect(text()).to.include('bogus is not a valid entry name');
		});
	});

	describe('setting deployment-targets', () => {
		it('supports an iPhone-only app', async () => {
			await exec([ 'deployment-targets', 'iphone' ]);

			expect(tiapp['deployment-targets']).to.deep.equal({ android: false, iphone: true, ipad: false });
			expect(deviceFamily(tiapp['deployment-targets'])).to.equal('iphone');
		});

		it('supports an iPad-only app', async () => {
			await exec([ 'deployment-targets', 'ipad' ]);

			expect(tiapp['deployment-targets']).to.deep.equal({ android: false, iphone: false, ipad: true });
			expect(deviceFamily(tiapp['deployment-targets'])).to.equal('ipad');
		});

		it('supports a universal app', async () => {
			await exec([ 'deployment-targets', 'iphone,ipad' ]);

			expect(tiapp['deployment-targets']).to.deep.equal({ android: false, iphone: true, ipad: true });
			expect(deviceFamily(tiapp['deployment-targets'])).to.equal('universal');
		});

		it('rejects "ios", which is a build platform and not a deployment target', async () => {
			const err = await exec([ 'deployment-targets', 'ios' ]);

			expect(err.exitCode).to.equal(1);
			expect(text()).to.include('Unsupported deployment target "ios"');
		});

		it('rejects a retired platform and lists the supported ones', async () => {
			const err = await exec([ 'deployment-targets', 'android,blackberry' ]);

			expect(err.exitCode).to.equal(1);
			expect(text()).to.include('Unsupported deployment target "blackberry"');
			const listed = output.slice(output.indexOf('Available deployment targets are:') + 1)
				.map(line => line.trim())
				.filter(Boolean);
			expect(listed).to.deep.equal([ 'android', 'ipad', 'iphone' ]);
		});

		it('copies the iphone template for an ipad target', async () => {
			await exec([ 'deployment-targets', 'ipad' ]);

			expect(fs.existsSync(path.join(projectDir, 'base.txt')), 'shared template').to.equal(true);
			expect(fs.existsSync(path.join(projectDir, 'ios.txt')), 'iphone template via ipad alias').to.equal(true);
			expect(fs.existsSync(path.join(projectDir, 'droid.txt')), 'android template').to.equal(false);
		});

		it('exits non-zero for an unknown template', async () => {
			const err = await exec([ 'deployment-targets', 'android' ], { template: 'nope' });

			expect(err.exitCode).to.equal(1);
			expect(text()).to.include('Unknown project template nope');
		});
	});

	describe('setting other keys', () => {
		it('sets a simple string property', async () => {
			await exec([ 'name', 'Renamed' ]);

			expect(tiapp.name).to.equal('Renamed');
		});

		it('clears a simple string property when the value is empty', async () => {
			await exec([ 'name', '' ]);

			expect(tiapp.name).to.equal('');
		});

		it('resolves an sdk-version of "latest"', async () => {
			await exec([ 'sdk-version', 'latest' ]);

			expect(tiapp['sdk-version']).to.equal('14.0.0');
		});

		it('exits non-zero for an unknown sdk-version', async () => {
			const err = await exec([ 'sdk-version', '99.0.0' ]);

			expect(err.exitCode).to.equal(1);
			expect(text()).to.include('Unknown SDK 99.0.0');
		});

		it('exits non-zero for an invalid project id', async () => {
			const err = await exec([ 'id', 'Not A Valid Id' ]);

			expect(err.exitCode).to.equal(1);
			expect(text()).to.include('Invalid project ID');
		});

		it('reports an invalid key instead of writing it', async () => {
			await exec([ 'nonsense', 'x' ]);

			expect(text()).to.include('Invalid tiapp.xml key "nonsense"');
			expect(tiapp).to.not.have.property('nonsense');
		});
	});

	it('rejects more than two arguments', async () => {
		const err = await exec([ 'name', 'a', 'b' ]);

		expect(err.exitCode).to.equal(1);
		expect(text()).to.include('Invalid number of arguments');
	});
});
