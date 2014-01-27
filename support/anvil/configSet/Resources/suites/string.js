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

	this.name = "string";
	this.tests = [
		{name: "string"},
		
	]

	//TIMOB-11709
	this.string = function(testRun){
		var win = Ti.UI.createWindow({
			backgroundColor:'white'
		});
		win.addEventListener('focus', function() {
			var date = "GIBBERISH";
			valueOf(testRun,function(){
				String.formatTime(date);
			}).shouldNotThrowException();
			
			finish(testRun);
		});
		win.open();
	}
}