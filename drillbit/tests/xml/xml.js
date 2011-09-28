describe("Ti.XML tests", {
	before_all: function() {
		this.countNodes = function(node, type) {
			var nodeCount = 0;
			type = typeof(type) == 'undefined' ? null : type;
			
			for (var i = 0; i < node.childNodes.length; i++) {
				var child = node.childNodes.item(i);
				if (type == null || child.nodeType == type) {
					nodeCount++;
					nodeCount += this.countNodes(child, type);
				}
			}
			return nodeCount;
		};
		
		var testFiles = ["soap.xml", "xpath.xml", "nodes.xml", "nodeCount.xml", "cdata.xml", "cdataEntities.xml", "with_dtd.xml", "with_ns.xml", "attrs.xml", "element.xml", "elementNS.xml"];
		var invalidFiles = [ "mismatched_tag.xml", "no_toplevel.xml", "no_end.xml"];
		this.testSource = {};
		this.invalidSource = {};
		for (var i = 0; i < testFiles.length; i++) {
			this.testSource[testFiles[i]] = Ti.Filesystem.getFile(testFiles[i]).read().toString();
		}
		
		for (var i = 0; i < invalidFiles.length; i++) {
			this.invalidSource[invalidFiles[i]] = Ti.Filesystem.getFile(invalidFiles[i]).read().toString();
		}
	},
	
	documentParsing: function() {
		var localSources = this.testSource;
		var localInvalid = this.invalidSource;
		// Parse valid documents
		valueOf(function() {
			Ti.XML.parseString(localSources["soap.xml"]);
		}).shouldNotThrowException();
		valueOf(function() {
			Ti.XML.parseString(localSources["xpath.xml"]);
		}).shouldNotThrowException();
		valueOf(function() {
			Ti.XML.parseString(localSources["nodes.xml"]);
		}).shouldNotThrowException();
		valueOf(function() {
			Ti.XML.parseString(localSources["nodeCount.xml"]);
		}).shouldNotThrowException();
		valueOf(function() {
			Ti.XML.parseString(localSources["cdata.xml"]);
		}).shouldNotThrowException();
		valueOf(function() {
			Ti.XML.parseString(localSources["cdataEntities.xml"]);
		}).shouldNotThrowException();
		
		// Parse empty document - spec specifies that a valid XML doc
		// must have a root element (empty string doesn't)
		valueOf(function() {
			Ti.XML.parseString('');
		}).shouldThrowException();
		
		// Parse (some types of) invalid documents
		valueOf(function() {
			Ti.XML.parseString(localInvalid["mismatched_tag.xml"]);
		}).shouldThrowException();
		valueOf(function() {
			Ti.XML.parseString(localInvalid["no_end.xml"]);
		}).shouldThrowException();
		valueOf(function() {
			Ti.XML.parseString(localInvalid["no_toplevel.xml"]);
		}).shouldThrowException();
	},
	
	// These 6 tests are adapted from the KitchenSink xml_dom test
	soap: function() {
		var xml = Ti.XML.parseString(this.testSource["soap.xml"]);
		var fooBarList = xml.documentElement.getElementsByTagName("FooBar");
		valueOf(fooBarList).shouldNotBeNull();
		valueOf(fooBarList.length).shouldBe(1);
		valueOf(fooBarList.item(0)).shouldBeObject();
		
		var item = fooBarList.item(0);
		valueOf(item.text).shouldBe("true");
		valueOf(item.nodeName).shouldBe("FooBar");
	},
	
	xpath: function() {
		var xml = Ti.XML.parseString(this.testSource["xpath.xml"]);
		var fooBarList = xml.documentElement.getElementsByTagName("FooBar");
		valueOf(fooBarList).shouldNotBeNull();
		valueOf(fooBarList.length).shouldBe(1);
		valueOf(fooBarList.item(0)).shouldBeObject();
		
		var item = fooBarList.item(0);
		valueOf(item.text).shouldBe("true");
		valueOf(item.nodeName).shouldBe("FooBar");
		
		// test XPath against Document
		var docResult = xml.evaluate("//FooBar/text()");
		valueOf(docResult).shouldNotBeNull();
		valueOf(docResult.length).shouldBe(1);
		valueOf(docResult.item(0).nodeValue).shouldBe("true");

		// test XPath against Element
		var elResult = xml.documentElement.evaluate("//FooBar/text()");
		valueOf(elResult).shouldNotBeNull();
		valueOf(elResult.length).shouldBe(1);
		valueOf(elResult.item(0).nodeValue).shouldBe("true");

		// test XPath against Element
		elResult = item.evaluate("text()");
		valueOf(elResult).shouldNotBeNull();
		valueOf(elResult.length).shouldBe(1);
		valueOf(elResult.item(0).nodeValue).shouldBe("true");
	},
	
	xmlNodes: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);
		var nodesList = doc.getElementsByTagName("nodes");

		valueOf(nodesList).shouldNotBeNull();
		valueOf(nodesList.length).shouldBe(1);
		
		var nodes = nodesList.item(0);
		var elements = nodes.getElementsByTagName("node");
		valueOf(elements).shouldNotBeNull();
		valueOf(elements.length).shouldBe(13);
		
		var children = nodes.childNodes;
		valueOf(children).shouldNotBeNull();
		valueOf(children).shouldBeObject();
		
		valueOf(this.countNodes(elements.item(0), 1)).shouldBe(6);
		valueOf(children.item).shouldBeFunction();

		elements = doc.firstChild.childNodes;
		valueOf(elements).shouldNotBeNull();
		valueOf(this.countNodes(nodes, 1)).shouldBe(13);
		
		valueOf(nodes.nodeName).shouldBe("nodes");
		valueOf(doc.documentElement.nodeName).shouldBe("response");
		valueOf(nodes.getAttribute("id"), "nodes");
		
		var node = nodes.getElementsByTagName("node").item(0);
		valueOf(node.getAttribute("id")).shouldBe("node 1");
		
		var subnodes = node.getElementsByTagName("node");
		valueOf(subnodes.item(0).getAttribute("id")).shouldBe("node 2");
	},
	
	xmlNodeCount: function() {
		var xml = Ti.XML.parseString(this.testSource["nodeCount.xml"]);
		var oneList = xml.documentElement.getElementsByTagName("one");
		var twoList = oneList.item(0).getElementsByTagName("two");
		var threeList = oneList.item(0).getElementsByTagName("three");
		var nodes = xml.getElementsByTagName("root");

		valueOf(oneList.length).shouldBe(1);
		valueOf(twoList.length).shouldBe(2);
		valueOf(threeList.length).shouldBe(4);
		
		var one = xml.documentElement.getElementsByTagName("one").item(0);
		var next = one.nextSibling;
		while (next != null && next.nodeType != next.ELEMENT_NODE) {
			next = next.nextSibling;
		}
		
		valueOf(one).shouldNotBeNull();
		valueOf(next).shouldNotBeNull();
		valueOf(one.nodeName).shouldBe("one");
		valueOf(xml.documentElement.attributes.getNamedItem("id").nodeValue).shouldBe("here");
		valueOf(next.getAttribute("id")).shouldBe("bar");
		valueOf(one.ownerDocument.documentElement.nodeName).shouldBe(xml.documentElement.ownerDocument.documentElement.nodeName);

		var nodeCount = this.countNodes(nodes.item(0), 1);
		valueOf(nodeCount).shouldBe(8);
	},
	
	xmlCData: function() {
		var xml = Ti.XML.parseString(this.testSource["cdata.xml"]);
		var scriptList = xml.documentElement.getElementsByTagName("script");
		valueOf(scriptList.length).shouldBe(1);

		valueOf(xml.documentElement.nodeName).shouldBe("root");
		var nodeCount = this.countNodes(xml.documentElement, 1);
		valueOf(nodeCount).shouldBe(1);

		var script = scriptList.item(0);
		var cData;
		for (i = 0; i < script.childNodes.length; i++) {
			var node = script.childNodes.item(i);
			if (node.nodeType == node.CDATA_SECTION_NODE) {
				cData = node;
				break;
			}
		}
		valueOf(cData).shouldNotBeNull();

		//CharacterDataAttributes
		var fullString = cData.data;
		valueOf(fullString).shouldBe("\nfunction matchwo(a,b)\n{\nif (a < b && a < 0) then\n  {\n  return 1;\n  }\nelse\n  {\n  return 0;\n  }\n}\n");
		cData.data = "Test Assignment";
		valueOf(cData.data).shouldBe("Test Assignment");

		cData.data = fullString;
		var fullLength = cData.length;
		valueOf(fullLength).shouldBe(fullString.length);

		// CharacterData.substringData
		var substring1 = cData.substringData(1, 8);
		valueOf(substring1).shouldBe(fullString.substr(1, 8));
		// asking for more than there is should not throw exception
		// according to spec, rather just return up to end.
		var substring2 = null;
		valueOf(function() {
			substring2 = cData.substringData(1, 1000);
		}).shouldNotThrowException();
		valueOf(substring2.length).shouldBe(fullLength - 1);
		valueOf(substring2).shouldBe(fullString.substr(1, 1000));
		// check edge cases
		substring2 = cData.substringData(0, fullLength);
		valueOf(substring2.length).shouldBe(fullLength);
		valueOf(substring2).shouldBe(fullString);
		substring2 = cData.substringData(1, fullLength);
		valueOf(substring2.length).shouldBe(fullLength - 1);
		valueOf(substring2).shouldBe(fullString.substr(1, fullLength));
		substring2 = cData.substringData(0, fullLength + 1);
		valueOf(substring2.length).shouldBe(fullLength);
		valueOf(substring2).shouldBe(fullString.substr(0, fullLength + 1));
		valueOf(function() {
			var substring3 = cData.substringData(1000, 1001);
		}).shouldThrowException();
		valueOf(function() {
			var substring4 = cData.substringData(-1, 101);
		}).shouldThrowException();
		valueOf(function() {
			var substring5 = cData.substringData(0, -1);
		}).shouldThrowException();

		//CharacterData.appendData
		var cDataLength = cData.length;
		cData.appendData("Appending");
		var substring6 = cData.substringData(97, 9);
		valueOf(cData.length).shouldBe(cDataLength + 9);
		valueOf(substring6).shouldBe("Appending");
		valueOf(function() {
			script.appendData("ReadOnly");
		}).shouldThrowException();

		//CharacterData.insertData
		cData.insertData(9, "InsertData");
		var substring7 = cData.substringData(9, 10);
		valueOf(substring7).shouldBe("InsertData");
		valueOf(function() {
			cData.insertData(-1, "InsertFail");
		}).shouldThrowException();
		valueOf(function() {
			cData.insertData(1000, "InsertFail");
		}).shouldThrowException();
		valueOf(function() {
			script.insertData(1, "ReadOnly");
		}).shouldThrowException();

		//CharacterData.replaceData
		cData.replaceData(9, 1, "ReplaceData");
		var substring8 = cData.substringData(9, 20);
		valueOf(substring8).shouldBe("ReplaceDatansertData");
		cDataLength = cData.length;
		cData.replaceData(cDataLength,100,"ReplaceData");
		valueOf(cData.length).shouldBe(cDataLength + 11);
		valueOf(function() {
			cData.replaceDate(-1, 2, "Failure");
		}).shouldThrowException();
		cDataLength = cData.length;
		valueOf(function() {
			cData.replaceDate(cDataLength + 1, 2, "Failure");
		}).shouldThrowException();
		valueOf(function() {
			cData.replaceDate(1, -1, "Failure");
		}).shouldThrowException();

		//CharacterData.deleteData
		cDataLength = cData.length;
		cData.deleteData(1, 8);
		valueOf(cData.length).shouldBe(cDataLength - 8);
		valueOf(function() {
			cData.deleteData(-1, 10);
		}).shouldThrowException();
		valueOf(function() {
			cData.deleteData(1000, 1001);
		}).shouldThrowException();
		valueOf(function() {
			cData.deleteData(0, -1);
		}).shouldThrowException();
		cData.deleteData(1, 1000);
		valueOf(cData.length).shouldBe(1);
		valueOf(function() {
			script.deleteData(0, 1);
		}).shouldThrowException();
	},
	
	xmlCDataAndEntities: function() {
		var xml = Ti.XML.parseString(this.testSource["cdataEntities.xml"]);
		var dataList = xml.documentElement.getElementsByTagName("data");
		var subdataList = xml.documentElement.getElementsByTagName("subdata");
		valueOf(xml.documentElement.firstChild.nodeName).shouldBe("subdata");
		
		var nodeCount = this.countNodes(subdataList.item(0), 1);
		valueOf(nodeCount).shouldBe(2);
	},
	
	xmlSerialize: function() {
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
			valueOf(a.nodeType).shouldBe(b.nodeType);
			valueOf(a.nodeName).shouldBe(b.nodeName);
			valueOf(a.nodeValue).shouldBe(b.nodeValue);
			
			if (a.nodeType == 1) {
				var aAttribs = sortAttributeList(a.attributes);
				var bAttribs = sortAttributeList(b.attributes);
				valueOf(aAttribs.length).shouldBe(bAttribs.length);
				
				for (var i = 0; i < aAttribs.length; i++) {
					matchXmlTrees(aAttribs[i], bAttribs[i]);
				}
				
				var aChildren = a.childNodes;
				var bChildren = b.childNodes;
				valueOf(aChildren.length).shouldBe(bChildren.length);

				for (var i = 0; i < aChildren.length; i++) {
					matchXmlTrees(aChildren.item(i), bChildren.item(i));
				}
			}
		}
		
		for (var sourceName in this.testSource) {
			var a = Ti.XML.parseString(this.testSource[sourceName]);
			var bstr = Ti.XML.serializeToString(a);
			var b = Ti.XML.parseString(bstr);
			
			// Make sure we can round-trip from source to DOM to source and back to DOM...
			matchXmlTrees(a, b);
		}
	},

	apiXMLTextSplitText: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);
		var firstString = "first part|";
		var secondString = "second part";
		var completeString = firstString + secondString;

		valueOf(doc.createTextNode).shouldBeFunction();

		var parentNode = doc.createElement("parentNode");
		var childNode = doc.createTextNode(completeString);
		parentNode.appendChild(childNode);
		valueOf(parentNode.childNodes.length).shouldBe(1);

		valueOf(function() { splitTextResults = parentNode.firstChild.splitText(firstString.length); }).shouldNotThrowException();

		valueOf(parentNode.childNodes.length).shouldBe(2);
		valueOf(splitTextResults.nodeValue).shouldBe(parentNode.lastChild.nodeValue);
		valueOf(firstString).shouldBe(parentNode.firstChild.nodeValue);
		valueOf(secondString).shouldBe(parentNode.lastChild.nodeValue);

		// Out-of-bounds exceptions are in the spec:
		completeString = "New text node";
		childNode = doc.createTextNode(completeString);
		valueOf(function() {
			childNode.splitText(-1);
		}).shouldThrowException();
		valueOf(function() {
			childNode.splitText(completeString.length + 1);
		}).shouldThrowException();
	},

	apiXMLTextGetText: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);
		var textValue = "this is some test";

		valueOf(doc.createTextNode).shouldBeFunction();
		var textNode = doc.createTextNode(textValue);
		valueOf(textNode.nodeValue).shouldBe(textValue);

		var getTextResults = null;
		valueOf(function() { getTextResults = textNode.getText(); }).shouldNotThrowException();
		valueOf(getTextResults).shouldBe(textValue);
		valueOf(function() { getTextResults2 = textNode.text; }).shouldNotThrowException();
		valueOf(getTextResults2).shouldBe(textValue);
	},

	apiXmlDocumentProperties: function() {
		// File with DTD
		var doc = Ti.XML.parseString(this.testSource["with_dtd.xml"]);
		valueOf(doc.documentElement).shouldNotBeUndefined();
		valueOf(doc.documentElement).shouldNotBeNull();
		valueOf(doc.documentElement).shouldBeObject();
		valueOf(doc.documentElement.nodeName).shouldBe("letter");
		valueOf(doc.implementation).shouldNotBeUndefined();
		valueOf(doc.implementation).shouldNotBeNull();
		valueOf(doc.implementation).shouldBeObject();
		valueOf(doc.doctype).shouldNotBeUndefined();
		valueOf(doc.doctype).shouldNotBeNull();
		valueOf(doc.doctype).shouldBeObject();
		// Document without DTD, to be sure doc.doctype is null as spec says
		doc = Ti.XML.parseString("<a/>");
		valueOf(doc.doctype).shouldBeNull();
	},
	apiXmlDocumentCreateAttribute: function() {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(doc.createAttribute).shouldBeFunction();
		var attr = doc.createAttribute("myattr");
		valueOf(attr).shouldNotBeNull();
		valueOf(attr).shouldBeObject();
		valueOf(attr.name).shouldBe("myattr");
		// Per spec, value in new attribute should be empty string
		valueOf(attr.value).shouldNotBeNull();
		valueOf(attr.value).shouldBeExactly("");

		attr = null;
		valueOf(doc.createAttributeNS).shouldBeFunction();
		attr = doc.createAttributeNS("http://example.com", "prefix:myattr");
		valueOf(attr).shouldNotBeNull();
		valueOf(attr).shouldBeObject();
		valueOf(attr.name).shouldBe("prefix:myattr");
		valueOf(attr.namespaceURI).shouldBe("http://example.com");
		valueOf(attr.prefix).shouldBe("prefix");
		valueOf(attr.value).shouldNotBeNull();
		valueOf(attr.value).shouldBeExactly("");
	},
	apiXmlDocumentCreateCDATASection: function() {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(doc.createCDATASection).shouldBeFunction();
		var data = "This is my CDATA section";
		var section = doc.createCDATASection(data);
		valueOf(section).shouldNotBeNull();
		valueOf(section).shouldBeObject();
		valueOf(section.text).shouldBe(data);
	},
	apiXmlDocumentCreateComment: function() {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(doc.createComment).shouldBeFunction();
		var data = "This is my comment";
		var comment = doc.createComment(data);
		valueOf(comment).shouldNotBeNull();
		valueOf(comment).shouldBeObject();
		valueOf(comment.data).shouldBe(data);
	},
	apiXmlDocumentCreateDocumentFragment: function() {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(doc.createDocumentFragment).shouldBeFunction();
		var frag = doc.createDocumentFragment();
		valueOf(frag).shouldNotBeNull();
		valueOf(frag).shouldBeObject();
	},
	apiXmlDocumentCreateElement: function() {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(doc.createElement).shouldBeFunction();
		var elem = doc.createElement("myelement");
		valueOf(elem).shouldNotBeNull();
		valueOf(elem).shouldBeObject();
		valueOf(elem.nodeName).shouldBe("myelement");
		valueOf(elem.localName).shouldBeNull();
		valueOf(elem.prefix).shouldBeNull();
		valueOf(elem.namespaceURI).shouldBeNull();
	},
	apiXmlDocumentCreateElementNS: function() {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(doc.createElementNS).shouldBeFunction();
		var elem = doc.createElementNS("http://example.com", "prefix:myelement");
		valueOf(elem).shouldNotBeNull();
		valueOf(elem).shouldBeObject();
		valueOf(elem.nodeName).shouldBe("prefix:myelement");
		valueOf(elem.localName).shouldBe("myelement");
		valueOf(elem.prefix).shouldBe("prefix");
		valueOf(elem.namespaceURI).shouldBe("http://example.com");
	},
	apiXmlDocumentCreateEntityReference: function() {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(doc.createEntityReference).shouldBeFunction();
		var entity = doc.createEntityReference("myentity");
		valueOf(entity).shouldNotBeNull();
		valueOf(entity).shouldBeObject();
		valueOf(entity.nodeName).shouldBe("myentity");
	},
	apiXmlDocumentCreateProcessingInstruction: function() {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(doc.createProcessingInstruction).shouldBeFunction();
		var instruction = doc.createProcessingInstruction("a", "b");
		valueOf(instruction).shouldNotBeNull();
		valueOf(instruction).shouldBeObject();
		valueOf(instruction.target).shouldBe("a");
		valueOf(instruction.data).shouldBe("b");
	},
	apiXmlDocumentCreateTextNode: function() {
		var doc = Ti.XML.parseString("<test/>");
		valueOf(doc.createTextNode).shouldBeFunction();
		var value = "This is some text";
		var text = doc.createTextNode(value);
		valueOf(text).shouldNotBeNull();
		valueOf(text).shouldBeObject();
		valueOf(text.data).shouldBe(value);
	},
	apiXmlDocumentGetElementById: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);
		valueOf(doc.getElementById).shouldBeFunction();
		var node = doc.getElementById("node 1");
		valueOf(node).shouldNotBeNull();
		valueOf(node).shouldBeObject();
		valueOf(node.nodeName).shouldBe("node");
		valueOf(function() {
			node = doc.getElementById("no_such_element");
		}).shouldNotThrowException();
		valueOf(node).shouldBeNull();
	},
	apiXmlDocumentGetElementsByTagName: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);
		valueOf(doc.getElementsByTagName).shouldBeFunction();
		var elements = doc.getElementsByTagName("node");
		valueOf(elements).shouldNotBeNull();
		valueOf(elements).shouldBeObject();
		valueOf(elements.length).shouldBeGreaterThan(0);
		for (var i = 0; i < elements.length; i++) {
			var checkelem = elements.item(i);
			valueOf(checkelem.nodeName).shouldBe("node");
		}
		// test bogus tagname
		valueOf(function() {
			elements = doc.getElementsByTagName("bogus");
		}).shouldNotThrowException();
		valueOf(elements).shouldNotBeNull();
		valueOf(elements).shouldBeObject();
		valueOf(elements.length).shouldBeExactly(0);
	},
	apiXmlDocumentGetElementsByTagNameNS: function() {
		var doc = Ti.XML.parseString(this.testSource["with_ns.xml"]);
		valueOf(doc.getElementsByTagNameNS).shouldBeFunction();
		var elements = doc.getElementsByTagNameNS("http://example.com", "cake");
		valueOf(elements).shouldNotBeNull();
		valueOf(elements).shouldBeObject();
		valueOf(elements.length).shouldBeGreaterThan(0);
		for (var i = 0; i < elements.length; i++) {
			var checkelem = elements.item(i);
			valueOf(checkelem.localName).shouldBe("cake");
			valueOf(checkelem.namespaceURI).shouldBe("http://example.com");
		}
		// test real namespace and bogus tagname
		valueOf(function() {
			elements = doc.getElementsByTagNameNS("http://example.com", "bogus");
		}).shouldNotThrowException();
		valueOf(elements).shouldNotBeNull();
		valueOf(elements).shouldBeObject();
		valueOf(elements.length).shouldBeExactly(0);
		// test bogus namespace and real tagname
		valueOf(function() {
			elements = doc.getElementsByTagNameNS("http://bogus.com", "pie");
		}).shouldNotThrowException();
		valueOf(elements).shouldNotBeNull();
		valueOf(elements).shouldBeObject();
		valueOf(elements.length).shouldBeExactly(0);
		// test bogus namespace and bogus tagname
		valueOf(function() {
			elements = doc.getElementsByTagNameNS("http://bogus.com", "bogus");
		}).shouldNotThrowException();
		valueOf(elements).shouldNotBeNull();
		valueOf(elements).shouldBeObject();
		valueOf(elements.length).shouldBeExactly(0);
	},
	apiXmlDocumentImportNode: function() {
		var doc = Ti.XML.parseString("<a/>");
		var otherDoc = Ti.XML.parseString(this.testSource["with_ns.xml"]);
		var cakeNodes = otherDoc.documentElement.getElementsByTagNameNS("http://example.com", "cake");
		valueOf(cakeNodes).shouldNotBeNull();
		valueOf(cakeNodes.length).shouldBeGreaterThan(0);
		var cakeNode = cakeNodes.item(0);
		valueOf(cakeNode).shouldNotBeNull();
		valueOf(doc.importNode).shouldBeFunction();
		// test deep import
		var importedNode;
		valueOf(function() {
			importedNode = doc.importNode(cakeNode, true);
		}).shouldNotThrowException();
		valueOf(importedNode.ownerDocument).shouldNotBeNull();
		valueOf(importedNode.ownerDocument).shouldBeObject();
		valueOf(importedNode.ownerDocument).shouldBe(doc);
		valueOf(importedNode.parentNode).shouldBeNull();
		valueOf(importedNode.hasChildNodes()).shouldBeTrue();
		valueOf(importedNode.childNodes.length).shouldBeGreaterThan(0);
		valueOf(importedNode.namespaceURI).shouldBe("http://example.com");
		// test shallow import
		valueOf(function() {
			importedNode = doc.importNode(cakeNode, false);
		}).shouldNotThrowException();
		valueOf(importedNode.hasChildNodes()).shouldBeFalse();
		valueOf(importedNode.ownerDocument).shouldNotBeNull();
		valueOf(importedNode.ownerDocument).shouldBeObject();
		valueOf(importedNode.ownerDocument).shouldBe(doc);
		valueOf(importedNode.parentNode).shouldBeNull();
	},

	apiXmlNodeProperties: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);

		var nodesList = doc.getElementsByTagName("nodes");
		valueOf(nodesList).shouldNotBeNull();
		valueOf(nodesList.length).shouldBe(1);

		var node = nodesList.item(0);

		// verify properties
		valueOf(node.ELEMENT_NODE).shouldBeNumber();
		valueOf(node.ATTRIBUTE_NODE).shouldBeNumber();
		valueOf(node.TEXT_NODE).shouldBeNumber();
		valueOf(node.CDATA_SECTION_NODE).shouldBeNumber();
		valueOf(node.ENTITY_REFERENCE_NODE).shouldBeNumber();
		valueOf(node.ENTITY_NODE).shouldBeNumber();
		valueOf(node.PROCESSING_INSTRUCTION_NODE).shouldBeNumber();
		valueOf(node.COMMENT_NODE).shouldBeNumber();
		valueOf(node.DOCUMENT_NODE).shouldBeNumber();
		valueOf(node.DOCUMENT_TYPE_NODE).shouldBeNumber();
		valueOf(node.DOCUMENT_FRAGMENT_NODE).shouldBeNumber();
		valueOf(node.NOTATION_NODE).shouldBeNumber();
		valueOf(node.nodeName).shouldBeString();

		var attrName = "attr";
		var attrValue = "value";
		node.setAttribute(attrName, attrValue);
		var attrNode = node.getAttributeNode(attrName);
		valueOf(attrNode.nodeValue).shouldBe(attrValue);

		var CDATANodeContents = "this CDATA contents";
		var CDATANode = doc.createCDATASection(CDATANodeContents);
		valueOf(CDATANode.nodeValue).shouldBe(CDATANodeContents);

		var commentNodeContents = "this is a comment";
		var commentNode = doc.createComment(commentNodeContents);
		valueOf(commentNode.nodeValue).shouldBe(commentNodeContents);

		valueOf(doc.nodeValue).shouldBe(null);
		valueOf(doc.createDocumentFragment().nodeValue).shouldBe(null);
		valueOf(doc.getDoctype().nodeValue).shouldBe(null);
		valueOf(node.nodeValue).shouldBe(null);
		valueOf(doc.createEntityReference("blah").nodeValue).shouldBe(null);

		var processingInstructionData = "data";
		valueOf(doc.createProcessingInstruction("target", processingInstructionData).nodeValue).shouldBe(processingInstructionData);

		var textNodeContents = "this is some text";
		var textNode = doc.createTextNode(textNodeContents);
		valueOf(textNode.nodeValue).shouldBe(textNodeContents);

		valueOf(node.nodeType).shouldBeNumber();
		valueOf(node.parentNode).shouldBeObject();
		valueOf(node.childNodes).shouldBeObject();
		valueOf(node.firstChild).shouldBeObject();
		valueOf(node.lastChild).shouldBeObject();
		valueOf(node.previousSibling).shouldBeObject();
		valueOf(node.nextSibling).shouldBeObject();
		valueOf(node.attributes).shouldBeObject();
		valueOf(node.ownerDocument).shouldBeObject();
		valueOf(node.namespaceURI).shouldNotBeUndefined();
		valueOf(node.prefix).shouldNotBeUndefined();
		valueOf(node.localName).shouldNotBeUndefined();
	},

	apiXmlNodeAppendChild: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		valueOf(parentNode.appendChild).shouldBeFunction();

		var childNode = doc.createElement("childNode");
		valueOf(function() { parentNode.appendChild(childNode); }).shouldNotThrowException();
		valueOf(parentNode.firstChild).shouldBe(childNode);
	},

	apiXmlNodeCloneNode: function() {
		var shouldRun = true;
		if (Ti.Platform.osname === 'android') {
			// this check exists to deal with the bug mentioned in TIMOB-4771
			valueOf( isNaN(parseInt(Ti.Platform.version)) ).shouldBeFalse();
			if (parseInt(Ti.Platform.version) < 3) {
				Ti.API.info("Less than 3.0, not running apiXmlNodeCloneNode test");
				shouldRun = false;
			} else {
				Ti.API.info("3.0 or greater, running apiXmlNodeCloneNode test");
			}
		}

		if (shouldRun)
		{
			var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);

			var parentNode = doc.createElement("parent");
			parentNode.setAttribute("myattr", "attr value");
			var childText = doc.createTextNode("child text");
			var childElement = doc.createElement("childelement");
			parentNode.appendChild(childText);
			parentNode.appendChild(childElement);

			valueOf(parentNode.cloneNode).shouldBeFunction();

			var clonedNode = null;
		
			// Shallow
			valueOf(function() { clonedNode = parentNode.cloneNode(false); }).shouldNotThrowException();
			valueOf(clonedNode.nodeName).shouldBe(parentNode.nodeName);
			// Though shallow, attributes should be there.
			var attrs = clonedNode.attributes;
			valueOf(attrs).shouldNotBeNull();
			valueOf(attrs.length).shouldBeExactly(1);
			var attr = attrs.getNamedItem("myattr");
			valueOf(attr).shouldNotBeNull();
			valueOf(attr.nodeValue).shouldBeExactly("attr value");
			// Fetch a different way
			var attrValue = clonedNode.getAttribute("myattr");
			valueOf(attrValue).shouldNotBeNull();
			valueOf(attrValue).shouldBeExactly("attr value");
			// Per spec, clone should have no parent and no children
			valueOf(clonedNode.parentNode).shouldBeNull();
			valueOf(clonedNode.hasChildNodes()).shouldBeBoolean();
			valueOf(clonedNode.hasChildNodes()).shouldBeFalse();

			// Deep
			valueOf(function() { clonedNode = parentNode.cloneNode(true); }).shouldNotThrowException();
			valueOf(clonedNode.nodeName).shouldBe(parentNode.nodeName);
			valueOf(clonedNode.parentNode).shouldBeNull();
			attrs = clonedNode.attributes;
			valueOf(attrs).shouldNotBeNull();
			valueOf(attrs.length).shouldBeExactly(1);
			attr = attrs.getNamedItem("myattr");
			valueOf(attr).shouldNotBeNull();
			valueOf(attr.nodeValue).shouldBeExactly("attr value");
			valueOf(clonedNode.getAttribute("myattr")).shouldBe("attr value");
			attrValue = clonedNode.getAttribute("myattr");
			valueOf(attrValue).shouldNotBeNull();
			valueOf(attrValue).shouldBeExactly("attr value");
			// this one should have children since it's deep.
			valueOf(clonedNode.hasChildNodes()).shouldBeBoolean();
			valueOf(clonedNode.hasChildNodes()).shouldBeTrue();
			valueOf(clonedNode.firstChild).shouldNotBeNull();
			valueOf(clonedNode.firstChild.nodeValue).shouldBe(parentNode.firstChild.nodeValue);
			valueOf(clonedNode.lastChild).shouldNotBeNull();
			valueOf(clonedNode.lastChild.nodeName).shouldBe(parentNode.lastChild.nodeName);
		}
	},

	apiXmlNodeHasAttributes: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);

		var node = doc.createElement("node");
		var node2 = doc.createElement("node2");
		node2.setAttribute("attr1", "value1");

		valueOf(node.hasAttributes).shouldBeFunction();

		var results;
		valueOf(function() { results = node.hasAttributes(); }).shouldNotThrowException();
		valueOf(results).shouldBe(false);
		valueOf(function() { results = node2.hasAttributes(); }).shouldNotThrowException();
		valueOf(results).shouldBe(true);
	},

	apiXmlNodeHasChildNodes: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		var parentNode2 = doc.createElement("parentNode2");
		parentNode2.appendChild(doc.createElement("childNode"));

		valueOf(parentNode.hasChildNodes).shouldBeFunction();

		var results;
		valueOf(function() { results = parentNode.hasChildNodes(); }).shouldNotThrowException();
		valueOf(results).shouldBe(false);
		valueOf(function() { results = parentNode2.hasChildNodes(); }).shouldNotThrowException();
		valueOf(results).shouldBe(true);
	},

	apiXmlNodeInsertBefore: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		parentNode.appendChild(doc.createElement("childNode"));
		parentNode.appendChild(doc.createElement("childNode2"));

		valueOf(parentNode.insertBefore).shouldBeFunction();

		var childNode3 = doc.createElement("childNode3");
		valueOf(function() { parentNode.insertBefore(childNode3, parentNode.firstChild); }).shouldNotThrowException();
		valueOf(parentNode.firstChild).shouldBe(childNode3);
	},

	apiXmlNodeIsSupported: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);

		valueOf(doc.isSupported).shouldBeFunction();

		var results;
		valueOf(function() { results = doc.isSupported("XML", "1.0"); }).shouldNotThrowException();
		valueOf(results).shouldBe(true);
		valueOf(function() { results = doc.isSupported("IDONTEXIST", "1.0"); }).shouldNotThrowException();
		valueOf(results).shouldBe(false);
	},

	apiXmlNodeNormalize: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		parentNode.appendChild(doc.createTextNode("My "));
		parentNode.appendChild(doc.createTextNode("name "));
		parentNode.appendChild(doc.createTextNode("is "));
		parentNode.appendChild(doc.createTextNode("Opie."));

		valueOf(parentNode.normalize).shouldBeFunction();

		valueOf(function() { parentNode.normalize(); }).shouldNotThrowException();
		valueOf(parentNode.getText()).shouldBe("My name is Opie.");
		valueOf(parentNode.getChildNodes().length).shouldBe(1);
	},

	apiXmlNodeRemoveChild: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		var childNode = doc.createElement("childNode");
		parentNode.appendChild(childNode);

		valueOf(parentNode.removeChild).shouldBeFunction();

		var results = null;
		valueOf(function() { results = parentNode.removeChild(childNode); }).shouldNotThrowException();
		valueOf(results).shouldBe(childNode);

		valueOf(parentNode.hasChildNodes()).shouldBe(false);
	},

	apiXmlNodeReplaceChild: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);

		var parentNode = doc.createElement("parentNode");
		var childNode = doc.createElement("childNode");
		var childNode2 = doc.createElement("childNode2");
		parentNode.appendChild(childNode);
		parentNode.appendChild(childNode2);

		valueOf(parentNode.replaceChild).shouldBeFunction();

		var replacementNode = doc.createElement("replacementNode");
		valueOf(function() { parentNode.replaceChild(replacementNode, childNode); }).shouldNotThrowException();
		valueOf(parentNode.firstChild).shouldBe(replacementNode);
	},

	xmlNodeListElementsByTagName : function() {
		var xml = Ti.XML.parseString(this.testSource["nodes.xml"]);
		valueOf(xml).shouldNotBeNull();
		
		var nodes = xml.getElementsByTagName("node");
		valueOf(nodes).shouldNotBeNull();
		valueOf(nodes.length).shouldBeNumber();
		valueOf(nodes.item).shouldBeFunction();
		
		valueOf(nodes.length).shouldBe(13);
		
		var n = nodes.item(0);
		valueOf(n).shouldNotBeNull();
		valueOf(n.getAttribute("id")).shouldBe("node 1");
		
		n = nodes.item(1);
		valueOf(n).shouldNotBeNull();
		valueOf(n.getAttribute("id")).shouldBe("node 2");
	},

	xmlNodeListChildren : function() {
		var xml = Ti.XML.parseString(this.testSource["nodes.xml"]);
		valueOf(xml).shouldNotBeNull();
		
		var e = xml.documentElement;
		valueOf(e).shouldNotBeNull();
		
		var nodes = e.childNodes;
		valueOf(nodes).shouldNotBeNull();
		var count = 0;
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes.item(i);
			if (node.nodeType == node.ELEMENT_NODE) {
				count++;
			}
		}
		valueOf(count).shouldBe(1);
	},

	xmlNodeListRange : function() {
		var xml = Ti.XML.parseString(this.testSource["nodes.xml"]);
		valueOf(xml).shouldNotBeNull();
		
		var nodes = xml.getElementsByTagName("node");
		valueOf(nodes.item(nodes.length)).shouldBeNull();
		valueOf(nodes.item(100)).shouldBeNull();
	},

	apiXmlAttr: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);
		var node = doc.getElementsByTagName("node").item(0);
		var attr;
		// First a known attribute
		valueOf(function() {
			attr = node.attributes.item(0);
		}).shouldNotThrowException();
		valueOf(attr).shouldNotBeUndefined();
		valueOf(attr).shouldNotBeNull();
		valueOf(attr).shouldBeObject();
		valueOf(attr.name).shouldBeString();
		valueOf(attr.name).shouldBe("id");
		valueOf(attr.ownerElement).shouldBeObject();
		valueOf(attr.ownerElement).shouldBe(node);
		valueOf(attr.specified).shouldBeBoolean();
		valueOf(attr.specified).shouldBeTrue();
		valueOf(attr.value).shouldBeString();
		valueOf(attr.value).shouldBe("node 1");
		// Now new attribute
		valueOf(function() {
			attr = doc.createAttribute("newattr");
		}).shouldNotThrowException();
		valueOf(attr).shouldNotBeUndefined();
		valueOf(attr).shouldNotBeNull();
		valueOf(attr).shouldBeObject();
		valueOf(attr.name).shouldBeString();
		valueOf(attr.name).shouldBe("newattr");
		valueOf(attr.specified).shouldBeBoolean();
		// Per spec, the default value in an attribute is empty string not null.
		valueOf(attr.value).shouldNotBeNull();
		valueOf(attr.value).shouldBeExactly("");
		// Per spec, when you set an attribute that doesn't exist yet,
		// null is returned.
		var addedAttr = node.setAttributeNode(attr);
		valueOf(addedAttr).shouldBeNull();
		valueOf(attr.ownerElement).shouldNotBeNull();
		valueOf(attr.ownerElement).shouldBe(node);
		// Per spec, when you set a new attribute of same name as one that
		// already exists, it replaces that existing one AND returns that existing one.
		var secondNewAttr = doc.createAttribute("newattr");
		var replacedAttr = node.setAttributeNode(secondNewAttr);
		valueOf(replacedAttr).shouldNotBeNull();
		valueOf(replacedAttr).shouldBe(attr);
		// Per spec, changing the value of an attribute automatically sets
		// specified to true.
		attr.value = "new value";
		valueOf(attr.value).shouldNotBeNull();
		valueOf(attr.value).shouldBe("new value");
		valueOf(attr.specified).shouldBeBoolean();
		valueOf(attr.specified).shouldBeTrue();
		// Per spec, an attribute with no owner element (i.e., it has just
		// been created and not yet put on to an element) will have
		// "true" for specified.
		var thirdNewAttr = doc.createAttribute("anotherattr");
		valueOf(thirdNewAttr).shouldNotBeNull();
		valueOf(thirdNewAttr.ownerElement).shouldBeNull();
		valueOf(thirdNewAttr.specified).shouldBeBoolean();
		valueOf(thirdNewAttr.specified).shouldBeTrue();
	},
	xmlNamedNodeMap: function() {
		var xml = Ti.XML.parseString(this.testSource["attrs.xml"]);
		var otherDoc = Ti.XML.parseString("<dummy/>");
		var doc = xml.documentElement;
		valueOf(doc.nodeName).shouldBe("doc");

		var nodes = doc.getElementsByTagName("test");
		valueOf(nodes.length).shouldBe(1);

		var test = nodes.item(0);
		valueOf(test).shouldNotBeNull();

		nodes = test.getElementsByTagNameNS("http://www.test.com/namespace", "child");
		valueOf(nodes.length).shouldBe(1);

		var child = nodes.item(0);
		valueOf(child).shouldNotBeNull();

		var attrs = test.attributes;

		// length
		valueOf(attrs.length).shouldBe(3);

		// item
		var item0 = attrs.item(0);
		var item1 = attrs.item(1);
		var item2 = attrs.item(2);
		valueOf(item0).shouldNotBeNull();
		valueOf(item1).shouldNotBeNull();
		valueOf(item2).shouldNotBeNull();
		valueOf(item0.nodeName).shouldBe("attr1");
		valueOf(item0.value).shouldBe("value1");
		valueOf(item1.nodeName).shouldBe("test:attr2");
		valueOf(item1.value).shouldBe("value2");
		valueOf(item2.nodeName).shouldBe("attr3");
		valueOf(item2.value).shouldBe("hello world");

		valueOf(attrs.item(3)).shouldBeNull();

		// getNamedItem
		var attr1 = attrs.getNamedItem("attr1");
		valueOf(attr1).shouldNotBeNull();
		valueOf(attr1.value).shouldBe("value1");
		valueOf(attrs.getNamedItem("idontexist")).shouldBe(null);

		// getNamedItemNS
		var attr2 = attrs.getNamedItemNS("http://www.test.com/namespace", "attr2")
		valueOf(attr2).shouldNotBeNull();
		valueOf(attr2.value).shouldBe("value2");
		valueOf(attrs.getNamedItemNS(null, "fakeattr")).shouldBe(null);

		var attr3 = attrs.getNamedItem("attr3");
		valueOf(attr3).shouldNotBeNull();
		valueOf(attr3.value).shouldBe("hello world");

		var newAttr = xml.createAttribute("newAttr");
		newAttr.value = "newValue";

		// setNamedItem
		// Initial set, return value is null
		valueOf(attrs.setNamedItem(newAttr)).shouldBe(null);
		valueOf(test.getAttribute("newAttr")).shouldBe("newValue");

		var otherDocAttr = otherDoc.createAttribute("otherAttr");
		otherDocAttr.value = "otherValue";
		// Adding an attr from another doc throws an exception
		valueOf(function() {
			attrs.setNamedItem(otherDocAttr);
		}).shouldThrowException();

		// Reusing an existing attr node throws an exception
		valueOf(function() {
			attrs.setNamedItem(child.getNamedItemNS("http://www.test.com/namespace", "name"));
		}).shouldThrowException();

		var newAttr2 = xml.createAttribute("newAttr");
		newAttr2.value = "value2";

		// Setting an attr with an existing, should return the original
		valueOf(attrs.setNamedItem(newAttr2)).shouldBe(newAttr);
		valueOf(test.getAttribute("newAttr")).shouldBe("value2");

		var newAttr3 = attrs.getNamedItem("newAttr");
		valueOf(newAttr3).shouldBe(newAttr2);
		valueOf(newAttr3.value).shouldBe(newAttr2.value);

		// removeNamedItem
		var removedAttr;
		valueOf(function() {
			removedAttr = attrs.removeNamedItem("newAttr");
		}).shouldNotThrowException();

		valueOf(removedAttr).shouldBe(newAttr3);

		// Removing an attr that doesn't exist throws an exception
		valueOf(function() {
			attrs.removeNamedItem("idontexist");
		}).shouldThrowException();

		// setNamedItemNS
		newAttr = xml.createAttributeNS("http://www.test.com/namespace", "newAttr2");
		newAttr.value = "newValue2";
		valueOf(attrs.setNamedItemNS(newAttr)).shouldBe(null);

		// Adding an attr from another doc throws an exception
		valueOf(function() {
			attrs.setNamedItemNS(otherDocAttr);
		}).shouldThrowException();

		// Reusing an existing attr node throws an exception
		valueOf(function() {
			attrs.setNamedItemNS(child.getNamedItemNS("http://www.test.com/namespace", "name"));
		}).shouldThrowException();

		newAttr2 = attrs.getNamedItemNS("http://www.test.com/namespace", "newAttr2");
		valueOf(newAttr2).shouldBe(newAttr);
		valueOf(newAttr2.value).shouldBe(newAttr.value);

		// Setting an attr with an existing, should return the original
		newAttr3 = xml.createAttributeNS("http://www.test.com/namespace", "newAttr2");
		newAttr3.value = "value3";
		valueOf(attrs.setNamedItemNS(newAttr3)).shouldBe(newAttr2);
		valueOf(test.getAttributeNS("http://www.test.com/namespace", "newAttr2")).shouldBe("value3");

		// removeNamedItemNS
		valueOf(function() {
			removedAttr = attrs.removeNamedItemNS("http://www.test.com/namespace", "newAttr2");
		}).shouldNotThrowException();

		valueOf(removedAttr).shouldBe(newAttr3);

		// Removing an attr that doesn't exist throws an exception
		valueOf(function() {
			attrs.removeNamedItemNS("http://www.test.com/namespace", "fakeattr");
		}).shouldThrowException();

		// Ensure structure after modifications
		valueOf(attrs.item(0)).shouldBe(attr1);
		valueOf(attrs.item(1)).shouldBe(attr2);
		valueOf(attrs.item(2)).shouldBe(attr3);

		attrs = child.attributes;
		var name = attrs.getNamedItemNS("http://www.test.com/namespace", "name");
		valueOf(name).shouldNotBeNull();
		valueOf(name.nodeName).shouldBe("test:name");
		valueOf(name.value).shouldBe("value");
	},
	apiXmlDOMImplementation: function() {
		var baseDoc = Ti.XML.parseString("<a/>");
		valueOf(baseDoc).shouldNotBeNull();
		var impl = null;
		valueOf(function() {
			impl = baseDoc.implementation;
		}).shouldNotThrowException();
		valueOf(impl).shouldNotBeNull();

		// createDocument
		valueOf(impl.createDocument).shouldBeFunction();
		var testDoc = null;
		// Basic: no namespace, no doctype
		valueOf(function() {
			testDoc = impl.createDocument(null, "the_root", null);
		}).shouldNotThrowException()
		valueOf(testDoc).shouldNotBeNull();
		valueOf(testDoc.documentElement).shouldNotBeNull();
		valueOf(testDoc.documentElement.namespaceURI).shouldBeNull();
		valueOf(testDoc.documentElement.nodeName).shouldBe("the_root");
		valueOf(testDoc.documentElement.localName).shouldBe("the_root");
		valueOf(testDoc.doctype).shouldBeNull();
		// Create a doctype (which is useless in dom level 2)
		valueOf(impl.createDocumentType).shouldBeFunction();
		var doctype = null;
		valueOf(function() {
			doctype = impl.createDocumentType("qname", "pid", "sid");
		}).shouldNotThrowException();
		// Document with doctype
		testDoc = null;
		valueOf(function() {
			testDoc = impl.createDocument(null, "the_root", doctype);
		}).shouldNotThrowException()
		valueOf(testDoc).shouldNotBeNull();
		valueOf(testDoc.documentElement).shouldNotBeNull();
		valueOf(testDoc.documentElement.namespaceURI).shouldBeNull();
		valueOf(testDoc.documentElement.nodeName).shouldBe("the_root");
		valueOf(testDoc.documentElement.localName).shouldBe("the_root");
		valueOf(testDoc.doctype).shouldNotBeNull();
		valueOf(testDoc.doctype).shouldBe(doctype);
		// Document with namespace but no doctype
		testDoc = null;
		valueOf(function() {
			testDoc = impl.createDocument("http://test", "test:the_root", null);
		}).shouldNotThrowException()
		valueOf(testDoc).shouldNotBeNull();
		valueOf(testDoc.documentElement).shouldNotBeNull();
		valueOf(testDoc.documentElement.namespaceURI).shouldNotBeNull();
		valueOf(testDoc.documentElement.namespaceURI).shouldBe("http://test");
		valueOf(testDoc.documentElement.nodeName).shouldBe("test:the_root");
		valueOf(testDoc.documentElement.localName).shouldBe("the_root");
		valueOf(testDoc.doctype).shouldBeNull();
		// Document with both namespace and doctype
		valueOf(function() {
			doctype = impl.createDocumentType("qname", "pid", "sid");
		}).shouldNotThrowException();
		testDoc = null;
		valueOf(function() {
			testDoc = impl.createDocument("http://test", "test:the_root", doctype);
		}).shouldNotThrowException()
		valueOf(testDoc).shouldNotBeNull();
		valueOf(testDoc.documentElement).shouldNotBeNull();
		valueOf(testDoc.documentElement.namespaceURI).shouldNotBeNull();
		valueOf(testDoc.documentElement.namespaceURI).shouldBe("http://test");
		valueOf(testDoc.documentElement.nodeName).shouldBe("test:the_root");
		valueOf(testDoc.documentElement.localName).shouldBe("the_root");
		valueOf(testDoc.doctype).shouldNotBeNull();
		valueOf(testDoc.doctype).shouldBe(doctype);
		// hasFeature
		valueOf(impl.hasFeature).shouldBeFunction();
		var testResult;
		valueOf(function() {
			testResult = impl.hasFeature("Core", "2.0");
		}).shouldNotThrowException();
		valueOf(testResult).shouldBeBoolean();
		valueOf(testResult).shouldBeTrue();
		valueOf(function() {
			testResult = impl.hasFeature("Fred", "Flinstone");
		}).shouldNotThrowException();
		valueOf(testResult).shouldBeBoolean();
		valueOf(testResult).shouldBeFalse();
	},
	xmlElement: function() {
		var xml = Ti.XML.parseString(this.testSource["element.xml"]);
		var xml2 = Ti.XML.parseString(this.testSource["with_ns.xml"]);
		
		 // Test element.getElementsByTagName
		var elements = xml.getElementsByTagName("dessert");
		valueOf(elements).shouldNotBeNull();
		valueOf(elements.length).shouldBe(3);
		valueOf(elements).shouldBeObject();
		valueOf(elements.item(0).tagName).shouldBe("dessert");
		
		// Test element.getAttribute
		var attribute = elements.item(0).getAttribute("category");
		valueOf(attribute).shouldBe("icecream");
		var attributeFail = elements.item(0).getAttribute("categories");
		valueOf(attributeFail).shouldBe("");
		
		// Test element.getAttributeNode
		var attributeNode= elements.item(1).getAttributeNode("category"); //Fails on iOS TIMOB-4867
		valueOf(attributeNode).shouldNotBeNull();
		valueOf(attributeNode.name).shouldBe('category');
		valueOf(attributeNode.value).shouldBe('pie');
		var attributeNodeFail = elements.item(1).getAttributeNode("categories");
		valueOf(attributeNodeFail).shouldBeNull();
		
		// Test element.hasAttribute
		var attributeTrue = null;
		var attributeFalse = null;
		valueOf(function() {attributeTrue = elements.item(2).hasAttribute("category");}).shouldNotThrowException(); //Fails on iOS TIMOB-5024
		valueOf(function() {attributeFalse = elements.item(2).hasAttribute("food");}).shouldNotThrowException(); 
		valueOf(attributeTrue).shouldBeTrue();
		valueOf(attributeFalse).shouldBeFalse();
		
		// Test element.removeAttribute
		elements.item(0).removeAttribute("category"); //Fails on iOS TIMOB-4868
		attribute = elements.item(0).getAttribute("category");
		valueOf(attribute).shouldBe("");
		
		// Test element.removeAttributeNode
		var dessertNode = elements.item(1).getAttributeNode("category");
		var errorNode = elements.item(1).getAttributeNode("error");
		valueOf(errorNode).shouldBeNull();
		var attributeNodeRemove = elements.item(1).removeAttributeNode(dessertNode);
		valueOf(attributeNodeRemove.name).shouldBe("category");
		valueOf(function() {
			elements.item(1).removeAttributeNode(errorNode);
		}).shouldThrowException();
		
		// Test element.setAttribute
		elements = xml.getElementsByTagName("title");
		elements.item(0).setAttribute("rating","taste yummy");
		valueOf(elements.item(0).childNodes.item(0).nodeValue).shouldBe("Banana Split");
		valueOf(elements.item(0).getAttribute("rating")).shouldBe("taste yummy");
		elements.item(0).setAttribute("rating","cookie");
		valueOf(elements.item(0).getAttribute("rating")).shouldBe("cookie");
		valueOf(function() {
			elements.item(0).setAttribute("?","*");
		}).shouldThrowException();
		
		// Test element.setAttributeNode
		elements = xml.getElementsByTagName("title"); //Fails on iOS TIMOB-5027
		var newAttributeNode = xml.createAttribute("rating");
		newAttributeNode.value = "taste good";
		var newAttr = elements.item(1).setAttributeNode(newAttributeNode);
		valueOf(newAttr).shouldBeNull();
		valueOf(elements.item(1).childNodes.item(0).nodeValue).shouldBe("Banana Cream Pie");
		valueOf(elements.item(1).getAttribute("rating")).shouldBe("taste good");
		var existAttributeNode = xml.createAttribute("rating");
		existAttributeNode.value = "tasty";
		var existAttr = elements.item(1).setAttributeNode(existAttributeNode);
		valueOf(elements.item(1).getAttribute("rating")).shouldBe("tasty");
		valueOf(existAttr.value).shouldBe("taste good");
		valueOf(function() {
			elements.item(1).setAttributeNode(newAttributeNode);
		}).shouldThrowException();
		var newAttributeWrong = xml2.createAttribute("testing");
		newAttributeWrong.value = "exception";
		valueOf(function() {
			elements.item(1).setAttributeNode(newAttributeWrong);
		}).shouldThrowException();
	},
	
	xmlElementNS: function() {
		var xml = Ti.XML.parseString(this.testSource["elementNS.xml"]);
		var xml2 = Ti.XML.parseString(this.testSource["with_ns.xml"]);
		var namespace1 = "http://candystore.com";
		var namespace2 = "http://toystore.com";
		
		
		// Test element.getElementsByTagNameNS
		var elementsNS = xml.getElementsByTagNameNS(namespace1, "ingredient");
		var elementsNS2 = xml.getElementsByTagNameNS(namespace2, "material");
		valueOf(elementsNS).shouldNotBeNull();
		valueOf(elementsNS).shouldBeObject();
		valueOf(elementsNS.length).shouldBe(3);
		valueOf(elementsNS.item(0).tagName).shouldBe("candy:ingredient"); 
		valueOf(elementsNS2).shouldNotBeNull();
		valueOf(elementsNS2).shouldBeObject();
		valueOf(elementsNS2.length).shouldBe(3);
		valueOf(elementsNS2.item(0).tagName).shouldBe("toy:material");
		
		
		// Test element.getAttributeNS
		var attributeNS = elementsNS.item(0).getAttributeNS(namespace1, "amount");
		valueOf(attributeNS).shouldBe("one cup");
		var attributeFailNS = elementsNS.item(0).getAttributeNS(namespace1, "amounts");
		valueOf(attributeFailNS).shouldBe("");
		
		// Test element.getAttributeNodeNS
		var attributeNodeNS= elementsNS.item(1).getAttributeNodeNS(namespace1, "amount");
		valueOf(attributeNodeNS.nodeName).shouldBe("candy:amount");
		valueOf(attributeNodeNS.nodeValue).shouldBe("two cup");
		var attributeNodeFailNS = elementsNS.item(1).getAttributeNodeNS(namespace1, "amounts");
		valueOf(attributeNodeFailNS).shouldBeNull();
		
		// Test element.hasAttributeNS
		var attributeNSTrue = null;
		var attributeNSFalse = null;
		valueOf(function() {attributeNSTrue = elementsNS.item(2).hasAttributeNS(namespace1, "amount");}).shouldNotThrowException();
		valueOf(function() {attributeNSFalse = elementsNS.item(2).hasAttributeNS(namespace1, "food");}).shouldNotThrowException();
		valueOf(attributeNSTrue).shouldBeTrue();
		valueOf(attributeNSFalse).shouldBeFalse();
		
		// Test element.removeAttributeNS
		elementsNS2.item(0).removeAttributeNS(namespace2, "content");
		attributeNS = elementsNS2.item(0).getAttributeNS(namespace2, "content");
		valueOf(attributeNS).shouldBe("");
		
		// Test element.setAttributeNS
		elementsNS2.item(1).setAttributeNS(namespace2, "toy:color","white");
		valueOf(elementsNS2.item(1).childNodes.item(0).nodeValue).shouldBe("polyester");
		valueOf(elementsNS2.item(1).getAttributeNS(namespace2, "color")).shouldBe("white");
		elementsNS2.item(1).setAttributeNS(namespace2, "toy:color","black");
		valueOf(elementsNS2.item(1).getAttributeNS(namespace2, "color")).shouldBe("black");
		valueOf(function() {
			elementsNS2.item(1).setAttributeNS(namespace2, "?","*");
		}).shouldThrowException();
		valueOf(function() {
			elementsNS2.item(1).setAttributeNS(namespace2, "malform:name:test","test");
		}).shouldThrowException();
		valueOf(function() {
			elementsNS2.item(1).setAttributeNS(namespace3, "name:test","namespace failure");
		}).shouldThrowException();
		
		// Test element.setAttributeNodeNS
		var newAttributeNodeNS = xml.createAttributeNS(namespace2, "toy:color");
		newAttributeNodeNS.nodeValue = "blue";
		var newAttrNS = elementsNS2.item(2).setAttributeNodeNS(newAttributeNodeNS);
		valueOf(newAttrNS).shouldBeNull();
		valueOf(elementsNS2.item(2).childNodes.item(0).nodeValue).shouldBe("buttons");
		valueOf(elementsNS2.item(2).getAttributeNS(namespace2, "color")).shouldBe("blue");
		var existAttributeNodeNS = xml.createAttributeNS(namespace2, "toy:color");
		existAttributeNodeNS.nodeValue = "pink";
		var existAttrNS = elementsNS2.item(2).setAttributeNodeNS(existAttributeNodeNS);
		valueOf(elementsNS2.item(2).getAttributeNS(namespace2, "color")).shouldBe("pink");
		valueOf(existAttrNS.value).shouldBe("blue");
		valueOf(function() {
			elementsNS.item(1).setAttributeNode(newAttributeNodeNS);
		}).shouldThrowException();
		
		var newAttributeNSWrong = xml2.createAttributeNS(namespace2, "toy:color");
		newAttributeNSWrong.value = "exception";
		valueOf(function() {
			elementsNS2.item(1).setAttributeNode(newAttributeNSWrong);
		}).shouldThrowException();
	}
});
