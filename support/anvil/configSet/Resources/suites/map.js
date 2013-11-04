/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
 
module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "map";
	this.tests = [
		{name: "addAnnotations"},
		{name: "subtitleid_titleid"},
		{name: "blobSupport"},
		{name: "appCrash"},
		{name: "customViewsInThePin"}
		]

	//TIMOB-5310
	this.addAnnotations = function(testRun) {
		var win = Ti.UI.createWindow();
		var atlantaParams = {
			latitude:33.74511,
			longitude:-84.38993,
			title:"Atlanta, GA",
			subtitle:'Atlanta Braves Stadium\nfoo',
			animate:true,
			rightButton: Titanium.UI.iPhone.SystemButton.DISCLOSURE,
			myid:3
		};
		atlantaParams.pincolor = Titanium.Map.ANNOTATION_PURPLE;
		var atlanta = [];
		atlanta.push(Titanium.Map.createAnnotation(atlantaParams));
		var mapview = Titanium.Map.createView({
			mapType: Titanium.Map.STANDARD_TYPE,
			region:{
				latitude:33.74511,
				longitude:-84.38993,
				latitudeDelta:0.5,
				longitudeDelta:0.5
			},
			animate:true,
			regionFit:true,
			userLocation:true
		});
		win.add(mapview);
		valueOf(testRun, function(){
			mapview.addAnnotations(atlanta);
		}).shouldNotThrowException();
		win.open();

		finish(testRun);
	}

	//TIMOB-7308
	this.subtitleid_titleid = function(testRun) {
		var defaultPin1 = Titanium.Map.createAnnotation({
			latitude:37.390749,
			longitude:-122.081651,
			titleid:'title',
			subtitleid:'subtitle',
			animate:true,
			myid:3,
			pincolor:Titanium.Map.ANNOTATION_GREEN
		});
		valueOf(testRun, defaultPin1.subtitleid).shouldBe('subtitle');
		valueOf(testRun, defaultPin1.titleid).shouldBe('title');

		finish(testRun);
	}

	//TIMOB-6895
	this.blobSupport = function(testRun) {
		var blob = Ti.UI.createImageView({
			image:"images/chat.png"
		}).toBlob();
		var annBlob = Ti.Map.createAnnotation({
			latitude: 37.389569, 
			longitude:-122.050212,
			image: blob,
			animate: true
		});
		valueOf(testRun, annBlob.image).shouldBeObject();

		finish(testRun);
	}

	//TIMOB-10691
	this.appCrash = function(testRun) {
		var ann = Ti.Map.createAnnotation({
			animate: true,
			pincolor: Ti.Map.ANNOTATION_RED,
			title: "Mountain View",
		});
		ann.latitude = 37.38956;
		ann.longitude = -122.05021;  
		valueOf(testRun, ann.latitude).shouldBe(37.38956);
		valueOf(testRun, ann.longitude).shouldBe(-122.05021);

		finish(testRun);
	}

	//TIMOB-12582/TIMOB-12583
	this.customViewsInThePin = function(testRun) {
		var myView1 = Ti.UI.createView({
			width:Ti.UI.SIZE,
			height:Ti.UI.SIZE,
			backgroundColor:'red'
		});
		var label = Ti.UI.createLabel({
			text:" $400K ",
			font:{fontSize:18, fontWeight:"bold", fontStyle:"italic"}
		});
		myView1.add(label);
		var anno = Titanium.Map.createAnnotation({
			latitude: -33.87365,
			customView: myView1,
			image: "KS_nav_ui.png",
			longitude: 151.20689,
		});
		valueOf(testRun, anno.customView.backgroundColor).shouldBe('red');

		finish(testRun);
	}
}
