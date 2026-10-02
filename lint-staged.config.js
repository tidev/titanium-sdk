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
	'*.js': files => (files.length ? `oxlint ${files.join(' ')}` : [])
};

if (process.platform === 'darwin') {
	config['iphone/Classes/**/*.swift'] = [
		'swiftlint --fix'
	];
}

export default config;
