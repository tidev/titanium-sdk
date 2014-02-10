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

	this.name = "ui_animation";
	this.tests = [
		{name: "animateCallback", timeout: 50000},
		{name: "animationCurves"},
		{name: "simpleAnimationAppCrash"},
		{name: "iOS_specific_constants"},
	]

	//TIMOB-6227
	this.animateCallback = function(testRun) {
		var win = Ti.UI.createWindow({
			backgroundColor : 'blue'
		});
		win.addEventListener('open',function(e){
			var animation = Ti.UI.createAnimation({
				backgroundColor : 'red',
				duration : 500
			});
			win.animate(animation, function(){

				finish(testRun);
			});
		});
		win.open();
	}

	//TIMOB-9343
	this.animationCurves = function(testRun) {
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			valueOf(testRun, Ti.UI.ANIMATION_CURVE_EASE_IN_OUT).shouldBeNumber();
			valueOf(testRun, Ti.UI.ANIMATION_CURVE_EASE_IN).shouldBeNumber();
			valueOf(testRun, Ti.UI.ANIMATION_CURVE_EASE_OUT).shouldBeNumber();
			valueOf(testRun, Ti.UI.ANIMATION_CURVE_LINEAR).shouldBeNumber();

			finish(testRun);
		}
		else {

			finish(testRun);
		}
	}

	//TIMOB-7416
	this.simpleAnimationAppCrash = function(testRun) {
		var win1 = Ti.UI.createWindow({
			backgroundColor : "white"
		});
		var view = Ti.UI.createView({
			height : 100,
			width : 100,
			backgroundColor : "green"
		});
		win1.add(view);
		var matrix = Ti.UI.create2DMatrix();
		var matrix1 = matrix.rotate(120);
		var matrix2 = matrix.rotate(240);
		var transforms = [matrix, matrix1, matrix2];
		var nextTransform = 1;
		animation = Ti.UI.createAnimation({
			transform : transforms[nextTransform],
			duration : 500,
		});
		animation.addEventListener('complete', function(e) {
			if(nextTransform == 0) {
				nextTransform = 1;
				animation.transform = transforms[nextTransform];
			} else {
				nextTransform = (nextTransform + 1) % 3;
				animation.transform = transforms[nextTransform];
				view.animate(animation);
			}
		});
		win1.addEventListener('open', function(e) {
			valueOf(testRun, function(){
				view.animate(animation);
			}).shouldNotThrowException();
		});
		win1.open();

		finish(testRun);
	}

	//TIMOB-5166
	this.iOS_specific_constants = function(testRun) {
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_CLEAR).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_COLOR).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_COLOR_BURN).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_COLOR_DODGE).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_COPY).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_DARKEN).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_DESTINATION_ATOP).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_DESTINATION_IN).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_DESTINATION_OUT).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_DESTINATION_OVER).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_DIFFERENCE).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_EXCLUSION).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_HARD_LIGHT).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_HUE ).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_LIGHTEN).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_LUMINOSITY).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_MULTIPLY).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_NORMAL).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_OVERLAY).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_PLUS_DARKER).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_PLUS_LIGHTER).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_SATURATION).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_SCREEN).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_SOFT_LIGHT).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_SOURCE_ATOP).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_SOURCE_IN).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_SOURCE_OUT).shouldBeNumber();
			valueOf(testRun, Ti.UI.iOS.BLEND_MODE_XOR).shouldBeNumber();

			finish(testRun);
		} else {

			finish(testRun);
		}
	}
}
