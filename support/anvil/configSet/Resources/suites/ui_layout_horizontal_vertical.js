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
	};

	this.name = "ui_layout_horizontal_vertical";
	this.tests = [
		{name: "horizontalTopBottomUndefinedHeight"},
		{name: "horizontalLeftRightUndefinedWidth"},
		{name: "horizontalLeftRightUndefinedWidthNoWrap"},
		{name: "horizontalTopBottomUndefinedHeightNoWrap"},
		{name: "horizontalWrapWithSIZEHeight"},
		{name: "horizontalNoWrapWithSIZEHeight"},
		{name: "horizontalNoWrapTopPaddingSIZEHeight"},
		{name: "horizontalWrapTopPaddingSIZEHeight"},
		{name: "verticalWithTopBottomPadding"},
		{name: "horizontalWrapWithSIZEWidth"},
		{name: "horizontalWrapWithFILLWidth"}
	];

	this.horizontalTopBottomUndefinedHeight = function(testRun) {
		var win = Ti.UI.createWindow({ backgroundColor: 'white'});
		var parent = Ti.UI.createView({backgroundColor:'red',layout:'horizontal', horizontalWrap: true, width:200, height:300});

		var child1 =Ti.UI.createView({backgroundColor:'green', width: 40, top: 10,bottom:10, height: 50});
		var child2 =Ti.UI.createView({backgroundColor:'blue', left: 5, right:20, top: 20, bottom: 10,width:55});
		var child3 =Ti.UI.createView({backgroundColor:'#eee',height:120,width:50});

		parent.add(child1);
		parent.add(child2);
		parent.add(child3);

		win.addEventListener("open", function(e) {
			valueOf(testRun, child1.rect.height).shouldBe(50);
			valueOf(testRun, child1.rect.width).shouldBe(40);
			valueOf(testRun, child1.rect.y).shouldBe(10);
			valueOf(testRun, child1.rect.x).shouldBe(0);

			valueOf(testRun, child2.rect.height).shouldBe(270);
			valueOf(testRun, child2.rect.width).shouldBe(55);
			valueOf(testRun, child2.rect.y).shouldBe(20);
			valueOf(testRun, child2.rect.x).shouldBe(45);

			valueOf(testRun, child3.rect.height).shouldBe(120);
			valueOf(testRun, child3.rect.width).shouldBe(50);
			valueOf(testRun, child3.rect.y).shouldBe(90);
			valueOf(testRun, child3.rect.x).shouldBe(120);

			finish(testRun);
		});

		win.add(parent);
		win.open();
	};

	this.horizontalLeftRightUndefinedWidth = function(testRun) {
		var win = Ti.UI.createWindow({ backgroundColor: 'white'});
		var parent = Ti.UI.createView({backgroundColor:'red',layout:'horizontal', horizontalWrap: true, width:200, height:300});

		var child1 =Ti.UI.createView({backgroundColor:'green', left: 10, right:10, height: 50});
		var child2 =Ti.UI.createView({backgroundColor:'blue', left: 5, right:20, height: 90,width:55});
		var child3 =Ti.UI.createView({backgroundColor:'#eee',left: 5,height:120,width:50});

		parent.add(child1);
		parent.add(child2);
		parent.add(child3);

		win.addEventListener("open", function(e) {
			valueOf(testRun, child1.rect.height).shouldBe(50);
			valueOf(testRun, child1.rect.width).shouldBe(180);
			valueOf(testRun, child1.rect.y).shouldBe(0);
			valueOf(testRun, child1.rect.x).shouldBe(10);

			valueOf(testRun, child2.rect.height).shouldBe(90);
			valueOf(testRun, child2.rect.width).shouldBe(55);
			// ((120 - 90) / 2) + 50
			// child3 determines the maximum height of that row, so we have to calculate accordingly. 
			// We have to add 50 since the previous row just fills and this is in the second row
			valueOf(testRun, child2.rect.y).shouldBe(65);
			valueOf(testRun, child2.rect.x).shouldBe(5);

			valueOf(testRun, child3.rect.height).shouldBe(120);
			valueOf(testRun, child3.rect.width).shouldBe(50);
			valueOf(testRun, child3.rect.y).shouldBe(50);
			valueOf(testRun, child3.rect.x).shouldBe(85);

			finish(testRun);
		});

		win.add(parent);
		win.open();
	};

	this.horizontalLeftRightUndefinedWidthNoWrap = function(testRun) {
		var win = Ti.UI.createWindow({ backgroundColor: 'white'});
		var parent = Ti.UI.createView({backgroundColor:'red',layout:'horizontal', horizontalWrap: false, width:200, height:300});

		var child1 =Ti.UI.createView({backgroundColor:'green', left: 10, right:10, height: 50});
		var child2 =Ti.UI.createView({backgroundColor:'blue', left: 5, right:20, height: 90,width:55});
		var child3 =Ti.UI.createView({backgroundColor:'#eee',left: 5,height:120,width:50});

		parent.add(child1);
		parent.add(child2);
		parent.add(child3);

		win.addEventListener("open", function(e) {
			valueOf(testRun, child1.rect.height).shouldBe(50);
			valueOf(testRun, child1.rect.width).shouldBe(180);
			// (300-50)/2
			valueOf(testRun, child1.rect.y).shouldBe(125);
			valueOf(testRun, child1.rect.x).shouldBe(10);

			valueOf(testRun, child2.rect.height).shouldBe(90);
			valueOf(testRun, child2.rect.width).shouldBe(55);
			valueOf(testRun, child2.rect.y).shouldBe(105);
			valueOf(testRun, child2.rect.x).shouldBe(205);

			valueOf(testRun, child3.rect.height).shouldBe(120);
			valueOf(testRun, child3.rect.width).shouldBe(50);
			valueOf(testRun, child3.rect.y).shouldBe(90);
			valueOf(testRun, child3.rect.x).shouldBe(285);

			finish(testRun);
		});
		win.add(parent);
		win.open();
	};
	
	this.horizontalTopBottomUndefinedHeightNoWrap = function(testRun) {
		var win = Ti.UI.createWindow({ backgroundColor: 'white'});
		var parent = Ti.UI.createView({backgroundColor:'red',layout:'horizontal', horizontalWrap: false, width:200, height:300});

		var child1 =Ti.UI.createView({backgroundColor:'green', width: 40, top: 10,bottom:10, height: 50});
		var child2 =Ti.UI.createView({backgroundColor:'blue', left: 5, right:20, top: 20, bottom: 10,width:55});
		var child3 =Ti.UI.createView({backgroundColor:'#eee',height:120,width:50});

		parent.add(child1);
		parent.add(child2);
		parent.add(child3);

		win.addEventListener("open", function(e) {
			valueOf(testRun, child1.rect.height).shouldBe(50);
			valueOf(testRun, child1.rect.width).shouldBe(40);
			valueOf(testRun, child1.rect.y).shouldBe(10);
			valueOf(testRun, child1.rect.x).shouldBe(0);

			valueOf(testRun, child2.rect.height).shouldBe(270);
			valueOf(testRun, child2.rect.width).shouldBe(55);
			valueOf(testRun, child2.rect.y).shouldBe(20);
			valueOf(testRun, child2.rect.x).shouldBe(45);

			valueOf(testRun, child3.rect.height).shouldBe(120);
			valueOf(testRun, child3.rect.width).shouldBe(50);
			valueOf(testRun, child3.rect.y).shouldBe(90);
			valueOf(testRun, child3.rect.x).shouldBe(120);

			finish(testRun);
		});

		win.add(parent);
		win.open();
	};

	this.horizontalWrapWithSIZEHeight = function(testRun) {
		var win = Ti.UI.createWindow({
			navBarHidden : true,
			backgroundColor : '#000'
		});

		var topView = Ti.UI.createView({
			backgroundColor : 'white',
			height : Ti.UI.SIZE,
			layout : 'horizontal'
		});

		topView.add(Ti.UI.createView({width: Ti.UI.FILL, height: 100, backgroundColor:'blue'}));
		topView.add(Ti.UI.createView({width: Ti.UI.FILL, height: 100, backgroundColor:'red'}));
		topView.add(Ti.UI.createView({width: Ti.UI.FILL, height: 100, backgroundColor:'purple'}));
		topView.add(Ti.UI.createView({width: Ti.UI.FILL, height: 100, backgroundColor:'orange'}));

		win.addEventListener("postlayout", function(e){
			valueOf(testRun, topView.rect.height).shouldBe(400);
			finish(testRun);
		});

		win.add(topView);
		win.open();
	};

	this.horizontalNoWrapWithSIZEHeight = function(testRun) {
		var win = Ti.UI.createWindow({
			navBarHidden : true,
			backgroundColor : '#000'
		});

		var topView = Ti.UI.createView({
			backgroundColor : 'white',
			width : Ti.UI.SIZE,
			height : Ti.UI.SIZE,
			layout : 'horizontal',
			horizontalWrap: false
		});

		topView.add(Ti.UI.createView({width: 50, height: 100, backgroundColor:'blue'}));
		topView.add(Ti.UI.createView({width: 50, height: 150, backgroundColor:'red'}));
		topView.add(Ti.UI.createView({width:50, height: 200, backgroundColor:'purple'}));
		topView.add(Ti.UI.createView({width: 100, height: 100, backgroundColor:'orange'}));

		win.addEventListener("postlayout", function(e){
			valueOf(testRun, topView.rect.width).shouldBe(250);
			valueOf(testRun, topView.rect.height).shouldBe(200);

			finish(testRun);
		});

		win.add(topView);
		win.open();
	};

	this.horizontalNoWrapTopPaddingSIZEHeight = function(testRun) {
		var win = Ti.UI.createWindow({
			navBarHidden : true,
			backgroundColor : '#000'
		});

		var topView = Ti.UI.createView({
			backgroundColor : 'white',
			width : Ti.UI.SIZE,
			height : Ti.UI.SIZE,
			layout : 'horizontal',
			horizontalWrap: false
		});

		topView.add(Ti.UI.createView({width: 50, height: 100, backgroundColor:'blue'}));
		topView.add(Ti.UI.createView({width: 50, height: 150, backgroundColor:'red'}));
		topView.add(Ti.UI.createView({width:50, top: 10, bottom: 25, height: 200, backgroundColor:'purple'}));
		topView.add(Ti.UI.createView({width: 100, height: 100, backgroundColor:'orange'}));

		win.addEventListener("postlayout", function(e){
			valueOf(testRun, topView.rect.width).shouldBe(250);
			valueOf(testRun, topView.rect.height).shouldBe(235);

			finish(testRun);
		});

		win.add(topView);
		win.open();
	};

	this.horizontalWrapTopPaddingSIZEHeight = function(testRun) {
		var win = Ti.UI.createWindow({
			navBarHidden : true,
			backgroundColor : '#000'
		});

		var topView = Ti.UI.createView({
			backgroundColor : 'white',
			height : Ti.UI.SIZE,
			layout : 'horizontal'
		});

		topView.add(Ti.UI.createView({width: Ti.UI.FILL, height: 100, backgroundColor:'blue'}));
		topView.add(Ti.UI.createView({width: 50, height: 100, backgroundColor:'red'}));
		topView.add(Ti.UI.createView({width: 50, top: 50, bottom: 20, height: 100, backgroundColor:'purple'}));
		topView.add(Ti.UI.createView({width: 50, height: 100, backgroundColor:'orange'}));

		win.addEventListener("postlayout", function(e){
			valueOf(testRun, topView.rect.height).shouldBe(270);
			finish(testRun);
		});

		win.add(topView);
		win.open();
	};

	this.verticalWithTopBottomPadding = function(testRun) {
		var win = Ti.UI.createWindow({
			backgroundColor : 'white'
		})

		var container = Ti.UI.createView({
			height : Ti.UI.SIZE,
			backgroundColor : 'yellow',
			width: 400,
			layout : 'vertical'
		})

		var view1 = Ti.UI.createView({
			width : 100,
			height : 100,
			top: 5,
			bottom : 5,
			backgroundColor : 'red'
		})

		var view2 = Ti.UI.createView({
			width : 100,
			height : 100,
			top: 5,
			bottom : 5,
			backgroundColor : 'green'
		})

		win.addEventListener("open", function(e){
			valueOf(testRun, view1.rect.y).shouldBe(5);
			valueOf(testRun, view2.rect.y).shouldBe(115);
			valueOf(testRun, container.rect.height).shouldBe(220);

			finish(testRun);
		});

		container.add(view1);
		container.add(view2);
		win.add(container);
		win.open();
	};
	
	this.horizontalWrapWithSIZEWidth = function(testRun) {
		var win = Ti.UI.createWindow({
			navBarHidden : true,
			backgroundColor : '#000'
		});

		var topView = Ti.UI.createView({
			backgroundColor : 'white',
			width : Ti.UI.SIZE,
			layout : 'horizontal'
		});

		topView.add(Ti.UI.createView({width: 100, height: 100, backgroundColor:'blue'}));
		topView.add(Ti.UI.createView({width: 50, height: 100, backgroundColor:'red'}));

		win.addEventListener("postlayout", function(e){
			valueOf(testRun, topView.rect.width).shouldBe(150);
			finish(testRun);
		});

		win.add(topView);
		win.open();
	};

	this.horizontalWrapWithFILLWidth = function(testRun) {
		var win2 = Titanium.UI.createWindow({  
		    title:'Tab 2',
		    backgroundColor:'#fff'
		});

		var fieldWrapper = Ti.UI.createView({
		    top: 0,
		    left: 0,
		    backgroundColor: '#ff0',
		    layout:'horizontal'
		});
		var Label = Ti.UI.createLabel({
		    text: 'Test text field',
		    height: 20,
		    width: 20
		});
		var Spacer = Ti.UI.createView({
		    width: 10,
		    height: 10,
		    backgroundColor: '#0f0',
		});

		var textfield = Titanium.UI.createTextField({
		    width: Ti.UI.FILL,
		    hintText: 'hint text',
			height: '35'
		});

		var view3 = Ti.UI.createView({
		    width: Ti.UI.FILL,
		    height: 10,
		    backgroundColor: 'purple'
		});

		var view4= Ti.UI.createView({
		    width: 30,
		    height: 10,
		    backgroundColor: 'red'
		});

		var view5= Ti.UI.createView({
		    width: 30,
		    height: 10,
		    backgroundColor: 'white'
		});

		win2.addEventListener("postlayout", function(e){
			// purple view should be in 2nd row
			valueOf(testRun, view3.rect.x).shouldBe(30);
			valueOf(testRun, view3.rect.y).shouldBe(35);

			// red view should be first view in 2nd row
			valueOf(testRun, view4.rect.x).shouldBe(0);
			valueOf(testRun, view4.rect.y).shouldBe(35);

			// white view should be on the third row
			valueOf(testRun, view5.rect.x).shouldBe(0);
			valueOf(testRun, view5.rect.y).shouldBe(45); // 35 (TextField) + 10 (view4)
			finish(testRun);
		});

		fieldWrapper.add(Label);
		fieldWrapper.add(Spacer);
		fieldWrapper.add(textfield);
		fieldWrapper.add(view4);
		fieldWrapper.add(view3);
		fieldWrapper.add(view5);
		win2.add(fieldWrapper);
		win2.open();
	};
};
