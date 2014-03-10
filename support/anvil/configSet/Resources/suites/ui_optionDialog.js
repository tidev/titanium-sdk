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
	
	this.name = "ui_optionDialog";
	this.tests = [
		{name: "dialogBox", timeout: 60000}
	];

	//TIMOB-7548
	this.dialogBox = function(testRun){
		var win = Ti.UI.createWindow();
		var dialog = Titanium.UI.createOptionDialog({
			options: ['Option 1','Option 2'],
			cancel:1
		});
		var fun = function(){ 
			dialog.show();
			dialog.hide();
			setTimeout(function(){
				valueOf(testRun, function(){
					dialog.show();
				}).shouldNotThrowException();

				finish(testRun);
			},2000);
		};
		win.addEventListener('focus', fun);
		win.open();
	}
}