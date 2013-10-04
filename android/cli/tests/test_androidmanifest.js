var AndroidManifest = require('../lib/AndroidManifest'),
	fs = require('fs'),
	path = require('path');

(function () {
	var am = new AndroidManifest();

	console.log('\nCreating empty tiapp.xml');
	console.log('toString():')
	console.log(am.toString());
	console.log('\nJSON:')
	console.log(am.toString('json'));
	console.log('\nPretty JSON:')
	console.log(am.toString('pretty-json'));
	console.log('\nXML:');
	console.log(am.toString('xml'));
}());