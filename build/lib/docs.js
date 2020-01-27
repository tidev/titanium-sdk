'use strict';

const spawn = require('child_process').spawn; // eslint-disable-line security/detect-child-process
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
	}

	async generateReport(format, filename) {
		const cmd = process.platform === 'win32' ? 'docgen.cmd' : 'docgen';
		const cmdPath = path.join(ROOT_DIR, 'node_modules', '.bin', cmd);
		const args = [ '-f', format, '-o', this.outputDir + path.sep, DOC_DIR ];

		console.log(`Generating ${format} report...`);
		const outputFile = path.join(this.outputDir, filename);

		return new Promise((resolve, reject) => {
			const prc = spawn(cmdPath, args, { cwd: DOC_DIR });
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
