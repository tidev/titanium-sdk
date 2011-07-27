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
		
		var testFiles = ["soap.xml", "xpath.xml", "nodes.xml", "nodeCount.xml", "cdata.xml", "cdataEntities.xml"];
		this.testSource = {};
		for (var i = 0; i < testFiles.length; i++) {
			this.testSource[testFiles[i]] = Ti.Filesystem.getFile(testFiles[i]).read().toString();
		}
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
		valueOf(parentNode.firstChild).shouldBe(childNode); // fails - opened ticket #4769
	},

	apiXmlNodeCloneNode: function() {
		var doc = Ti.XML.parseString(this.testSource["nodes.xml"]);

		var parentNode = doc.createElement("parent");
		parentNode.setAttribute("myattr", "attr value");
		var childText = doc.createTextNode("child text");
		var childElement = doc.createElement("childelement");
		parentNode.appendChild(childText);
		parentNode.appendChild(childElement);

		valueOf(parentNode.cloneNode).shouldBeFunction();

		var clonedNode = null;
		
		// exception is thrown - opened ticket #4771
		valueOf(function() { clonedNode = parentNode.cloneNode(false); }).shouldNotThrowException();
		valueOf(clonedNode.nodeName).shouldBe(parentNode.nodeName);
		valueOf(clonedNode.getAttribute("myattr")).shouldBe("attr value");
		valueOf(clonedNode.firstChild.nodeValue).shouldBe(parentNode.firstChild.nodeValue);
		valueOf(clonedNode.lastChild.nodeName).shouldBe(parentNode.lastChild.nodeName);

		valueOf(function() { clonedNode = parentNode.cloneNode(true); }).shouldNotThrowException();
		valueOf(clonedNode.nodeName).shouldBe(parentNode.nodeName);
		valueOf(clonedNode.getAttribute("myattr")).shouldBe("attr value");
		valueOf(clonedNode.firstChild.nodeValue).shouldBe(parentNode.firstChild.nodeValue);
		valueOf(clonedNode.lastChild.nodeName).shouldBe(parentNode.lastChild.nodeName);
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
		valueOf(parentNode.firstChild).shouldBe(childNode3); // fails - opened ticket #4769
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
		valueOf(results).shouldBe(childNode); // fails - opened ticket #4703

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
		valueOf(parentNode.firstChild).shouldBe(replacementNode); // fails - opened ticket #4769
	}
});
