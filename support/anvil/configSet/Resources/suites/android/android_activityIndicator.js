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
    
	this.name = "activityIndicator";
	this.tests = [
		{name: "activityIndicator", timeout: 5000},
		{name: "focusWindow", timeout:50000},
	]
	
	//TIMOB-6092
	this.activityIndicator = function(testRun) {
		var win = Ti.UI.createWindow({
			backgroundColor : 'red'
		});
		var style1;
		if (Ti.Platform.name === 'iPhone OS') {
			style1 = Ti.UI.iPhone.ActivityIndicatorStyle.PLAIN;
		} else {
			style1 = Ti.UI.ActivityIndicatorStyle.PLAIN;
		}
		var activityIndicator = Ti.UI.createActivityIndicator({
			color : 'red',
			font : {
				fontFamily : 'Helvetica Neue',
				fontSize : 26,
				fontWeight : 'bold'
			},
			message : 'Loading...',
			style:style1,
			top : 0,
			left : 0,
			height: Ti.UI.SIZE,
			width: Ti.UI.SIZE
		});
		win.add(activityIndicator);
		win.addEventListener('focus', function(){
			valueOf(testRun, function(){
				activityIndicator.show();
			}).shouldNotThrowException();
			valueOf(testRun, activityIndicator.color).shouldBe('red');
				activityIndicator.color = 'green';
			valueOf(testRun, activityIndicator.color).shouldBe('green');
			valueOf(testRun, activityIndicator.getTop()).shouldBe(0);
			valueOf(testRun, activityIndicator.getLeft()).shouldBe(0);
				activityIndicator.color = 'blue';
			valueOf(testRun, activityIndicator.color).shouldBe('blue');
			valueOf(testRun, function(){
				activityIndicator.hide();
			}).shouldNotThrowException();
			
			finish(testRun);
		});
		win.open();
	}
	
	//TIMOB-7024
	this.focusWindow = function(testRun) {
		var suite_complete=false;
		var win1 = Ti.UI.createWindow({
			fullscreen : false,
			backgroundColor:'red'
		});
		win1.add(Ti.UI.createLabel({
			top : '0dp',
			text : 'Win1'
		}));
		setTimeout(function(){
			var win2 = Ti.UI.createWindow({
				fullscreen : false,
				backgroundColor:'green'
			});
			win2.add(Ti.UI.createLabel({
				top : '0dp',
				text : 'Win2'
			}));
			win2.open();
			setTimeout(function(){
				suite_complete=true;
				win2.close();
			},1000);
		},3000);
		win1.addEventListener('focus', function(){
			var actInd = Ti.UI.createActivityIndicator({
				bottom : 10,
				height : 50,
				width : 10,
				message : 'Loading...'
			});
			win1.add(actInd);
			valueOf(testRun,function(){
				actInd.show();
			}).shouldNotThrowException();
			valueOf(testRun, actInd.getBottom()).shouldBe(10);
			valueOf(testRun, actInd.getHeight()).shouldBe(50);
			valueOf(testRun, actInd.getWidth()).shouldBe(10);
			setTimeout(function(){
				valueOf(testRun,function(){
					actInd.hide();
				}).shouldNotThrowException();
			}, 2000);
			if(suite_complete == true)
				finish(testRun);
		});
		win1.open();
	}
}