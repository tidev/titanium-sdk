define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	return lang.setObject("Ti.Map", Evented, {

		constants: {
			// these constants MUST match the correct order of the markers in Ti.Map.View
			ANNOTATION_GREEN: 1,
			ANNOTATION_PURPLE: 2,
			ANNOTATION_RED: 0,

			HYBRID_TYPE: 2,
			SATELLITE_TYPE: 1,
			STANDARD_TYPE: 0,
			TERRAIN_TYPE: 3
		},

		createAnnotation: function(args) {
			return new (require("Ti/Map/Annotation"))(args);
		},

		createView: function(args) {
			return new (require("Ti/Map/View"))(args);
		}

	});

});