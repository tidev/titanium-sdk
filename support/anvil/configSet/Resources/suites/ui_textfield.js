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
	
	this.name = "ui_textfield";
	this.tests = [
		{name: "changeEvent"},
		{name: "editableFalse"}, //due to TIMOB-15700
		{name: "hasText"},
		{name: "hasTextInIfStatement"}, //due to TIMOB-15700
		//{name: "focusAndBlurEvents"}, //due to TIMOB-15700
		{name: "setProperties"}, //due to TIMOB-15700
		{name: "setSelectionMethod"} //due to TIMOB-15700
	];

	//TIMOB-10596
	this.changeEvent = function(testRun){
		var win1 = Ti.UI.createWindow({
			title: 'Bug'
		});
		var focus1 = false;
		var textField1 = Ti.UI.createTextField();
		win1.add(textField1);
		textField1.addEventListener('change', function() {
			focus1 = true;  
		});
		setTimeout(function(){
			valueOf(testRun, focus1).shouldBeFalse();

			finish(testRun);
		}, 3000);
		win1.open();
	}
	
	//TIMOB-877
	this.editableFalse = function(testRun) {
		var w = Ti.UI.createWindow();
		var tf =  Ti.UI.createTextField({
			width: 280,
			height: 44,
			hintText: "Selecionar...",
			font: {
				fontFamily: "Helvetica Neue",
				fontSize: 18
			},
			color: "red",
			editable: true
		});
		tf.addEventListener("focus", function(){
			valueOf(testRun, tf.editable).shouldBe(true);
			valueOf(testRun, tf.width).shouldBe(280);
			valueOf(testRun, tf.height).shouldBe(44);
			valueOf(testRun, tf.color).shouldBe("red");
			valueOf(testRun, function(){
				tf.editable = true;
			}).shouldNotThrowException();
			valueOf(testRun, function(){
				tf.editable = false;
			}).shouldNotThrowException();
			
			finish(testRun);
		});
		w.add(tf);
		var fun = function(){
			tf.focus();
		}
		w.addEventListener('focus',fun);
		w.open();
	}
	
	//TIMOB-996
	this.hasText = function(testRun) {
		var textField1 = Ti.UI.createTextField();
		var textField2 = Ti.UI.createTextField({
			value : 'I am a textfield'
		});
		var textField3 = Ti.UI.createTextField({
			value : '',
		});
		valueOf(testRun,textField1.hasText()).shouldBeFalse();
		valueOf(testRun,textField2.hasText()).shouldBeTrue();
		valueOf(testRun,textField3.hasText()).shouldBeFalse();
		
		finish(testRun);
	}
	
	//TIMOB-997
	this.hasTextInIfStatement = function(testRun) {
		var win = Ti.UI.createWindow();
		var textField = Ti.UI.createTextField({
			height:30,
			color: 'red',
			font: {fontFamily:'Helvetica Neue', fontSize:12, fontWeight:'bold'},
			width : 70,
			value:'has text'
		});
		var found_Bug;
		textField.addEventListener('focus', function(e) {
			valueOf(testRun, function(){
				if(textField.hasText()) {
					found_Bug = false;
				}
				else { 
					found_Bug = true;
				}
			}).shouldNotThrowException();
			valueOf(testRun, found_Bug).shouldBeFalse();
			valueOf(testRun, textField.height).shouldBe(30);
			valueOf(testRun, textField.color).shouldBe('red');
			valueOf(testRun, textField.width).shouldBe(70);
			
			finish(testRun);
		});
		win.add(textField);
		var fun = function(){
			textField.focus();
		}
		win.addEventListener('focus', fun);
		win.open();
	}
			
	//TIMOB-6873
	this.focusAndBlurEvents = function(testRun) {
		var win = Ti.UI.createWindow();
		var focus_count = 0;
		var blur_count = 0;
		var row1 = Ti.UI.createTableViewRow({
			height : 80,
		});
		tf1 = Titanium.UI.createTextField({
			color : '#336699',
			width : 250,
			height : 80,
			focusable : true
		});
		tf1.addEventListener('focus', function() {
			focus_count += 1;
		});
		tf1.addEventListener('blur', function() {
			blur_count += 1;
			valueOf(testRun, focus_count).shouldBe(1);
			valueOf(testRun, blur_count).shouldBe(1);
		});
		row1.add(tf1);
		var row2 = Ti.UI.createTableViewRow({
			height : 80,
		});
		tf2 = Titanium.UI.createTextField({
			color : '#336699',
			width : 250,
			height : 80,
			focusable : true
		});
		tf2.addEventListener('focus', function() {
			focus_count += 1;
		});
		tf2.addEventListener('blur', function() {
			blur_count += 1;
			valueOf(testRun, focus_count).shouldBe(2);
			valueOf(testRun, blur_count).shouldBe(2);
		});
		row2.add(tf2);
		var row3 = Ti.UI.createTableViewRow({
			height : 80,
		});
		tf3 = Titanium.UI.createTextField({
			color : '#336699',
			width : 250,
			height : 80,
			focusable : true
		});
		tf3.addEventListener('focus', function() {
			focus_count += 1;
			valueOf(testRun, focus_count).shouldBe(3);
			valueOf(testRun, blur_count).shouldBe(2);
			
			finish(testRun);
		});
		row3.add(tf3);
		var data = [];
		data[0] = row1;
		data[1] = row2;
		data[2] = row3;
		var tableView = Ti.UI.createTableView({
			data : data,
		});
		win.add(tableView);
		win.addEventListener('focus', function(){
			tf1.focus();
			tf2.focus();
			tf3.focus();
		});
		win.open();
	}
	
	// TIMOB-7255
	this.setProperties = function(testRun) {
		var win = Ti.UI.createWindow();
		var textField = Ti.UI.createTextField({
			height: 30,
			top: 20,
			left: 20,
			right: 20,
			backgroundColor:'green'
		});
		textField.addEventListener("focus", function(){
			valueOf(testRun,textField.getHeight()).shouldBe(30);
			valueOf(testRun,textField.getTop()).shouldBe(20);
			valueOf(testRun,textField.getLeft()).shouldBe(20);
			valueOf(testRun,textField.getRight()).shouldBe(20);
			
			finish(testRun);
		});
		win.add(textField);
		var fun = function(){
			textField.focus();
		}
		win.addEventListener('focus', fun);
		win.open();
	}
	
	//TIMOB-10460
	this.setSelectionMethod = function(testRun) {
		var text = Ti.UI.createTextField({
			top: 10,
			value: "This is Sparta.",
			left:10,
			backgroundColor :'red'
		});
		var win = Ti.UI.createWindow({backgroundColor: "#fff"});
		var fun = function(){
			valueOf(testRun, function(){
				text.setSelection(0, 4);
			}).shouldNotThrowException();
			valueOf(testRun, text.getTop()).shouldBe(10);
			valueOf(testRun, text.getLeft()).shouldBe(10);
			valueOf(testRun, text.getBackgroundColor()).shouldBe('red');
			
			finish(testRun);
		};
		win.addEventListener('focus', fun);
		win.add(text);
		win.open();
	}
}