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
		{name: "horizontalTopBottomUndefinedHeightNoWrap"}
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
};
