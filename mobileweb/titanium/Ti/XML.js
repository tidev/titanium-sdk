define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {
	
	// Add getters and setters to the various prototypes
	[
		[
			"Document",
			"doctype,implementation,documentElement,inputEncoding,xmlEncoding,domConfig",
			"xmlStandalone,xmlVersion,strictErrorChecking,documentURI"
		],[
			"Node",
			"nodeName,nodeType,parentNode,childNodes,firstChild,lastChild,previousSibling,nextSibling,attributes,ownerDocument,namespaceURI,localName,baseURI",
			"textContent,nodeValue,prefix"
		],[
			"NamedNodeMap",
			"length"
		],[
			"CharacterData",
			"length",
			"data"
		],[
			"Attr",
			"name,specified,ownerElement,schemaTypeInfo,isId",
			"value"
		],[
			"Element",
			"tagName,schemaTypeInfo"
		],[
			"Text",
			"isElementContentWhitespace,wholeText"
		],[
			"DocumentType",
			"name,entities,notations,publicId,systemId,internalSubset"
		],[
			"Notation",
			"publicId,systemId"
		],[
			"NodeList",
			"length"
		],[
			"Entity",
			"publicId,systemId,notationName,inputEncoding,xmlEncoding,xmlVersion"
		],[
			"ProcessingInstruction",
			"target",
			"data"
		]
	].forEach(function(e) {
		var f = window[e[0]];
		f && lang.generateAccessors(f, e[1], e[2]);
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