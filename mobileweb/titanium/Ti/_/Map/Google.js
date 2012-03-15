define(["Ti/_/declare", "Ti/_/lang", "Ti/App/Properties", "Ti/Map", "Ti/UI/View"], function(declare, lang, Properties, Map, View) {

	var isDef = lang.isDef,
		deferStart = Ti.deferStart(),
		mapTypeMap,
		MapView = declare("Ti.Map.View", View, {

			constructor: function() {
				this.properties.annotations = [];
				this._routes = [];
				this.region = {
					longitude: 0,
					latitude: 0,
					longitudeDelta: 0,
					latitudeDelta: 0
				};
			},

			postscript: function() {
				var m = google.maps;
				this._map = new m.Map(this.domNode, {
					zoom: 2,
					center: new m.LatLng(this.region.latitude, this.region.longitude),
					mapTypeId: this.mapType === Map.HYBRID_TYPE ? m.MapTypeId.ROADMAP
				});
			},

			addAnnotation: function(/*Object|Ti.Map.Annotation*/annotation) {
				if (annotation) {
					annotation.declaredClass === "Ti.Map.Annotation" || (annotation = new Annotation(annotation));
					this.properties.annotations.push(annotation);
					// TODO: create the google annotation
				}
			},

			addAnnotations: function(/*Array*/annotations) {
				annotations && annotations.forEach(lang.hitch(this, "addAnnotation"));
			},

			addRoute: function(/*Object*/route) {
				this._routes.push(route);
				/*
				TODO: add the route
				color 	String 					Color to use when drawing the route.
				name 	String 					Route name.
				points 	Array<MapPointType> 	Array of map points making up the route. {longitude,latitude}
				width 	Number 					Line width to use when drawing the route. 
				*/
			},

			deselectAnnotation: function(/*String|Ti.Map.Annotation*/annotation) {
				if (annotation = this._findAnnotation(annotation)) {
					// TODO: hide the annotation
				}
			},

			removeAllAnnotations: function() {
				this.properties.annotations = [];
				// TODO: remove all google annotations
			},

			removeAnnotation: function(/*String|Ti.Map.Annotation*/annotation) {
				var anno = this.properties.annotations,
					i = 0;
				if (annotation = this._getAnnotationTitle(annotation)) {
					for (; i < anno.length; i++) {
						if (anno[i].title === annotation) {
							// TODO: remove the annotation
							anno.splice(i--, 1);
						}
					}
				}
			},

			removeAnnotations: function(/*Array*/annotations) {
				annotations.forEach(function(a) {
					this.removeAnnotation(a);
				}, this);
			},

			removeRoute: function(/*Object*/route) {
				if (route && route.name) {
					var r = this._routes,
						i = 0;
					for (; i < r.length; i++) {
						if (r[i].name === route.name) {
							// TODO: remove the route
							r.splice(i--, 1);
						}
					}
				}
			},

			selectAnnotation: function(/*String|Ti.Map.Annotation*/annotation) {
				if (annotation = this._findAnnotation(annotation)) {
					// TODO: show the annotation
				}
			},

			setLocation: function(location) {
				location && (this.region = location);
				isDef(location.animate) && (this.animated = location.animate);
				isDef(location.animated) && (this.animated = location.animated);
				isDef(location.regionFit) && (this.regionFit = location.regionFit);
			},

			zoom: function(level) {
				// TODO: Relative zoom level (positive to zoom in, negative to zoom out).
			},

			_getAnnotationTitle: function(/*String|Ti.Map.Annotation*/a) {
				return a && require.is(a, "String") ? a : a.declaredClass === "Ti.Map.Annotation" ? a.title : 0;
			},

			_findAnnotation: function(/*String|Ti.Map.Annotation*/annotation) {
				var anno = this.properties.annotations,
					i = 0;
				if (annotation = this._getAnnotationTitle(annotation)) {
					for (; i < anno.length; i++) {
						if (anno[i].title === annotation) {
							return anno[i];
						}
					}
				}
				return null;
			},

			constants: {
				latitudeDelta: 0,
				longitudeDelta: 0
			},

			properties: {
				animated: false,
				annotations: {
					set: function(value) {
						return value.filter(function(a) { return a && a.declaredClass === "Ti.Map.Annotation"; });
					}
				},
				mapType: Map.STANDARD_TYPE,
				region: null,
				regionFit: true,
				userLocation: false
			}

		});

	window.TiMapViewInit = function() {
		var m = google.maps;
		mapTypeMap = {
			HYBRID_TYPE: m.MapTypeId.HYBRID,
			SATELLITE_TYPE: m.MapTypeId.SATELLITE,
			STANDARD_TYPE: m.MapTypeId.ROADMAP,
			TERRAIN_TYPE: m.MapTypeId.TERRAIN
		};
		deferStart();
	};

	require(["http://maps.googleapis.com/maps/api/js?key=" + Properties.getString("ti.map.apikey", "") + "&sensor=false&callback=TiMapViewInit"]);

	return MapView;

});