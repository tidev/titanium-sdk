/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.windowsBroken('Titanium.XML', function () {
	var testSource = {},
		invalidSource = {};

	// some common initialization specific to the xml suite
	function countNodes(node, type) {
		var nodeCount = 0,
			i,
			child;
		type = typeof type === 'undefined' ? null : type;
		for (i = 0; i < node.childNodes.length; i++) {
			child = node.childNodes.item(i);
			if (type == null || child.nodeType == type) { // eslint-disable-line
				nodeCount++;
				nodeCount += countNodes(child, type);
			}
		}
		return nodeCount;
	}

	before(function () {
		var i = 0,
			testFiles = [ 'soap.xml', 'xpath.xml', 'nodes.xml', 'nodeCount.xml', 'cdata.xml', 'cdataEntities.xml', 'with_dtd.xml', 'with_ns.xml', 'attrs.xml', 'element.xml', 'elementNS.xml' ],
			invalidFiles = [ 'mismatched_tag.xml', 'no_toplevel.xml', 'no_end.xml' ];

		// wipe last held contents to allow GC to clean up proxies?
		testSource = {};
		invalidSource = {};

		for (i = 0; i < testFiles.length; i++) {
			testSource[testFiles[i]] = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'xml', testFiles[i]).read().text;
		}
		for (i = 0; i < invalidFiles.length; i++) {
			invalidSource[invalidFiles[i]] = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'xml', invalidFiles[i]).read().text;
		}
	});

	after(function () {
		// wipe last held contents to allow GC to clean up proxies?
		testSource = {};
		invalidSource = {};
	});

	it('apiName', function () {
		should(Ti.XML).have.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.XML.apiName).be.eql('Ti.XML');
	});

	it('parseString', function () {
		should(Ti.XML.parseString).be.a.Function();
		should(function () {
			var xml = Ti.XML.parseString('<test>content</test>');
			should(xml).be.an.Object();
		}).not.throw();
	});

	it('serializeToString', function () {
		should(Ti.XML.serializeToString).be.a.Function();
		should(function () {
			var xml = Ti.XML.parseString('<test>content</test>'),
				str;
			should(xml).be.an.Object();
			str = Ti.XML.serializeToString(xml);
			should(str).be.a.String();
		}).not.throw();
	});

	// TIMOB-9071
	it('getOrCreateAttributeNS', function () {
		var xmlDoc = Ti.XML.parseString('<html><head></head><body><a href="http://appcelerator.com/" /></body></html>');
		var anchor = xmlDoc.getElementsByTagName('a').item(0);
		should(function () {
			anchor.getAttributeNS(null, 'href');
		}).not.throw();
		should(function () {
			xmlDoc.createAttributeNS(null, 'id');
		}).not.throw();
	});

	// TIMOB-8551
	// FIXME Get working on Android, fails
	it.androidBroken('ownerDocumentProperty', function () {
		var doc = Ti.XML.parseString('<?xml version="1.0"?><root><test>data</test></root>'),
			e1 = doc.firstChild,
			e2 = doc.createElement('test');
		if (e1.ownerDocument === e2.ownerDocument) {
			should(e2.ownerDocument === null).be.eql(false);
		}
	});

	// TIMOB-5112
	it('getElementsByTagName', function () {
		var xmlString = '<benny/>',
			doc = Ti.XML.parseString(xmlString);
		should(function () {
			doc.getElementsByTagName('mickey').item(0);
		}).not.throw();
	});

	// FIXME Get working on iOS - doesn't throw exception on parsing empty string
	// FIXME: new V8 changes have prevented exceptions from throwing?
	// iOS gives: expected [Function] to throw exception
	// Android gives: expected [Function] to throw exception
	it.androidAndIosBroken('documentParsing', function () {
		var localSources = testSource,
			localInvalid = invalidSource;
		// Parse valid documents
		should(function () {
			Ti.XML.parseString(localSources['soap.xml']);
		}).not.throw();
		should(function () {
			Ti.XML.parseString(localSources['xpath.xml']);
		}).not.throw();
		should(function () {
			Ti.XML.parseString(localSources['nodes.xml']);
		}).not.throw();
		should(function () {
			Ti.XML.parseString(localSources['nodeCount.xml']);
		}).not.throw();
		should(function () {
			Ti.XML.parseString(localSources['cdata.xml']);
		}).not.throw();
		should(function () {
			Ti.XML.parseString(localSources['cdataEntities.xml']);
		}).not.throw();
		// Parse empty document - spec specifies that a valid XML doc
		// must have a root element (empty string doesn't)
		should(function () {
			Ti.XML.parseString('');
		}).throw(); // iOS doesn't throw exception
		// Parse (some types of) invalid documents
		should(function () {
			Ti.XML.parseString(localInvalid['mismatched_tag.xml']);
		}).throw();
	});

	// FIXME: dom-parser.js doesn't throw exception when it 'corrects' end tag
	// iOS gives: expected [Function] to throw exception
	// Android gives: expected [Function] to throw exception
	// Windows Desktop gives: expected [Function] to throw exception, stderr gives: [WARN] :   unclosed xml attribute
	it.allBroken('invalidDocumentParsing', function () {
		var localInvalid = invalidSource;
		should(function () {
			Ti.XML.parseString(localInvalid['no_end.xml']);
		}).throw();
		should(function () {
			Ti.XML.parseString(localInvalid['no_toplevel.xml']);
		}).throw();
	});

	// These 6 tests are adapted from the KitchenSink xml_dom test
	it('soap', function () {
		var xml = Ti.XML.parseString(testSource['soap.xml']),
			fooBarList = xml.documentElement.getElementsByTagName('FooBar'),
			item;
		should(fooBarList === null).be.eql(false);
		should(fooBarList.length).eql(1);
		should(fooBarList.item(0)).be.an.Object();
		item = fooBarList.item(0);
		should(item.firstChild.data).eql('true');
		should(item.firstChild.nodeValue).eql('true');
		should(item.tagName).eql('FooBar');
	});

	// SKIP: because XPath is not a part of DOM level2 CORE
	// Windows faisl at call to xml.evaluate. This is not marked as part of our API for Ti.XML.Document!
	it.windowsMissing('xpath', function () {
		var xml = Ti.XML.parseString(testSource['xpath.xml']),
			fooBarList = xml.documentElement.getElementsByTagName('FooBar'),
			item,
			docResult,
			elResult;
		should(fooBarList === null).be.eql(false);
		should(fooBarList.length).eql(1);
		should(fooBarList.item(0)).be.an.Object();
		item = fooBarList.item(0);
		should(item.firstChild.data).eql('true');
		should(item.firstChild.nodeValue).eql('true');
		should(item.nodeName).eql('FooBar');
		// test XPath against Document
		docResult = xml.evaluate('//FooBar/text()');
		should(docResult === null).be.eql(false);
		should(docResult.length).eql(1);
		should(docResult.item(0).nodeValue).eql('true');
		// test XPath against Element
		elResult = xml.documentElement.evaluate('//FooBar/text()');
		should(elResult === null).be.eql(false);
		should(elResult.length).eql(1);
		should(elResult.item(0).nodeValue).eql('true');
		// test XPath against Element
		elResult = item.evaluate('text()');
		should(elResult === null).be.eql(false);
		should(elResult.length).eql(1);
		should(elResult.item(0).nodeValue).eql('true');
	});

	// FIXME Get working on iOS and Android - tagName is undefined, when expecting 'xml'
	it.androidAndIosBroken('xmlNodes', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			nodesList = doc.getElementsByTagName('nodes'),
			nodes,
			elements,
			children,
			firstChild,
			node,
			subnodes;
		should(nodesList === null).be.eql(false);
		should(nodesList.length).eql(1);
		nodes = nodesList.item(0);
		elements = nodes.getElementsByTagName('node');
		should(elements === null).be.eql(false);
		should(elements.length).eql(13);
		children = nodes.childNodes;
		should(children === null).be.eql(false);
		should(children).be.an.Object();
		should(countNodes(elements.item(0), 1)).eql(6);
		should(children.item).be.a.Function();
		firstChild = doc.firstChild;
		should(firstChild === null).be.eql(false);
		should(firstChild.tagName).be.eql('xml'); // iOS returns undefined, Android returns undefined
		should(countNodes(nodes, 1)).eql(13);
		should(nodes.nodeName).eql('nodes');
		should(doc.documentElement.nodeName).eql('response');
		should(nodes.getAttribute('id'));
		node = nodes.getElementsByTagName('node').item(0);
		should(node.getAttribute('id')).eql('node 1');
		subnodes = node.getElementsByTagName('node');
		should(subnodes.item(0).getAttribute('id')).eql('node 2');
	});

	it('xmlNodeCount', function () {
		var xml = Ti.XML.parseString(testSource['nodeCount.xml']),
			oneList = xml.documentElement.getElementsByTagName('one'),
			twoList = oneList.item(0).getElementsByTagName('two'),
			threeList = oneList.item(0).getElementsByTagName('three'),
			nodes = xml.getElementsByTagName('root'),
			one,
			next,
			nodeCount;
		should(oneList.length).eql(1);
		should(twoList.length).eql(2);
		should(threeList.length).eql(4);
		one = xml.documentElement.getElementsByTagName('one').item(0);
		next = one.nextSibling;
		for (;next != null && next.nodeType != next.ELEMENT_NODE;) { // eslint-disable-line eqeqeq, no-eq-null
			next = next.nextSibling;
		}
		should(one === null).be.eql(false);
		should(next === null).be.eql(false);
		should(one.nodeName).eql('one');
		should(xml.documentElement.attributes.getNamedItem('id').nodeValue).eql('here');
		should(next.getAttribute('id')).eql('bar');
		should(one.ownerDocument.documentElement.nodeName).eql(xml.documentElement.ownerDocument.documentElement.nodeName);
		nodeCount = countNodes(nodes.item(0), 1);
		should(nodeCount).eql(8);
	});

	// FIXME: some functions should throw exception on out-of-bounds error
	// iOS Gives: expected [Function] to throw exception
	// Windows Desktop Gives: expected [Function] to throw exception
	it.iosAndWindowsBroken('xmlCData', function () {
		var xml = Ti.XML.parseString(testSource['cdata.xml']),
			scriptList = xml.documentElement.getElementsByTagName('script'),
			nodeCount,
			script,
			i,
			node,
			cData,
			fullString,
			newline = Ti.Filesystem.lineEnding,
			functionBody = newline + 'function matchwo(a,b)' + newline + '{' + newline + 'if (a < b && a < 0) then' + newline + '  {' + newline + '  return 1;' + newline + '  }' + newline + 'else' + newline + '  {' + newline + '  return 0;' + newline + '  }' + newline + '}' + newline,
			fullLength,
			substring1,
			substring2 = null,
			cDataLength,
			substring6,
			substring7,
			substring8;
		should(scriptList.length).eql(1);
		should(xml.documentElement.nodeName).eql('root');
		nodeCount = countNodes(xml.documentElement, 1);
		should(nodeCount).eql(1);
		script = scriptList.item(0);
		for (i = 0; i < script.childNodes.length; i++) {
			node = script.childNodes.item(i);
			if (node.nodeType == node.CDATA_SECTION_NODE) { // eslint-disable-line eqeqeq
				cData = node;
				break;
			}
		}
		should(cData === null).be.eql(false);
		// CharacterDataAttributes
		fullString = cData.data;

		should(fullString).eql(functionBody);
		cData.data = 'Test Assignment';
		should(cData.data).eql('Test Assignment');
		cData.data = fullString;
		fullLength = cData.length;
		should(fullLength).eql(fullString.length);
		// CharacterData.substringData
		substring1 = cData.substringData(1, 8);
		should(substring1).eql(fullString.substr(1, 8));
		// asking for more than there is should not throw exception
		// according to spec, rather just return up to end.
		substring2 = null;
		should(function () {
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
		should(function () {
			cData.substringData(1e3, 1001);
		}).throw(); // Windows Desktop doesn't throw here
		should(function () {
			cData.substringData(-1, 101);
		}).throw();
		should(function () {
			cData.substringData(0, -1);
		}).throw();
		// CharacterData.appendData
		cDataLength = cData.length;
		cData.appendData('Appending');
		substring6 = cData.substringData(97, 9);
		should(cData.length).eql(cDataLength + 9);
		should(substring6).eql('Appending');
		should(function () {
			script.appendData('ReadOnly');
		}).throw();
		// CharacterData.insertData
		cData.insertData(9, 'InsertData');
		substring7 = cData.substringData(9, 10);
		should(substring7).eql('InsertData');
		// Per spec insertData should throw exception if given params are out of range
		should(function () {
			cData.insertData(-1, 'InsertFail');
		}).throw();
		should(function () {
			cData.insertData(1e3, 'InsertFail');
		}).throw();
		should(function () {
			script.insertData(1, 'ReadOnly');
		}).throw();
		// CharacterData.replaceData
		cData.replaceData(9, 1, 'ReplaceData');
		substring8 = cData.substringData(9, 20);
		should(substring8).eql('ReplaceDatansertData');
		cDataLength = cData.length;
		cData.replaceData(cDataLength, 100, 'ReplaceData');
		should(cData.length).eql(cDataLength + 11);
		should(function () {
			cData.replaceDate(-1, 2, 'Failure');
		}).throw();
		cDataLength = cData.length;
		should(function () {
			cData.replaceDate(cDataLength + 1, 2, 'Failure');
		}).throw();
		should(function () {
			cData.replaceDate(1, -1, 'Failure');
		}).throw();
		// CharacterData.deleteData
		cDataLength = cData.length;
		cData.deleteData(1, 8);
		should(cData.length).eql(cDataLength - 8);
		should(function () {
			cData.deleteData(-1, 10);
		}).throw();
		should(function () {
			cData.deleteData(1e3, 1001);
		}).throw();
		should(function () {
			cData.deleteData(0, -1);
		}).throw();
		cData.deleteData(1, 1e3);
		should(cData.length).eql(1);
		should(function () {
			script.deleteData(0, 1);
		}).throw();
	});

	it('xmlCDataAndEntities', function () {
		var xml = Ti.XML.parseString(testSource['cdataEntities.xml']),
			subdataList = xml.documentElement.getElementsByTagName('subdata'),
			nodeCount;
		should(xml.documentElement.firstChild.nodeName).eql('subdata');
		nodeCount = countNodes(subdataList.item(0), 1);
		should(nodeCount).eql(2);
	});

	it('xmlSerialize', function () {
		var sourceName,
			a,
			bstr,
			b;
		// Return an array of attribute nodes, sorted by name.
		// An attribute NamedNodeMap has no canonical ordering,
		// so to do a comparison we need to ensure we've got the
		// same order between both.
		function sortAttributeList(attribs) {
			var names = [],
				map = {},
				i,
				a,
				list = [];
			for (i = 0; attribs > i; i++) {
				a = attribs.item(i);
				map[a.nodeName] = a;
				names.push(a.nodeName);
			}
			names = names.sort();
			list = [];
			for (i = 0; i < names.length; i++) {
				list.push(map[names[i]]);
			}
			return list;
		}
		function matchXmlTrees(a, b) {
			var aAttribs,
				bAttribs,
				i,
				aChildren,
				bChildren;
			should(a.nodeType).eql(b.nodeType);
			should(a.nodeName).eql(b.nodeName);
			should(a.nodeValue).eql(b.nodeValue);
			if (a.nodeType == 1) { // eslint-disable-line eqeqeq
				aAttribs = sortAttributeList(a.attributes);
				bAttribs = sortAttributeList(b.attributes);
				should(aAttribs.length).eql(bAttribs.length);
				for (i = 0; i < aAttribs.length; i++) {
					matchXmlTrees(aAttribs[i], bAttribs[i]);
				}
				aChildren = a.childNodes;
				bChildren = b.childNodes;
				should(aChildren.length).eql(bChildren.length);
				for (i = 0; i < aChildren.length; i++) {
					matchXmlTrees(aChildren.item(i), bChildren.item(i));
				}
			}
		}
		for (sourceName in testSource) {
			a = Ti.XML.parseString(testSource[sourceName]);
			bstr = Ti.XML.serializeToString(a);
			b = Ti.XML.parseString(bstr);
			// Make sure we can round-trip from source to DOM to source and back to DOM...
			matchXmlTrees(a, b);
		}
	});

	// FIXME: splitText function should throw exception on out-of-bounds error
	// Windows gives: expected [Function] to throw exception
	it.windowsBroken('apiXMLTextSplitText', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			firstString = 'first part|',
			secondString = 'second part',
			completeString = firstString + secondString,
			parentNode,
			childNode,
			splitTextResults;
		should(doc.createTextNode).be.a.Function();
		parentNode = doc.createElement('parentNode');
		childNode = doc.createTextNode(completeString);
		parentNode.appendChild(childNode);
		should(parentNode.childNodes.length).eql(1);
		should(function () {
			splitTextResults = parentNode.firstChild.splitText(firstString.length);
		}).not.throw();
		should(parentNode.childNodes.length).eql(2);
		should(splitTextResults.nodeValue).eql(parentNode.lastChild.nodeValue);
		should(firstString).eql(parentNode.firstChild.nodeValue);
		should(secondString).eql(parentNode.lastChild.nodeValue);
		// Out-of-bounds exceptions are in the spec:
		completeString = 'New text node';
		childNode = doc.createTextNode(completeString);
		should(function () {
			childNode.splitText(-1);
		}).throw();
		should(function () {
			childNode.splitText(completeString.length + 1);
		}).throw();
	});

	// SKIP: textContent is not a part of DOM level2 CORE
	// Android gives: expected [Function] not to throw exception (got [TypeError: textNode.getText is not a function])
	// Windows gives: expected [Function] not to throw exception (got [TypeError: textNode.getText is not a function. (In 'textNode.getText()', 'textNode.getText' is undefined)])
	// I don't see getText() in the API docs
	it.androidAndWindowsMissing('apiXMLTextGetText', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			textValue = 'this is some test',
			textNode,
			getTextResults = null,
			getTextResults2;
		should(doc.createTextNode).be.a.Function();
		textNode = doc.createTextNode(textValue);
		should(textNode.nodeValue).eql(textValue);
		should(function () {
			getTextResults = textNode.getText();
		}).not.throw();
		should(getTextResults).eql(textValue);
		should(function () {
			getTextResults = textNode.getTextContent();
		}).not.throw();
		should(getTextResults).eql(textValue);
		should(function () {
			getTextResults2 = textNode.text;
		}).not.throw();
		should(getTextResults2).eql(textValue);
		should(function () {
			getTextResults2 = textNode.textContent;
		}).not.throw();
		should(getTextResults2).eql(textValue);
	});

	// FIXME: doctype support
	// Android gives: expected true to equal false
	// Windows gives: expected true to equal false
	it.androidAndWindowsBroken('apiXmlDocumentProperties', function () {
		// File with DTD
		var doc = Ti.XML.parseString(testSource['with_dtd.xml']);
		should(doc.documentElement).not.be.type('undefined');
		should(doc.documentElement === null).be.eql(false);
		should(doc.documentElement).be.an.Object();
		should(doc.documentElement.nodeName).eql('letter');
		should(doc.implementation).not.be.type('undefined');
		should(doc.implementation === null).be.eql(false);
		should(doc.implementation).be.an.Object();
		should(doc.doctype).not.be.type('undefined');
		should(doc.doctype === null).be.eql(false); // Windows: expected true to equal false
		should(doc.doctype).be.an.Object();
		// Document without DTD, to be sure doc.doctype is null as spec says
		doc = Ti.XML.parseString('<a/>');
		should(doc.doctype === null).eql(true);
	});

	// FIXME: value property should return empty string according to spec
	// Don't know why Android fails!
	// Windows gives: expected true to equal false
	it.androidAndWindowsBroken('apiXmlDocumentCreateAttribute', function () {
		var doc = Ti.XML.parseString('<test/>'),
			attr;
		should(doc.createAttribute).be.a.Function();
		attr = doc.createAttribute('myattr');
		should(attr === null).be.eql(false);
		should(attr).be.an.Object();
		should(attr.name).eql('myattr');
		// Per spec, value in new attribute should be empty string
		should(attr.value === null).be.eql(false);
		should(attr.value === undefined).be.eql(false); // Windows: expected true to equal false
		should(attr.value).be.equal('');
		should(attr.ownerDocument).eql(doc);
		attr = null;
		should(doc.createAttributeNS).be.a.Function();
		attr = doc.createAttributeNS('http://example.com', 'prefix:myattr');
		should(attr === null).be.eql(false);
		should(attr).be.an.Object();
		should(attr.name).eql('prefix:myattr');
		should(attr.namespaceURI).eql('http://example.com');
		should(attr.prefix).eql('prefix');
		should(attr.value === null).be.eql(false);
		should(attr.value === undefined).be.eql(false);
		should(attr.value).be.equal('');
		should(attr.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	it.androidBroken('apiXmlDocumentCreateCDATASection', function () {
		var doc = Ti.XML.parseString('<test/>'),
			data = 'This is my CDATA section',
			section;
		should(doc.createCDATASection).be.a.Function();
		section = doc.createCDATASection(data);
		should(section === null).be.eql(false);
		should(section).be.an.Object();
		should(section.data).eql(data);
		should(section.nodeValue).eql(data);
		should(section.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	it.androidBroken('apiXmlDocumentCreateComment', function () {
		var doc = Ti.XML.parseString('<test/>'),
			data = 'This is my comment',
			comment;
		should(doc.createComment).be.a.Function();
		comment = doc.createComment(data);
		should(comment === null).be.eql(false);
		should(comment).be.an.Object();
		should(comment.data).eql(data);
		should(comment.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	it.androidBroken('apiXmlDocumentCreateDocumentFragment', function () {
		var doc = Ti.XML.parseString('<test/>'),
			frag;
		should(doc.createDocumentFragment).be.a.Function();
		frag = doc.createDocumentFragment();
		should(frag === null).be.eql(false);
		should(frag).be.an.Object();
		should(frag.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	it.androidBroken('apiXmlDocumentCreateElement', function () {
		var doc = Ti.XML.parseString('<test/>'),
			elem;
		should(doc.createElement).be.a.Function();
		elem = doc.createElement('myelement');
		should(elem === null).be.eql(false);
		should(elem).be.an.Object();
		should(elem.nodeName).eql('myelement');
		should(elem.localName === null).eql(true);
		should(elem.prefix === null).eql(true);
		should(elem.namespaceURI === null).eql(true);
		should(elem.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	it.androidBroken('apiXmlDocumentCreateElementNS', function () {
		var doc = Ti.XML.parseString('<test/>'),
			elem;
		should(doc.createElementNS).be.a.Function();
		elem = doc.createElementNS('http://example.com', 'prefix:myelement');
		should(elem === null).be.eql(false);
		should(elem).be.an.Object();
		should(elem.nodeName).eql('prefix:myelement');
		should(elem.localName).eql('myelement');
		should(elem.prefix).eql('prefix');
		should(elem.namespaceURI).eql('http://example.com');
		should(elem.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	it.androidBroken('apiXmlDocumentCreateEntityReference', function () {
		var doc = Ti.XML.parseString('<test/>'),
			entity;
		should(doc.createEntityReference).be.a.Function();
		entity = doc.createEntityReference('myentity');
		should(entity === null).be.eql(false);
		should(entity).be.an.Object();
		should(entity.nodeName).eql('myentity');
		should(entity.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	it.androidBroken('apiXmlDocumentCreateProcessingInstruction', function () {
		var doc = Ti.XML.parseString('<test/>'),
			instruction;
		should(doc.createProcessingInstruction).be.a.Function();
		instruction = doc.createProcessingInstruction('a', 'b');
		should(instruction === null).be.eql(false);
		should(instruction).be.an.Object();
		should(instruction.target).eql('a');
		should(instruction.data).eql('b');
		should(instruction.ownerDocument).eql(doc);
	});

	// FIXME Get working on Android, fails
	it.androidBroken('apiXmlDocumentCreateTextNode', function () {
		var doc = Ti.XML.parseString('<test/>'),
			value = 'This is some text',
			text;
		should(doc.createTextNode).be.a.Function();
		text = doc.createTextNode(value);
		should(text === null).be.eql(false);
		should(text).be.an.Object();
		should(text.data).eql(value);
		should(text.ownerDocument).eql(doc);
	});

	it('apiXmlDocumentGetElementById', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			node;
		should(doc.getElementById).be.a.Function();
		node = doc.getElementById('node 1');
		should(node === null).be.eql(false);
		should(node).be.an.Object();
		should(node.nodeName).eql('node');
		should(function () {
			node = doc.getElementById('no_such_element');
		}).not.throw();
		should(node === null).eql(true);
	});

	it('apiXmlDocumentGetElementsByTagName', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			elements,
			i,
			checkelem;
		should(doc.getElementsByTagName).be.a.Function();
		elements = doc.getElementsByTagName('node');
		should(elements === null).be.eql(false);
		should(elements).be.an.Object();
		should(elements.length).be.greaterThan(0);
		for (i = 0; i < elements.length; i++) {
			checkelem = elements.item(i);
			should(checkelem.nodeName).eql('node');
		}
		// test bogus tagname
		should(function () {
			elements = doc.getElementsByTagName('bogus');
		}).not.throw();
		should(elements === null).be.eql(false);
		should(elements).be.an.Object();
		should(elements.length).be.equal(0);
	});

	it.windowsDesktopBroken('apiXmlDocumentGetElementsByTagNameNS', function () {
		var doc = Ti.XML.parseString(testSource['with_ns.xml']),
			elements,
			i,
			checkelem;
		should(doc.getElementsByTagNameNS).be.a.Function();
		elements = doc.getElementsByTagNameNS('http://example.com', 'cake');
		should(elements === null).be.eql(false);
		should(elements).be.an.Object();
		should(elements.length).be.greaterThan(0);
		for (i = 0; i < elements.length; i++) {
			checkelem = elements.item(i);
			should(checkelem.localName).eql('cake');
			should(checkelem.namespaceURI).eql('http://example.com');
		}
		// test real namespace and bogus tagname
		should(function () {
			elements = doc.getElementsByTagNameNS('http://example.com', 'bogus');
		}).not.throw();
		should(elements === null).be.eql(false);
		should(elements).be.an.Object();
		should(elements.length).be.equal(0);
		// test bogus namespace and real tagname
		should(function () {
			elements = doc.getElementsByTagNameNS('http://bogus.com', 'pie');
		}).not.throw();
		should(elements === null).be.eql(false);
		should(elements).be.an.Object();
		should(elements.length).be.equal(0);
		// test bogus namespace and bogus tagname
		should(function () {
			elements = doc.getElementsByTagNameNS('http://bogus.com', 'bogus');
		}).not.throw();
		should(elements === null).be.eql(false);
		should(elements).be.an.Object();
		should(elements.length).be.equal(0);
	});

	// FIXME Get working on Android, fails
	it.androidAndWindowsBroken('apiXmlDocumentImportNode', function () {
		var doc = Ti.XML.parseString('<a/>'),
			otherDoc = Ti.XML.parseString(testSource['with_ns.xml']),
			cakeNodes = otherDoc.documentElement.getElementsByTagNameNS('http://example.com', 'cake'),
			cakeNode,
			importedNode;
		should(cakeNodes === null).be.eql(false);
		should(cakeNodes.length).be.greaterThan(0);
		cakeNode = cakeNodes.item(0);
		should(cakeNode === null).be.eql(false);
		should(doc.importNode).be.a.Function();
		// test deep import
		should(function () {
			importedNode = doc.importNode(cakeNode, true);
		}).not.throw();
		should(importedNode.ownerDocument === null).be.eql(false);
		should(importedNode.ownerDocument).be.an.Object();
		should(importedNode.ownerDocument).eql(doc);
		should(importedNode.parentNode === null).eql(true);
		should(importedNode.hasChildNodes()).be.true();
		should(importedNode.childNodes.length).be.greaterThan(0);
		should(importedNode.namespaceURI).eql('http://example.com');
		// test shallow import
		should(function () {
			importedNode = doc.importNode(cakeNode, false);
		}).not.throw();
		should(importedNode.hasChildNodes()).be.false();
		should(importedNode.ownerDocument === null).be.eql(false);
		should(importedNode.ownerDocument).be.an.Object();
		should(importedNode.ownerDocument).eql(doc);
		should(importedNode.parentNode === null).eql(true);
	});

	// FIXME: some properties should be null if it is unspecified
	// Windows: expected undefined not to have type undefined
	it.androidAndWindowsBroken('apiXmlNodeProperties', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			nodesList = doc.getElementsByTagName('nodes'),
			node,
			attrName = 'attr',
			attrValue = 'value',
			attrNode,
			CDATANodeContents = 'this CDATA contents',
			CDATANode,
			commentNodeContents = 'this is a comment',
			commentNode,
			processingInstructionData = 'data',
			textNodeContents = 'this is some text',
			textNode;
		should(nodesList === null).be.eql(false);
		should(nodesList.length).eql(1);
		node = nodesList.item(0);
		// verify properties
		should(node.ELEMENT_NODE).be.a.Number();
		should(node.ATTRIBUTE_NODE).be.a.Number();
		should(node.TEXT_NODE).be.a.Number();
		should(node.CDATA_SECTION_NODE).be.a.Number();
		should(node.ENTITY_REFERENCE_NODE).be.a.Number();
		should(node.ENTITY_NODE).be.a.Number();
		should(node.PROCESSING_INSTRUCTION_NODE).be.a.Number();
		should(node.COMMENT_NODE).be.a.Number();
		should(node.DOCUMENT_NODE).be.a.Number();
		should(node.DOCUMENT_TYPE_NODE).be.a.Number();
		should(node.DOCUMENT_FRAGMENT_NODE).be.a.Number();
		should(node.NOTATION_NODE).be.a.Number();
		should(node.nodeName).be.a.String();

		// attribute node
		node.setAttribute(attrName, attrValue);
		attrNode = node.getAttributeNode(attrName);
		should(attrNode.nodeValue).eql(attrValue);

		// CDATA Node
		CDATANode = doc.createCDATASection(CDATANodeContents);
		should(CDATANode.nodeValue).eql(CDATANodeContents);

		// Comment node
		commentNode = doc.createComment(commentNodeContents);
		should(commentNode.nodeValue).eql(commentNodeContents);
		should(doc.nodeValue).eql(null);
		should(doc.createDocumentFragment().nodeValue).eql(null);
		should(doc.doctype).be.an.Object();
		should(node.nodeValue).eql(null);
		should(doc.createEntityReference('blah').nodeValue).eql(null);

		// processing instruction
		should(doc.createProcessingInstruction('target', processingInstructionData).nodeValue).eql(processingInstructionData);

		// text node
		textNode = doc.createTextNode(textNodeContents);
		should(textNode.nodeValue).eql(textNodeContents);
		should(node.nodeType).be.a.Number();
		should(node.parentNode).be.an.Object();
		should(node.childNodes).be.an.Object();
		should(node.firstChild).be.an.Object();
		should(node.lastChild).be.an.Object();
		should(node.previousSibling).be.an.Object();
		should(node.nextSibling).be.an.Object();
		should(node.attributes).be.an.Object();
		should(node.ownerDocument).be.an.Object();
		// Per spec, namespaceURI should be null if it is unspecified
		should(node.namespaceURI).not.be.type('undefined'); // Windows: expected undefined not to have type undefined
		// Per spec, prefix should be null if it is unspecified
		should(node.prefix).not.be.type('undefined');
		should(node.localName).not.be.type('undefined');
	});

	// FIXME Get working on Android, fails
	it.androidAndWindowsDesktopBroken('apiXmlNodeAppendChild', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			parentNode = doc.createElement('parentNode'),
			childNode;
		should(parentNode.appendChild).be.a.Function();
		childNode = doc.createElement('childNode');
		should(function () {
			parentNode.appendChild(childNode);
		}).not.throw();
		should(parentNode.firstChild).eql(childNode);
	});

	it.windowsDesktopBroken('apiXmlNodeCloneNode', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			parentNode = doc.createElement('parent'),
			childText,
			childElement,
			clonedNode = null,
			attrs,
			attr,
			attrValue;
		parentNode.setAttribute('myattr', 'attr value');

		childText = doc.createTextNode('child text');
		childElement = doc.createElement('childelement');
		parentNode.appendChild(childText);
		parentNode.appendChild(childElement);

		should(parentNode.cloneNode).be.a.Function();
		clonedNode = null;
		// Shallow
		should(function () {
			clonedNode = parentNode.cloneNode(false);
		}).not.throw();
		should(clonedNode.nodeName).eql(parentNode.nodeName);
		// Though shallow, attributes should be there.
		attrs = clonedNode.attributes;
		should(attrs === null).be.eql(false);
		should(attrs.length).be.equal(1);
		attr = attrs.getNamedItem('myattr');
		should(attr === null).be.eql(false);
		should(attr.nodeValue).be.equal('attr value');
		// Fetch a different way
		attrValue = clonedNode.getAttribute('myattr');
		should(attrValue === null).be.eql(false);
		should(attrValue).be.equal('attr value');
		// Per spec, clone should have no parent and no children
		should(clonedNode.parentNode === null).eql(true);
		should(clonedNode.hasChildNodes()).be.a.Boolean();
		should(clonedNode.hasChildNodes()).be.false();
		// Deep
		should(function () {
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
		should(clonedNode.hasChildNodes()).be.a.Boolean();
		should(clonedNode.hasChildNodes()).be.true();
		should(clonedNode.firstChild === null).be.eql(false);
		should(clonedNode.firstChild.nodeValue).eql(parentNode.firstChild.nodeValue);
		should(clonedNode.lastChild === null).be.eql(false);
		should(clonedNode.lastChild.nodeName).eql(parentNode.lastChild.nodeName);
	});

	it('apiXmlNodeHasAttributes', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			node = doc.createElement('node'),
			node2 = doc.createElement('node2'),
			results;
		node2.setAttribute('attr1', 'value1');
		should(node.hasAttributes).be.a.Function();

		should(function () {
			results = node.hasAttributes();
		}).not.throw();
		should(results).eql(false);
		should(function () {
			results = node2.hasAttributes();
		}).not.throw();
		should(results).eql(true);
	});

	it.windowsDesktopBroken('apiXmlNodeHasChildNodes', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			parentNode = doc.createElement('parentNode'),
			parentNode2 = doc.createElement('parentNode2'),
			results;
		parentNode2.appendChild(doc.createElement('childNode'));
		should(parentNode.hasChildNodes).be.a.Function();

		should(function () {
			results = parentNode.hasChildNodes();
		}).not.throw();
		should(results).eql(false);
		should(function () {
			results = parentNode2.hasChildNodes();
		}).not.throw();
		should(results).eql(true);
	});

	// FIXME Get working on Android, fails
	it.androidBroken('apiXmlNodeInsertBefore', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			parentNode = doc.createElement('parentNode'),
			childNode3;
		parentNode.appendChild(doc.createElement('childNode'));
		parentNode.appendChild(doc.createElement('childNode2'));
		should(parentNode.insertBefore).be.a.Function();
		childNode3 = doc.createElement('childNode3');
		should(function () {
			parentNode.insertBefore(childNode3, parentNode.firstChild);
		}).not.throw();
		should(parentNode.firstChild).eql(childNode3);
	});

	// FIXME: isSupported should not throw exception
	it.windowsBroken('apiXmlNodeIsSupported', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			results;
		should(doc.isSupported).be.a.Function();

		should(function () {
			results = doc.isSupported('XML', '1.0');
		}).not.throw(); // Windows: expected [Function] not to throw exception (got [TypeError: null is not an object (evaluating 'this.ownerDocument.implementation')])
		should(results).eql(true);
		should(function () {
			results = doc.isSupported('IDONTEXIST', '1.0');
		}).not.throw();
		should(results).eql(false);
	});

	// TODO: "normalize()" is not available for Ti.XML.Node on iOS
	it.iosMissing('apiXmlNodeNormalize', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']);
		var parentNode = doc.createElement('parentNode');
		parentNode.appendChild(doc.createTextNode('My '));
		parentNode.appendChild(doc.createTextNode('name '));
		parentNode.appendChild(doc.createTextNode('is '));
		parentNode.appendChild(doc.createTextNode('Opie.'));
		should(parentNode.normalize).be.a.Function();
		should(function () {
			parentNode.normalize();
		}).not.throw();
		should(parentNode.firstChild.data).eql('My name is Opie.');
		should(parentNode.firstChild.nodeValue).eql('My name is Opie.');
		should(parentNode.childNodes.length).eql(1);
	});

	// FIXME Get working on Android, causes crash
	it.androidBroken('apiXmlNodeRemoveChild', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			parentNode = doc.createElement('parentNode'),
			childNode = doc.createElement('childNode'),
			results = null;
		parentNode.appendChild(childNode);
		should(parentNode.removeChild).be.a.Function();
		should(function () {
			results = parentNode.removeChild(childNode);
		}).not.throw();
		should(results).eql(childNode);
		should(parentNode.hasChildNodes()).eql(false);
	});

	// FIXME Get working on Android, fails
	it.androidBroken('apiXmlNodeReplaceChild', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			parentNode = doc.createElement('parentNode'),
			childNode = doc.createElement('childNode'),
			childNode2 = doc.createElement('childNode2'),
			replacementNode;
		parentNode.appendChild(childNode);
		parentNode.appendChild(childNode2);
		should(parentNode.replaceChild).be.a.Function();
		replacementNode = doc.createElement('replacementNode');
		should(function () {
			parentNode.replaceChild(replacementNode, childNode);
		}).not.throw();
		should(parentNode.firstChild).eql(replacementNode);
	});

	it('xmlNodeListElementsByTagName', function () {
		var xml = Ti.XML.parseString(testSource['nodes.xml']),
			nodes,
			n;
		should(xml === null).be.eql(false);
		nodes = xml.getElementsByTagName('node');
		should(nodes === null).be.eql(false);
		should(nodes.length).be.a.Number();
		should(nodes.item).be.a.Function();
		should(nodes.length).eql(13);
		n = nodes.item(0);
		should(n === null).be.eql(false);
		should(n.getAttribute('id')).eql('node 1');
		n = nodes.item(1);
		should(n === null).be.eql(false);
		should(n.getAttribute('id')).eql('node 2');
	});

	it('xmlNodeListChildren', function () {
		var xml = Ti.XML.parseString(testSource['nodes.xml']),
			e,
			nodes,
			count = 0,
			i,
			node;
		should(xml === null).be.eql(false);
		e = xml.documentElement;
		should(e === null).be.eql(false);
		nodes = e.childNodes;
		should(nodes === null).be.eql(false);

		for (i = 0; i < nodes.length; i++) {
			node = nodes.item(i);
			if (node.nodeType == node.ELEMENT_NODE) { // eslint-disable-line eqeqeq
				count++;
			}
		}
		should(count).eql(1);
	});

	it.windowsBroken('xmlNodeListRange', function () {
		var xml = Ti.XML.parseString(testSource['nodes.xml']),
			nodes;
		should(xml === null).be.eql(false);
		nodes = xml.getElementsByTagName('node');
		should(nodes.length).be.a.Number();
		// item should return null if that is not a valid index
		should(nodes.item(nodes.length) === null).eql(true); // Windows: expected false to equal true
		should(nodes.item(100) === null).eql(true);
	});

	// Don't know why Android fails!
	// Windows gives: expected undefined to be ''
	it.androidAndWindowsBroken('apiXmlAttr', function () {
		var doc = Ti.XML.parseString(testSource['nodes.xml']),
			node = doc.getElementsByTagName('node').item(0),
			attr,
			addedAttr,
			secondNewAttr,
			replacedAttr,
			thirdNewAttr;
		// First a known attribute
		should(function () {
			attr = node.attributes.item(0);
		}).not.throw();
		should(attr).not.be.type('undefined');
		should(attr === null).be.eql(false);
		should(attr).be.an.Object();
		should(attr.name).be.a.String();
		should(attr.name).eql('id');
		should(attr.ownerElement).be.an.Object();
		should(attr.ownerElement).eql(node);
		should(attr.specified).be.a.Boolean();
		should(attr.specified).be.true();
		should(attr.value).be.a.String();
		should(attr.value).eql('node 1');
		// Now new attribute
		should(function () {
			attr = doc.createAttribute('newattr');
		}).not.throw();
		should(attr).not.be.type('undefined');
		should(attr === null).be.eql(false);
		should(attr).be.an.Object();
		should(attr.name).be.a.String();
		should(attr.name).eql('newattr');
		should(attr.specified).be.a.Boolean();
		// Per spec, the default value in an attribute is empty string not null.
		should(attr.value === null).be.eql(false);
		should(attr.value).be.equal(''); // Windows gives: expected undefined to be ''
		// Per spec, when you set an attribute that doesn't exist yet,
		// null is returned.
		addedAttr = node.setAttributeNode(attr);
		should(addedAttr === null).eql(true);
		should(attr.ownerElement === null).be.eql(false);
		should(attr.ownerElement).eql(node);
		// Per spec, when you set a new attribute of same name as one that
		// already exists, it replaces that existing one AND returns that existing one.
		secondNewAttr = doc.createAttribute('newattr');
		replacedAttr = node.setAttributeNode(secondNewAttr);
		should(replacedAttr === null).be.eql(false);
		should(replacedAttr).eql(attr);
		// Per spec, changing the value of an attribute automatically sets
		// specified to true.
		attr.value = 'new value';
		should(attr.value === null).be.eql(false);
		should(attr.value).eql('new value');
		should(attr.specified).be.a.Boolean();
		should(attr.specified).be.true();
		// Per spec, an attribute with no owner element (i.e., it has just
		// been created and not yet put on to an element) will have
		// 'true' for specified.
		thirdNewAttr = doc.createAttribute('anotherattr');
		should(thirdNewAttr === null).be.eql(false);
		should(thirdNewAttr.ownerElement === null).eql(true);
		should(thirdNewAttr.specified).be.a.Boolean();
		should(thirdNewAttr.specified).be.true();
	});

	it.ios('parseString (invalid xml)', function () {
		should(Ti.XML.parseString).be.a.Function();
		should(function () {
			Ti.XML.parseString('invalid XML');
		}).throw();
	});
});
