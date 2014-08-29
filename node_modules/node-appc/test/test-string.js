/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	colors = require('colors'),
	string = appc.string;

describe('string', function () {
	it('namespace exists', function () {
		appc.should.have.property('string');
		appc.string.should.be.an.Object;
	});

	describe('#lpad()', function () {
		it('pad short string', function () {
			string.lpad('titanium', 10).should.equal('  titanium');
		});

		it('pad long string', function () {
			string.lpad('titanium', 5).should.equal('titanium');
		});
	});

	describe('#rpad()', function () {
		it('pad short string', function () {
			string.rpad('titanium', 10).should.equal('titanium  ');
		});

		it('pad long string', function () {
			string.rpad('titanium', 5).should.equal('titanium');
		});
	});

	describe('#capitalize()', function () {
		it('capitalize lowercase string', function () {
			string.capitalize('titanium').should.equal('Titanium');
		});

		it('capitalize uppercase string', function () {
			string.capitalize('TITANIUM').should.equal('TITANIUM');
		});

		it('capitalize mixed-case string', function () {
			string.capitalize('tItAnIuM').should.equal('TItAnIuM');
		});
	});

	describe('#levenshtein()', function () {
		it('proper distance calculation', function () {
			string.levenshtein('', '').should.equal(0);
			string.levenshtein('titanium', 'titanium').should.equal(0);
			string.levenshtein('titan', 'titanium').should.equal(3);
			string.levenshtein('titanium', 'titan').should.equal(3);
			string.levenshtein('android', 'and').should.equal(4);
			string.levenshtein('and', 'android').should.equal(4);
			string.levenshtein('bileweb', 'mobileweb').should.equal(2);
			string.levenshtein('mobileweb', 'mobile').should.equal(3);
		});
	});

	describe('#suggest()', function () {
		it('suggest no match', function () {
			var output = '';
			string.suggest('alpha', ['set', 'getter', 'value', 'stack', 'integer'], function () {
				output += Array.prototype.slice.call(arguments).join(' ') + '\n';
			}, 3);
			output.should.equal('');
		});

		it('suggest short word with', function () {
			var output = '';
			string.suggest('get', ['set', 'getter', 'value', 'stack', 'integer'], function () {
				output += Array.prototype.slice.call(arguments).join(' ') + '\n';
			}, 3);
			output.should.equal('Did you mean this?\n    ' + 'set'.cyan + '\n    ' + 'getter'.cyan + '\n\n');
		});

		it('suggest long word', function () {
			var output = '';
			string.suggest('prototype', ['set', 'getter', 'value', 'stack', 'integer', 'proto', 'type', 'protohype'], function () {
				output += Array.prototype.slice.call(arguments).join(' ') + '\n';
			}, 3);
			output.should.equal('Did you mean this?\n    ' + 'protohype'.cyan + '\n\n');
		});

		it('suggest version', function () {
			var output = '';
			string.suggest('2.1', ['1.8.0', '2.0.0', '2.1.0.GA', '2.2'], function () {
				output += Array.prototype.slice.call(arguments).join(' ') + '\n';
			}, 2);
			output.should.equal('Did you mean this?\n    ' + '2.1.0.GA'.cyan + '\n    ' + '2.2'.cyan + '\n\n');

			output = '';
			string.suggest('2.1', ['1.8.0', '2.0.0', '2.1.0.GA', '2.2'], function () {
				output += Array.prototype.slice.call(arguments).join(' ') + '\n';
			}, 3);
			output.should.equal('Did you mean this?\n    ' + '2.0.0'.cyan + '\n    ' + '2.1.0.GA'.cyan + '\n    ' + '2.2'.cyan + '\n\n');
		});

		it('suggest guid', function () {
			var output = '';
			string.suggest('32', [
				'3ad525be-5eba-406e-8232-04f2fb8e1529',
				'663f15db-75a4-4ded-9fe5-1fda06bbbd78',
				'e1c543a6-166a-47cf-802f-4e00adb468c1',
				'b612af0c-94ad-4444-a337-baa964469f0b',
				'1d730210-1298-464e-a23d-b553634d2adc',
				'325260e0-8e4b-4214-9a9f-19459bb6b16a',
				'3936232d-5fea-4b68-832a-6160df996538',
				'22378356-1dca-4023-ab7d-e2ad610c44b9',
				'888aa9a6-deef-49af-8783-11962b826717',
				'84250298-4799-4b35-b9b7-7ef629e15dcf',
				'810de798-57c3-4aea-ba2b-be9fb67ea74e',
				'd3ac345c-9133-4be4-8d22-d6164a5873b6',
				'5e05b2a8-89fb-49a7-bd7a-f31f70ba9dba',
				'b8a5cd03-97b6-40fc-8568-288672bd790b',
				'117223c9-c097-4171-85c1-44165527db55',
				'323495cc-da61-4e8d-b6ec-4f6d72351289',
				'fe2a6f93-f7a9-456a-8483-f3b6feb1a9a3',
				'4df1f67b-db67-4a3a-b578-4896634d6ae3',
				'd02648cf-ff47-41d0-9201-98810928ce11',
				'e9fc2391-9036-4dc0-bd77-473556f152cd'
			], function () {
				output += Array.prototype.slice.call(arguments).join(' ') + '\n';
			}, 3);
			output.should.equal('Did you mean this?\n    ' + '325260e0-8e4b-4214-9a9f-19459bb6b16a'.cyan + '\n    ' + '323495cc-da61-4e8d-b6ec-4f6d72351289'.cyan + '\n\n');
		});
	});

	describe('#wrap()', function () {
		it('short string should not wrap', function () {
			string.wrap('Appcelerator Titanium is open, extensible development environment.', 80)
				.should.equal('Appcelerator Titanium is open, extensible development environment.');
		});

		it('long string should wrap', function () {
			string.wrap('Appcelerator Titanium is open, extensible development environment for creating ' +
				'beautiful native apps across different mobile devices and OSs including iOS, Android, ' +
				'Windows and BlackBerry, as well as hybrid and HTML5. It includes an open source SDK with ' +
				'over 5,000 device and mobile operating system APIs, Studio, a powerful Eclipse-based IDE, ' +
				'Alloy, an MVC framework and Cloud Services for a ready-to-use mobile backend.', 80)
			.should.equal('Appcelerator Titanium is open, extensible development environment for creating\n' +
				'beautiful native apps across different mobile devices and OSs including iOS,\n' +
				'Android, Windows and BlackBerry, as well as hybrid and HTML5. It includes an\n' +
				'open source SDK with over 5,000 device and mobile operating system APIs, Studio,\n' +
				'a powerful Eclipse-based IDE, Alloy, an MVC framework and Cloud Services for a\n' +
				'ready-to-use mobile backend.');

			string.wrap('Titanium is the leading mobile development environment of choice for hundreds of ' +
				'thousands of developers. With more than 56,843 mobile applications deployed on 145,539,021 ' +
				'devices, the award-winning Titanium environment helps organizations get to market 60% faster ' +
				'and achieve a significant competitive advantage.', 80)
			.should.equal('Titanium is the leading mobile development environment of choice for hundreds of\n' +
				'thousands of developers. With more than 56,843 mobile applications deployed on\n' +
				'145,539,021 devices, the award-winning Titanium environment helps organizations\n' +
				'get to market 60% faster and achieve a significant competitive advantage.');
		});

		it('long string with colors should wrap', function () {
			var counter = 0;
			string.wrap(('Appcelerator Titanium is open, extensible development environment for creating ' +
				'beautiful native apps across different mobile devices and OSs including iOS, Android, ' +
				'Windows and BlackBerry, as well as hybrid and HTML5. It includes an open source SDK with ' +
				'over 5,000 device and mobile operating system APIs, Studio, a powerful Eclipse-based IDE, ' +
				'Alloy, an MVC framework and Cloud Services for a ready-to-use mobile backend.').split(' ').map(function (word) {
					return counter++ % 2 ? word : word.cyan;
				}).join(' '), 80)
			.should.equal(
				'Appcelerator'.cyan +	' Titanium ' +
				'is'.cyan +				' open, ' +
				'extensible'.cyan +		' development ' +
				'environment'.cyan +	' for ' +
				'creating'.cyan +		'\nbeautiful ' +
				'native'.cyan +			' apps ' +
				'across'.cyan +			' different ' +
				'mobile'.cyan +			' devices ' +
				'and'.cyan +			' OSs ' +
				'including'.cyan +		' iOS,\n' +
				'Android,'.cyan +		' Windows ' +
				'and'.cyan +			' BlackBerry, ' +
				'as'.cyan +				' well ' +
				'as'.cyan +				' hybrid ' +
				'and'.cyan +			' HTML5. ' +
				'It'.cyan +				' includes ' +
				'an'.cyan +				'\nopen ' +
				'source'.cyan +			' SDK ' +
				'with'.cyan +			' over ' +
				'5,000'.cyan +			' device ' +
				'and'.cyan +			' mobile ' +
				'operating'.cyan +		' system ' +
				'APIs,'.cyan +			' Studio,\n' +
				'a'.cyan +				' powerful ' +
				'Eclipse-based'.cyan +	' IDE, ' +
				'Alloy,'.cyan +			' an ' +
				'MVC'.cyan +			' framework ' +
				'and'.cyan +			' Cloud ' +
				'Services'.cyan +		' for ' +
				'a'.cyan +				'\nready-to-use ' +
				'mobile'.cyan +			' backend.');
		});

		it('zero width should not wrap', function () {
			string.wrap('Appcelerator Titanium is open, extensible development environment for creating ' +
				'beautiful native apps across different mobile devices and OSs including iOS, Android, ' +
				'Windows and BlackBerry, as well as hybrid and HTML5. It includes an open source SDK with ' +
				'over 5,000 device and mobile operating system APIs, Studio, a powerful Eclipse-based IDE, ' +
				'Alloy, an MVC framework and Cloud Services for a ready-to-use mobile backend.', 0)
			.should.equal('Appcelerator Titanium is open, extensible development environment for creating ' +
				'beautiful native apps across different mobile devices and OSs including iOS, Android, ' +
				'Windows and BlackBerry, as well as hybrid and HTML5. It includes an open source SDK with ' +
				'over 5,000 device and mobile operating system APIs, Studio, a powerful Eclipse-based IDE, ' +
				'Alloy, an MVC framework and Cloud Services for a ready-to-use mobile backend.');
		});
	});

	describe('#renderColumns()', function () {
		it('should render a few items in columns', function (){
			string.renderColumns(['apple', 'orange', 'grape', 'banana'], null, 80).should.equal('apple      orange     grape      banana');

			string.renderColumns([
				'apple',
				'apricot',
				'avocado',
				'banana',
				'breadfruit',
				'bilberry',
				'blackberry',
				'blackcurrant',
				'blueberry',
				'boysenberry',
				'currant',
				'cherry',
				'cherimoya',
				'chili',
				'cloudberry',
				'coconut',
				'damson',
				'date',
				'dragonfruit',
				'durian',
				'elderberry',
				'feijoa',
				'fig',
				'gooseberry',
				'grape',
				'grapefruit',
				'guava',
				'huckleberry',
				'honeydew',
				'jackfruit',
				'jettamelon',
				'jambul',
				'jujube',
				'kiwi fruit',
				'kumquat',
				'legume',
				'lemon',
				'lime',
				'loquat',
				'lychee',
				'mango',
				'melon',
				'nectarine',
				'nut',
				'orange',
				'papaya',
				'peach',
				'pepper',
				'pear',
				'persimmon',
				'physalis',
				'plum',
				'pineapple',
				'pomegranate',
				'pomelo',
				'purple mangosteen',
				'quince',
				'raspberry',
				'rambutan',
				'redcurrant',
				'salal berry',
				'satsuma',
				'star fruit',
				'strawberry',
				'tamarillo',
				'tomato',
				'ugli fruit'
			], null, 80).should.equal(
				'apple                 gooseberry            peach\n' +
				'apricot               grape                 pepper\n' +
				'avocado               grapefruit            pear\n' +
				'banana                guava                 persimmon\n' +
				'breadfruit            huckleberry           physalis\n' +
				'bilberry              honeydew              plum\n' +
				'blackberry            jackfruit             pineapple\n' +
				'blackcurrant          jettamelon            pomegranate\n' +
				'blueberry             jambul                pomelo\n' +
				'boysenberry           jujube                purple mangosteen\n' +
				'currant               kiwi fruit            quince\n' +
				'cherry                kumquat               raspberry\n' +
				'cherimoya             legume                rambutan\n' +
				'chili                 lemon                 redcurrant\n' +
				'cloudberry            lime                  salal berry\n' +
				'coconut               loquat                satsuma\n' +
				'damson                lychee                star fruit\n' +
				'date                  mango                 strawberry\n' +
				'dragonfruit           melon                 tamarillo\n' +
				'durian                nectarine             tomato\n' +
				'elderberry            nut                   ugli fruit\n' +
				'feijoa                orange\n' +
				'fig                   papaya'
			);
		});
	});
});
