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
	
	this.name = "ui_label";
	this.tests = [
		{name: "labelHeight"},
		{name: "labelTextid"},
		{name: "labelPostlayout"},
		{name: "labelBackground"}
	]
	
	//TIMOB-4123
	this.labelHeight = function(testRun) {
		var label = Ti.UI.createLabel({
			top:10,
			right:10,
			height : 'auto',
			width:'auto',
			borderColor:'red'
		});
		valueOf(testRun, label.getTop()).shouldBe(10);
		valueOf(testRun, label.getHeight()).shouldBe('auto');
		valueOf(testRun, label.getWidth()).shouldBe('auto');
		valueOf(testRun, label.getBorderColor()).shouldBe('red');
		valueOf(testRun, label.getRight()).shouldBe('10');
						
		finish(testRun);
	}
	
	//TIMOB-9912
	this.labelTextid=function(testRun){
		var  win = Titanium.UI.createWindow();
		var view = Ti.UI.createView({
			top:0,
			height:80,
			right:0,
			left:0
		});
		var label =  Ti.UI.createLabel({
			font:{fontSize:30,fontFamily:'Helvetica Neue'},
			color:'red',
			left:0,
			width:'100%',
			textid:'new',
			right:'10%',
			textid:'check'
		});
		view.add(label);
		label.textid='new';
		valueOf(testRun, label.textid).shouldBe('new');
		label.textid='new';
		valueOf(testRun, label.textid).shouldBe('new');
		label.textid='new';
		valueOf(testRun, label.textid).shouldBe('new');
		
		finish(testRun);
		win.add(view)
		win.open();
	}
	
	//TIMOB-9994
	this.labelPostlayout=function(testRun){
		var win = Ti.UI.createWindow({
			layout : 'vertical'
		});
		var postlayoutStatus=false;
		var label = Ti.UI.createLabel({
			text : "hello",
			left : 0,
			top:10,
			color:'red',
			width : Ti.UI.SIZE,
			height : Ti.UI.SIZE
		});
		label.addEventListener("postlayout", function(e) {
			if(postlayoutStatus){
				valueOf(testRun, label.text).shouldBe('newText');
				finish(testRun);
			}
			else {
				valueOf(testRun, label.text).shouldBe('hello');
				valueOf(testRun, label.left).shouldBe(0);
				valueOf(testRun, label.top).shouldBe(10);
				valueOf(testRun, label.color).shouldBe('red');
			}
		})
		setTimeout(function(){
			label.text = "newText";
			postlayoutStatus=true;
		},2000);
		win.add(label);
		win.open();
	}
	
	//TIMOB-8955 & TIMOB-8246
	this.labelBackground=function(testRun){
		var win = Ti.UI.createWindow();
		win.open();
		var signonview = Ti.UI.createView({
			top:10,
			left:10,
			right:10
		});
		var label = Ti.UI.createLabel({
			text:'Appcelerator',
			backgroundGradient:{
				type:'linear',
				colors:['red','blue'],
				startPoint:{x:0,y:0},
				endPoint:{x:0,y:45},
				backFillStart:true
			},
			shadowColor:'green',
			shadowOffset:{x:0,y:1},
			top:0,
			height:45,
			width:290,
			textAlign:'center',
			backgroundColor: 'red'
		});
		label.addEventListener("postlayout", function(){
			valueOf(testRun,label.getBackgroundGradient().type).shouldBe('linear');
			valueOf(testRun,label.getBackgroundGradient().backFillStart).shouldBeTrue();
			valueOf(testRun,label.getBackgroundGradient().startPoint.x).shouldBe(0);
			valueOf(testRun,label.getBackgroundGradient().startPoint.y).shouldBe(0);
			valueOf(testRun,label.getBackgroundGradient().endPoint.x).shouldBe(0);
			valueOf(testRun,label.getBackgroundGradient().endPoint.y).shouldBe(45);
			
			valueOf(testRun,label.shadowOffset.x).shouldBe(0);
			valueOf(testRun,label.shadowOffset.y).shouldBe(1);
			valueOf(testRun,label.getTop()).shouldBe(0);
			valueOf(testRun,label.getTextAlign()).shouldBe('center');
			valueOf(testRun, label.getText()).shouldBe('Appcelerator');
			valueOf(testRun, label.getBackgroundColor()).shouldBe('red');
			valueOf(testRun,label.getHeight()).shouldBe(45);
			valueOf(testRun,label.getWidth()).shouldBe(290);
			
			finish(testRun);
		})
		valueOf(testRun, function(){
			signonview.add(label);
		}).shouldNotThrowException();
		win.add(signonview);
	}
}