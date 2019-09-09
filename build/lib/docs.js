'use strict';

const spawn = require('child_process').spawn; // eslint-disable-line security/detect-child-process
const fs = require('fs-extra');
const path = require('path');
const ROOT_DIR = path.join(__dirname, '../..');
const DOC_DIR = path.join(ROOT_DIR, 'apidoc');

class Documentation {
	/**
	 * @param       {string} outputDir output directory for generated documentation
	 * @constructor
	 */
	constructor(outputDir) {
		this.outputDir = outputDir;
		this.hasWindows = fs.existsSync(path.join(ROOT_DIR, 'windows'));
	}

	async generateReport(format, filename) {
		const args = [ path.join(ROOT_DIR, 'node_modules', '.bin', 'docgen'), '-f', format, '-o', this.outputDir + path.sep, DOC_DIR ];
		if (this.hasWindows && format !== 'typescript') {
			args.push([
				'-a', path.join(ROOT_DIR, 'windows/doc/Titanium'),
				'-a', path.join(ROOT_DIR, 'windows/doc/WindowsOnly'),
				'-a', path.join(ROOT_DIR, 'windows/doc/Modules')
			]);
		}

		console.log(`Generating ${format} report...`);
		const outputFile = path.join(this.outputDir, filename);

		return new Promise((resolve, reject) => {
			const prc = spawn('node', args, { cwd: DOC_DIR });
			prc.stdout.on('data', data => console.log(data.toString().trim()));
			prc.stderr.on('data', data => console.error(data.toString().trim()));
			prc.on('close', code => {
				if (code !== 0) {
					return reject(new Error(`Failed to generate ${format} docs.`));
				}
				resolve(outputFile);
			});
		});
	}

	async generateParityReport() {
		return this.generateReport('parity', 'parity.html');
	}

	async generateJSCA() {
		return this.generateReport('jsca', 'api.jsca');
	}

	async generateTypeScriptTypeDefinitions() {
		return this.generateReport('typescript', 'index.d.ts');
	}

	async generate() {
		return Promise.all([
			this.generateParityReport(),
			this.generateJSCA(),
			this.generateTypeScriptTypeDefinitions()
		]);
	}
}
module.exports = Documentation;
