define(["Ti/_/declare", "Ti/_/lang", "Ti/Map"], function(declare, lang, Map) {

	return declare("Ti.Map.View", null, {

		constructor: function() {
			this.properties.annotations = [];
		},

		addAnnotation: function(/*Object|Ti.Map.Annotation*/annotation) {
			if (annotation) {
				annotation.declaredClass === "Ti.Map.Annotation" || (annotation = new Annotation(annotation));

				// TODO
			}
		},

		addAnnotations: function(/*Array*/annotations) {
			annotations && annotations.forEach(lang.hitch(this, "addAnnotation"));
		},

		addRoute: function(route) {
			/*
			color 	String 					Color to use when drawing the route.
			name 	String 					Route name.
			points 	Array<MapPointType> 	Array of map points making up the route.
			width 	Number 					Line width to use when drawing the route. 
			*/
		},

		deselectAnnotation: function(/*String|Ti.Map.Annotation*/annotation) {
			// Annotation to deselect, identified by an annotation title or a Titanium.Map.Annotation reference. 
		},

		removeAllAnnotations: function() {
		},

		removeAnnotation: function() {
		},

		removeAnnotations: function() {
		},

		removeRoute: function() {
		},

		selectAnnotation: function() {
		},

		setLocation: function() {
		},

		zoom: function(level) {
			//
		},

		constants: {
			latitudeDelta: 0,
			longitudeDelta: 0
		},

		properties: {
			animated: false,
			annotations: undefined,
			mapType: Map.STANDARD_TYPE,
			regionFit: true,
			userLocation: false
		}

	});

});