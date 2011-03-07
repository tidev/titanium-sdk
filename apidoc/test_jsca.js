/*globals process,require, JSON, console */
/**
* Copyright (c) 2011 Appcelerator, Inc. All Rights Reserved.
* Licensed under the Apache Public License (version 2)
* 
* Requires node.js.
* 
* Quasi-unit test for generating the "newjson" output of 
* apidoc's docgen.py.
* 
* Usage: 
*			node test_jsca.js
*
* (make sure this script is in the same folder as docgen.py when you run it.)
*
**/

var assert = require('assert');
var spawn = require('child_process').spawn;
var jsca = '';
var errout = '';
var breadcrumbs = [];

function isArray(x) {
	return x && typeof x === 'object' && x.constructor === Array;
}

function resolveName(x, passed_name) {
	if (passed_name) {
		return passed_name;
	}
	if (typeof x === 'object') {
		if (x.hasOwnProperty('name')) {
			return x.name;
		}
	}
	return '[' + typeof x + ']';
}

function assertMember(object, member, passed_name, err_msg) {
	var name = resolveName(object, passed_name);
	var msg = err_msg;
	if (!msg) {
		msg = name + ' should have member "' + member + '"';
	}
	assert.ok(object.hasOwnProperty(member), msg);
}

function assertTypeEquality(obj1, obj2, err_msg) {
	assert.ok( (typeof obj1) == (typeof obj2), err_msg);
	assert.ok( isArray(obj1) == isArray(obj2), err_msg);
}

function testSymmetricalProperties(obj1, obj1name, obj2, obj2name) {
	assert.ok((typeof obj1) == (typeof obj2), obj1name + " and " + obj2name + " are not same type. The first is " + (typeof obj1) + " and the second is " + (typeof obj2));
	assert.ok( isArray(obj1) == isArray(obj2), "One of " + obj1name + " and " + obj2name + " is an array and the other is not.");
	if (isArray(obj1) && isArray(obj2)) {
		if (obj1.length === 0 || obj2.length === 0) {
			return;
		}
		for (var i = 0; i < obj1.length && i < obj2.length; i++) {
			testSymmetricalProperties(obj1[i], obj1 + "[array element]", obj2[i], obj2[i] + "[array element]");
		}
	} else {
		for (var prop in obj1) {
			if (obj1.hasOwnProperty(prop)) {
				var optional = obj1._optional && (obj1._optional.indexOf(prop) >= 0);
				if (!optional) {
					assertMember(obj2, prop, "", obj1name + " has '" + prop + "' but " + obj2name + " doesn't");
				}
				if (obj2.hasOwnProperty(prop)) {
					assertTypeEquality(obj1[prop], obj2[prop], obj1name + '.' + prop + " has different type than " + obj2name + "." + prop + "; the first is " + (typeof obj1[prop]) + ", the second is " + (typeof obj2[prop]));
				}
			}
		}
		for (prop in obj2) {
			if (obj2.hasOwnProperty(prop)) {
				optional = obj2._optional && (obj2._optional.indexOf(prop) >= 0);
				if (!optional) {
					assertMember(obj1, prop, "", obj2name + " has '" + prop + "' but " + obj1name + " doesn't");
				}
				if (obj1.hasOwnProperty(prop)) {
					assertTypeEquality(obj1[prop], obj2[prop], obj1name + '.' + prop + " has different type than " + obj2name + "." + prop + "; the first is " + (typeof obj1[prop]) + ", the second is " + (typeof obj2[prop]));
				}
			}
		}
	}
}

var templates = {
	userAgent_template : { 'platform' : '' },
	since_template : { 'name': '', 'version': '' }
};
templates.userAgents_template = [ templates.userAgent_template ];
templates.sinces_template = [ templates.since_template ];
templates.type_template = {
	'name' : '',
	'description': '',
	'deprecated': false,
	'userAgents': templates.userAgents_template,
	'since' : templates.sinces_template,
	'properties' : [],
	'functions' : [],
	'events' : [],
	'remarks' : [],
	'examples' : []
};
templates.function_template = {
	'name' : '',
	'description' : '',
	'userAgents' : templates.userAgents_template,
	'since' : templates.sinces_template,
	'isInstanceProperty' : false,
	'isClassProperty' : false,
	'isInternal' : false,
	'examples' : [],
	'parameters' : [],
	'references' : [],
	'exceptions' : [],
	'returnTypes' : [],
	'isConstructor' : false,
	'isMethod' : false,
	_optional : ['_optional', 'returnTypes', 'parameters']
};
templates.property_template = {
	'name' : '',
	'description' : '',
	'userAgents' : templates.userAgents_template,
	'since' : templates.sinces_template,
	'isInstanceProperty' : false,
	'isClassProperty' : false,
	'isInternal' : false,
	'type' : '',
	'examples' : [],
	'_optional' : ['_optional']
};

