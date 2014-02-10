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
	
	this.name = "ui_view";
	this.tests = [
		{name: "backgroundGradient"},
		{name: "sizeProperty"},
		{name: "percentageDimension"},
		{name: "getProperties"},
		{name: "fireevent"},
		{name: "sourcevalue"},
		{name: "thisvalue"},
		{name: "offsetProperty"},
		{name: "e_source_size"}
	]
	
	//TIMOB-1124
	this.backgroundGradient = function(testRun) {
		var win = Ti.UI.createWindow({backgroundColor: 'black'});
		var linearGradient = Ti.UI.createView({
			width: 100,
			height: 100,
			backgroundGradient: {
				type: 'linear',
				startPoint: { x: '0%', y: '50%' },
				endPoint: { x: '100%', y: '50%' },
				colors: [ { color: 'red', offset: 0.0}, { color: 'blue', offset: 0.25 }, { color: 'red', offset: 1.0 } ]
			}
		});
		win.add(linearGradient);
		linearGradient.addEventListener("postlayout", function(){
			valueOf(testRun, linearGradient.backgroundGradient.type).shouldBe('linear');
			valueOf(testRun, linearGradient.width).shouldBe(100);
			valueOf(testRun, linearGradient.height).shouldBe(100);
			
			finish(testRun);
		});
		win.open();
	}
	
	//TIMOB-1501
	this.sizeProperty=function(testRun){
		var win = Titanium.UI.createWindow();
		var view1 = Ti.UI.createView({
			top:0,
			bottom:50,
			left:20,
			right:20
		});
		var lbl1 = Ti.UI.createLabel({
			text: 'Outer view',
			top: 5,
			left: 5
		});
		view1.add(lbl1);
		win.add(view1);
		view1.addEventListener("postlayout", function(){
			valueOf(testRun,view1.size.height).shouldBe(win.size.height-50);
			valueOf(testRun,view1.size.width).shouldBe(win.size.width-40);
			
			finish(testRun);
		});
		win.open();
	}
	
	//TIMOB-3238
	this.percentageDimension=function(testRun){
		var win = Ti.UI.createWindow({
			layout: 'vertical', 
			fullscreen: true, 
		});
		var view = Ti.UI.createView({
			layout: 'horizontal',
			height: 50,
			backgroundColor: '#ccf',
			width: 200
		});
		var nested_view = Ti.UI.createView({
			height: 50,
			backgroundColor: '#cfc',
			width: '50%'
		});
		view.add(nested_view);
		win.add(view);
		nested_view.addEventListener("postlayout", function(){
			valueOf(testRun, nested_view.width).shouldBe('50%');
			valueOf(testRun,nested_view.height ).shouldBe(50);
			
			finish(testRun); 
		})
		win.open();
	}
	
	//TIMOB-4644
	this.getProperties = function(testRun){
		var myApp = {};
		myApp.ui = {};
		myApp.ui.createMyView = function() {
			var v = Ti.UI.createView({});
			v.foo = 100;
			v.getSomething = function() {
				return v.foo;
			};
			v.setSomething = function(val) {
				v.foo = val;
			}
			v.getFood = 200;
			return v;
		};
		var myView = myApp.ui.createMyView();
		valueOf(testRun, myView.getSomething).shouldBeFunction();
		valueOf(testRun, myView.setSomething).shouldBeFunction();
		valueOf(testRun, myView.getFood).shouldBe(200);
		valueOf(testRun, myView.getSomething()).shouldBe(100);
		myView.setSomething(50);
		valueOf(testRun, myView.getSomething()).shouldBe(50);
		
		finish(testRun); 
	}
	
	//TIMOB-6204
	this.fireevent=function(testRun){
		var win = Ti.UI.createWindow({
			backgroundColor:'red'
		});
		var view=Ti.UI.createView({
			height:100,
			width:100
		});
		valueOf(testRun, win.backgroundColor).shouldBe('red');
		view.addEventListener('background', function(){
			win.backgroundColor = 'green';
			valueOf(testRun, win.backgroundColor).shouldBe('green');
			
			finish(testRun);
		});
		win.addEventListener('open', function(){
			view.fireEvent('background');
		});
		win.open();
	}

	//TIMOB-9054
	this.sourcevalue=function(testRun){
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			backgroundColor: "blue"
		});
		win.add(view);
		valueOf(testRun, view.backgroundColor).shouldBe('blue');
		view.addEventListener("myEvent", function(e) {
			e.source.backgroundColor = "red";
			valueOf(testRun, e.message).shouldBe('Hello');
			valueOf(testRun, view.backgroundColor).shouldBe('red');
			
			finish(testRun);
		});
		view.addEventListener("postlayout", function(e) {
			var data = {message: "Hello"};
			e.source.fireEvent("myEvent", data);
		});
		win.open();
	}
	
	//TIMOB-9085
	this.thisvalue = function(testRun){
		var win = Ti.UI.createWindow({
			navBarHidden: true
		});
		var view = Ti.UI.createView({ width: '100%', height: '100%'});
		view.addEventListener('postlayout', function(){
			valueOf(testRun, this).shouldBeObject();
			valueOf(testRun, this).shouldBe('[object TiUIView]');

			finish(testRun);
		});
		win.add(view);
		win.open();
	}
	
	//TIMOB-10015
	this.offsetProperty = function(testRun){
		var win1 = Ti.UI.createWindow({
			layout:'vertical',
			backgroundColor:'gray',
			exitOnClose:true,
			navBarHidden:true
		});
		var view = Ti.UI.createView({
			height:100,
			width:100,
			backgroundGradient:{
				type:'linear',
				endPoint:{ x:0, y:'100%' },
				colors:[ {color:'white'  },{color:'red' }]
			}
		});
		win1.add(view);
		view.addEventListener('postlayout', function(){
			valueOf(testRun, view.backgroundGradient.type).shouldBe('linear');  
			valueOf(testRun, view.height).shouldBe(100);  
			valueOf(testRun, view.width).shouldBe(100); 
			
			finish(testRun);
		})
		win1.open();
	}
	
	//TIMOB-10485
	this.e_source_size = function(testRun){
		var win = Ti.UI.createWindow();
		var data = [];
		var label = Ti.UI.createLabel({
			text:'appcelarator'
		});
		var view = Ti.UI.createView({
			height:Ti.UI.SIZE,
			width:210
		});
		view.addEventListener('postlayout',function(e){
			valueOf(testRun, e.source.size.width).shouldBe(210);
			valueOf(testRun, e.source.size.height).shouldNotBe(0);
			
			finish(testRun);
		});
		var view2 = Ti.UI.createView({
			height:Ti.UI.SIZE,
			width:250
		});
		view.add(label);
		view2.add(view);
		var tvr = Ti.UI.createTableViewRow();
		tvr.add(view2);
		data.push(tvr);
		var tv = Ti.UI.createTableView({
			data:data
		});
		win.add(tv);
		win.open();
	}
	
}