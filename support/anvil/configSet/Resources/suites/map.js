/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

module.exports = new function() {
	var finish,
		valueOf;
	
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "map";
	this.tests = [
		{name: "constants"},
		{name: "add_annotation"},
		{name: "map_properties"},
		{name: "simple_map_methods"},
		{name: "route"},
		{name: "annotation"},
		{name: "annotation_methods"}
	]

	// Check all constants
	this.constants = function(testRun) {
		valueOf(testRun, Ti.Map.ANNOTATION_GREEN).shouldBeNumber();
		valueOf(testRun, Ti.Map.ANNOTATION_PURPLE).shouldBeNumber();
		valueOf(testRun, Ti.Map.ANNOTATION_RED).shouldBeNumber();
		valueOf(testRun, Ti.Map.HYBRID_TYPE).shouldBeNumber();
		valueOf(testRun, Ti.Map.SATELLITE_TYPE).shouldBeNumber();
		valueOf(testRun, Ti.Map.STANDARD_TYPE).shouldBeNumber();
		valueOf(testRun, Ti.Map.TERRAIN_TYPE).shouldBeNumber();
				
		finish(testRun);
	}

	this.add_annotation = function(testRun) {
		var annotationList,
			win = Titanium.UI.createWindow(),
			map =  Titanium.Map.createView({
				mapType: Titanium.Map.STANDARD_TYPE,
				region: {latitude: 37.390749, longitude: -122.081651, latitudeDelta: 3, longitudeDelta: 3},
				animate: true,
				regionFit: true,
				userLocation: false
			}),
			annotation1 = Titanium.Map.createAnnotation({
				latitude: 37.390749,
				longitude: -122.081651,
				title: "Test1",
				subtitle: "Test1, CA",
				pincolor: Titanium.Map.ANNOTATION_RED,
				animate: true,
				// Custom property to uniquely identify this annotation.
				myid: 1
			}),
			annotation2 = Titanium.Map.createAnnotation({
				latitude: 39.390749,
				longitude: -121.081651,
				title: "Test2",
				subtitle: "Test2, CA",
				pincolor: Titanium.Map.ANNOTATION_RED,
				animate: true,
				// Custom property to uniquely identify this annotation.
				myid: 2
			}),
			annotation3 = Titanium.Map.createAnnotation({
				latitude: 38.390749,
				longitude: -120.081651,
				title: "Test3",
				subtitle: "Test3, CA",
				pincolor: Titanium.Map.ANNOTATION_RED,
				animate: true,
				// Custom property to uniquely identify this annotation.
				myid: 3
			});

		valueOf(testRun, map.annotations.length).shouldBeEqual(0);
		
		// Add one annotation
		valueOf(testRun, function() {
			map.addAnnotation(annotation1);
		}).shouldNotThrowException();
		valueOf(testRun, map.annotations.length).shouldBeEqual(1);
		
		// Add array of annotations
		valueOf(testRun, function() {
			map.addAnnotations([annotation2, annotation3]);
		}).shouldNotThrowException();
		valueOf(testRun, map.annotations.length).shouldBeEqual(3);
		
		valueOf(testRun, function() {
			annotationList = map.getAnnotations();
		}).shouldNotThrowException();
		
		// Check the annotations objects
		for (var i = 0, len = annotationList.length; i < len; i++){
			valueOf(testRun, annotationList[i]).shouldBeObject();
		}

		valueOf(testRun, function() {
			map.selectAnnotation("Test2");
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			map.deselectAnnotation("Test2");
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			map.removeAnnotation(annotation2)
		}).shouldNotThrowException();
		valueOf(testRun, map.annotations.length).shouldBeEqual(2);

		valueOf(testRun, function() {
			map.removeAnnotations([annotation3]);
		}).shouldNotThrowException();
		valueOf(testRun, map.annotations.length).shouldBeEqual(1);

		valueOf(testRun, function() {
			map.removeAllAnnotations();
		}).shouldNotThrowException();
		valueOf(testRun, map.annotations.length).shouldBeEqual(0);

		win.add(map);
		win.open();
		win.close();
		finish(testRun);
	};

	this.map_properties = function(testRun) {
		var win = Titanium.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			map = Titanium.Map.createView({
				mapType: Titanium.Map.STANDARD_TYPE,
				region: {latitude: 33.74511, longitude: -84.38993, latitudeDelta: 0.05, longitudeDelta: 0.05},
				animate: true,
				regionFit: true,
				userLocation: false,
				animated: true,
				latitudeDelta: 0.05,
				longitudeDelta: 0.05
			});

		valueOf(testRun, map.latitudeDelta).shouldBeEqual(0.05);
		valueOf(testRun, map.longitudeDelta).shouldBeEqual(0.05);
		valueOf(testRun, map.region.latitudeDelta).shouldBeEqual(0.05);
		valueOf(testRun, map.region.longitudeDelta).shouldBeEqual(0.05);
		valueOf(testRun, map.animated).shouldBeTrue();
		valueOf(testRun, map.mapType).shouldBeEqual(Titanium.Map.STANDARD_TYPE);
		valueOf(testRun, map.regionFit).shouldBeTrue();
		valueOf(testRun, map.region.latitude.toFixed(1)).shouldBeEqual(33.7);
		valueOf(testRun, map.region.longitude.toFixed(1)).shouldBeEqual(-84.4);
		valueOf(testRun, map.regionFit).shouldBeTrue();
		valueOf(testRun, map.userLocation).shouldBeFalse();
	
		win.add(map);
		win.open();
		win.close();
		finish(testRun);
	};

	this.simple_map_methods = function(testRun) {
		var win = Titanium.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			map =  Titanium.Map.createView({
				mapType: Titanium.Map.STANDARD_TYPE,
				region: {latitude: 33.74511, longitude: -84.38993, latitudeDelta: 0.05, longitudeDelta: 0.05},
				animate: true,
				regionFit: true,
				userLocation: false,
				animated: true,
				latitudeDelta: 0.05,
				longitudeDelta: 0.05
			});

		valueOf(testRun, map.getAnimated()).shouldBeTrue();
		valueOf(testRun, function() { map.setAnimated(false); }).shouldNotThrowException();
		valueOf(testRun, map.getAnimated()).shouldBeFalse();
		valueOf(testRun, map.getMapType()).shouldBeEqual(Titanium.Map.STANDARD_TYPE);
		valueOf(testRun, map.getRegion().latitude.toFixed(1)).shouldBeEqual(33.7);
		valueOf(testRun, map.getRegion().longitude.toFixed(1)).shouldBeEqual(-84.4);
		valueOf(testRun, map.getRegion().latitudeDelta).shouldBeEqual(0.05);
		valueOf(testRun, map.getRegion().longitudeDelta).shouldBeEqual(0.05);
		valueOf(testRun, map.getRegionFit()).shouldBeTrue();
		valueOf(testRun, map.getUserLocation()).shouldBeFalse();
		valueOf(testRun, map.getLatitudeDelta()).shouldBeEqual(0.05);
		valueOf(testRun, map.getLongitudeDelta()).shouldBeEqual(0.05);
		valueOf(testRun, function() {
			map.setLocation({
				latitude: 37.337681, 
				longitude: -122.038193, 
				animate: true,
				latitudeDelta: 0.04, 
				longitudeDelta: 0.04
			});
		}).shouldNotThrowException();
		valueOf(testRun, map.getRegion().latitude.toFixed(1)).shouldBeEqual(37.3);
		valueOf(testRun, map.getRegion().longitude.toFixed(1)).shouldBeEqual(-122.0);
		valueOf(testRun, map.getRegion().latitudeDelta).shouldBeEqual(0.04);
		valueOf(testRun, map.getRegion().longitudeDelta).shouldBeEqual(0.04);
		
		valueOf(testRun, function() {
			map.setMapType(Ti.Map.TERRAIN_TYPE);
		}).shouldNotThrowException();

		valueOf(testRun, map.getMapType()).shouldBeEqual(Titanium.Map.TERRAIN_TYPE);
		
		valueOf(testRun, function() {
			map.setRegion({latitude: 33.74511, longitude: -84.38993, latitudeDelta: 0.05, longitudeDelta: 0.05});
		}).shouldNotThrowException();
				   
		valueOf(testRun, map.getRegion().latitude.toFixed(1)).shouldBeEqual(33.7);
		valueOf(testRun, map.getRegion().longitude.toFixed(1)).shouldBeEqual(-84.4);
		valueOf(testRun, map.getRegion().latitudeDelta).shouldBeEqual(0.05);
		valueOf(testRun, map.getRegion().longitudeDelta).shouldBeEqual(0.05);
		
		valueOf(testRun, function() {
			map.setRegionFit(false);
		}).shouldNotThrowException();
		
		valueOf(testRun, map.getRegionFit()).shouldBeFalse();
		
		map.addEventListener('complete', function() {
			valueOf(testRun, function() {
				map.zoom(-1);
			}).shouldNotThrowException();
			
			win.close();
			finish(testRun);
		});
		
		win.add(map);
		win.open();
	};

	this.route = function(testRun){
		var win = Titanium.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			map = Titanium.Map.createView({
				mapType: Titanium.Map.STANDARD_TYPE,
				region: {latitude: 37.74511, longitude: -84.38993, latitudeDelta: 5, longitudeDelta: 5},
				animate: true,
				regionFit: true,
				userLocation: false,
				animated: true
			}),
			route = {
				color: '#FF0000',
				name: 'testRout',
				points:[{'latitude':37.390749, 'longitude':-122.081651}, {'latitude':39.390749, 'longitude':-84.38993}],
				width: 10
			};

		map.addEventListener('complete', function() {
			win.close();
			finish(testRun);
		}); 
		
		valueOf(testRun, function() {
			map.addRoute(route); 
		}).shouldNotThrowException();
		
		valueOf(testRun, function() {
			map.removeRoute(route); 
		}).shouldNotThrowException();
		
		win.add(map);
		win.open();
	};

	this.annotation = function(testRun){
		var annotation,
			win = Titanium.UI.createWindow(),
			map =  Titanium.Map.createView({
				mapType: Titanium.Map.STANDARD_TYPE,
				region: {latitude: 33.74511, longitude: -84.38993, latitudeDelta: 0.01, longitudeDelta: 0.01},
				animate: true,
				regionFit: true,
				userLocation: false
			});

		valueOf(testRun, function() {
			annotation = Titanium.Map.createAnnotation({
				latitude: 33.74511,
				longitude: -84.38993,
				title: "Test",
				subtitle: "Test, CA",
				pincolor: Titanium.Map.ANNOTATION_RED,
				animate: true,
				// Custom property to uniquely identify this annotation.
				myid: 1
			});
		}).shouldNotThrowException();
			
		valueOf(testRun, annotation.animate).shouldBeTrue();
		valueOf(testRun, annotation.image).shouldBeUndefined();
		valueOf(testRun, annotation.latitude.toFixed(1)).shouldBeEqual(33.7);
		valueOf(testRun, annotation.longitude.toFixed(1)).shouldBeEqual(-84.4);
		valueOf(testRun, annotation.pincolor).shouldBeEqual(Titanium.Map.ANNOTATION_RED);
		valueOf(testRun, annotation.subtitle).shouldBeEqual('Test, CA');
		valueOf(testRun, annotation.title).shouldBeEqual('Test');
		valueOf(testRun, annotation.subtitleid).shouldBeUndefined();
		valueOf(testRun, annotation.titleid).shouldBeUndefined();
		
		map.addEventListener('complete', function() {
			win.close();
			finish(testRun);
		});
		map.addAnnotation(annotation);
		win.add(map);
		win.open();
	}
				
	this.annotation_methods = function(testRun) {
		var annotation = Titanium.Map.createAnnotation({
				latitude: 33.74511,
				longitude: -84.38993,
				title: "Test",
				subtitle: "Test, CA",
				pincolor: Titanium.Map.ANNOTATION_RED,
				animate: true,
				// Custom property to uniquely identify this annotation.
				myid: 1
			});

		valueOf(testRun, annotation.getAnimate()).shouldBeTrue();
		valueOf(testRun, annotation.getImage()).shouldBeUndefined(); 
		valueOf(testRun, annotation.getLatitude().toFixed(1)).shouldBeEqual(33.7);
		valueOf(testRun, annotation.getLongitude().toFixed(1)).shouldBeEqual(-84.4);
		valueOf(testRun, annotation.getPincolor()).shouldBeEqual(Titanium.Map.ANNOTATION_RED);
		valueOf(testRun, annotation.getSubtitle()).shouldBeEqual('Test, CA');
		valueOf(testRun, annotation.getTitle()).shouldBeEqual('Test');

		valueOf(testRun, function() { 
			annotation.setAnimate(false);
		}).shouldNotThrowException();
		
		valueOf(testRun, function() { 
			annotation.setLatitude(34.74511);
		}).shouldNotThrowException();
		
		valueOf(testRun, function() { 
			annotation.setLongitude(-85.38993);
		}).shouldNotThrowException();
		
		valueOf(testRun, function() { 
			annotation.setPincolor(Titanium.Map.ANNOTATION_GREEN);
		}).shouldNotThrowException();
		
		valueOf(testRun, function() { 
			annotation.setSubtitle('New test subtitle');
		}).shouldNotThrowException();
		
		valueOf(testRun, function() { 
			annotation.setTitle('New test title');
		}).shouldNotThrowException();
		
		valueOf(testRun, function() { 
			annotation.setImage('file:///suites/map/image.png');
		}).shouldNotThrowException();
		
		valueOf(testRun, function() { 
			annotation.setSubtitleid('newSubtitleiD');
		}).shouldNotThrowException();
		
		valueOf(testRun, function() { 
			annotation.setTitleid('newtitleiD');
		}).shouldNotThrowException();
		
		valueOf(testRun, annotation.getAnimate()).shouldBeFalse();
		valueOf(testRun, annotation.getLatitude().toFixed(1)).shouldBeEqual(34.7);
		valueOf(testRun, annotation.getLongitude().toFixed(1)).shouldBeEqual(-85.4);
		valueOf(testRun, annotation.getPincolor()).shouldBeEqual(Titanium.Map.ANNOTATION_GREEN);
		valueOf(testRun, annotation.getSubtitle()).shouldBeEqual('New test subtitle');
		valueOf(testRun, annotation.getTitle()).shouldBeEqual('New test title');
		valueOf(testRun, annotation.getImage()).shouldBeEqual('file:///suites/map/image.png'); 
		valueOf(testRun, annotation.getSubtitleid()).shouldBeEqual('newSubtitleiD');
		valueOf(testRun, annotation.getTitleid()).shouldBeEqual('newtitleiD');
		
		finish(testRun);
	}
}