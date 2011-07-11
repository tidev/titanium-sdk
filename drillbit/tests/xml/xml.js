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

	apiXmlNode: function() {
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
		valueOf(node.nodeValue).shouldNotBeUndefined(); // null is a valid return, what is the expected behavior when null?
		valueOf(node.nodeType).shouldBeNumber();
		valueOf(node.parentNode).shouldBeObject();
		valueOf(node.childNodes).shouldBeObject();
		valueOf(node.firstChild).shouldBeObject();
		valueOf(node.lastChild).shouldBeObject();
		valueOf(node.previousSibling).shouldBeObject();
		valueOf(node.nextSibling).shouldBeObject();
		valueOf(node.attributes).shouldBeObject();
		valueOf(node.ownerDocument).shouldBeObject();
		valueOf(node.namespaceURI).shouldNotBeUndefined(); // null is a valid return, what is the expected behavior when null?
		valueOf(node.prefix).shouldNotBeUndefined(); // null is a valid return, what is the expected behavior when null?
		valueOf(node.localName).shouldNotBeUndefined(); // null is a valid return, what is the expected behavior when null?


		// verify methods
		valueOf(node.appendChild).shouldBeFunction();
		var appendChildResults = null;
		valueOf(function() { appendChildResults = node.appendChild(node.firstChild); }).shouldNotThrowException();
		valueOf(appendChildResults).shouldBe(node.firstChild);

		valueOf(node.cloneNode).shouldBeFunction();
		var clonedNode = null;
		valueOf(function() { clonedNode = node.cloneNode(false); }).shouldNotThrowException();
		valueOf(clonedNode).shouldBeObject();
		valueOf(function() { clonedNode = node.cloneNode(true); }).shouldNotThrowException();
		valueOf(clonedNode).shouldBeObject();

		valueOf(node.hasAttributes).shouldBeFunction();
		valueOf(function() { node.hasAttributes(); }).shouldNotThrowException();

		valueOf(node.hasChildNodes).shouldBeFunction();
		valueOf(function() { node.hasChildNodes(); }).shouldNotThrowException();

		valueOf(node.insertBefore).shouldBeFunction();
		var insertBeforeResults = null;
		valueOf(function() { insertBeforeResults = node.insertBefore(node.lastChild, node.firstChild); }).shouldNotThrowException();
		valueOf(insertBeforeResults).shouldBe(node.lastChild);

		valueOf(node.isSupported).shouldBeFunction();
		var isSupportedResults = null;
		valueOf(function() { isSupportedResults = node.isSupported("XML", "1.0"); }).shouldNotThrowException();
		valueOf(isSupportedResults).shouldBeBoolean();

		valueOf(node.normalize).shouldBeFunction();
		valueOf(function() { node.normalize(); }).shouldNotThrowException();

		valueOf(node.removeChild).shouldBeFunction();
		var nodeToRemove = node.firstChild;
		var removeChildResults = null;
		valueOf(function() { removeChildResults = node.removeChild(node.firstChild); }).shouldNotThrowException();
		valueOf(removeChildResults).shouldBe(nodeToRemove);

		valueOf(node.replaceChild).shouldBeFunction();
		var nodeToReplace = node.firstChild;
		var replaceChildResults = null;
		valueOf(function() { replaceChildResults = node.replaceChild(nodeToRemove, node.firstChild); }).shouldNotThrowException();
		valueOf(replaceChildResults).shouldBe(nodeToReplace);
	}
});