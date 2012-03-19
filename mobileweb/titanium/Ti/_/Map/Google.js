define(["Ti/_/declare", "Ti/_/lang", "Ti/App/Properties", "Ti/Map", "Ti/UI/View"], function(declare, lang, Properties, Map, View) {

	function mapType(type) {
		var t = gmaps.MapTypeId;
		switch (type) {
			case Map.HYBRID_TYPE: return t.HYBRID;
			case Map.SATELLITE_TYPE: return t.SATELLITE;
			case Map.TERRAIN_TYPE: return t.TERRAIN;
		}
		return t.ROADMAP;
	};

	var isDef = lang.isDef,
		mix = require.mix,
		defaultRegion = {
			latitude: 39.828175,
			longitude: -98.5795,
			latitudeDelta: 30.137412,
			longitudeDelta: 63.235658
		},
		gmaps,
		activeInfoWindow,
		// the order of the markers MUST match the ANNOTATION_* constants defined in Ti.Map
		markers = ["red", "green", "purple"],
		onload = Ti.deferStart(),
		MapView = declare("Ti.Map.View", View, {

			constructor: function() {
				this.properties.annotations = [];
				this._routes = [];
				this.fireEvent("loading");
			},

			postscript: function() {
				var region = this.region,
					gmap = this._gmap = new gmaps.Map(this.domNode, {
						disableDefaultUI: true,
						zoom: 2,
						zoomControl: true,
						center: new gmaps.LatLng(region.latitude, region.longitude),
						mapTypeId: mapType(this.mapType)
					});

				gmaps.event.addListener(gmap, "bounds_changed", lang.hitch(this, "_fitRegion"));
				this._updateMap(region, 1);

				this.annotations.forEach(function(a, i) {
					var marker = markers[a.pincolor | 0],
						title = a._getTitle(),
						subtitle = a._getSubtitle(),
						onInfoWindowClick = lang.hitch(this, function() {
							a._onclick(this, i, "pin");
						}),
						opts = {
							map: gmap,
							icon: marker[0],
							shadow: marker[1],
							position: new gmaps.LatLng(a.latitude, a.longitude),
							title: title
						};

					a.animate && (opts.animation = gmaps.Animation.DROP);
					marker = a.marker = new gmaps.Marker(opts);

					gmaps.event.addListener(marker, "click", lang.hitch(this, function() {
						if (activeInfoWindow) {
							activeInfoWindow.close();
							onInfoWindowClick();
						}

						(activeInfoWindow = new gmaps.InfoWindow({
							// image: void 0,			// string or Titanium.Blob
							// leftButton: void 0,		// number or string
							// leftView: void 0,		// Ti.UI.View
							// rightButton: void 0,	// number or string
							// rightView: void 0,		// Ti.UI.View
							content: "<p><strong>" + title + "</strong></p><p>" + subtitle + "</p>"
						})).open(gmap, marker);

						gmaps.event.addListener(activeInfoWindow, "closeclick", onInfoWindowClick);

						onInfoWindowClick();

						this.fireEvent("click", {
							annotation: a,
							clicksource: "pin",
							index: i,
							latitude: a.latitude,
							longitude: a.longitude,
							map: this,
							subtitle: subtitle,
							title: title
						});
					}));

					this.properties.__values__.annotations[i] = a;
				}, this);

				// TODO: userLocation???
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
				if (route && (route.points || []).length) {
					route.pline = new gmaps.Polyline({
						map: this._gmap,
						path: route.points.map(function(p) {
							return new gmaps.LatLng(p.latitude, p.longitude);
						}),
						strokeColor: route.color || "#000",
						strokeWeight: route.width || 1
					});
					this._routes.push(route);
				}
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
							route.pline.setMap(null);
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
				this._updateMap(location);
			},

			zoom: function(level) {
				var gmap = this._gmap;
				gmap.setZoom(gmap.getZoom() + level);
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

			_fitRegion: function() {
				var c = this.constants,
					gmap = this._gmap,
					center = gmap.getCenter(),
					bounds = gmap.getBounds(),
					ne = bounds.getNorthEast(),
					sw = bounds.getSouthWest(),
					latD = c.latitudeDelta = ne.lat() - sw.lat(),
					lngD = c.longitudeDelta = ne.lng() - sw.lng(),
					region = {
						latitude: center.lat(),
						longitude: center.lng(),
						latitudeDelta: latD,
						longitudeDelta: lngD
					};

				this.regionFit && (this.properties.__values__.region = region);

				if (!this._initialized) {
					this._initialized = 1;
					this.fireEvent("complete");
				}

				this.fireEvent("regionChanged", region);
			},

			_updateMap: function(region, dontAnimate) {
				var gmap = this._gmap;
				if (gmap) {
					var animated = !dontAnimate && this.animated,
						latD = region.latitudeDelta / 2,
						lngD = region.longitudeDelta / 2;
					gmap[animated ? "panTo" : "setCenter"](new gmaps.LatLng(region.latitude, region.longitude));
					gmap[animated ? "panToBounds" : "fitBounds"](new gmaps.LatLngBounds(
						new gmaps.LatLng(region.latitude - latD, region.longitude - lngD),
						new gmaps.LatLng(region.latitude + latD, region.longitude + lngD)
					));
				}
			},

			constants: {
				latitudeDelta: 0,
				longitudeDelta: 0
			},

			properties: {
				animated: false,
				annotations: {
					set: function(value) {
						value = value.filter(function(a) { return a && a.declaredClass === "Ti.Map.Annotation"; });
						// TODO: update annotations
						return value;
					}
				},
				mapType: {
					set: function(value) {
						this._gmap && this._gmap.setMapTypeId(mapType(value));
						return value;
					}
				},
				region: {
					set: function(newValue, oldValue) {
						return mix({}, defaultRegion, oldValue, newValue);
					},
					post: function(value) {
						this._updateMap(value);
					},
					value: null
				},
				regionFit: true,
				userLocation: false
			}

		});

	window.TiMapViewInit = function() {
		gmaps = google.maps;

		var prefix = "/themes/" + require.config.ti.theme + "/Map/marker_",
			point = gmaps.Point;

		function makeMarker(color, x1, x2) {
			return new gmaps.MarkerImage(prefix + color + ".png", new gmaps.Size(x1, 34), new point(x2, 0), new point(10, 34));
		}

		markers = markers.map(function(color) {
			return [makeMarker(color, 20, 0), makeMarker(color, 37, 20)];
		});

		onload();
	};

	require(["http://maps.googleapis.com/maps/api/js?key=" + Properties.getString("ti.map.apikey", "") + "&sensor=false&callback=TiMapViewInit"]);

	return MapView;

});