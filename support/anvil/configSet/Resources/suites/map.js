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
		{name: "appCrash"},
		{name: "subtitleidAndTitleid"}
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

	//TIMOB-10691
	this.appCrash = function(testRun) {
		valueOf(testRun,  function() {
			var ann = Ti.Map.createAnnotation({
				animate : true,
				pincolor : Ti.Map.ANNOTATION_RED,
				title : "Mountain View",
			});
			ann.latitude = 37.38956;
			ann.longitude = -122.05021; 
			valueOf(testRun, ann.latitude).shouldBe(37.38956);
			valueOf(testRun, ann.longitude).shouldBe(-122.05021);
		}).shouldNotThrowException();

		finish(testRun);	
	}
	
	//TIMOB-7308
	this.subtitleidAndTitleid = function(testRun) {
		var win1 = Titanium.UI.createWindow({ 
			title:'id:string',
			backgroundColor:'#fff'
		});
		var defaultPin1 = Titanium.Map.createAnnotation({
			latitude:37.390749,
			longitude:-122.081651,
			titleid:'title',
			subtitleid:'subtitle',
			animate:true,
			myid:3,
			pincolor:Titanium.Map.ANNOTATION_GREEN
		});
		var mapview1 = Titanium.Map.createView({
			mapType: Titanium.Map.STANDARD_TYPE,
			region: {
				latitude:37.337681,
				longitude:-122.038193,
				latitudeDelta:1,
				longitudeDelta:2
			},
			animate:true,
			regionFit:true,
			userLocation:false,
			annotations:[defaultPin1]
		});
		win1.addEventListener('open', function() {
			setTimeout(function() {
				defaultPin1.titleid = "title2";
				defaultPin1.subtitle = "Updated!";
				valueOf(testRun, defaultPin1.titleid).shouldBe("title2");
				valueOf(testRun, defaultPin1.subtitle).shouldBe("Updated!");

				finish(testRun);
			}, 3000);

		});
		win1.add(mapview1);
		win1.open();
	}
}
