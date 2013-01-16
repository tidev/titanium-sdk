/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
 
module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "xml";
	this.tests = [
		{name: "documentParsing"},
		{name: "soap"},
		{name: "xpath"},
		{name: "xmlNodes"},
		{name: "xmlNodeCount"},
		{name: "xmlCData"},
		{name: "xmlCDataAndEntities"},
		{name: "xmlSerialize"},
		{name: "apiXMLTextSplitText"},
		{name: "apiXMLTextGetText"},
		{name: "apiXmlDocumentProperties"},
		{name: "apiXmlDocumentCreateAttribute"},
		{name: "apiXmlDocumentCreateCDATASection"},
		{name: "apiXmlDocumentCreateComment"},
		{name: "apiXmlDocumentCreateDocumentFragment"},
		{name: "apiXmlDocumentCreateElement"},
		{name: "apiXmlDocumentCreateElementNS"},
		{name: "apiXmlDocumentCreateEntityReference"},
		{name: "apiXmlDocumentCreateProcessingInstruction"},
		{name: "apiXmlDocumentCreateTextNode"},
		{name: "apiXmlDocumentGetElementById"},
		{name: "apiXmlDocumentGetElementsByTagName"},
		{name: "apiXmlDocumentGetElementsByTagNameNS"},
		{name: "apiXmlDocumentImportNode"},
		{name: "apiXmlNodeProperties"},
		{name: "apiXmlNodeAppendChild"},
		{name: "apiXmlNodeCloneNode"},
		{name: "apiXmlNodeHasAttributes"},
		{name: "apiXmlNodeHasChildNodes"},
		{name: "apiXmlNodeInsertBefore"},
		{name: "apiXmlNodeIsSupported"},
		{name: "apiXmlNodeNormalize"},
		{name: "apiXmlNodeRemoveChild"},
		{name: "apiXmlNodeReplaceChild"},
		{name: "xmlNodeListElementsByTagName"},
		{name: "xmlNodeListChildren"},
		{name: "xmlNodeListRange"},
		{name: "apiXmlAttr"},
		{name: "xmlNamedNodeMap"},
		{name: "apiXmlDOMImplementation"},
		{name: "xmlElement"},	
		{name: "xmlElementNS"}
	];

	// some common initialization specific to the xml suite
	function countNodes(node, type) {
		var nodeCount = 0;
		type = typeof(type) == 'undefined' ? null : type;
			
		for (var i = 0; i < node.childNodes.length; i++) {
			var child = node.childNodes.item(i);
			if (type == null || child.nodeType == type) {
				nodeCount++;
				nodeCount += countNodes(child, type);
			}
		}

		return nodeCount;
	}

	var testSource = {};
	var invalidSource = {};
	var testFiles = ["soap.xml", "xpath.xml", "nodes.xml", "nodeCount.xml", "cdata.xml", "cdataEntities.xml", "with_dtd.xml", "with_ns.xml", "attrs.xml", "element.xml", "elementNS.xml"];
	var invalidFiles = [ "mismatched_tag.xml", "no_toplevel.xml", "no_end.xml"];
	for (var i = 0; i < testFiles.length; i++) {
		testSource[testFiles[i]] = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, "suites/xml/" + testFiles[i]).read().toString();
	}

	for (var i = 0; i < invalidFiles.length; i++) {
		invalidSource[invalidFiles[i]] = Ti.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, "suites/xml/" + invalidFiles[i]).read().toString();
	}

	this.documentParsing = function(testRun) {
		var localSources = testSource;
		var localInvalid = invalidSource;
		// Parse valid documents
		valueOf(testRun, function() {
			Ti.XML.parseString(localSources["soap.xml"]);
		}).shouldNotThrowException();
		valueOf(testRun, function() {
			Ti.XML.parseString(localSources["xpath.xml"]);
		}).shouldNotThrowException();
		valueOf(testRun, function() {
			Ti.XML.parseString(localSources["nodes.xml"]);
		}).shouldNotThrowException();
		valueOf(testRun, function() {
			Ti.XML.parseString(localSources["nodeCount.xml"]);
		}).shouldNotThrowException();
		valueOf(testRun, function() {
			Ti.XML.parseString(localSources["cdata.xml"]);
		}).shouldNotThrowException();
		valueOf(testRun, function() {
			Ti.XML.parseString(localSources["cdataEntities.xml"]);
		}).shouldNotThrowException();
		
		// Parse empty document - spec specifies that a valid XML doc
		// must have a root element (empty string doesn't)
		valueOf(testRun, function() {
			Ti.XML.parseString('');
		}).shouldThrowException();
		
		// Parse (some types of) invalid documents
		valueOf(testRun, function() {
			Ti.XML.parseString(localInvalid["mismatched_tag.xml"]);
		}).shouldThrowException();
		valueOf(testRun, function() {
			Ti.XML.parseString(localInvalid["no_end.xml"]);
		}).shouldThrowException();
		valueOf(testRun, function() {
			Ti.XML.parseString(localInvalid["no_toplevel.xml"]);
		}).shouldThrowException();

		finish(testRun);
	};

	// These 6 tests are adapted from the KitchenSink xml_dom test
	this.soap = function(testRun) {
		var xml = Ti.XML.parseString(testSource["soap.xml"]);
		var fooBarList = xml.documentElement.getElementsByTagName("FooBar");
		valueOf(testRun, fooBarList).shouldNotBeNull();
		valueOf(testRun, fooBarList.length).shouldBe(1);
		valueOf(testRun, fooBarList.item(0)).shouldBeObject();
		
		var item = fooBarList.item(0);
		valueOf(testRun, item.text).shouldBe("true");
		valueOf(testRun, item.textContent).shouldBe("true");
		valueOf(testRun, item.nodeName).shouldBe("FooBar");

		finish(testRun);
	};

	this.xpath = function(testRun) {
		var xml = Ti.XML.parseString(testSource["xpath.xml"]);
		var fooBarList = xml.documentElement.getElementsByTagName("FooBar");
		valueOf(testRun, fooBarList).shouldNotBeNull();
		valueOf(testRun, fooBarList.length).shouldBe(1);
		valueOf(testRun, fooBarList.item(0)).shouldBeObject();
		
		var item = fooBarList.item(0);
		valueOf(testRun, item.text).shouldBe("true");
		valueOf(testRun, item.textContent).shouldBe("true");
		valueOf(testRun, item.nodeName).shouldBe("FooBar");
		
		// test XPath against Document
		var docResult = xml.evaluate("//FooBar/text()");
		valueOf(testRun, docResult).shouldNotBeNull();
		valueOf(testRun, docResult.length).shouldBe(1);
		valueOf(testRun, docResult.item(0).nodeValue).shouldBe("true");

		// test XPath against Element
		var elResult = xml.documentElement.evaluate("//FooBar/text()");
		valueOf(testRun, elResult).shouldNotBeNull();
		valueOf(testRun, elResult.length).shouldBe(1);
		valueOf(testRun, elResult.item(0).nodeValue).shouldBe("true");

		// test XPath against Element
		elResult = item.evaluate("text()");
		valueOf(testRun, elResult).shouldNotBeNull();
		valueOf(testRun, elResult.length).shouldBe(1);
		valueOf(testRun, elResult.item(0).nodeValue).shouldBe("true");

		finish(testRun);
	};

	this.xmlNodes = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);
		var nodesList = doc.getElementsByTagName("nodes");

		valueOf(testRun, nodesList).shouldNotBeNull();
		valueOf(testRun, nodesList.length).shouldBe(1);
		
		var nodes = nodesList.item(0);
		var elements = nodes.getElementsByTagName("node");
		valueOf(testRun, elements).shouldNotBeNull();
		valueOf(testRun, elements.length).shouldBe(13);
		
		var children = nodes.childNodes;
		valueOf(testRun, children).shouldNotBeNull();
		valueOf(testRun, children).shouldBeObject();
		
		valueOf(testRun, countNodes(elements.item(0), 1)).shouldBe(6);
		valueOf(testRun, children.item).shouldBeFunction();

		elements = doc.firstChild.childNodes;
		valueOf(testRun, elements).shouldNotBeNull();
		valueOf(testRun, countNodes(nodes, 1)).shouldBe(13);
		
		valueOf(testRun, nodes.nodeName).shouldBe("nodes");
		valueOf(testRun, doc.documentElement.nodeName).shouldBe("response");
		valueOf(testRun, nodes.getAttribute("id"), "nodes");
		
		var node = nodes.getElementsByTagName("node").item(0);
		valueOf(testRun, node.getAttribute("id")).shouldBe("node 1");
		
		var subnodes = node.getElementsByTagName("node");
		valueOf(testRun, subnodes.item(0).getAttribute("id")).shouldBe("node 2");

		finish(testRun);
	};

	this.xmlNodeCount = function(testRun) {
		var xml = Ti.XML.parseString(testSource["nodeCount.xml"]);
		var oneList = xml.documentElement.getElementsByTagName("one");
		var twoList = oneList.item(0).getElementsByTagName("two");
		var threeList = oneList.item(0).getElementsByTagName("three");
		var nodes = xml.getElementsByTagName("root");

		valueOf(testRun, oneList.length).shouldBe(1);
		valueOf(testRun, twoList.length).shouldBe(2);
		valueOf(testRun, threeList.length).shouldBe(4);
		
		var one = xml.documentElement.getElementsByTagName("one").item(0);
		var next = one.nextSibling;
		while (next != null && next.nodeType != next.ELEMENT_NODE) {
			next = next.nextSibling;
		}
		
		valueOf(testRun, one).shouldNotBeNull();
		valueOf(testRun, next).shouldNotBeNull();
		valueOf(testRun, one.nodeName).shouldBe("one");
		valueOf(testRun, xml.documentElement.attributes.getNamedItem("id").nodeValue).shouldBe("here");
		valueOf(testRun, next.getAttribute("id")).shouldBe("bar");
		valueOf(testRun, one.ownerDocument.documentElement.nodeName).shouldBe(xml.documentElement.ownerDocument.documentElement.nodeName);

		var nodeCount = countNodes(nodes.item(0), 1);
		valueOf(testRun, nodeCount).shouldBe(8);

		finish(testRun);
	};

	this.xmlCData = function(testRun) {
		var xml = Ti.XML.parseString(testSource["cdata.xml"]);
		var scriptList = xml.documentElement.getElementsByTagName("script");
		valueOf(testRun, scriptList.length).shouldBe(1);

		valueOf(testRun, xml.documentElement.nodeName).shouldBe("root");
		var nodeCount = countNodes(xml.documentElement, 1);
		valueOf(testRun, nodeCount).shouldBe(1);

		var script = scriptList.item(0);
		var cData;
		for (i = 0; i < script.childNodes.length; i++) {
			var node = script.childNodes.item(i);
			if (node.nodeType == node.CDATA_SECTION_NODE) {
				cData = node;
				break;
			}
		}
		valueOf(testRun, cData).shouldNotBeNull();

		//CharacterDataAttributes
		var fullString = cData.data;
		valueOf(testRun, fullString).shouldBe("\nfunction matchwo(a,b)\n{\nif (a < b && a < 0) then\n  {\n  return 1;\n  }\nelse\n  {\n  return 0;\n  }\n}\n");
		cData.data = "Test Assignment";
		valueOf(testRun, cData.data).shouldBe("Test Assignment");

		cData.data = fullString;
		var fullLength = cData.length;
		valueOf(testRun, fullLength).shouldBe(fullString.length);

		// CharacterData.substringData
		var substring1 = cData.substringData(1, 8);
		valueOf(testRun, substring1).shouldBe(fullString.substr(1, 8));
		// asking for more than there is should not throw exception
		// according to spec, rather just return up to end.
		var substring2 = null;
		valueOf(testRun, function() {
			substring2 = cData.substringData(1, 1000);
		}).shouldNotThrowException();
		valueOf(testRun, substring2.length).shouldBe(fullLength - 1);
		valueOf(testRun, substring2).shouldBe(fullString.substr(1, 1000));
		// check edge cases
		substring2 = cData.substringData(0, fullLength);
		valueOf(testRun, substring2.length).shouldBe(fullLength);
		valueOf(testRun, substring2).shouldBe(fullString);
		substring2 = cData.substringData(1, fullLength);
		valueOf(testRun, substring2.length).shouldBe(fullLength - 1);
		valueOf(testRun, substring2).shouldBe(fullString.substr(1, fullLength));
		substring2 = cData.substringData(0, fullLength + 1);
		valueOf(testRun, substring2.length).shouldBe(fullLength);
		valueOf(testRun, substring2).shouldBe(fullString.substr(0, fullLength + 1));
		valueOf(testRun, function() {
			var substring3 = cData.substringData(1000, 1001);
		}).shouldThrowException();
		valueOf(testRun, function() {
			var substring4 = cData.substringData(-1, 101);
		}).shouldThrowException();
		valueOf(testRun, function() {
			var substring5 = cData.substringData(0, -1);
		}).shouldThrowException();

		//CharacterData.appendData
		var cDataLength = cData.length;
		cData.appendData("Appending");
		var substring6 = cData.substringData(97, 9);
		valueOf(testRun, cData.length).shouldBe(cDataLength + 9);
		valueOf(testRun, substring6).shouldBe("Appending");
		valueOf(testRun, function() {
			script.appendData("ReadOnly");
		}).shouldThrowException();

		//CharacterData.insertData
		cData.insertData(9, "InsertData");
		var substring7 = cData.substringData(9, 10);
		valueOf(testRun, substring7).shouldBe("InsertData");
		valueOf(testRun, function() {
			cData.insertData(-1, "InsertFail");
		}).shouldThrowException();
		valueOf(testRun, function() {
			cData.insertData(1000, "InsertFail");
		}).shouldThrowException();
		valueOf(testRun, function() {
			script.insertData(1, "ReadOnly");
		}).shouldThrowException();

		//CharacterData.replaceData
		cData.replaceData(9, 1, "ReplaceData");
		var substring8 = cData.substringData(9, 20);
		valueOf(testRun, substring8).shouldBe("ReplaceDatansertData");
		cDataLength = cData.length;
		cData.replaceData(cDataLength,100,"ReplaceData");
		valueOf(testRun, cData.length).shouldBe(cDataLength + 11);
		valueOf(testRun, function() {
			cData.replaceDate(-1, 2, "Failure");
		}).shouldThrowException();
		cDataLength = cData.length;
		valueOf(testRun, function() {
			cData.replaceDate(cDataLength + 1, 2, "Failure");
		}).shouldThrowException();
		valueOf(testRun, function() {
			cData.replaceDate(1, -1, "Failure");
		}).shouldThrowException();

		//CharacterData.deleteData
		cDataLength = cData.length;
		cData.deleteData(1, 8);
		valueOf(testRun, cData.length).shouldBe(cDataLength - 8);
		valueOf(testRun, function() {
			cData.deleteData(-1, 10);
		}).shouldThrowException();
		valueOf(testRun, function() {
			cData.deleteData(1000, 1001);
		}).shouldThrowException();
		valueOf(testRun, function() {
			cData.deleteData(0, -1);
		}).shouldThrowException();
		cData.deleteData(1, 1000);
		valueOf(testRun, cData.length).shouldBe(1);
		valueOf(testRun, function() {
			script.deleteData(0, 1);
		}).shouldThrowException();

		finish(testRun);
	};

	this.xmlCDataAndEntities = function(testRun) {
		var xml = Ti.XML.parseString(testSource["cdataEntities.xml"]);
		var dataList = xml.documentElement.getElementsByTagName("data");
		var subdataList = xml.documentElement.getElementsByTagName("subdata");
		valueOf(testRun, xml.documentElement.firstChild.nodeName).shouldBe("subdata");
		
		var nodeCount = countNodes(subdataList.item(0), 1);
		valueOf(testRun, nodeCount).shouldBe(2);

		finish(testRun);
	};

	this.xmlSerialize = function(testRun) {
		// Return an array of attribute nodes, sorted by name.
		// An attribute NamedNodeMap has no canonical ordering,
		// so to do a comparison we need to ensure we've got the
		// same order between both.
		function sortAttributeList(attribs) {
			var names = [];
			var map = {};
			for (var i = 0; i < attribs; i++) {
				var a = attribs.item(i);
				map[a.nodeName] = a;
				names.push(a.nodeName);
			}
			
			names = names.sort();
			var list = [];
			for (var i = 0; i < names.length; i++) {
				list.push(map[names[i]]);
			}
			return list;
		}
		
		function matchXmlTrees(a, b) {
			valueOf(testRun, a.nodeType).shouldBe(b.nodeType);
			valueOf(testRun, a.nodeName).shouldBe(b.nodeName);
			valueOf(testRun, a.nodeValue).shouldBe(b.nodeValue);
			
			if (a.nodeType == 1) {
				var aAttribs = sortAttributeList(a.attributes);
				var bAttribs = sortAttributeList(b.attributes);
				valueOf(testRun, aAttribs.length).shouldBe(bAttribs.length);
				
				for (var i = 0; i < aAttribs.length; i++) {
					matchXmlTrees(aAttribs[i], bAttribs[i]);
				}
				
				var aChildren = a.childNodes;
				var bChildren = b.childNodes;
				valueOf(testRun, aChildren.length).shouldBe(bChildren.length);

				for (var i = 0; i < aChildren.length; i++) {
					matchXmlTrees(aChildren.item(i), bChildren.item(i));
				}
			}
		}
		
		for (var sourceName in testSource) {
			var a = Ti.XML.parseString(testSource[sourceName]);
			var bstr = Ti.XML.serializeToString(a);
			var b = Ti.XML.parseString(bstr);
			
			// Make sure we can round-trip from source to DOM to source and back to DOM...
			matchXmlTrees(a, b);
		}

		finish(testRun);
	};

	this.apiXMLTextSplitText = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);
		var firstString = "first part|";
		var secondString = "second part";
		var completeString = firstString + secondString;

		valueOf(testRun, doc.createTextNode).shouldBeFunction();

		var parentNode = doc.createElement("parentNode");
		var childNode = doc.createTextNode(completeString);
		parentNode.appendChild(childNode);
		valueOf(testRun, parentNode.childNodes.length).shouldBe(1);

		valueOf(testRun, function() { splitTextResults = parentNode.firstChild.splitText(firstString.length); }).shouldNotThrowException();

		valueOf(testRun, parentNode.childNodes.length).shouldBe(2);
		valueOf(testRun, splitTextResults.nodeValue).shouldBe(parentNode.lastChild.nodeValue);
		valueOf(testRun, firstString).shouldBe(parentNode.firstChild.nodeValue);
		valueOf(testRun, secondString).shouldBe(parentNode.lastChild.nodeValue);

		// Out-of-bounds exceptions are in the spec:
		completeString = "New text node";
		childNode = doc.createTextNode(completeString);
		valueOf(testRun, function() {
			childNode.splitText(-1);
		}).shouldThrowException();
		valueOf(testRun, function() {
			childNode.splitText(completeString.length + 1);
		}).shouldThrowException();

		finish(testRun);
	};

	this.apiXMLTextGetText = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);
		var textValue = "this is some test";

		valueOf(testRun, doc.createTextNode).shouldBeFunction();
		var textNode = doc.createTextNode(textValue);
		valueOf(testRun, textNode.nodeValue).shouldBe(textValue);

		var getTextResults = null;
		valueOf(testRun, function() { getTextResults = textNode.getText(); }).shouldNotThrowException();
		valueOf(testRun, getTextResults).shouldBe(textValue);
		valueOf(testRun, function() { getTextResults = textNode.getTextContent(); }).shouldNotThrowException();
		valueOf(testRun, getTextResults).shouldBe(textValue);
		valueOf(testRun, function() { getTextResults2 = textNode.text; }).shouldNotThrowException();
		valueOf(testRun, getTextResults2).shouldBe(textValue);
		valueOf(testRun, function() { getTextResults2 = textNode.textContent; }).shouldNotThrowException();
		valueOf(testRun, getTextResults2).shouldBe(textValue);

		finish(testRun);
	};

	this.apiXmlDocumentProperties = function(testRun) {
		// File with DTD
		var doc = Ti.XML.parseString(testSource["with_dtd.xml"]);
		valueOf(testRun, doc.documentElement).shouldNotBeUndefined();
		valueOf(testRun, doc.documentElement).shouldNotBeNull();
		valueOf(testRun, doc.documentElement).shouldBeObject();
		valueOf(testRun, doc.documentElement.nodeName).shouldBe("letter");
		valueOf(testRun, doc.implementation).shouldNotBeUndefined();
		valueOf(testRun, doc.implementation).shouldNotBeNull();
		valueOf(testRun, doc.implementation).shouldBeObject();
		valueOf(testRun, doc.doctype).shouldNotBeUndefined();
		valueOf(testRun, doc.doctype).shouldNotBeNull();
		valueOf(testRun, doc.doctype).shouldBeObject();
		// Document without DTD, to be sure doc.doctype is null as spec says
		doc = Ti.XML.parseString("<a/>");
		valueOf(testRun, doc.doctype).shouldBeNull();

		finish(testRun);
	};

	this.apiXmlDocumentCreateAttribute = function(testRun) {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(testRun, doc.createAttribute).shouldBeFunction();
		var attr = doc.createAttribute("myattr");
		valueOf(testRun, attr).shouldNotBeNull();
		valueOf(testRun, attr).shouldBeObject();
		valueOf(testRun, attr.name).shouldBe("myattr");
		// Per spec, value in new attribute should be empty string
		valueOf(testRun, attr.value).shouldNotBeNull();
		valueOf(testRun, attr.value).shouldBeExactly("");
		valueOf(testRun, attr.ownerDocument).shouldBe(doc);

		attr = null;
		valueOf(testRun, doc.createAttributeNS).shouldBeFunction();
		attr = doc.createAttributeNS("http://example.com", "prefix:myattr");
		valueOf(testRun, attr).shouldNotBeNull();
		valueOf(testRun, attr).shouldBeObject();
		valueOf(testRun, attr.name).shouldBe("prefix:myattr");
		valueOf(testRun, attr.namespaceURI).shouldBe("http://example.com");
		valueOf(testRun, attr.prefix).shouldBe("prefix");
		valueOf(testRun, attr.value).shouldNotBeNull();
		valueOf(testRun, attr.value).shouldBeExactly("");
		valueOf(testRun, attr.ownerDocument).shouldBe(doc);

		finish(testRun);
	};

	this.apiXmlDocumentCreateCDATASection = function(testRun) {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(testRun, doc.createCDATASection).shouldBeFunction();
		var data = "This is my CDATA section";
		var section = doc.createCDATASection(data);
		valueOf(testRun, section).shouldNotBeNull();
		valueOf(testRun, section).shouldBeObject();
		valueOf(testRun, section.text).shouldBe(data);
		valueOf(testRun, section.textContent).shouldBe(data);
		valueOf(testRun, section.ownerDocument).shouldBe(doc);

		finish(testRun);
	};

	this.apiXmlDocumentCreateComment = function(testRun) {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(testRun, doc.createComment).shouldBeFunction();
		var data = "This is my comment";
		var comment = doc.createComment(data);
		valueOf(testRun, comment).shouldNotBeNull();
		valueOf(testRun, comment).shouldBeObject();
		valueOf(testRun, comment.data).shouldBe(data);
		valueOf(testRun, comment.ownerDocument).shouldBe(doc);

		finish(testRun);
	};

	this.apiXmlDocumentCreateDocumentFragment = function(testRun) {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(testRun, doc.createDocumentFragment).shouldBeFunction();
		var frag = doc.createDocumentFragment();
		valueOf(testRun, frag).shouldNotBeNull();
		valueOf(testRun, frag).shouldBeObject();
		valueOf(testRun, frag.ownerDocument).shouldBe(doc);

		finish(testRun);
	};

	this.apiXmlDocumentCreateElement = function(testRun) {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(testRun, doc.createElement).shouldBeFunction();
		var elem = doc.createElement("myelement");
		valueOf(testRun, elem).shouldNotBeNull();
		valueOf(testRun, elem).shouldBeObject();
		valueOf(testRun, elem.nodeName).shouldBe("myelement");
		valueOf(testRun, elem.localName).shouldBeNull();
		valueOf(testRun, elem.prefix).shouldBeNull();
		valueOf(testRun, elem.namespaceURI).shouldBeNull();
		valueOf(testRun, elem.ownerDocument).shouldBe(doc);

		finish(testRun);
	};

	this.apiXmlDocumentCreateElementNS = function(testRun) {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(testRun, doc.createElementNS).shouldBeFunction();
		var elem = doc.createElementNS("http://example.com", "prefix:myelement");
		valueOf(testRun, elem).shouldNotBeNull();
		valueOf(testRun, elem).shouldBeObject();
		valueOf(testRun, elem.nodeName).shouldBe("prefix:myelement");
		valueOf(testRun, elem.localName).shouldBe("myelement");
		valueOf(testRun, elem.prefix).shouldBe("prefix");
		valueOf(testRun, elem.namespaceURI).shouldBe("http://example.com");
		valueOf(testRun, elem.ownerDocument).shouldBe(doc);

		finish(testRun);
	};

	this.apiXmlDocumentCreateEntityReference = function(testRun) {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(testRun, doc.createEntityReference).shouldBeFunction();
		var entity = doc.createEntityReference("myentity");
		valueOf(testRun, entity).shouldNotBeNull();
		valueOf(testRun, entity).shouldBeObject();
		valueOf(testRun, entity.nodeName).shouldBe("myentity");
		valueOf(testRun, entity.ownerDocument).shouldBe(doc);

		finish(testRun);
	};

	this.apiXmlDocumentCreateProcessingInstruction = function(testRun) {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(testRun, doc.createProcessingInstruction).shouldBeFunction();
		var instruction = doc.createProcessingInstruction("a", "b");
		valueOf(testRun, instruction).shouldNotBeNull();
		valueOf(testRun, instruction).shouldBeObject();
		valueOf(testRun, instruction.target).shouldBe("a");
		valueOf(testRun, instruction.data).shouldBe("b");
		valueOf(testRun, instruction.ownerDocument).shouldBe(doc);

		finish(testRun);
	};

	this.apiXmlDocumentCreateTextNode = function(testRun) {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(testRun, doc.createTextNode).shouldBeFunction();
		var value = "This is some text";
		var text = doc.createTextNode(value);
		valueOf(testRun, text).shouldNotBeNull();
		valueOf(testRun, text).shouldBeObject();
		valueOf(testRun, text.data).shouldBe(value);
		valueOf(testRun, text.ownerDocument).shouldBe(doc);

		finish(testRun);
	};

	this.apiXmlDocumentGetElementById = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);
		valueOf(testRun, doc.getElementById).shouldBeFunction();
		var node = doc.getElementById("node 1");
		valueOf(testRun, node).shouldNotBeNull();
		valueOf(testRun, node).shouldBeObject();
		valueOf(testRun, node.nodeName).shouldBe("node");
		valueOf(testRun, function() {
			node = doc.getElementById("no_such_element");
		}).shouldNotThrowException();
		valueOf(testRun, node).shouldBeNull();

		finish(testRun);
	};

	this.apiXmlDocumentGetElementsByTagName = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);
		valueOf(testRun, doc.getElementsByTagName).shouldBeFunction();
		var elements = doc.getElementsByTagName("node");
		valueOf(testRun, elements).shouldNotBeNull();
		valueOf(testRun, elements).shouldBeObject();
		valueOf(testRun, elements.length).shouldBeGreaterThan(0);
		for (var i = 0; i < elements.length; i++) {
			var checkelem = elements.item(i);
			valueOf(testRun, checkelem.nodeName).shouldBe("node");
		}
		// test bogus tagname
		valueOf(testRun, function() {
			elements = doc.getElementsByTagName("bogus");
		}).shouldNotThrowException();
		valueOf(testRun, elements).shouldNotBeNull();
		valueOf(testRun, elements).shouldBeObject();
		valueOf(testRun, elements.length).shouldBeExactly(0);

		finish(testRun);
	};

	this.apiXmlDocumentGetElementsByTagNameNS = function(testRun) {
		var doc = Ti.XML.parseString(testSource["with_ns.xml"]);
		valueOf(testRun, doc.getElementsByTagNameNS).shouldBeFunction();
		var elements = doc.getElementsByTagNameNS("http://example.com", "cake");
		valueOf(testRun, elements).shouldNotBeNull();
		valueOf(testRun, elements).shouldBeObject();
		valueOf(testRun, elements.length).shouldBeGreaterThan(0);
		for (var i = 0; i < elements.length; i++) {
			var checkelem = elements.item(i);
			valueOf(testRun, checkelem.localName).shouldBe("cake");
			valueOf(testRun, checkelem.namespaceURI).shouldBe("http://example.com");
		}
		// test real namespace and bogus tagname
		valueOf(testRun, function() {
			elements = doc.getElementsByTagNameNS("http://example.com", "bogus");
		}).shouldNotThrowException();
		valueOf(testRun, elements).shouldNotBeNull();
		valueOf(testRun, elements).shouldBeObject();
		valueOf(testRun, elements.length).shouldBeExactly(0);
		// test bogus namespace and real tagname
		valueOf(testRun, function() {
			elements = doc.getElementsByTagNameNS("http://bogus.com", "pie");
		}).shouldNotThrowException();
		valueOf(testRun, elements).shouldNotBeNull();
		valueOf(testRun, elements).shouldBeObject();
		valueOf(testRun, elements.length).shouldBeExactly(0);
		// test bogus namespace and bogus tagname
		valueOf(testRun, function() {
			elements = doc.getElementsByTagNameNS("http://bogus.com", "bogus");
		}).shouldNotThrowException();
		valueOf(testRun, elements).shouldNotBeNull();
		valueOf(testRun, elements).shouldBeObject();
		valueOf(testRun, elements.length).shouldBeExactly(0);

		finish(testRun);
	};

	this.apiXmlDocumentImportNode = function(testRun) {
		var doc = Ti.XML.parseString("<a/>");
		var otherDoc = Ti.XML.parseString(testSource["with_ns.xml"]);
		var cakeNodes = otherDoc.documentElement.getElementsByTagNameNS("http://example.com", "cake");
		valueOf(testRun, cakeNodes).shouldNotBeNull();
		valueOf(testRun, cakeNodes.length).shouldBeGreaterThan(0);
		var cakeNode = cakeNodes.item(0);
		valueOf(testRun, cakeNode).shouldNotBeNull();
		valueOf(testRun, doc.importNode).shouldBeFunction();
		// test deep import
		var importedNode;
		valueOf(testRun, function() {
			importedNode = doc.importNode(cakeNode, true);
		}).shouldNotThrowException();
		valueOf(testRun, importedNode.ownerDocument).shouldNotBeNull();
		valueOf(testRun, importedNode.ownerDocument).shouldBeObject();
		valueOf(testRun, importedNode.ownerDocument).shouldBe(doc);
		valueOf(testRun, importedNode.parentNode).shouldBeNull();
		valueOf(testRun, importedNode.hasChildNodes()).shouldBeTrue();
		valueOf(testRun, importedNode.childNodes.length).shouldBeGreaterThan(0);
		valueOf(testRun, importedNode.namespaceURI).shouldBe("http://example.com");
		// test shallow import
		valueOf(testRun, function() {
			importedNode = doc.importNode(cakeNode, false);
		}).shouldNotThrowException();
		valueOf(testRun, importedNode.hasChildNodes()).shouldBeFalse();
		valueOf(testRun, importedNode.ownerDocument).shouldNotBeNull();
		valueOf(testRun, importedNode.ownerDocument).shouldBeObject();
		valueOf(testRun, importedNode.ownerDocument).shouldBe(doc);
		valueOf(testRun, importedNode.parentNode).shouldBeNull();

		finish(testRun);
	};

	this.apiXmlNodeProperties = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);

		var nodesList = doc.getElementsByTagName("nodes");
		valueOf(testRun, nodesList).shouldNotBeNull();
		valueOf(testRun, nodesList.length).shouldBe(1);

		var node = nodesList.item(0);

		// verify properties
		valueOf(testRun, node.ELEMENT_NODE).shouldBeNumber();
		valueOf(testRun, node.ATTRIBUTE_NODE).shouldBeNumber();
		valueOf(testRun, node.TEXT_NODE).shouldBeNumber();
		valueOf(testRun, node.CDATA_SECTION_NODE).shouldBeNumber();
		valueOf(testRun, node.ENTITY_REFERENCE_NODE).shouldBeNumber();
		valueOf(testRun, node.ENTITY_NODE).shouldBeNumber();
		valueOf(testRun, node.PROCESSING_INSTRUCTION_NODE).shouldBeNumber();
		valueOf(testRun, node.COMMENT_NODE).shouldBeNumber();
		valueOf(testRun, node.DOCUMENT_NODE).shouldBeNumber();
		valueOf(testRun, node.DOCUMENT_TYPE_NODE).shouldBeNumber();
		valueOf(testRun, node.DOCUMENT_FRAGMENT_NODE).shouldBeNumber();
		valueOf(testRun, node.NOTATION_NODE).shouldBeNumber();
		valueOf(testRun, node.nodeName).shouldBeString();

		var attrName = "attr";
		var attrValue = "value";
		node.setAttribute(attrName, attrValue);
		var attrNode = node.getAttributeNode(attrName);
		valueOf(testRun, attrNode.nodeValue).shouldBe(attrValue);

		var CDATANodeContents = "this CDATA contents";
		var CDATANode = doc.createCDATASection(CDATANodeContents);
		valueOf(testRun, CDATANode.nodeValue).shouldBe(CDATANodeContents);

		var commentNodeContents = "this is a comment";
		var commentNode = doc.createComment(commentNodeContents);
		valueOf(testRun, commentNode.nodeValue).shouldBe(commentNodeContents);

		valueOf(testRun, doc.nodeValue).shouldBe(null);
		valueOf(testRun, doc.createDocumentFragment().nodeValue).shouldBe(null);
		valueOf(testRun, doc.getDoctype().nodeValue).shouldBe(null);
		valueOf(testRun, node.nodeValue).shouldBe(null);
		valueOf(testRun, doc.createEntityReference("blah").nodeValue).shouldBe(null);

		var processingInstructionData = "data";
		valueOf(testRun, doc.createProcessingInstruction("target", processingInstructionData).nodeValue).shouldBe(processingInstructionData);

		var textNodeContents = "this is some text";
		var textNode = doc.createTextNode(textNodeContents);
		valueOf(testRun, textNode.nodeValue).shouldBe(textNodeContents);

		valueOf(testRun, node.nodeType).shouldBeNumber();
		valueOf(testRun, node.parentNode).shouldBeObject();
		valueOf(testRun, node.childNodes).shouldBeObject();
		valueOf(testRun, node.firstChild).shouldBeObject();
		valueOf(testRun, node.lastChild).shouldBeObject();
		valueOf(testRun, node.previousSibling).shouldBeObject();
		valueOf(testRun, node.nextSibling).shouldBeObject();
		valueOf(testRun, node.attributes).shouldBeObject();
		valueOf(testRun, node.ownerDocument).shouldBeObject();
		valueOf(testRun, node.namespaceURI).shouldNotBeUndefined();
		valueOf(testRun, node.prefix).shouldNotBeUndefined();
		valueOf(testRun, node.localName).shouldNotBeUndefined();

		finish(testRun);
	};

	this.apiXmlNodeAppendChild = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		valueOf(testRun, parentNode.appendChild).shouldBeFunction();

		var childNode = doc.createElement("childNode");
		valueOf(testRun, function() { parentNode.appendChild(childNode); }).shouldNotThrowException();
		valueOf(testRun, parentNode.firstChild).shouldBe(childNode);

		finish(testRun);
	};

	this.apiXmlNodeCloneNode = function(testRun) {
		var shouldRun = true;
		if (Ti.Platform.osname === 'android') {
			// this check exists to deal with the bug mentioned in TIMOB-4771
			valueOf(testRun,  isNaN(parseInt(Ti.Platform.version)) ).shouldBeFalse();
			if (parseInt(Ti.Platform.version) < 3) {
				Ti.API.info("Less than 3.0, not running apiXmlNodeCloneNode test");
				shouldRun = false;
			} else {
				Ti.API.info("3.0 or greater, running apiXmlNodeCloneNode test");
			}
		}

		if (shouldRun)
		{
			var doc = Ti.XML.parseString(testSource["nodes.xml"]);

			var parentNode = doc.createElement("parent");
			parentNode.setAttribute("myattr", "attr value");
			var childText = doc.createTextNode("child text");
			var childElement = doc.createElement("childelement");
			parentNode.appendChild(childText);
			parentNode.appendChild(childElement);

			valueOf(testRun, parentNode.cloneNode).shouldBeFunction();

			var clonedNode = null;
		
			// Shallow
			valueOf(testRun, function() { clonedNode = parentNode.cloneNode(false); }).shouldNotThrowException();
			valueOf(testRun, clonedNode.nodeName).shouldBe(parentNode.nodeName);
			// Though shallow, attributes should be there.
			var attrs = clonedNode.attributes;
			valueOf(testRun, attrs).shouldNotBeNull();
			valueOf(testRun, attrs.length).shouldBeExactly(1);
			var attr = attrs.getNamedItem("myattr");
			valueOf(testRun, attr).shouldNotBeNull();
			valueOf(testRun, attr.nodeValue).shouldBeExactly("attr value");
			// Fetch a different way
			var attrValue = clonedNode.getAttribute("myattr");
			valueOf(testRun, attrValue).shouldNotBeNull();
			valueOf(testRun, attrValue).shouldBeExactly("attr value");
			// Per spec, clone should have no parent and no children
			valueOf(testRun, clonedNode.parentNode).shouldBeNull();
			valueOf(testRun, clonedNode.hasChildNodes()).shouldBeBoolean();
			valueOf(testRun, clonedNode.hasChildNodes()).shouldBeFalse();

			// Deep
			valueOf(testRun, function() { clonedNode = parentNode.cloneNode(true); }).shouldNotThrowException();
			valueOf(testRun, clonedNode.nodeName).shouldBe(parentNode.nodeName);
			valueOf(testRun, clonedNode.parentNode).shouldBeNull();
			attrs = clonedNode.attributes;
			valueOf(testRun, attrs).shouldNotBeNull();
			valueOf(testRun, attrs.length).shouldBeExactly(1);
			attr = attrs.getNamedItem("myattr");
			valueOf(testRun, attr).shouldNotBeNull();
			valueOf(testRun, attr.nodeValue).shouldBeExactly("attr value");
			valueOf(testRun, clonedNode.getAttribute("myattr")).shouldBe("attr value");
			attrValue = clonedNode.getAttribute("myattr");
			valueOf(testRun, attrValue).shouldNotBeNull();
			valueOf(testRun, attrValue).shouldBeExactly("attr value");
			// this one should have children since it's deep.
			valueOf(testRun, clonedNode.hasChildNodes()).shouldBeBoolean();
			valueOf(testRun, clonedNode.hasChildNodes()).shouldBeTrue();
			valueOf(testRun, clonedNode.firstChild).shouldNotBeNull();
			valueOf(testRun, clonedNode.firstChild.nodeValue).shouldBe(parentNode.firstChild.nodeValue);
			valueOf(testRun, clonedNode.lastChild).shouldNotBeNull();
			valueOf(testRun, clonedNode.lastChild.nodeName).shouldBe(parentNode.lastChild.nodeName);
		}

		finish(testRun);
	};

	this.apiXmlNodeHasAttributes = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);

		var node = doc.createElement("node");
		var node2 = doc.createElement("node2");
		node2.setAttribute("attr1", "value1");

		valueOf(testRun, node.hasAttributes).shouldBeFunction();

		var results;
		valueOf(testRun, function() { results = node.hasAttributes(); }).shouldNotThrowException();
		valueOf(testRun, results).shouldBe(false);
		valueOf(testRun, function() { results = node2.hasAttributes(); }).shouldNotThrowException();
		valueOf(testRun, results).shouldBe(true);

		finish(testRun);
	};

	this.apiXmlNodeHasChildNodes = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		var parentNode2 = doc.createElement("parentNode2");
		parentNode2.appendChild(doc.createElement("childNode"));

		valueOf(testRun, parentNode.hasChildNodes).shouldBeFunction();

		var results;
		valueOf(testRun, function() { results = parentNode.hasChildNodes(); }).shouldNotThrowException();
		valueOf(testRun, results).shouldBe(false);
		valueOf(testRun, function() { results = parentNode2.hasChildNodes(); }).shouldNotThrowException();
		valueOf(testRun, results).shouldBe(true);

		finish(testRun);
	};

	this.apiXmlNodeInsertBefore = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		parentNode.appendChild(doc.createElement("childNode"));
		parentNode.appendChild(doc.createElement("childNode2"));

		valueOf(testRun, parentNode.insertBefore).shouldBeFunction();

		var childNode3 = doc.createElement("childNode3");
		valueOf(testRun, function() { parentNode.insertBefore(childNode3, parentNode.firstChild); }).shouldNotThrowException();
		valueOf(testRun, parentNode.firstChild).shouldBe(childNode3);

		finish(testRun);
	};

	this.apiXmlNodeIsSupported = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);

		valueOf(testRun, doc.isSupported).shouldBeFunction();

		var results;
		valueOf(testRun, function() { results = doc.isSupported("XML", "1.0"); }).shouldNotThrowException();
		valueOf(testRun, results).shouldBe(true);
		valueOf(testRun, function() { results = doc.isSupported("IDONTEXIST", "1.0"); }).shouldNotThrowException();
		valueOf(testRun, results).shouldBe(false);

		finish(testRun);
	};

	this.apiXmlNodeNormalize = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		parentNode.appendChild(doc.createTextNode("My "));
		parentNode.appendChild(doc.createTextNode("name "));
		parentNode.appendChild(doc.createTextNode("is "));
		parentNode.appendChild(doc.createTextNode("Opie."));

		valueOf(testRun, parentNode.normalize).shouldBeFunction();

		valueOf(testRun, function() { parentNode.normalize(); }).shouldNotThrowException();
		valueOf(testRun, parentNode.getText()).shouldBe("My name is Opie.");
		valueOf(testRun, parentNode.getTextContent()).shouldBe("My name is Opie.");
		valueOf(testRun, parentNode.getChildNodes().length).shouldBe(1);

		finish(testRun);
	};

	this.apiXmlNodeRemoveChild = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		var childNode = doc.createElement("childNode");
		parentNode.appendChild(childNode);

		valueOf(testRun, parentNode.removeChild).shouldBeFunction();

		var results = null;
		valueOf(testRun, function() { results = parentNode.removeChild(childNode); }).shouldNotThrowException();
		valueOf(testRun, results).shouldBe(childNode);

		valueOf(testRun, parentNode.hasChildNodes()).shouldBe(false);

		finish(testRun);
	};

	this.apiXmlNodeReplaceChild = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		var childNode = doc.createElement("childNode");
		var childNode2 = doc.createElement("childNode2");
		parentNode.appendChild(childNode);
		parentNode.appendChild(childNode2);

		valueOf(testRun, parentNode.replaceChild).shouldBeFunction();

		var replacementNode = doc.createElement("replacementNode");
		valueOf(testRun, function() { parentNode.replaceChild(replacementNode, childNode); }).shouldNotThrowException();
		valueOf(testRun, parentNode.firstChild).shouldBe(replacementNode);

		finish(testRun);
	};

	this.xmlNodeListElementsByTagName = function(testRun) {
		var xml = Ti.XML.parseString(testSource["nodes.xml"]);
		valueOf(testRun, xml).shouldNotBeNull();
		
		var nodes = xml.getElementsByTagName("node");
		valueOf(testRun, nodes).shouldNotBeNull();
		valueOf(testRun, nodes.length).shouldBeNumber();
		valueOf(testRun, nodes.item).shouldBeFunction();
		
		valueOf(testRun, nodes.length).shouldBe(13);
		
		var n = nodes.item(0);
		valueOf(testRun, n).shouldNotBeNull();
		valueOf(testRun, n.getAttribute("id")).shouldBe("node 1");
		
		n = nodes.item(1);
		valueOf(testRun, n).shouldNotBeNull();
		valueOf(testRun, n.getAttribute("id")).shouldBe("node 2");

		finish(testRun);
	};

	this.xmlNodeListChildren = function(testRun) {
		var xml = Ti.XML.parseString(testSource["nodes.xml"]);
		valueOf(testRun, xml).shouldNotBeNull();
		
		var e = xml.documentElement;
		valueOf(testRun, e).shouldNotBeNull();
		
		var nodes = e.childNodes;
		valueOf(testRun, nodes).shouldNotBeNull();
		var count = 0;
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes.item(i);
			if (node.nodeType == node.ELEMENT_NODE) {
				count++;
			}
		}
		valueOf(testRun, count).shouldBe(1);

		finish(testRun);
	};

	this.xmlNodeListRange = function(testRun) {
		var xml = Ti.XML.parseString(testSource["nodes.xml"]);
		valueOf(testRun, xml).shouldNotBeNull();
		
		var nodes = xml.getElementsByTagName("node");
		valueOf(testRun, nodes.item(nodes.length)).shouldBeNull();
		valueOf(testRun, nodes.item(100)).shouldBeNull();

		finish(testRun);
	};

	this.apiXmlAttr = function(testRun) {
		var doc = Ti.XML.parseString(testSource["nodes.xml"]);
		var node = doc.getElementsByTagName("node").item(0);
		var attr;
		// First a known attribute
		valueOf(testRun, function() {
			attr = node.attributes.item(0);
		}).shouldNotThrowException();
		valueOf(testRun, attr).shouldNotBeUndefined();
		valueOf(testRun, attr).shouldNotBeNull();
		valueOf(testRun, attr).shouldBeObject();
		valueOf(testRun, attr.name).shouldBeString();
		valueOf(testRun, attr.name).shouldBe("id");
		valueOf(testRun, attr.ownerElement).shouldBeObject();
		valueOf(testRun, attr.ownerElement).shouldBe(node);
		valueOf(testRun, attr.specified).shouldBeBoolean();
		valueOf(testRun, attr.specified).shouldBeTrue();
		valueOf(testRun, attr.value).shouldBeString();
		valueOf(testRun, attr.value).shouldBe("node 1");
		// Now new attribute
		valueOf(testRun, function() {
			attr = doc.createAttribute("newattr");
		}).shouldNotThrowException();
		valueOf(testRun, attr).shouldNotBeUndefined();
		valueOf(testRun, attr).shouldNotBeNull();
		valueOf(testRun, attr).shouldBeObject();
		valueOf(testRun, attr.name).shouldBeString();
		valueOf(testRun, attr.name).shouldBe("newattr");
		valueOf(testRun, attr.specified).shouldBeBoolean();
		// Per spec, the default value in an attribute is empty string not null.
		valueOf(testRun, attr.value).shouldNotBeNull();
		valueOf(testRun, attr.value).shouldBeExactly("");
		// Per spec, when you set an attribute that doesn't exist yet,
		// null is returned.
		var addedAttr = node.setAttributeNode(attr);
		valueOf(testRun, addedAttr).shouldBeNull();
		valueOf(testRun, attr.ownerElement).shouldNotBeNull();
		valueOf(testRun, attr.ownerElement).shouldBe(node);
		// Per spec, when you set a new attribute of same name as one that
		// already exists, it replaces that existing one AND returns that existing one.
		var secondNewAttr = doc.createAttribute("newattr");
		var replacedAttr = node.setAttributeNode(secondNewAttr);
		valueOf(testRun, replacedAttr).shouldNotBeNull();
		valueOf(testRun, replacedAttr).shouldBe(attr);
		// Per spec, changing the value of an attribute automatically sets
		// specified to true.
		attr.value = "new value";
		valueOf(testRun, attr.value).shouldNotBeNull();
		valueOf(testRun, attr.value).shouldBe("new value");
		valueOf(testRun, attr.specified).shouldBeBoolean();
		valueOf(testRun, attr.specified).shouldBeTrue();
		// Per spec, an attribute with no owner element (i.e., it has just
		// been created and not yet put on to an element) will have
		// "true" for specified.
		var thirdNewAttr = doc.createAttribute("anotherattr");
		valueOf(testRun, thirdNewAttr).shouldNotBeNull();
		valueOf(testRun, thirdNewAttr.ownerElement).shouldBeNull();
		valueOf(testRun, thirdNewAttr.specified).shouldBeBoolean();
		valueOf(testRun, thirdNewAttr.specified).shouldBeTrue();

		finish(testRun);
	};

	this.xmlNamedNodeMap = function(testRun) {
		var xml = Ti.XML.parseString(testSource["attrs.xml"]);
		var otherDoc = Ti.XML.parseString("<dummy/>");
		var doc = xml.documentElement;
		valueOf(testRun, doc.nodeName).shouldBe("doc");

		var nodes = doc.getElementsByTagName("test");
		valueOf(testRun, nodes.length).shouldBe(1);

		var test = nodes.item(0);
		valueOf(testRun, test).shouldNotBeNull();

		nodes = test.getElementsByTagNameNS("http://www.test.com/namespace", "child");
		valueOf(testRun, nodes.length).shouldBe(1);

		var child = nodes.item(0);
		valueOf(testRun, child).shouldNotBeNull();

		var attrs = test.attributes;

		// length
		valueOf(testRun, attrs.length).shouldBe(3);

		// item
		var item0 = attrs.item(0);
		var item1 = attrs.item(1);
		var item2 = attrs.item(2);
		valueOf(testRun, item0).shouldNotBeNull();
		valueOf(testRun, item1).shouldNotBeNull();
		valueOf(testRun, item2).shouldNotBeNull();
		valueOf(testRun, item0.nodeName).shouldBe("attr1");
		valueOf(testRun, item0.value).shouldBe("value1");
		valueOf(testRun, item1.nodeName).shouldBe("test:attr2");
		valueOf(testRun, item1.value).shouldBe("value2");
		valueOf(testRun, item2.nodeName).shouldBe("attr3");
		valueOf(testRun, item2.value).shouldBe("hello world");

		valueOf(testRun, attrs.item(3)).shouldBeNull();

		// getNamedItem
		var attr1 = attrs.getNamedItem("attr1");
		valueOf(testRun, attr1).shouldNotBeNull();
		valueOf(testRun, attr1.value).shouldBe("value1");
		valueOf(testRun, attrs.getNamedItem("idontexist")).shouldBe(null);

		// getNamedItemNS
		var attr2 = attrs.getNamedItemNS("http://www.test.com/namespace", "attr2")
		valueOf(testRun, attr2).shouldNotBeNull();
		valueOf(testRun, attr2.value).shouldBe("value2");
		valueOf(testRun, attrs.getNamedItemNS(null, "fakeattr")).shouldBe(null);

		var attr3 = attrs.getNamedItem("attr3");
		valueOf(testRun, attr3).shouldNotBeNull();
		valueOf(testRun, attr3.value).shouldBe("hello world");

		var newAttr = xml.createAttribute("newAttr");
		newAttr.value = "newValue";

		// setNamedItem
		// Initial set, return value is null
		valueOf(testRun, attrs.setNamedItem(newAttr)).shouldBe(null);
		valueOf(testRun, test.getAttribute("newAttr")).shouldBe("newValue");

		var otherDocAttr = otherDoc.createAttribute("otherAttr");
		otherDocAttr.value = "otherValue";
		// Adding an attr from another doc throws an exception
		valueOf(testRun, function() {
			attrs.setNamedItem(otherDocAttr);
		}).shouldThrowException();

		// Reusing an existing attr node throws an exception
		valueOf(testRun, function() {
			attrs.setNamedItem(child.getNamedItemNS("http://www.test.com/namespace", "name"));
		}).shouldThrowException();

		var newAttr2 = xml.createAttribute("newAttr");
		newAttr2.value = "value2";

		// Setting an attr with an existing, should return the original
		valueOf(testRun, attrs.setNamedItem(newAttr2)).shouldBe(newAttr);
		valueOf(testRun, test.getAttribute("newAttr")).shouldBe("value2");

		var newAttr3 = attrs.getNamedItem("newAttr");
		valueOf(testRun, newAttr3).shouldBe(newAttr2);
		valueOf(testRun, newAttr3.value).shouldBe(newAttr2.value);

		// removeNamedItem
		var removedAttr;
		valueOf(testRun, function() {
			removedAttr = attrs.removeNamedItem("newAttr");
		}).shouldNotThrowException();

		valueOf(testRun, removedAttr).shouldBe(newAttr3);

		// Removing an attr that doesn't exist throws an exception
		valueOf(testRun, function() {
			attrs.removeNamedItem("idontexist");
		}).shouldThrowException();

		// setNamedItemNS
		newAttr = xml.createAttributeNS("http://www.test.com/namespace", "newAttr2");
		newAttr.value = "newValue2";
		valueOf(testRun, attrs.setNamedItemNS(newAttr)).shouldBe(null);

		// Adding an attr from another doc throws an exception
		valueOf(testRun, function() {
			attrs.setNamedItemNS(otherDocAttr);
		}).shouldThrowException();

		// Reusing an existing attr node throws an exception
		valueOf(testRun, function() {
			attrs.setNamedItemNS(child.getNamedItemNS("http://www.test.com/namespace", "name"));
		}).shouldThrowException();

		newAttr2 = attrs.getNamedItemNS("http://www.test.com/namespace", "newAttr2");
		valueOf(testRun, newAttr2).shouldBe(newAttr);
		valueOf(testRun, newAttr2.value).shouldBe(newAttr.value);

		// Setting an attr with an existing, should return the original
		newAttr3 = xml.createAttributeNS("http://www.test.com/namespace", "newAttr2");
		newAttr3.value = "value3";
		valueOf(testRun, attrs.setNamedItemNS(newAttr3)).shouldBe(newAttr2);
		valueOf(testRun, test.getAttributeNS("http://www.test.com/namespace", "newAttr2")).shouldBe("value3");

		// removeNamedItemNS
		valueOf(testRun, function() {
			removedAttr = attrs.removeNamedItemNS("http://www.test.com/namespace", "newAttr2");
		}).shouldNotThrowException();

		valueOf(testRun, removedAttr).shouldBe(newAttr3);

		// Removing an attr that doesn't exist throws an exception
		valueOf(testRun, function() {
			attrs.removeNamedItemNS("http://www.test.com/namespace", "fakeattr");
		}).shouldThrowException();

		// Ensure structure after modifications
		valueOf(testRun, attrs.item(0)).shouldBe(attr1);
		valueOf(testRun, attrs.item(1)).shouldBe(attr2);
		valueOf(testRun, attrs.item(2)).shouldBe(attr3);

		attrs = child.attributes;
		var name = attrs.getNamedItemNS("http://www.test.com/namespace", "name");
		valueOf(testRun, name).shouldNotBeNull();
		valueOf(testRun, name.nodeName).shouldBe("test:name");
		valueOf(testRun, name.value).shouldBe("value");

		finish(testRun);
	};

	this.apiXmlDOMImplementation = function(testRun) {
		var baseDoc = Ti.XML.parseString("<a/>");
		valueOf(testRun, baseDoc).shouldNotBeNull();
		var impl = null;
		valueOf(testRun, function() {
			impl = baseDoc.implementation;
		}).shouldNotThrowException();
		valueOf(testRun, impl).shouldNotBeNull();

		// createDocument
		valueOf(testRun, impl.createDocument).shouldBeFunction();
		var testDoc = null;
		// Basic: no namespace, no doctype
		valueOf(testRun, function() {
			testDoc = impl.createDocument(null, "the_root", null);
		}).shouldNotThrowException()
		valueOf(testRun, testDoc).shouldNotBeNull();
		valueOf(testRun, testDoc.documentElement).shouldNotBeNull();
		valueOf(testRun, testDoc.documentElement.namespaceURI).shouldBeNull();
		valueOf(testRun, testDoc.documentElement.nodeName).shouldBe("the_root");
		valueOf(testRun, testDoc.documentElement.localName).shouldBe("the_root");
		valueOf(testRun, testDoc.doctype).shouldBeNull();
		// Create a doctype (which is useless in dom level 2)
		valueOf(testRun, impl.createDocumentType).shouldBeFunction();
		var doctype = null;
		valueOf(testRun, function() {
			doctype = impl.createDocumentType("qname", "pid", "sid");
		}).shouldNotThrowException();
		// Document with doctype
		testDoc = null;
		valueOf(testRun, function() {
			testDoc = impl.createDocument(null, "the_root", doctype);
		}).shouldNotThrowException()
		valueOf(testRun, testDoc).shouldNotBeNull();
		valueOf(testRun, testDoc.documentElement).shouldNotBeNull();
		valueOf(testRun, testDoc.documentElement.namespaceURI).shouldBeNull();
		valueOf(testRun, testDoc.documentElement.nodeName).shouldBe("the_root");
		valueOf(testRun, testDoc.documentElement.localName).shouldBe("the_root");
		valueOf(testRun, testDoc.doctype).shouldNotBeNull();
		valueOf(testRun, testDoc.doctype).shouldBe(doctype);
		// Document with namespace but no doctype
		testDoc = null;
		valueOf(testRun, function() {
			testDoc = impl.createDocument("http://test", "test:the_root", null);
		}).shouldNotThrowException()
		valueOf(testRun, testDoc).shouldNotBeNull();
		valueOf(testRun, testDoc.documentElement).shouldNotBeNull();
		valueOf(testRun, testDoc.documentElement.namespaceURI).shouldNotBeNull();
		valueOf(testRun, testDoc.documentElement.namespaceURI).shouldBe("http://test");
		valueOf(testRun, testDoc.documentElement.nodeName).shouldBe("test:the_root");
		valueOf(testRun, testDoc.documentElement.localName).shouldBe("the_root");
		valueOf(testRun, testDoc.doctype).shouldBeNull();
		// Document with both namespace and doctype
		valueOf(testRun, function() {
			doctype = impl.createDocumentType("qname", "pid", "sid");
		}).shouldNotThrowException();
		testDoc = null;
		valueOf(testRun, function() {
			testDoc = impl.createDocument("http://test", "test:the_root", doctype);
		}).shouldNotThrowException()
		valueOf(testRun, testDoc).shouldNotBeNull();
		valueOf(testRun, testDoc.documentElement).shouldNotBeNull();
		valueOf(testRun, testDoc.documentElement.namespaceURI).shouldNotBeNull();
		valueOf(testRun, testDoc.documentElement.namespaceURI).shouldBe("http://test");
		valueOf(testRun, testDoc.documentElement.nodeName).shouldBe("test:the_root");
		valueOf(testRun, testDoc.documentElement.localName).shouldBe("the_root");
		valueOf(testRun, testDoc.doctype).shouldNotBeNull();
		valueOf(testRun, testDoc.doctype).shouldBe(doctype);
		// hasFeature
		valueOf(testRun, impl.hasFeature).shouldBeFunction();
		var testResult;
		valueOf(testRun, function() {
			testResult = impl.hasFeature("Core", "2.0");
		}).shouldNotThrowException();
		valueOf(testRun, testResult).shouldBeBoolean();
		valueOf(testRun, testResult).shouldBeTrue();
		valueOf(testRun, function() {
			testResult = impl.hasFeature("Fred", "Flinstone");
		}).shouldNotThrowException();
		valueOf(testRun, testResult).shouldBeBoolean();
		valueOf(testRun, testResult).shouldBeFalse();

		finish(testRun);
	};

	this.xmlElement = function(testRun) {
		var xml = Ti.XML.parseString(testSource["element.xml"]);
		var xml2 = Ti.XML.parseString(testSource["with_ns.xml"]);
		
		 // Test element.getElementsByTagName
		var elements = xml.getElementsByTagName("dessert");
		valueOf(testRun, elements).shouldNotBeNull();
		valueOf(testRun, elements.length).shouldBe(3);
		valueOf(testRun, elements).shouldBeObject();
		valueOf(testRun, elements.item(0).tagName).shouldBe("dessert");
		
		// Test element.getAttribute
		var attribute = elements.item(0).getAttribute("category");
		valueOf(testRun, attribute).shouldBe("icecream");
		var attributeFail = elements.item(0).getAttribute("categories");
		valueOf(testRun, attributeFail).shouldBe("");
		
		// Test element.getAttributeNode
		var attributeNode= elements.item(1).getAttributeNode("category"); //Fails on iOS TIMOB-4867
		valueOf(testRun, attributeNode).shouldNotBeNull();
		valueOf(testRun, attributeNode.name).shouldBe('category');
		valueOf(testRun, attributeNode.value).shouldBe('pie');
		var attributeNodeFail = elements.item(1).getAttributeNode("categories");
		valueOf(testRun, attributeNodeFail).shouldBeNull();
		
		// Test element.hasAttribute
		var attributeTrue = null;
		var attributeFalse = null;
		valueOf(testRun, function() {attributeTrue = elements.item(2).hasAttribute("category");}).shouldNotThrowException(); //Fails on iOS TIMOB-5024
		valueOf(testRun, function() {attributeFalse = elements.item(2).hasAttribute("food");}).shouldNotThrowException(); 
		valueOf(testRun, attributeTrue).shouldBeTrue();
		valueOf(testRun, attributeFalse).shouldBeFalse();
		
		// Test element.removeAttribute
		elements.item(0).removeAttribute("category"); //Fails on iOS TIMOB-4868
		attribute = elements.item(0).getAttribute("category");
		valueOf(testRun, attribute).shouldBe("");
		
		// Test element.removeAttributeNode
		var dessertNode = elements.item(1).getAttributeNode("category");
		var errorNode = elements.item(1).getAttributeNode("error");
		valueOf(testRun, errorNode).shouldBeNull();
		var attributeNodeRemove = elements.item(1).removeAttributeNode(dessertNode);
		valueOf(testRun, attributeNodeRemove.name).shouldBe("category");
		valueOf(testRun, function() {
			elements.item(1).removeAttributeNode(errorNode);
		}).shouldThrowException();
		
		// Test element.setAttribute
		elements = xml.getElementsByTagName("title");
		elements.item(0).setAttribute("rating","taste yummy");
		valueOf(testRun, elements.item(0).childNodes.item(0).nodeValue).shouldBe("Banana Split");
		valueOf(testRun, elements.item(0).getAttribute("rating")).shouldBe("taste yummy");
		elements.item(0).setAttribute("rating","cookie");
		valueOf(testRun, elements.item(0).getAttribute("rating")).shouldBe("cookie");
		valueOf(testRun, function() {
			elements.item(0).setAttribute("?","*");
		}).shouldThrowException();
		
		// Test element.setAttributeNode
		elements = xml.getElementsByTagName("title"); //Fails on iOS TIMOB-5027
		var newAttributeNode = xml.createAttribute("rating");
		newAttributeNode.value = "taste good";
		var newAttr = elements.item(1).setAttributeNode(newAttributeNode);
		valueOf(testRun, newAttr).shouldBeNull();
		valueOf(testRun, elements.item(1).childNodes.item(0).nodeValue).shouldBe("Banana Cream Pie");
		valueOf(testRun, elements.item(1).getAttribute("rating")).shouldBe("taste good");
		var existAttributeNode = xml.createAttribute("rating");
		existAttributeNode.value = "tasty";
		var existAttr = elements.item(1).setAttributeNode(existAttributeNode);
		valueOf(testRun, elements.item(1).getAttribute("rating")).shouldBe("tasty");
		valueOf(testRun, existAttr.value).shouldBe("taste good");
		valueOf(testRun, newAttributeNode).shouldBe(existAttr);
		valueOf(testRun, function() {
			elements.item(1).setAttributeNode(newAttributeNode);
		}).shouldNotThrowException();
		valueOf(testRun, function() {
			elements.item(2).setAttributeNode(newAttributeNode);
		}).shouldThrowException();
		var newAttributeWrong = xml2.createAttribute("testing");
		newAttributeWrong.value = "exception";
		valueOf(testRun, function() {
			elements.item(1).setAttributeNode(newAttributeWrong);
		}).shouldThrowException();

		finish(testRun);
	};
	
	this.xmlElementNS = function(testRun) {
		var xml = Ti.XML.parseString(testSource["elementNS.xml"]);
		var xml2 = Ti.XML.parseString(testSource["with_ns.xml"]);
		var namespace1 = "http://candystore.com";
		var namespace2 = "http://toystore.com";
		
		
		// Test element.getElementsByTagNameNS
		var elementsNS = xml.getElementsByTagNameNS(namespace1, "ingredient");
		var elementsNS2 = xml.getElementsByTagNameNS(namespace2, "material");
		valueOf(testRun, elementsNS).shouldNotBeNull();
		valueOf(testRun, elementsNS).shouldBeObject();
		valueOf(testRun, elementsNS.length).shouldBe(3);
		valueOf(testRun, elementsNS.item(0).tagName).shouldBe("candy:ingredient"); 
		valueOf(testRun, elementsNS2).shouldNotBeNull();
		valueOf(testRun, elementsNS2).shouldBeObject();
		valueOf(testRun, elementsNS2.length).shouldBe(3);
		valueOf(testRun, elementsNS2.item(0).tagName).shouldBe("toy:material");
		
		
		// Test element.getAttributeNS
		var attributeNS = elementsNS.item(0).getAttributeNS(namespace1, "amount");
		valueOf(testRun, attributeNS).shouldBe("one cup");
		var attributeFailNS = elementsNS.item(0).getAttributeNS(namespace1, "amounts");
		valueOf(testRun, attributeFailNS).shouldBe("");
		
		// Test element.getAttributeNodeNS
		var attributeNodeNS= elementsNS.item(1).getAttributeNodeNS(namespace1, "amount");
		valueOf(testRun, attributeNodeNS.nodeName).shouldBe("candy:amount");
		valueOf(testRun, attributeNodeNS.nodeValue).shouldBe("two cup");
		var attributeNodeFailNS = elementsNS.item(1).getAttributeNodeNS(namespace1, "amounts");
		valueOf(testRun, attributeNodeFailNS).shouldBeNull();
		
		// Test element.hasAttributeNS
		var attributeNSTrue = null;
		var attributeNSFalse = null;
		valueOf(testRun, function() {attributeNSTrue = elementsNS.item(2).hasAttributeNS(namespace1, "amount");}).shouldNotThrowException();
		valueOf(testRun, function() {attributeNSFalse = elementsNS.item(2).hasAttributeNS(namespace1, "food");}).shouldNotThrowException();
		valueOf(testRun, attributeNSTrue).shouldBeTrue();
		valueOf(testRun, attributeNSFalse).shouldBeFalse();
		
		// Test element.removeAttributeNS
		elementsNS2.item(0).removeAttributeNS(namespace2, "content");
		attributeNS = elementsNS2.item(0).getAttributeNS(namespace2, "content");
		valueOf(testRun, attributeNS).shouldBe("");
		
		// Test element.setAttributeNS
		elementsNS2.item(1).setAttributeNS(namespace2, "toy:color","white");
		valueOf(testRun, elementsNS2.item(1).childNodes.item(0).nodeValue).shouldBe("polyester");
		valueOf(testRun, elementsNS2.item(1).getAttributeNS(namespace2, "color")).shouldBe("white");
		elementsNS2.item(1).setAttributeNS(namespace2, "toy:color","black");
		valueOf(testRun, elementsNS2.item(1).getAttributeNS(namespace2, "color")).shouldBe("black");
		valueOf(testRun, function() {
			elementsNS2.item(1).setAttributeNS(namespace2, "?","*");
		}).shouldThrowException();
		valueOf(testRun, function() {
			elementsNS2.item(1).setAttributeNS(namespace2, "malform:name:test","test");
		}).shouldThrowException();
		valueOf(testRun, function() {
			elementsNS2.item(1).setAttributeNS(namespace3, "name:test","namespace failure");
		}).shouldThrowException();
		
		// Test element.setAttributeNodeNS
		var newAttributeNodeNS = xml.createAttributeNS(namespace2, "toy:color");
		newAttributeNodeNS.nodeValue = "blue";
		var newAttrNS = elementsNS2.item(2).setAttributeNodeNS(newAttributeNodeNS);
		valueOf(testRun, newAttrNS).shouldBeNull();
		valueOf(testRun, elementsNS2.item(2).childNodes.item(0).nodeValue).shouldBe("buttons");
		valueOf(testRun, elementsNS2.item(2).getAttributeNS(namespace2, "color")).shouldBe("blue");
		var existAttributeNodeNS = xml.createAttributeNS(namespace2, "toy:color");
		existAttributeNodeNS.nodeValue = "pink";
		var existAttrNS = elementsNS2.item(2).setAttributeNodeNS(existAttributeNodeNS);
		valueOf(testRun, elementsNS2.item(2).getAttributeNS(namespace2, "color")).shouldBe("pink");
		valueOf(testRun, existAttrNS.value).shouldBe("blue");
		valueOf(testRun, newAttributeNodeNS).shouldBe(existAttrNS);
		valueOf(testRun, function() {
			elementsNS.item(1).setAttributeNode(newAttributeNodeNS);
		}).shouldNotThrowException();
		valueOf(testRun, function() {
			elementsNS.item(2).setAttributeNode(newAttributeNodeNS);
		}).shouldThrowException();
		
		var newAttributeNSWrong = xml2.createAttributeNS(namespace2, "toy:color");
		newAttributeNSWrong.value = "exception";
		valueOf(testRun, function() {
			elementsNS2.item(1).setAttributeNode(newAttributeNSWrong);
		}).shouldThrowException();

		finish(testRun);
	};
};
