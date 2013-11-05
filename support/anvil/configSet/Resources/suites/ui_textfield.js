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
		{name: "editableFalse"},
		{name: "hasText"},
		{name: "hasTextInIfStatement"},
		{name: "textFieldInScrollview"},
		{name: "focusAndBlurEvents"},
		{name: "setProperties"},
		{name: "setSelectionMethod"}
	]
	
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
		})
		w.add(tf);
		w.open();
		tf.focus();
	}
	
	//TIMOB-996
	this.hasText = function(testRun) {
		var textArea1 = Ti.UI.createTextArea();
		var textArea2 = Ti.UI.createTextArea({
			value : 'I am a textarea'
		});
		var textArea3 = Ti.UI.createTextArea({
			value : '',
		});
		var textField1 = Ti.UI.createTextField();
		var textField2 = Ti.UI.createTextField({
			value : 'I am a textfield'
		});
		var textField3 = Ti.UI.createTextField({
			value : '',
		});
		valueOf(testRun,textArea1.hasText()).shouldBeFalse();
		valueOf(testRun, textArea2.hasText()).shouldBeTrue();
		valueOf(testRun, textArea3.hasText()).shouldBeFalse();
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
		textField.addEventListener('focus', function(e) {
			valueOf(testRun, function(){
				if(textField.hasText()) {
					found_Bug = false;
				}
				else { 
					found_Bug = true;
				}
			}).shouldNotThrowException();
			valueOf(testRun, textField.height).shouldBe(30);
			valueOf(testRun, textField.color).shouldBe('red');
			valueOf(testRun, textField.width).shouldBe(70);
			
			finish(testRun);
		});
		win.add(textField);
		win.open();
		textField.focus();
	}
	
	//TIMOB-8425
	this.textFieldInScrollview = function(testRun) {
		var win = Ti.UI.createWindow();
		var formboxLeft = Ti.UI.createView();
		var finished = false;
		var field = Ti.UI.createTextField({
			width:250,
			left: 50,
			top: 140,
			height: 95,
			backgroundColor:'red',
			borderRadius:1,
			passwordMask: true
		});
		var scroll = Ti.UI.createScrollView({
			left: 11,
			top: 12,
			width: 433,
			height: 390,
			backgroundColor:'green',
			contentHeight:'auto',
			contentWidth: 'auto',   
		});
		field.addEventListener("focus", function(){
			valueOf(testRun, field.top).shouldBe(140);
			valueOf(testRun, field.left).shouldBe(50);
			valueOf(testRun, field.height).shouldBe(95);
			valueOf(testRun, field.borderRadius).shouldBe(1);
			valueOf(testRun, field.passwordMask).shouldBeTrue();
			valueOf(testRun, field.width).shouldBe(250);
			if(finished){
				finish(testRun);
			}
		})
		field.addEventListener("blur", function(){
			finished = true;
		})
		scroll.add(field);
		formboxLeft.add(scroll);
		win.add(formboxLeft);
		win.addEventListener('focus', function(){
			field.focus();
			field.blur();
			field.focus();
		});
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
		})
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
		})
		win.add(textField);
		win.open();
		textField.focus();
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
		win.addEventListener('focus', function(e) {
			valueOf(testRun, function(){
				text.setSelection(0, 4);
			}).shouldNotThrowException();
			valueOf(testRun, text.getTop()).shouldBe(10);
			valueOf(testRun, text.getLeft()).shouldBe(10);
			valueOf(testRun, text.getBackgroundColor()).shouldBe('red');
			
			finish(testRun);
		});
		win.add(text);
		win.open();
	}
}