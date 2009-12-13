/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
// requires Ti, UI, Geolocation

/**
 * @tiapi(property=True,name=Map.STANDARD_TYPE,version=0.8,type=int) constant representing the standard map type
 * @tiapi(property=True,name=Map.SATELLITE_TYPE,version=0.8,type=int) constant representing the satellite map type
 * @tiapi(property=True,name=Map.HYBRID_TYPE,version=0.8,type=int) constant representing the hybrid map type
 */
/**
 * @tiapi(property=True,name=Map.ANNOTATION_RED,version=0.8,type=int) constant representing the annotation red pin type
 * @tiapi(property=True,name=Map.ANNOTATION_GREEN,version=0.8,type=int) constant representing the annotation green pin type
 * @tiapi(property=True,name=Map.ANNOTATION_PURPLE,version=0.8,type=int) constant representing the annotation purple pin type
 *
 */

Ti.Map = {
	STANDARD_TYPE : 1,
	SATELLITE_TYPE : 2,
	HYBRID_TYPE : 2, /* satellite is basically hybrid */

	ANNOTATION_RED : 1,
	ANNOTATION_GREEN : 2,
	ANNOTATION_PURPLE : 3
};

Ti.Map.MapView = function(proxy)
{
	this._proxy = proxy;

	this.getKey = function() {
		return Ti.Method.dispatch(this._proxy, "getKey");
	};

	this.processOptions = function(options) {
		// Stringify until other views are moved to dispatch
		Ti.Method.dispatch(this._proxy, "processOptions", Ti.JSON.stringify(options));
	};

	/**
	 * @tiapi(method=True,name=Map.MapView.setLocation,version=0.8) set the location of the map
	 * @tiarg(for=Map.MapView.setLocation,type=object,name=properties) location properties such as longitude, latitude
	 */
	this.setLocation = function(region) {
		if (!Ti.isUndefined(region)) {
			Ti.Method.dispatch(this._proxy, "setLocation", region);
		}
	};

	/**
	 * @tiapi(method=True,name=Map.MapView.setMapType,version=0.8) set the map type
	 * @tiarg(for=Map.MapView.setMapType,type=int,name=type) map
	 */
	this.setMapType = function(type) {
		if (!Ti.isUndefined(type)) {
			Ti.Method.dispatch(this._proxy, "setMapType", type);
		}
	};

	this.setZoomEnabled = function(enabled) {
		if (!Ti.isUndefined(enabled)) {
			Ti.Method.dipatch(this._proxy,"setZoomEnabled", enabled);
		}
	};

	this.setScrollEnabled = function(enabled) {
		if (!Ti.isUndefined(enabled)) {
			Ti.Method.dipatch(this._proxy,"setScrollEnabled", enabled);
		}
	};

	/**
	 * @tiapi(method=True,name=Map.MapView.zoom,version=0.8) zoom in or out the view
	 * @tiarg(for=Map.MapView.zoom,type=double,name=delta) double value that specifies level to zoom (negative is out, positive is in)
	 */
	this.zoom = function(delta) {
		if (!Ti.isUndefined(delta)) {
			Ti.Method.dispatch(this._proxy, "changeZoomLevel", delta);
		}
	}

	/**
	 * @tiapi(method=True,name=Map.MapView.addEventListener,version=0.8) add event listener
	 * @tiarg(for=Map.MapView.addEventListener,type=string,name=event) function
	 * @tiarg(for=Map.MapView.addEventListener,type=function,name=listener) function
	 * @tiresult(for=Map.MapView.addEventListener,type=int) listener id.
	 */
	this.addEventListener = function(event, listener) {
		return Ti.Method.dispatch(this._proxy, "addEventListener", event, registerCallback(this, listener));
	};

	/**
	 * @tiapi(method=True,name=Map.MapView.removeEventListener,version=0.8) remove event listener
	 * @tiarg(for=Map.MapView.removeEventListener,type=string,name=event) function
	 * @tiarg(for=Map.MapView.removeEventListener,type=int,name=listenerId) function
	 */
	this.removeEventListener = function(event, listenerId) {
		Ti.Method.dispatch(this._proxy, "removeEventListener", event, listenerId);
	};

	/**
	 * @tiapi(method=True,name=Map.MapView.addAnnotation,version=0.8) add an annotation
	 * @tiarg(for=Map.MapView.addAnnotation,type=object,name=annotation) properties of annotation
	 */

	this.addAnnotation = function(annotation) {
		if (!Ti.isUndefined(annotation)) {
			Ti.Method.dispatch(this._proxy, "addAnnotation", annotation);
		}
	};
	/**
	 * @tiapi(method=True,name=Map.MapView.removeAnnotation,version=0.8) add an annotation
	 * @tiarg(for=Map.MapView.removeAnnotation,type=string,name=title) annotation title string
	 */
	this.removeAnnotation = function(title) {
		if (!Ti.isUndefined(title)) {
			Ti.Method.dispatch(this._proxy, "removeAnnotation", title);
		}
	};
	/**
	 * @tiapi(method=True,name=Map.MapView.selectAnnotation,version=0.8) select an annotation
	 * @tiarg(for=Map.MapView.selectAnnotation,type=string,name=title) annotation title string
	 * @tiarg(for=Map.MapView.selectAnnotation,type=boolean,name=animate) animated (default to true)
	 */
	this.selectAnnotation = function(title, animate) {
		if (!Ti.isUndefined(title)) {
			if (Ti.isUndefined(animate)) {
				animate = true;
			}

			Ti.Method.dispatch(this._proxy, "selectAnnotation", true, title, animate);
		}
	};
	/**
	 * @tiapi(method=True,name=Map.MapView.deselectAnnotation,version=0.8) deselect an annotation
	 * @tiarg(for=Map.MapView.deselectAnnotation,type=string,name=title) annotation title string
	 * @tiarg(for=Map.MapView.deselectAnnotation,type=boolean,name=animate) animated (default to true)
	 */
	this.deselectAnnotation = function(title, animate) {
		if (!Ti.isUndefined(title)) {
			if (Ti.isUndefined(animate)) {
				animate = true;
			}

			Ti.Method.dispatch(this._proxy, "selectAnnotation", false, title, animate);
		}
	};
};

/**
 * @tiapi(method=True,name=Map.createView,version=0.8) create a google map view
 * @tiarg(for=Map.createView,type=object,name=properties) view properties
 * @tiresult(for=Map.createView,type=Map.MapView) the resulting map view
 */

Ti.Map.createView = function(options) {
	if (Ti.isUndefined(options)) {
		options = {};
	}

	var mv = new Ti.Map.MapView(Ti.Method.dispatch("TitaniumMap","createMapView"));
	mv.processOptions(options);
	return mv;
};
