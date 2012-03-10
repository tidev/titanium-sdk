define(["Ti/_/Evented", "Ti/_/lang", "Ti/XML/Document"], function(Evented, lang, XMLDocument) {

	return lang.setObject("Ti.XML", Evented, {
		
		parseString: function(xml) {
			return (new DOMParser()).parseFromString(xml,"text/xml");
		},
		
		serializeToString: function(node) {
			return (new XMLSerializer()).serializeToString(node);
		}
	});

});