import { ESLint } from 'eslint';

const eslint = new ESLint();

const asyncFilter = async (arr, predicate) => {
	return arr.reduce(async (acc, value) => {
		const result = await predicate(value);
		return [ ...await acc, ...(result ? [ value ] : []) ];
	}, []);
};

const config = {
	'android/**/*.java': filenames => {
		return `node ./build/scons gradlew checkJavaStyle --args --console plain -PchangedFiles='${filenames.join(',')}'`;
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
	}
};

if (process.platform === 'darwin') {
	config['iphone/Classes/**/*.swift'] = [
		'swiftlint --fix'
	];
}

export default config;
