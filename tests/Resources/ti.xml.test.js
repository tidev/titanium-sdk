/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

// FIXME overflowing local ref table with DocumentProxy: https://jira.appcelerator.org/browse/TIMOB-23460
describe('Titanium.XML', function () {

	// some common initialization specific to the xml suite
	function countNodes(node, type) {
		var nodeCount = 0;
		type = 'undefined' == typeof type ? null : type;
		for (var i = 0; i < node.childNodes.length; i++) {
			var child = node.childNodes.item(i);
			if (null == type || child.nodeType == type) {
				nodeCount++;
				nodeCount += countNodes(child, type);
			}
		}
		return nodeCount;
	}

	var testSource = {};
	var invalidSource = {};

	before(function () {
		var i = 0;
		var testFiles = [ 'soap.xml', 'xpath.xml', 'nodes.xml', 'nodeCount.xml', 'cdata.xml', 'cdataEntities.xml', 'with_dtd.xml', 'with_ns.xml', 'attrs.xml', 'element.xml', 'elementNS.xml' ];
		var invalidFiles = [ 'mismatched_tag.xml', 'no_toplevel.xml', 'no_end.xml' ];

		// wipe last held contents to allow GC to clean up proxies?
		testSource = {};
		invalidSource = {};

		for (i = 0; i < testFiles.length; i++) {
			testSource[testFiles[i]] = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, testFiles[i]).read().text;
		}
		for (i = 0; i < invalidFiles.length; i++) {
			invalidSource[invalidFiles[i]] = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, invalidFiles[i]).read().text;
		}
	});

	after(function () {
		// wipe last held contents to allow GC to clean up proxies?
		testSource = {};
		invalidSource = {};
	});

	it('apiName', function (){
		should(Ti.XML).have.readOnlyProperty('apiName').which.is.a.String;
		should(Ti.XML.apiName).be.eql('Ti.XML');
	});

	it('parseString', function (finish) {
		should(Ti.XML.parseString).be.a.Function;
		should(function () {
			var xml = Ti.XML.parseString('<test>content</test>');
			should(xml).be.an.Object;
		}).not.throw();
		finish();
	});

	it('serializeToString', function (finish) {
		should(Ti.XML.serializeToString).be.a.Function;
		should(function () {
			var xml = Ti.XML.parseString('<test>content</test>');
			should(xml).be.an.Object;
			var str = Ti.XML.serializeToString(xml);
			should(str).be.a.String;
		}).not.throw();
		finish();
	});

	// TIMOB-9071
	it('getOrCreateAttributeNS', function(finish) {
		var xmlDoc = Ti.XML.parseString('<html><head></head><body><a href="http://appcelerator.com/" /></body></html>');
		var anchor = xmlDoc.getElementsByTagName('a').item(0);
		should(function() {
			anchor.getAttributeNS(null, 'href');
		}).not.throw();
		should(function() {
			xmlDoc.createAttributeNS(null, 'id');
		}).not.throw();
		finish();
	});

	//TIMOB-8551
	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('ownerDocumentProperty', function(finish) {
		var doc = Ti.XML.parseString('<?xml version="1.0"?><root><test>data</test></root>');
		var e1 = doc.firstChild;
		var e2 = doc.createElement('test');
		if (e1.ownerDocument === e2.ownerDocument) {
			should(e2.ownerDocument === null).be.eql(false);
			finish();
		}
	});

	// TIMOB-5112
	it('getElementsByTagName', function(finish) {
		var xmlString = '<benny/>';
		var doc = Ti.XML.parseString(xmlString);
		var elem;
		should(function() {
			elem = doc.getElementsByTagName('mickey').item(0);
		}).not.throw();
		finish();
	});

	// FIXME Get working on iOS - doesn't throw exception on parsing empty string
	(utilities.isIOS() ? it.skip : it)('documentParsing', function(finish) {
		var localSources = testSource;
		var localInvalid = invalidSource;
		// Parse valid documents
		should(function() {
			Ti.XML.parseString(localSources['soap.xml']);
		}).not.throw();
		should(function() {
			Ti.XML.parseString(localSources['xpath.xml']);
		}).not.throw();
		should(function() {
			Ti.XML.parseString(localSources['nodes.xml']);
		}).not.throw();
		should(function() {
			Ti.XML.parseString(localSources['nodeCount.xml']);
		}).not.throw();
		should(function() {
			Ti.XML.parseString(localSources['cdata.xml']);
		}).not.throw();
		should(function() {
			Ti.XML.parseString(localSources['cdataEntities.xml']);
		}).not.throw();
		// Parse empty document - spec specifies that a valid XML doc
		// must have a root element (empty string doesn't)
		should(function() {
			Ti.XML.parseString('');
		}).throw(); // iOS doesn't throw exception
		// Parse (some types of) invalid documents
		should(function() {
			Ti.XML.parseString(localInvalid['mismatched_tag.xml']);
		}).throw();
		finish();
	});

	// FIXME: dom-parser.js doesn't throw exception when it 'corrects' end tag
	it.skip('invalidDocumentParsing', function (finish) {
		var localSources = testSource;
		var localInvalid = invalidSource;
		should(function() {
			Ti.XML.parseString(localInvalid['no_end.xml']);
		}).throw();
		should(function() {
			Ti.XML.parseString(localInvalid['no_toplevel.xml']);
		}).throw();
		finish();
	});

	// These 6 tests are adapted from the KitchenSink xml_dom test
	it('soap', function(finish) {
		var xml = Ti.XML.parseString(testSource['soap.xml']);
		var fooBarList = xml.documentElement.getElementsByTagName('FooBar');
		should(fooBarList === null).be.eql(false);
		should(fooBarList.length).eql(1);
		should(fooBarList.item(0)).be.an.Object;
		var item = fooBarList.item(0);
		should(item.firstChild.data).eql('true');
		should(item.firstChild.nodeValue).eql('true');
		should(item.tagName).eql('FooBar');
		finish();
	});

	// SKIP: because XPath is not a part of DOM level2 CORE
	it.skip('xpath', function(finish) {
		var xml = Ti.XML.parseString(testSource['xpath.xml']);
		var fooBarList = xml.documentElement.getElementsByTagName('FooBar');
		should(fooBarList === null).be.eql(false);
		should(fooBarList.length).eql(1);
		should(fooBarList.item(0)).be.an.Object;
		var item = fooBarList.item(0);
		should(item.firstChild.data).eql('true');
		should(item.firstChild.nodeValue).eql('true');
		should(item.nodeName).eql('FooBar');
		// test XPath against Document
		var docResult = xml.evaluate('//FooBar/text()');
		should(docResult === null).be.eql(false);
		should(docResult.length).eql(1);
		should(docResult.item(0).nodeValue).eql('true');
		// test XPath against Element
		var elResult = xml.documentElement.evaluate('//FooBar/text()');
		should(elResult === null).be.eql(false);
		should(elResult.length).eql(1);
		should(elResult.item(0).nodeValue).eql('true');
		// test XPath against Element
		elResult = item.evaluate('text()');
		should(elResult === null).be.eql(false);
		should(elResult.length).eql(1);
		should(elResult.item(0).nodeValue).eql('true');
		finish();
	});

	// FIXME Get working on iOS and Android - tagName is undefined, when expecting 'xml'
	((utilities.isIOS() || utilities.isAndroid()) ? it.skip : it)('xmlNodes', function (finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var nodesList = doc.getElementsByTagName('nodes');
		should(nodesList === null).be.eql(false);
		should(nodesList.length).eql(1);
		var nodes = nodesList.item(0);
		var elements = nodes.getElementsByTagName('node');
		should(elements === null).be.eql(false);
		should(elements.length).eql(13);
		var children = nodes.childNodes;
		should(children === null).be.eql(false);
		should(children).be.an.Object;
		should(countNodes(elements.item(0), 1)).eql(6);
		should(children.item).be.a.Function;
		var firstChild = doc.firstChild;
		should(firstChild === null).be.eql(false);
		should(firstChild.tagName).be.eql('xml'); // iOS returns undefined, Android returns undefined
		should(countNodes(nodes, 1)).eql(13);
		should(nodes.nodeName).eql('nodes');
		should(doc.documentElement.nodeName).eql('response');
		should(nodes.getAttribute('id'));
		var node = nodes.getElementsByTagName('node').item(0);
		should(node.getAttribute('id')).eql('node 1');
		var subnodes = node.getElementsByTagName('node');
		should(subnodes.item(0).getAttribute('id')).eql('node 2');
		finish();
	});

	it('xmlNodeCount', function (finish) {
		var xml = Ti.XML.parseString(testSource['nodeCount.xml']);
		var oneList = xml.documentElement.getElementsByTagName('one');
		var twoList = oneList.item(0).getElementsByTagName('two');
		var threeList = oneList.item(0).getElementsByTagName('three');
		var nodes = xml.getElementsByTagName('root');
		should(oneList.length).eql(1);
		should(twoList.length).eql(2);
		should(threeList.length).eql(4);
		var one = xml.documentElement.getElementsByTagName('one').item(0);
		var next = one.nextSibling;
		for (;null != next && next.nodeType != next.ELEMENT_NODE; ) next = next.nextSibling;
		should(one === null).be.eql(false);
		should(next === null).be.eql(false);
		should(one.nodeName).eql('one');
		should(xml.documentElement.attributes.getNamedItem('id').nodeValue).eql('here');
		should(next.getAttribute('id')).eql('bar');
		should(one.ownerDocument.documentElement.nodeName).eql(xml.documentElement.ownerDocument.documentElement.nodeName);
		var nodeCount = countNodes(nodes.item(0), 1);
		should(nodeCount).eql(8);
		finish();
	});

	// FIXME: some functions should throw exception on out-of-bounds error
	it.skip('xmlCData', function(finish) {
		var xml = Ti.XML.parseString(testSource['cdata.xml']);
		var scriptList = xml.documentElement.getElementsByTagName('script');
		should(scriptList.length).eql(1);
		should(xml.documentElement.nodeName).eql('root');
		var nodeCount = countNodes(xml.documentElement, 1);
		should(nodeCount).eql(1);
		var script = scriptList.item(0);
		var cData;
		for (i = 0; i < script.childNodes.length; i++) {
			var node = script.childNodes.item(i);
			if (node.nodeType == node.CDATA_SECTION_NODE) {
				cData = node;
				break;
			}
		}
		should(cData === null).be.eql(false);
		//CharacterDataAttributes
		var fullString = cData.data;
		should(fullString).eql('\nfunction matchwo(a,b)\n{\nif (a < b && a < 0) then\n  {\n  return 1;\n  }\nelse\n  {\n  return 0;\n  }\n}\n');
		cData.data = 'Test Assignment';
		should(cData.data).eql('Test Assignment');
		cData.data = fullString;
		var fullLength = cData.length;
		should(fullLength).eql(fullString.length);
		// CharacterData.substringData
		var substring1 = cData.substringData(1, 8);
		should(substring1).eql(fullString.substr(1, 8));
		// asking for more than there is should not throw exception
		// according to spec, rather just return up to end.
		var substring2 = null;
		should(function() {
			substring2 = cData.substringData(1, 1e3);
		}).not.throw();
		should(substring2.length).eql(fullLength - 1);
		should(substring2).eql(fullString.substr(1, 1e3));
		// check edge cases
		substring2 = cData.substringData(0, fullLength);
		should(substring2.length).eql(fullLength);
		should(substring2).eql(fullString);
		substring2 = cData.substringData(1, fullLength);
		should(substring2.length).eql(fullLength - 1);
		should(substring2).eql(fullString.substr(1, fullLength));
		substring2 = cData.substringData(0, fullLength + 1);
		should(substring2.length).eql(fullLength);
		should(substring2).eql(fullString.substr(0, fullLength + 1));
		// Per spec substringData should throw exception if given params are out of range
		should(function() {
			var substring3 = cData.substringData(1e3, 1001);
		}).throw();
		should(function() {
			var substring4 = cData.substringData(-1, 101);
		}).throw();
		should(function() {
			var substring5 = cData.substringData(0, -1);
		}).throw();
		//CharacterData.appendData
		var cDataLength = cData.length;
		cData.appendData('Appending');
		var substring6 = cData.substringData(97, 9);
		should(cData.length).eql(cDataLength + 9);
		should(substring6).eql('Appending');
		should(function() {
			script.appendData('ReadOnly');
		}).throw();
		//CharacterData.insertData
		cData.insertData(9, 'InsertData');
		var substring7 = cData.substringData(9, 10);
		should(substring7).eql('InsertData');
		// Per spec insertData should throw exception if given params are out of range
		should(function() {
			cData.insertData(-1, 'InsertFail');
		}).throw();
		should(function() {
			cData.insertData(1e3, 'InsertFail');
		}).throw();
		should(function() {
			script.insertData(1, 'ReadOnly');
		}).throw();
		//CharacterData.replaceData
		cData.replaceData(9, 1, 'ReplaceData');
		var substring8 = cData.substringData(9, 20);
		should(substring8).eql('ReplaceDatansertData');
		cDataLength = cData.length;
		cData.replaceData(cDataLength, 100, 'ReplaceData');
		should(cData.length).eql(cDataLength + 11);
		should(function() {
			cData.replaceDate(-1, 2, 'Failure');
		}).throw();
		cDataLength = cData.length;
		should(function() {
			cData.replaceDate(cDataLength + 1, 2, 'Failure');
		}).throw();
		should(function() {
			cData.replaceDate(1, -1, 'Failure');
		}).throw();
		//CharacterData.deleteData
		cDataLength = cData.length;
		cData.deleteData(1, 8);
		should(cData.length).eql(cDataLength - 8);
		should(function() {
			cData.deleteData(-1, 10);
		}).throw();
		should(function() {
			cData.deleteData(1e3, 1001);
		}).throw();
		should(function() {
			cData.deleteData(0, -1);
		}).throw();
		cData.deleteData(1, 1e3);
		should(cData.length).eql(1);
		should(function() {
			script.deleteData(0, 1);
		}).throw();
		finish();
	});

	it('xmlCDataAndEntities', function(finish) {
		var xml = Ti.XML.parseString(testSource['cdataEntities.xml']);
		var dataList = xml.documentElement.getElementsByTagName('data');
		var subdataList = xml.documentElement.getElementsByTagName('subdata');
		should(xml.documentElement.firstChild.nodeName).eql('subdata');
		var nodeCount = countNodes(subdataList.item(0), 1);
		should(nodeCount).eql(2);
		finish();
	});

	it('xmlSerialize', function(finish) {
		// Return an array of attribute nodes, sorted by name.
		// An attribute NamedNodeMap has no canonical ordering,
		// so to do a comparison we need to ensure we've got the
		// same order between both.
		function sortAttributeList(attribs) {
			var names = [];
			var map = {};
			for (var i = 0; attribs > i; i++) {
				var a = attribs.item(i);
				map[a.nodeName] = a;
				names.push(a.nodeName);
			}
			names = names.sort();
			var list = [];
			for (var i = 0; i < names.length; i++) list.push(map[names[i]]);
			return list;
		}
		function matchXmlTrees(a, b) {
			should(a.nodeType).eql(b.nodeType);
			should(a.nodeName).eql(b.nodeName);
			should(a.nodeValue).eql(b.nodeValue);
			if (1 == a.nodeType) {
				var aAttribs = sortAttributeList(a.attributes);
				var bAttribs = sortAttributeList(b.attributes);
				should(aAttribs.length).eql(bAttribs.length);
				for (var i = 0; i < aAttribs.length; i++) matchXmlTrees(aAttribs[i], bAttribs[i]);
				var aChildren = a.childNodes;
				var bChildren = b.childNodes;
				should(aChildren.length).eql(bChildren.length);
				for (var i = 0; i < aChildren.length; i++) matchXmlTrees(aChildren.item(i), bChildren.item(i));
			}
		}
		for (var sourceName in testSource) {
			var a = Ti.XML.parseString(testSource[sourceName]);
			var bstr = Ti.XML.serializeToString(a);
			var b = Ti.XML.parseString(bstr);
			// Make sure we can round-trip from source to DOM to source and back to DOM...
			matchXmlTrees(a, b);
		}
		finish();
	});

	// FIXME: splitText function should throw exception on out-of-bounds error
	it.skip('apiXMLTextSplitText', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var firstString = 'first part|';
		var secondString = 'second part';
		var completeString = firstString + secondString;
		should(doc.createTextNode).be.a.Function;
		var parentNode = doc.createElement('parentNode');
		var childNode = doc.createTextNode(completeString);
		parentNode.appendChild(childNode);
		should(parentNode.childNodes.length).eql(1);
		should(function() {
			splitTextResults = parentNode.firstChild.splitText(firstString.length);
		}).not.throw();
		should(parentNode.childNodes.length).eql(2);
		should(splitTextResults.nodeValue).eql(parentNode.lastChild.nodeValue);
		should(firstString).eql(parentNode.firstChild.nodeValue);
		should(secondString).eql(parentNode.lastChild.nodeValue);
		// Out-of-bounds exceptions are in the spec:
		completeString = 'New text node';
		childNode = doc.createTextNode(completeString);
		should(function() {
			childNode.splitText(-1);
		}).throw();
		should(function() {
			childNode.splitText(completeString.length + 1);
		}).throw();
		finish();
	});

	// SKIP: textContent is not a part of DOM level2 CORE
	it.skip('apiXMLTextGetText', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var textValue = 'this is some test';
		should(doc.createTextNode).be.a.Function;
		var textNode = doc.createTextNode(textValue);
		should(textNode.nodeValue).eql(textValue);
		var getTextResults = null;
		should(function() {
			getTextResults = textNode.getText();
		}).not.throw();
		should(getTextResults).eql(textValue);
		should(function() {
			getTextResults = textNode.getTextContent();
		}).not.throw();
		should(getTextResults).eql(textValue);
		should(function() {
			getTextResults2 = textNode.text;
		}).not.throw();
		should(getTextResults2).eql(textValue);
		should(function() {
			getTextResults2 = textNode.textContent;
		}).not.throw();
		should(getTextResults2).eql(textValue);
		finish();
	});

	// FIXME: doctype support
	it.skip('apiXmlDocumentProperties', function(finish) {
		// File with DTD
		var doc = Ti.XML.parseString(testSource['with_dtd.xml']);
		should(doc.documentElement).not.be.type('undefined');
		should(doc.documentElement === null).be.eql(false);
		should(doc.documentElement).be.an.Object;
		should(doc.documentElement.nodeName).eql('letter');
		should(doc.implementation).not.be.type('undefined');
		should(doc.implementation === null).be.eql(false);
		should(doc.implementation).be.an.Object;
		should(doc.doctype).not.be.type('undefined');
		should(doc.doctype === null).be.eql(false);
		should(doc.doctype).be.an.Object;
		// Document without DTD, to be sure doc.doctype is null as spec says
		doc = Ti.XML.parseString('<a/>');
		should(doc.doctype === null).eql(true);
		finish();
	});

	// FIXME: value property should return empty string according to spec
	it.skip('apiXmlDocumentCreateAttribute', function() {
		var doc = Ti.XML.parseString('<test/>');
		should(doc.createAttribute).be.a.Function;
		var attr = doc.createAttribute('myattr');
		should(attr === null).be.eql(false);
		should(attr).be.an.Object;
		should(attr.name).eql('myattr');
		// Per spec, value in new attribute should be empty string
		should(attr.value === null).be.eql(false);
		should(attr.value === undefined).be.eql(false);
		should(attr.value).be.equal('');
		should(attr.ownerDocument).eql(doc);
		attr = null;
		should(doc.createAttributeNS).be.a.Function;
		attr = doc.createAttributeNS('http://example.com', 'prefix:myattr');
		should(attr === null).be.eql(false);
		should(attr).be.an.Object;
		should(attr.name).eql('prefix:myattr');
		should(attr.namespaceURI).eql('http://example.com');
		should(attr.prefix).eql('prefix');
		should(attr.value === null).be.eql(false);
		should(attr.value === undefined).be.eql(false);
		should(attr.value).be.equal('');
		should(attr.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlDocumentCreateCDATASection', function() {
		var doc = Ti.XML.parseString('<test/>');
		should(doc.createCDATASection).be.a.Function;
		var data = 'This is my CDATA section';
		var section = doc.createCDATASection(data);
		should(section === null).be.eql(false);
		should(section).be.an.Object;
		should(section.data).eql(data);
		should(section.nodeValue).eql(data);
		should(section.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlDocumentCreateComment', function() {
		var doc = Ti.XML.parseString('<test/>');
		should(doc.createComment).be.a.Function;
		var data = 'This is my comment';
		var comment = doc.createComment(data);
		should(comment === null).be.eql(false);
		should(comment).be.an.Object;
		should(comment.data).eql(data);
		should(comment.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlDocumentCreateDocumentFragment', function() {
		var doc = Ti.XML.parseString('<test/>');
		should(doc.createDocumentFragment).be.a.Function;
		var frag = doc.createDocumentFragment();
		should(frag === null).be.eql(false);
		should(frag).be.an.Object;
		should(frag.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlDocumentCreateElement', function() {
		var doc = Ti.XML.parseString('<test/>');
		should(doc.createElement).be.a.Function;
		var elem = doc.createElement('myelement');
		should(elem === null).be.eql(false);
		should(elem).be.an.Object;
		should(elem.nodeName).eql('myelement');
		should(elem.localName === null).eql(true);
		should(elem.prefix === null).eql(true);
		should(elem.namespaceURI === null).eql(true);
		should(elem.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlDocumentCreateElementNS', function() {
		var doc = Ti.XML.parseString('<test/>');
		should(doc.createElementNS).be.a.Function;
		var elem = doc.createElementNS('http://example.com', 'prefix:myelement');
		should(elem === null).be.eql(false);
		should(elem).be.an.Object;
		should(elem.nodeName).eql('prefix:myelement');
		should(elem.localName).eql('myelement');
		should(elem.prefix).eql('prefix');
		should(elem.namespaceURI).eql('http://example.com');
		should(elem.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlDocumentCreateEntityReference', function() {
		var doc = Ti.XML.parseString('<test/>');
		should(doc.createEntityReference).be.a.Function;
		var entity = doc.createEntityReference('myentity');
		should(entity === null).be.eql(false);
		should(entity).be.an.Object;
		should(entity.nodeName).eql('myentity');
		should(entity.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlDocumentCreateProcessingInstruction', function() {
		var doc = Ti.XML.parseString('<test/>');
		should(doc.createProcessingInstruction).be.a.Function;
		var instruction = doc.createProcessingInstruction('a', 'b');
		should(instruction === null).be.eql(false);
		should(instruction).be.an.Object;
		should(instruction.target).eql('a');
		should(instruction.data).eql('b');
		should(instruction.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlDocumentCreateTextNode', function() {
		var doc = Ti.XML.parseString('<test/>');
		should(doc.createTextNode).be.a.Function;
		var value = 'This is some text';
		var text = doc.createTextNode(value);
		should(text === null).be.eql(false);
		should(text).be.an.Object;
		should(text.data).eql(value);
		should(text.ownerDocument).eql(doc);
	});

	it('apiXmlDocumentGetElementById', function() {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		should(doc.getElementById).be.a.Function;
		var node = doc.getElementById('node 1');
		should(node === null).be.eql(false);
		should(node).be.an.Object;
		should(node.nodeName).eql('node');
		should(function() {
			node = doc.getElementById('no_such_element');
		}).not.throw();
		should(node === null).eql(true);
	});

	it('apiXmlDocumentGetElementsByTagName', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		should(doc.getElementsByTagName).be.a.Function;
		var elements = doc.getElementsByTagName('node');
		should(elements === null).be.eql(false);
		should(elements).be.an.Object;
		should(elements.length).be.greaterThan(0);
		for (var i = 0; i < elements.length; i++) {
			var checkelem = elements.item(i);
			should(checkelem.nodeName).eql('node');
		}
		// test bogus tagname
		should(function() {
			elements = doc.getElementsByTagName('bogus');
		}).not.throw();
		should(elements === null).be.eql(false);
		should(elements).be.an.Object;
		should(elements.length).be.equal(0);
		finish();
	});

	it('apiXmlDocumentGetElementsByTagNameNS', function(finish) {
		var doc = Ti.XML.parseString(testSource['with_ns.xml']);
		should(doc.getElementsByTagNameNS).be.a.Function;
		var elements = doc.getElementsByTagNameNS('http://example.com', 'cake');
		should(elements === null).be.eql(false);
		should(elements).be.an.Object;
		should(elements.length).be.greaterThan(0);
		for (var i = 0; i < elements.length; i++) {
			var checkelem = elements.item(i);
			should(checkelem.localName).eql('cake');
			should(checkelem.namespaceURI).eql('http://example.com');
		}
		// test real namespace and bogus tagname
		should(function() {
			elements = doc.getElementsByTagNameNS('http://example.com', 'bogus');
		}).not.throw();
		should(elements === null).be.eql(false);
		should(elements).be.an.Object;
		should(elements.length).be.equal(0);
		// test bogus namespace and real tagname
		should(function() {
			elements = doc.getElementsByTagNameNS('http://bogus.com', 'pie');
		}).not.throw();
		should(elements === null).be.eql(false);
		should(elements).be.an.Object;
		should(elements.length).be.equal(0);
		// test bogus namespace and bogus tagname
		should(function() {
			elements = doc.getElementsByTagNameNS('http://bogus.com', 'bogus');
		}).not.throw();
		should(elements === null).be.eql(false);
		should(elements).be.an.Object;
		should(elements.length).be.equal(0);
		finish();
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlDocumentImportNode', function(finish) {
		var doc = Ti.XML.parseString('<a/>');
		var otherDoc = Ti.XML.parseString(testSource['with_ns.xml']);
		var cakeNodes = otherDoc.documentElement.getElementsByTagNameNS('http://example.com', 'cake');
		should(cakeNodes === null).be.eql(false);
		should(cakeNodes.length).be.greaterThan(0);
		var cakeNode = cakeNodes.item(0);
		should(cakeNode === null).be.eql(false);
		should(doc.importNode).be.a.Function;
		// test deep import
		var importedNode;
		should(function() {
			importedNode = doc.importNode(cakeNode, true);
		}).not.throw();
		should(importedNode.ownerDocument === null).be.eql(false);
		should(importedNode.ownerDocument).be.an.Object;
		should(importedNode.ownerDocument).eql(doc);
		should(importedNode.parentNode === null).eql(true);
		should(importedNode.hasChildNodes()).be.true;
		should(importedNode.childNodes.length).be.greaterThan(0);
		should(importedNode.namespaceURI).eql('http://example.com');
		// test shallow import
		should(function() {
			importedNode = doc.importNode(cakeNode, false);
		}).not.throw();
		should(importedNode.hasChildNodes()).be.false;
		should(importedNode.ownerDocument === null).be.eql(false);
		should(importedNode.ownerDocument).be.an.Object;
		should(importedNode.ownerDocument).eql(doc);
		should(importedNode.parentNode === null).eql(true);
		finish();
	});

	// FIXME: some properties should be null if it is unspecified
	it.skip('apiXmlNodeProperties', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var nodesList = doc.getElementsByTagName('nodes');
		should(nodesList === null).be.eql(false);
		should(nodesList.length).eql(1);
		var node = nodesList.item(0);
		// verify properties
		should(node.ELEMENT_NODE).be.a.Number;
		should(node.ATTRIBUTE_NODE).be.a.Number;
		should(node.TEXT_NODE).be.a.Number;
		should(node.CDATA_SECTION_NODE).be.a.Number;
		should(node.ENTITY_REFERENCE_NODE).be.a.Number;
		should(node.ENTITY_NODE).be.a.Number;
		should(node.PROCESSING_INSTRUCTION_NODE).be.a.Number;
		should(node.COMMENT_NODE).be.a.Number;
		should(node.DOCUMENT_NODE).be.a.Number;
		should(node.DOCUMENT_TYPE_NODE).be.a.Number;
		should(node.DOCUMENT_FRAGMENT_NODE).be.a.Number;
		should(node.NOTATION_NODE).be.a.Number;
		should(node.nodeName).be.a.String;
		var attrName = 'attr';
		var attrValue = 'value';
		node.setAttribute(attrName, attrValue);
		var attrNode = node.getAttributeNode(attrName);
		should(attrNode.nodeValue).eql(attrValue);
		var CDATANodeContents = 'this CDATA contents';
		var CDATANode = doc.createCDATASection(CDATANodeContents);
		should(CDATANode.nodeValue).eql(CDATANodeContents);
		var commentNodeContents = 'this is a comment';
		var commentNode = doc.createComment(commentNodeContents);
		should(commentNode.nodeValue).eql(commentNodeContents);
		should(doc.nodeValue).eql(null);
		should(doc.createDocumentFragment().nodeValue).eql(null);
		should(doc.doctype).eql(null);
		should(node.nodeValue).eql(null);
		should(doc.createEntityReference('blah').nodeValue).eql(null);
		var processingInstructionData = 'data';
		should(doc.createProcessingInstruction('target', processingInstructionData).nodeValue).eql(processingInstructionData);
		var textNodeContents = 'this is some text';
		var textNode = doc.createTextNode(textNodeContents);
		should(textNode.nodeValue).eql(textNodeContents);
		should(node.nodeType).be.a.Number;
		should(node.parentNode).be.an.Object;
		should(node.childNodes).be.an.Object;
		should(node.firstChild).be.an.Object;
		should(node.lastChild).be.an.Object;
		should(node.previousSibling).be.an.Object;
		should(node.nextSibling).be.an.Object;
		should(node.attributes).be.an.Object;
		should(node.ownerDocument).be.an.Object;
		// Per spec, namespaceURI should be null if it is unspecified
		should(node.namespaceURI).not.be.type('undefined');
		// Per spec, prefix should be null if it is unspecified
		should(node.prefix).not.be.type('undefined');
		should(node.localName).not.be.type('undefined');
		finish();
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlNodeAppendChild', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var parentNode = doc.createElement('parentNode');
		should(parentNode.appendChild).be.a.Function;
		var childNode = doc.createElement('childNode');
		should(function() {
			parentNode.appendChild(childNode);
		}).not.throw();
		should(parentNode.firstChild).eql(childNode);
		finish();
	});

	it('apiXmlNodeCloneNode', function(finish) {
		var shouldRun = true;
		if (utilities.isAndroid()) {
			// this check exists to deal with the bug mentioned in TIMOB-4771
			should(isNaN(parseInt(Ti.Platform.version))).be.false;
			if (parseInt(Ti.Platform.version) < 3) {
				Ti.API.info('Less than 3.0, not running apiXmlNodeCloneNode test');
				shouldRun = false;
			} else Ti.API.info('3.0 or greater, running apiXmlNodeCloneNode test');
		}
		if (shouldRun) {
			var doc = Ti.XML.parseString(testSource['nodes.xml']);
			var parentNode = doc.createElement('parent');
			parentNode.setAttribute('myattr', 'attr value');
			var childText = doc.createTextNode('child text');
			var childElement = doc.createElement('childelement');
			parentNode.appendChild(childText);
			parentNode.appendChild(childElement);
			should(parentNode.cloneNode).be.a.Function;
			var clonedNode = null;
			// Shallow
			should(function() {
				clonedNode = parentNode.cloneNode(false);
			}).not.throw();
			should(clonedNode.nodeName).eql(parentNode.nodeName);
			// Though shallow, attributes should be there.
			var attrs = clonedNode.attributes;
			should(attrs === null).be.eql(false);
			should(attrs.length).be.equal(1);
			var attr = attrs.getNamedItem('myattr');
			should(attr === null).be.eql(false);
			should(attr.nodeValue).be.equal('attr value');
			// Fetch a different way
			var attrValue = clonedNode.getAttribute('myattr');
			should(attrValue === null).be.eql(false);
			should(attrValue).be.equal('attr value');
			// Per spec, clone should have no parent and no children
			should(clonedNode.parentNode === null).eql(true);
			should(clonedNode.hasChildNodes()).be.Boolean;
			should(clonedNode.hasChildNodes()).be.false;
			// Deep
			should(function() {
				clonedNode = parentNode.cloneNode(true);
			}).not.throw();
			should(clonedNode.nodeName).eql(parentNode.nodeName);
			should(clonedNode.parentNode === null).eql(true);
			attrs = clonedNode.attributes;
			should(attrs === null).be.eql(false);
			should(attrs.length).be.equal(1);
			attr = attrs.getNamedItem('myattr');
			should(attr === null).be.eql(false);
			should(attr.nodeValue).be.equal('attr value');
			should(clonedNode.getAttribute('myattr')).eql('attr value');
			attrValue = clonedNode.getAttribute('myattr');
			should(attrValue === null).be.eql(false);
			should(attrValue).be.equal('attr value');
			// this one should have children since it's deep.
			should(clonedNode.hasChildNodes()).be.Boolean;
			should(clonedNode.hasChildNodes()).be.true;
			should(clonedNode.firstChild === null).be.eql(false);
			should(clonedNode.firstChild.nodeValue).eql(parentNode.firstChild.nodeValue);
			should(clonedNode.lastChild === null).be.eql(false);
			should(clonedNode.lastChild.nodeName).eql(parentNode.lastChild.nodeName);
		}
		finish();
	});

	it('apiXmlNodeHasAttributes', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var node = doc.createElement('node');
		var node2 = doc.createElement('node2');
		node2.setAttribute('attr1', 'value1');
		should(node.hasAttributes).be.a.Function;
		var results;
		should(function() {
			results = node.hasAttributes();
		}).not.throw();
		should(results).eql(false);
		should(function() {
			results = node2.hasAttributes();
		}).not.throw();
		should(results).eql(true);
		finish();
	});

	it('apiXmlNodeHasChildNodes', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var parentNode = doc.createElement('parentNode');
		var parentNode2 = doc.createElement('parentNode2');
		parentNode2.appendChild(doc.createElement('childNode'));
		should(parentNode.hasChildNodes).be.a.Function;
		var results;
		should(function() {
			results = parentNode.hasChildNodes();
		}).not.throw();
		should(results).eql(false);
		should(function() {
			results = parentNode2.hasChildNodes();
		}).not.throw();
		should(results).eql(true);
		finish();
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlNodeInsertBefore', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var parentNode = doc.createElement('parentNode');
		parentNode.appendChild(doc.createElement('childNode'));
		parentNode.appendChild(doc.createElement('childNode2'));
		should(parentNode.insertBefore).be.a.Function;
		var childNode3 = doc.createElement('childNode3');
		should(function() {
			parentNode.insertBefore(childNode3, parentNode.firstChild);
		}).not.throw();
		should(parentNode.firstChild).eql(childNode3);
		finish();
	});

	// FIXME: isSupported should not throw exception
	it.skip('apiXmlNodeIsSupported', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		should(doc.isSupported).be.a.Function;
		var results;
		should(function() {
			results = doc.isSupported('XML', '1.0');
		}).not.throw();
		should(results).eql(true);
		should(function() {
			results = doc.isSupported('IDONTEXIST', '1.0');
		}).not.throw();
		should(results).eql(false);
		finish();
	});

	it('apiXmlNodeNormalize', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var parentNode = doc.createElement('parentNode');
		parentNode.appendChild(doc.createTextNode('My '));
		parentNode.appendChild(doc.createTextNode('name '));
		parentNode.appendChild(doc.createTextNode('is '));
		parentNode.appendChild(doc.createTextNode('Opie.'));
		should(parentNode.normalize).be.a.Function;
		should(function() {
			parentNode.normalize();
		}).not.throw();
		should(parentNode.firstChild.data).eql('My name is Opie.');
		should(parentNode.firstChild.nodeValue).eql('My name is Opie.');
		should(parentNode.childNodes.length).eql(1);
		finish();
	});

	// FIXME Get working on Android, causes crash
	(utilities.isAndroid() ? it.skip : it)('apiXmlNodeRemoveChild', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var parentNode = doc.createElement('parentNode');
		var childNode = doc.createElement('childNode');
		parentNode.appendChild(childNode);
		should(parentNode.removeChild).be.a.Function;
		var results = null;
		should(function() {
			results = parentNode.removeChild(childNode);
		}).not.throw();
		should(results).eql(childNode);
		should(parentNode.hasChildNodes()).eql(false);
		finish();
	});

	// FIXME Get working on Android, fails
	(utilities.isAndroid() ? it.skip : it)('apiXmlNodeReplaceChild', function(finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var parentNode = doc.createElement('parentNode');
		var childNode = doc.createElement('childNode');
		var childNode2 = doc.createElement('childNode2');
		parentNode.appendChild(childNode);
		parentNode.appendChild(childNode2);
		should(parentNode.replaceChild).be.a.Function;
		var replacementNode = doc.createElement('replacementNode');
		should(function() {
			parentNode.replaceChild(replacementNode, childNode);
		}).not.throw();
		should(parentNode.firstChild).eql(replacementNode);
		finish();
	});

	it('xmlNodeListElementsByTagName', function(finish) {
		var xml = Ti.XML.parseString(testSource['nodes.xml']);
		should(xml === null).be.eql(false);
		var nodes = xml.getElementsByTagName('node');
		should(nodes === null).be.eql(false);
		should(nodes.length).be.a.Number;
		should(nodes.item).be.a.Function;
		should(nodes.length).eql(13);
		var n = nodes.item(0);
		should(n === null).be.eql(false);
		should(n.getAttribute('id')).eql('node 1');
		n = nodes.item(1);
		should(n === null).be.eql(false);
		should(n.getAttribute('id')).eql('node 2');
		finish();
	});

	it('xmlNodeListChildren', function(finish) {
		var xml = Ti.XML.parseString(testSource['nodes.xml']);
		should(xml === null).be.eql(false);
		var e = xml.documentElement;
		should(e === null).be.eql(false);
		var nodes = e.childNodes;
		should(nodes === null).be.eql(false);
		var count = 0;
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes.item(i);
			if (node.nodeType == node.ELEMENT_NODE) count++;
		}
		should(count).eql(1);
		finish();
	});

	it.skip('xmlNodeListRange', function(finish) {
		var xml = Ti.XML.parseString(testSource['nodes.xml']);
		should(xml === null).be.eql(false);
		var nodes = xml.getElementsByTagName('node');
		should(nodes.length).be.a.Number;
		// item should return null if that is not a valid index
		should(nodes.item(nodes.length) === null).eql(true);
		should(nodes.item(100) === null).eql(true);
		finish();
	});

	it.skip('apiXmlAttr', function (finish) {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var node = doc.getElementsByTagName('node').item(0);
		var attr;
		// First a known attribute
		should(function() {
			attr = node.attributes.item(0);
		}).not.throw();
		should(attr).not.be.type('undefined');
		should(attr === null).be.eql(false);
		should(attr).be.an.Object;
		should(attr.name).be.a.String;
		should(attr.name).eql('id');
		should(attr.ownerElement).be.an.Object;
		should(attr.ownerElement).eql(node);
		should(attr.specified).be.Boolean;
		should(attr.specified).be.true;
		should(attr.value).be.a.String;
		should(attr.value).eql('node 1');
		// Now new attribute
		should(function() {
			attr = doc.createAttribute('newattr');
		}).not.throw();
		should(attr).not.be.type('undefined');
		should(attr === null).be.eql(false);
		should(attr).be.an.Object;
		should(attr.name).be.a.String;
		should(attr.name).eql('newattr');
		should(attr.specified).be.Boolean;
		// Per spec, the default value in an attribute is empty string not null.
		should(attr.value === null).be.eql(false);
		should(attr.value).be.equal('');
		// Per spec, when you set an attribute that doesn't exist yet,
		// null is returned.
		var addedAttr = node.setAttributeNode(attr);
		should(addedAttr === null).eql(true);
		should(attr.ownerElement === null).be.eql(false);
		should(attr.ownerElement).eql(node);
		// Per spec, when you set a new attribute of same name as one that
		// already exists, it replaces that existing one AND returns that existing one.
		var secondNewAttr = doc.createAttribute('newattr');
		var replacedAttr = node.setAttributeNode(secondNewAttr);
		should(replacedAttr === null).be.eql(false);
		should(replacedAttr).eql(attr);
		// Per spec, changing the value of an attribute automatically sets
		// specified to true.
		attr.value = 'new value';
		should(attr.value === null).be.eql(false);
		should(attr.value).eql('new value');
		should(attr.specified).be.Boolean;
		should(attr.specified).be.true;
		// Per spec, an attribute with no owner element (i.e., it has just
		// been created and not yet put on to an element) will have
		// 'true' for specified.
		var thirdNewAttr = doc.createAttribute('anotherattr');
		should(thirdNewAttr === null).be.eql(false);
		should(thirdNewAttr.ownerElement === null).eql(true);
		should(thirdNewAttr.specified).be.Boolean;
		should(thirdNewAttr.specified).be.true;
		finish();
	});
});
