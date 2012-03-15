define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {
	
	// Add getters and setters to the various prototypes
	var elements = [[
			Document,
			"doctype,implementation,documentElement,inputEncoding,xmlEncoding,domConfig",
			"xmlStandalone,xmlVersion,strictErrorChecking,documentURI"
		],[
			Node,
			"nodeName,nodeType,parentNode,childNodes,firstChild,lastChild,previousSibling,nextSibling,attributes,ownerDocument,namespaceURI,localName,baseURI",
			"textContent,nodeValue,prefix"
		],[
			NamedNodeMap,
			"length",
		],[
			CharacterData,
			"length",
			"data"
		],[
			Attr,
			"name,specified,ownerElement,schemaTypeInfo,isId",
			"value"
		],[
			Element,
			"tagName,schemaTypeInfo"
		],[
			Text,
			"isElementContentWhitespace,wholeText"
		],[
			DocumentType,
			"name,entities,notations,publicId,systemId,internalSubset"
		],[
			Notation,
			"publicId,systemId"
		],[
			NodeList,
			"length"
		],[
			Entity,
			"publicId,systemId,notationName,inputEncoding,xmlEncoding,xmlVersion"
		],[
			ProcessingInstruction,
			"target",
			"data"
		]
	];
	for(var i = 0; i < elements.length; i++) {
		lang.generateAccessors(elements[i][0],elements[i][1],elements[i][2]);
	}
	Object.defineProperty(Element.prototype, "text", { 
		get: function() { return this.textContent; },
		enumerable: true
	});

	return lang.setObject("Ti.XML", Evented, {
		
		parseString: function(xml) {
			return (new DOMParser()).parseFromString(xml,"text/xml");
		},
		
		serializeToString: function(node) {
			return (new XMLSerializer()).serializeToString(node);
		}
	});

});