'use strict';

const { ESLint } = require('eslint');

const eslint = new ESLint();

const asyncFilter = async (arr, predicate) => {
	return arr.reduce(async (acc, value) => {
		const result = await predicate(value);
		return [ ...await acc, ...(result ? [ value ] : []) ];
	}, []);
};

module.exports = {
	'android/**/*.java': filenames => {
		return `./android/gradlew checkJavaStyle -p ./android --console plain -PchangedFiles='${filenames.join(',')}'`;
	},
	'iphone/**/*.{m,h}': [
		'npx clang-format -style=file -i'
	],
	'iphone/TitaniumKit/TitaniumKit/Sources/API/TopTiModule.m': [
		'npm run ios-sanity-check --'
	],
	'*.js': async files => {
		const filtered = await asyncFilter(files, async file => {
			try {
				return !await eslint.isPathIgnored(file);
			} catch (e) {
				return false;
			}
		});
		return `eslint ${filtered.join(' ')}`;
	},
	'package-lock.json': 'npm run lint:lockfile'
};
