define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	return lang.setObject("Ti.Map", Evented, {

		constants: {
			ANNOTATION_GREEN: 1,
			ANNOTATION_PURPLE: 2,
			ANNOTATION_RED: 0,
			HYBRID_TYPE: 2,
			SATELLITE_TYPE: 1,
			STANDARD_TYPE: 0
		},

		createAnnotation: function(args) {
			var m = require("Ti/Map/Annotation");
			return new m(args);
		},

		createMapView: function(args) {
			var m = require("Ti/Map/View");
			return new m(args);
		}

	});

});