function test_array_against_member_template(the_array, member_type_name) {
	assert.ok(isArray(the_array) && the_array.length, member_type_name + " array should be non-empty");
	var template_name = member_type_name + "_template";
	var template = templates[template_name];
	for (var i = 0; i < the_array.length; i++) {
		var element = the_array[i];
		var element_name = resolveName(element);
		breadcrumbs.push('Testing properties are same between ' + template_name + ' and ' + element_name);
		testSymmetricalProperties(template, template_name, element, element_name);
		breadcrumbs.pop();
	}
}

function test_functions(functions) {
	assert.ok(isArray(functions) && functions.length, 'functions should be a non-empty array');
	test_array_against_member_template(functions, "function");
}

function test_properties(properties) {
	assert.ok(isArray(properties) && properties.length, 'properties should be a non-empty array');
	test_array_against_member_template(properties, "property");
}

function test_types(types) {
	assert.ok(isArray(types) && types.length, 'types should be a non-empty array');
	breadcrumbs.push('testing all type definitions');
	test_array_against_member_template(types, "type");
	for (var i = 0; i < types.length; i++) {
		var onetype = types[i];
		var tname = resolveName(onetype);
		if (onetype.functions && onetype.functions.length) {
			breadcrumbs.push('testing function definitions for ' + tname);
			test_functions(onetype.functions);
			breadcrumbs.pop();
		}
		if (onetype.properties && onetype.properties.length) {
			breadcrumbs.push('testing property definitions for ' + tname);
			test_properties(onetype.properties);
			breadcrumbs.pop();
		}
	}
	breadcrumbs.pop();
}

function sanityChecks(api) {
	assert.ok(api.types.length>115, 'Looks like too few (' + api.types.length + ') types.  Was expecting more than 115');
	var methodCount = 0;
	var propertyCount = 0;
	var eventCount = 0;
	for (var i = 0; i < api.types.length; i++) {
		methodCount += api.types[i].functions.length;
		propertyCount += api.types[i].properties.length;
		eventCount += api.types[i].events.length;
	}
	assert.ok(methodCount > 800, 'Expected well over 800 function definitions, found only ' + methodCount);
	assert.ok(propertyCount > 2200, 'Expected well over 2200 property definitions, found only ' + propertyCount);
	assert.ok(eventCount > 400, 'Expected well over 400 event definitions, found only ' + eventCount);
}

var docgen = spawn('python', ['docgen.py', '-f', 'newjson']);
docgen.stdout.on('data', function(data) {
	jsca += data;
});
docgen.stderr.on('data', function(data) {
	errout += data;
});
docgen.on('exit', function(code) {
	if (code !== 0) {
		console.error('Failed to generate jsca: ' + errout);
		process.exit(code);
	}
	breadcrumbs.push('parsing');
	var api = JSON.parse(jsca);
	breadcrumbs.pop();
	try {
		breadcrumbs.push('Checking aliases');
		assertMember(api, 'aliases', 'top-level api');
		breadcrumbs.pop();
		breadcrumbs.push('checking types');
		assertMember(api, 'types', 'top-level api');
		breadcrumbs.push('sanity checks');
		sanityChecks(api);
		breadcrumbs.pop();
		test_types(api.types);
		breadcrumbs.pop();
	} catch(e) {
		if (breadcrumbs && breadcrumbs.length) {
			console.error('Breadcrumbs (most recent last):');
			for (var i = 0; i < breadcrumbs.length; i++) {
				console.error(breadcrumbs[i]);
			}
		}
		throw e;
	}
});

