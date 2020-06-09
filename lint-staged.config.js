'use strict';

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
	'!(**/locales/**/*).js': 'eslint'
};
