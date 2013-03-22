/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

// To simplify platform checks we are adding this variables
var isTizen = Ti.Platform.osname === 'tizen',
	isMobileWeb = Ti.Platform.osname === 'mobileweb',
	isAndroid = Ti.Platform.osname === 'android';

if (isTizen || isMobileWeb) {
	Ti.include('countPixels.js');
}

module.exports = new function() {
	var finish,
		valueOf,
		// For Tizen and mobileWeb all valued based on rendering results are avalible only on "postlayout" event.
		openEvent = isTizen || isMobileWeb ? "postlayout" : "open";

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	};

	this.name = "ui_layout";
	this.tests = (function() {
		var arr = [
			{name: "viewSizeAndRectPx"},
			{name: "viewLeft"},
			{name: "viewTop"},
			{name: "viewCenter"},
			{name: "viewWidth"},
			{name: "viewError"},
			{name: "undefinedWidth"},
			{name: "undefinedLeft"},
			{name: "undefinedCenter"},
			{name: "undefinedRight"},
			{name: "undefinedHeight"},
			{name: "undefinedTop"},
			{name: "undefinedBottom"},
			{name: "widthPrecedence"},
			{name: "leftPrecedence"},
			{name: "centerXPrecedence"},
			{name: "heightPrecedence"},
			{name: "topPrecedence"},
			{name: "centerYPrecedence"},
			{name: "scrollViewSize"},
			{name: "zIndexMultiple"},
			{name: "fillInVerticalLayout"},
			{name: "sizeFillConflict"},
			{name: "systemMeasurement"},
			{name: "unitMeasurements"},
			{name: "scrollViewAutoContentHeight"},
			{name: "scrollViewLargeContentHeight"},
			{name: "scrollViewMinimumContentHeight"},
			{name: "horizontalScrollViewMinimumContentHeight"},
			{name: "horizontalScrollViewLargeContentHeight"},
			{name: "scrollViewWithSIZE"},
			{name: "scrollViewWithLargeVerticalLayoutChild"},
			{name: "convertUnits"},
			{name: "fourPins"}
		];

		if (isTizen || isMobileWeb) {
			arr = arr.concat([
				{name: "viewPixelTest"}, 
				{name: "viewBorderPixelTest"},
				{name: "viewOpacityPixelTest"},
				{name: "viewImagePixelTest"},
				{name: "viewAddRemovePixelTest"},
				{name: "viewZindex"},
				{name: "viewVisible"},
				{name: "viewLayoutPixelTest"},
				{name: "viewTransformPixelTest"}
			]);
		}

		return arr;
	}());

	// functional test cases #1010, #1011, #1025, #1025a
	//rect and size properties should not be undefined
	this.viewSizeAndRectPx = function(testRun) {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView();
		var label = Ti.UI.createLabel({
			text: "a",
			font: {
				fontSize: 14,
				fontFamily: "monospace"
			}
		});
		win.add(view);
		win.add(label);
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, view.size).shouldNotBeUndefined();
			valueOf(testRun, view.size.width).shouldNotBeUndefined();
			valueOf(testRun, view.size.height).shouldNotBeUndefined();
			valueOf(testRun, view.size.x).shouldNotBeUndefined();
			valueOf(testRun, view.size.y).shouldNotBeUndefined();
			valueOf(testRun, view.rect).shouldNotBeUndefined();
			valueOf(testRun, view.rect.width).shouldNotBeUndefined();
			valueOf(testRun, view.rect.height).shouldNotBeUndefined();
			valueOf(testRun, view.rect.x).shouldNotBeUndefined();
			valueOf(testRun, view.rect.y).shouldNotBeUndefined();
			
			//size and rect properties return the same width and height
			valueOf(testRun, view.size.width).shouldBe(view.size.width);
			valueOf(testRun, view.size.height).shouldBe(view.size.height);
			
			//size property returns 0 for x and y
			valueOf(testRun, view.size.x).shouldBe(0);
			valueOf(testRun, view.size.y).shouldBe(0);
			
			//Functonal test case 1025
			valueOf(testRun, view.top).shouldBeUndefined();
			valueOf(testRun, view.bottom).shouldBeUndefined();
			valueOf(testRun, view.left).shouldBeUndefined();
			valueOf(testRun, view.right).shouldBeUndefined();
			valueOf(testRun, view.center).shouldBeUndefined();
			valueOf(testRun, view.zIndex).shouldBeUndefined();
			
			//Functonal test case 1025a
			valueOf(testRun, label.top).shouldBeUndefined();
			valueOf(testRun, label.bottom).shouldBeUndefined();
			valueOf(testRun, label.left).shouldBeUndefined();
			valueOf(testRun, label.right).shouldBeUndefined();
			valueOf(testRun, label.center).shouldBeUndefined();
			valueOf(testRun, label.zIndex).shouldBeUndefined();
			
			//FILL behavior
			valueOf(testRun, view.rect.x).shouldBe(0);
			valueOf(testRun, view.rect.y).shouldBe(0);
			valueOf(testRun, win.size.height/view.size.height).shouldBe(1);
			valueOf(testRun, win.size.width/view.size.width).shouldBe(1);

			finish(testRun);
		});
		win.open();
	};

	// functional test cases #1012, #1014: 
	// ViewLeft and ViewRight
	this.viewLeft = function(testRun) {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			left: 10, width: 10
		});
		var view2 = Ti.UI.createView({
			right: 10, width:10
		});
		win.add(view);
		win.add(view2);
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, view.left).shouldBe(10);
			valueOf(testRun, view.rect.x).shouldBe(10);
			valueOf(testRun, view.rect.width).shouldBe(10);
			valueOf(testRun, view.right).shouldBeUndefined();
			
			valueOf(testRun, view2.right).shouldBe(10);
			valueOf(testRun, view2.rect.x).shouldBe(win.size.width - 20);
			valueOf(testRun, view2.rect.width).shouldBe(10);
			valueOf(testRun, view2.left).shouldBeUndefined();

			finish(testRun);
		});
		win.open();
	};

	// functional test case #1016, #1018
	// ViewTop and ViewBottom
	this.viewTop = function(testRun) {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			top: 10, height: 10
		});
		var view2 = Ti.UI.createView({
			bottom: 10, height: 10
		});
		win.add(view);
		win.add(view2);
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, view.top).shouldBe(10);
			valueOf(testRun, view.rect.y).shouldBe(10);
			valueOf(testRun, view.rect.height).shouldBe(10);
			valueOf(testRun, view.bottom).shouldBeUndefined();
			
			valueOf(testRun, view2.bottom).shouldBe(10);
			valueOf(testRun, view2.rect.y).shouldBe(win.size.height - 20);
			valueOf(testRun, view2.rect.height).shouldBe(10);
			valueOf(testRun, view2.top).shouldBeUndefined();

			finish(testRun);
		});
		win.open();
	};

	// functional test case #1020: ViewCenter
	this.viewCenter = function(testRun) {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			center: {
				x: 50, y: 50
			},
			height: 40, width: 40
		});
		win.add(view);

		// This test runs on "open" event for Android\iOS and on "postlayout" on tizen and mobileweb
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, view.rect.x).shouldBe(30);
			valueOf(testRun, view.rect.y).shouldBe(30);

			valueOf(testRun, view.center.x).shouldBe(50);
			valueOf(testRun, view.center.y).shouldBe(50);

			finish(testRun);
		});

		win.open();
	};

	// functional test case #1022, #1024
	// ViewWidth, ViewHeight
	this.viewWidth = function(testRun) {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			width: 10, height: 10
		});
		win.add(view);
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, view.width).shouldBe(10);
			valueOf(testRun, view.size.width).shouldBe(10);
			valueOf(testRun, view.height).shouldBe(10);
			valueOf(testRun, view.size.height).shouldBe(10);

			valueOf(testRun, view.left).shouldBeUndefined()
			valueOf(testRun, view.right).shouldBeUndefined();
			valueOf(testRun, view.top).shouldBeUndefined();
			valueOf(testRun, view.bottom).shouldBeUndefined();
			//Centered View with width and height defined
			valueOf(testRun, Math.floor(view.rect.x)).shouldBe(Math.floor((win.size.width - view.size.width) / 2));
			valueOf(testRun, Math.floor(view.rect.y)).shouldBe(Math.floor((win.size.height - view.size.height) / 2));

			finish(testRun);
		});
		win.open();
	};

	// functional test #1026 ViewError
	this.viewError = function(testRun) {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'green',
			left: 'leftString',
			right: 'rightString',
			top: 'topString',
			bottom: 'bottomString',
			width: 'widthString',
			height: 'heightString',
			center: {x:'centerXString', y:'centerYString'},
		});
		
		win.add(view);
		win.addEventListener('open', function(e){
			valueOf(testRun, view.left).shouldBe("leftString");
			valueOf(testRun, view.right).shouldBe("rightString");
			valueOf(testRun, view.top).shouldBe("topString");
			valueOf(testRun, view.bottom).shouldBe("bottomString");
			valueOf(testRun, view.width).shouldBe("widthString");
			valueOf(testRun, view.height).shouldBe("heightString");

			if (!(isTizen || isMobileWeb)) {
				valueOf(testRun, view.center.y).shouldBe("centerYString");
				valueOf(testRun, view.center.x).shouldBe("centerXString");
			};

			finish(testRun);
		});

		win.open();
	};

	// functional test #1033, 1033a, 1033b 
	// UndefinedWidth Implicit calculations
	this.undefinedWidth = function(testRun) {
		var win = Ti.UI.createWindow();
		var parentView = Ti.UI.createView({
			width:100,
			height:100
		});
		
		var view1 = Ti.UI.createView({
			left: 5,
			right: 10
		});
		var view2 = Ti.UI.createView({
			left: 5,
			center: {x:10}
		});
		var view3 = Ti.UI.createView({
			center: {x:75},
			right: 10
		});

		win.addEventListener(openEvent, function(e){
			valueOf(testRun, view1.width).shouldBeUndefined();
			valueOf(testRun, view2.width).shouldBeUndefined();
			valueOf(testRun, view3.width).shouldBeUndefined();
			
			valueOf(testRun, view1.rect.width).shouldBe(85);
			valueOf(testRun, view2.rect.width).shouldBe(10);
			valueOf(testRun, view3.rect.width).shouldBe(30);

			finish(testRun);
		});
		
		parentView.add(view1);
		parentView.add(view2);
		parentView.add(view3);
		win.add(parentView);
		win.open();
	};

	// functional test #1034/1034a/1034b UndefinedLeft
	this.undefinedLeft = function(testRun) {
		var win = Ti.UI.createWindow();

		var view1 = Ti.UI.createView({
			width: 120,
			center: {x:80}
		});
		var view2 = Ti.UI.createView({
			right: 120,
			center: {x:80}
		});
		var view3 = Ti.UI.createView({
			right: 80,
			width: 120
		});

		win.addEventListener(openEvent, function(e){
			valueOf(testRun, view1.left).shouldBeUndefined();
			valueOf(testRun, view2.left).shouldBeUndefined();
			valueOf(testRun, view3.left).shouldBeUndefined();
			
			valueOf(testRun, view1.rect.x).shouldNotBeUndefined();
			valueOf(testRun, view2.rect.x).shouldNotBeUndefined();
			valueOf(testRun, view3.rect.x).shouldNotBeUndefined();
			valueOf(testRun, view1.rect.y).shouldNotBeUndefined();
			valueOf(testRun, view2.rect.y).shouldNotBeUndefined();
			valueOf(testRun, view3.rect.y).shouldNotBeUndefined();
			valueOf(testRun, view1.rect.width).shouldNotBeUndefined();
			valueOf(testRun, view2.rect.width).shouldNotBeUndefined();
			valueOf(testRun, view3.rect.width).shouldNotBeUndefined();
			valueOf(testRun, view1.rect.height).shouldNotBeUndefined();
			valueOf(testRun, view2.rect.height).shouldNotBeUndefined();
			valueOf(testRun, view3.rect.height).shouldNotBeUndefined();

			finish(testRun);
		});

		win.add(view1);
		win.add(view2);
		win.add(view3);
		win.open();
	};

	// functional test #1035 & #1039 UndefinedCenter
	this.undefinedCenter = function(testRun) {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({});

		win.addEventListener('open', function(e){
			valueOf(testRun, view.center).shouldBeUndefined();
			//Dynamic center can be calculated from view.rect
			valueOf(testRun, view.rect).shouldNotBeUndefined();

			finish(testRun);
		});

		win.add(view);
		win.open();
	};

	// functional test #1036 UndefinedRight
	this.undefinedRight = function(testRun) {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			center: {x:50},
			left:10
		});

		win.addEventListener(openEvent, function(e){
			valueOf(testRun, view.right).shouldBeUndefined();
			valueOf(testRun, view.rect.width).shouldBe(80);
			valueOf(testRun, view.rect.x).shouldBe(10);

			finish(testRun);
		});

		win.add(view);
		win.open();
	};

	// functional test #1037, #1037a, #1037b 
	// UndefinedHeight Implicit calculations
	this.undefinedHeight = function(testRun) {
		var win = Ti.UI.createWindow();
		var parentView = Ti.UI.createView({
			width:100,
			height:100
		});
		
		var view1 = Ti.UI.createView({
			top: 5,
			bottom: 10
		});
		var view2 = Ti.UI.createView({
			top: 5,
			center: {y:10}
		});
		var view3 = Ti.UI.createView({
			center: {y:75},
			bottom: 10
		});

		win.addEventListener(openEvent, function(e){
			valueOf(testRun, view1.height).shouldBeUndefined();
			valueOf(testRun, view2.height).shouldBeUndefined();
			valueOf(testRun, view3.height).shouldBeUndefined();
			
			valueOf(testRun, view1.rect.height).shouldBe(85);
			valueOf(testRun, view2.rect.height).shouldBe(10);
			valueOf(testRun, view3.rect.height).shouldBe(30);

			finish(testRun);
		});
		
		parentView.add(view1);
		parentView.add(view2);
		parentView.add(view3);
		win.add(parentView);
		win.open();
	};

	// functional test #1038, 1038a, 1038b
	// UndefinedTop. Dynamic top calculation
	this.undefinedTop = function(testRun) {
		var win = Ti.UI.createWindow();
		var view1 = Ti.UI.createView({
			height: 50,
			center: {y:200}
		});
		var view2 = Ti.UI.createView({
			center: {y:50},
			bottom: 200
		});
		var view3 = Ti.UI.createView({
			bottom: 200,
			height: 100
		});

		win.addEventListener(openEvent, function(e){
			//Static Tops
			valueOf(testRun, view1.top).shouldBeUndefined();
			valueOf(testRun, view2.top).shouldBeUndefined();
			valueOf(testRun, view3.top).shouldBeUndefined();
			//Dynamic Tops
			valueOf(testRun, view1.rect.y).shouldBe(175);
			if(win.size.height <= 250)
			{
				//View Height of 0 positioned at center
				valueOf(testRun, view2.rect.y).shouldBe(50);
			}
			else
			{
				//View height = 2x(wh - bottom - center)
				//View top = center - height/2 = 2c + b - wh
				valueOf(testRun, view2.rect.y).shouldBe(300 - win.size.height);
			}
			
			valueOf(testRun, view3.rect.y).shouldBe(win.size.height-300);

			finish(testRun);
		});
		
		win.add(view1);
		win.add(view2);
		win.add(view3);
		win.open();
	};
	
	// functional test #1040 UndefinedBottom
	this.undefinedBottom = function(testRun) {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			center: {y:50},
			top: 10
		});

		win.addEventListener('open', function(e){
			valueOf(testRun, view.bottom).shouldBeUndefined();
			//Dynamic bottom is rect.y + rect.height
			valueOf(testRun, view.rect.height).shouldNotBeUndefined();

			finish(testRun);
		});

		win.add(view);
		win.open();
	};

	// functional test #1042 WidthPrecedence
	this.widthPrecedence = function(testRun) {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			left: 10,
			right: 15,
			width: 10
		});

		win.addEventListener(openEvent, function(e){
			valueOf(testRun, view.size.width).shouldBe(10);

			finish(testRun);
		});

		win.add(view);
		win.open();
	};

	// functional test #1043 LeftPrecedence
	this.leftPrecedence = function(testRun) {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			left: 10,
			right: 100,
			center: {x:30}
		});

		win.addEventListener(openEvent, function(e){
			valueOf(testRun, view.size.width).shouldBe(40);

			finish(testRun);
		});

		win.add(view);
		win.open();
	};

	// functional test #1044 CenterXPrecedence
	this.centerXPrecedence = function(testRun) {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			height: 200,
			width:200,
			backgroundColor: 'yellow'
		})
		var viewChild = Ti.UI.createView({
			backgroundColor: 'red',
			center: {x:100},
			right: 50
		});

		win.addEventListener(openEvent, function(e){
			valueOf(testRun, viewChild.size.width).shouldBe(100);

			finish(testRun);
		});

		view.add(viewChild);
		win.add(view);
		win.open();
	};

	// functional test #1046 HeightPrecedence
	this.heightPrecedence = function(testRun) {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			top: 10,
			bottom: 15,
			height: 10
		});

		win.addEventListener(openEvent, function(e){
			valueOf(testRun, view.size.height).shouldBe(10);

			finish(testRun);
		});

		win.add(view);
		win.open();
	};

	// functional test #1047 TopPrecedence
	this.topPrecedence = function(testRun) {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			top: 10,
			bottom: 100,
			center: {y: 30}
		});

		win.addEventListener(openEvent, function(e){
			valueOf(testRun, view.size.height).shouldBe(40);

			finish(testRun);
		});

		win.add(view);
		win.open();
	};

	// functional test #1048 CenterYPrecedence
	this.centerYPrecedence = function(testRun) {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			height: 200,
			width:200,
			backgroundColor: 'yellow'
		})
		var viewChild = Ti.UI.createView({
			backgroundColor: 'red',
			center: {y:100},
			bottom: 50
		});

		win.addEventListener(openEvent, function(e){
			valueOf(testRun, viewChild.size.height).shouldBe(100);

			finish(testRun);
		});

		view.add(viewChild);
		win.add(view);
		win.open();
	};

	// functional test #1053 ScrollViewSize
	this.scrollViewSize = function(testRun) {
		var win = Ti.UI.createWindow();

		var label2 = Ti.UI.createLabel({
			text: 'View Size is: ',
			top: 20,
			left: 10,
			height: 200,
			color: 'black'
		});

		var label = Ti.UI.createLabel({
			color: 'red'
		})
		var scrollView = Titanium.UI.createScrollView({
		    contentHeight:'auto',
		    contentWidth:'auto',
		    showVerticalScrollIndicator:true,
		    showHorizontalScrollIndicator:true,
		    width:Ti.UI.SIZE,
		    height:Ti.UI.SIZE		
		});
		var scrollView2 = Titanium.UI.createScrollView({
		    contentHeight:'auto',
		    contentWidth:'auto',
		    showVerticalScrollIndicator:true,
		    showHorizontalScrollIndicator:true
		});
		
		label.add(scrollView);
		label2.add(scrollView2);

		var view = Ti.UI.createView({
			backgroundColor : 'green',
			borderRadius : 10,
			width : 200,
			height : 200,
		});

		var scrollView3 = Titanium.UI.createScrollView({
			contentHeight : 'auto',
			contentWidth : 'auto',
			showVerticalScrollIndicator : true,
			showHorizontalScrollIndicator : true
		});

		//We need to keep how many events we have handled as we need to subscribe on the two different events but have only one finalizer.
		var evnentsHanlded = 0;

		// this test runs on "open" event 
		win.addEventListener('open', function(e){
			//LABEL HAS SIZE AUTO BEHAVIOR. 
			//SCROLLVIEW HAS FILL BEHAVIOR
			//LABEL will have 0 size (no text)
			//LABEL2 will have non 0 size (has text/pins)
			valueOf(testRun, label.size).shouldNotBeUndefined();
			valueOf(testRun, label2.size).shouldNotBeUndefined();
			valueOf(testRun, scrollView.size).shouldNotBeUndefined();
			valueOf(testRun, scrollView2.size).shouldNotBeUndefined();

			if (!isAndroid) {
				//Android does not return 0 height even when there is no text
				valueOf(testRun, label.size.width).shouldBe(0);
				valueOf(testRun, label.size.height).shouldBe(0);
				// Adding a scroll view to a label does not work in android: TIMOB-7817
				valueOf(testRun, scrollView.size.width).shouldBe(0);
				valueOf(testRun, scrollView.size.height).shouldBe(0);

				valueOf(testRun, label2.size.width).shouldBe(scrollView2.size.width);
				valueOf(testRun, label2.size.height).shouldBe(scrollView2.size.height);
			}

			// This is not working yet due to TIMOB-5303
			// valueOf(testRun, scrollView3.size.height).shouldNotBe(0);
			// valueOf(testRun, scrollView3.size.width).shouldNotBe(0);
			// valueOf(testRun, view.size.width).shouldBe(scrollView3.size.width);
			// valueOf(testRun, view.size.height).shouldBe(scrollView3.size.height);

			//if we had finised another event hanling before we got here - finish this test run
			if ((++evnentsHanlded) == 2){finish(testRun);};
		});

		// this test runs on "open" event for Android\iOS and on "postlayout" on tizen and mobileweb
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, label2.size.height).shouldNotBe(0);
			valueOf(testRun, label2.size.width).shouldNotBe(0);

			valueOf(testRun, scrollView2.size.height).shouldNotBe(0);
			valueOf(testRun, scrollView2.size.width).shouldNotBe(0);

			//if we had finised another event hanling before we got here - finish this test run			
			if ((++evnentsHanlded) == 2){finish(testRun);};
		});

		view.add(scrollView);
		win.add(view);
		win.add(label2);
		win.add(label);
		win.open();
	};

	// functional test #1106 ZIndexMultiple
	this.zIndexMultiple = function(testRun) {
		var win = Ti.UI.createWindow();

		var view1 = Ti.UI.createView({backgroundColor:'red', zIndex:0, height: 50, width: 50, top: 10});
		var view2 = Ti.UI.createView({backgroundColor:'orange',zIndex:1, height: 50, width: 50, top: 20});
		var view3 = Ti.UI.createView({backgroundColor:'yellow',zIndex:2, height: 50, width: 50, top: 30});
		var view4 = Ti.UI.createView({backgroundColor:'green', zIndex:3, height: 50, width: 50, top: 40});
		var view5 = Ti.UI.createView({backgroundColor:'blue', zIndex:4, height: 50, width: 50, top: 50});

		win.addEventListener('open', function(e){
			valueOf(testRun, view1.zIndex).shouldBe(0);
			valueOf(testRun, view2.zIndex).shouldBe(1);
			valueOf(testRun, view3.zIndex).shouldBe(2);
			valueOf(testRun, view4.zIndex).shouldBe(3);
			valueOf(testRun, view5.zIndex).shouldBe(4);

			finish(testRun);
		});

		win.add(view5);
		win.add(view4);
		win.add(view3);
		win.add(view2);
		win.add(view1);
		win.open();
	};

	this.fillInVerticalLayout = function(testRun) {
		var win = Ti.UI.createWindow({
		});
		var parent = Ti.UI.createView({
			height: 50,
			width: 40,
			layout: 'vertical',
		});
		var child = Ti.UI.createView({
		});
		parent.add(child);
		win.add(parent);
		// this test runs on "open" event for Android\iOS and on "postlayout" on tizen and mobileweb
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, parent.size.width).shouldBe(40);
			valueOf(testRun, parent.size.height).shouldBe(50);
			valueOf(testRun, child.size.width).shouldBe(40);
			valueOf(testRun, child.size.height).shouldBe(50);

			finish(testRun);
		});
		win.open();
	};

	this.sizeFillConflict = function(testRun) {
		var win = Ti.UI.createWindow({
		});
		var grandParent = Ti.UI.createView({
			height : 300,
			width : 200
		});
		var parent = Ti.UI.createView({
			height : Ti.UI.SIZE
		});
		var child1 = Ti.UI.createView({
			height : Ti.UI.SIZE
		});
		var child2 = Ti.UI.createView({
			height : 50
		});
		var child3 = Ti.UI.createView({
			width : 30
		});

		child1.add(child2);
		child1.add(child3);
		parent.add(child1);
		grandParent.add(parent);
		win.add(grandParent);
		// this test runs on "open" event for Android\iOS and on "postlayout" on tizen and mobileweb
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, grandParent.size.width).shouldBe(200);
			valueOf(testRun, grandParent.size.height).shouldBe(300);

			valueOf(testRun, parent.size.width).shouldBe(200);
			valueOf(testRun, parent.size.height).shouldBe(300);

			valueOf(testRun, child1.size.width).shouldBe(200);
			valueOf(testRun, child1.size.height).shouldBe(300);

			valueOf(testRun, child2.size.width).shouldBe(200);
			valueOf(testRun, child2.size.height).shouldBe(50);

			valueOf(testRun, child3.size.width).shouldBe(30);
			valueOf(testRun, child3.size.height).shouldBe(300);

			finish(testRun);
		});
		win.open();
	};

	// Functional Test #1000 SystemMeasurement
	this.systemMeasurement = function(testRun) {
		var win = Ti.UI.createWindow({
		});
		var parent = Ti.UI.createView({
			height: '50dip',
			width: '40px',
			layout: 'vertical',
		});
		var child = Ti.UI.createView({
		});
		parent.add(child);
		win.add(parent);
		win.addEventListener("open", function(e) {
			if (isAndroid) {
				valueOf(testRun, parent.size.width).shouldBe(40);
			} else if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad' ) {
				valueOf(testRun, parent.size.height).shouldBe(50);
			}

			finish(testRun);
		});
		win.open();
	};

	// Functional Test #1001 #1002 #1003 #1004 #1005 #1006
	this.unitMeasurements = function(testRun) {
		var win = Ti.UI.createWindow({
		});
		var child = Ti.UI.createView({
			height: '50mm',
			width: '40cm',
		});
		var child1 = Ti.UI.createView({
			height: '1in',
			width: '100px',
		});
		var child2 = Ti.UI.createView({
			height: '50dip',
			width: '40dp',
		});
		var child3 = Ti.UI.createView({
			//inavlid measurement
			height: 'invalid',
			width: 'inavlid'
		});
		
		win.add(child);
		win.add(child1);
		win.add(child2);
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, child.size.width).shouldNotBe(0);
			valueOf(testRun, child.size.height).shouldNotBe(0);
			
			valueOf(testRun, child1.size.width).shouldNotBe(0);
			valueOf(testRun, child1.size.height).shouldNotBe(0);
			
			valueOf(testRun, child2.size.width).shouldNotBe(0);
			valueOf(testRun, child2.size.height).shouldNotBe(0);
			
			valueOf(testRun, child3.size.width).shouldBe(0);
			valueOf(testRun, child3.size.height).shouldBe(0);

			finish(testRun);
		});
		win.open();
	};

	// Scrollview
	this.scrollViewAutoContentHeight = function(testRun) {
		var win = Ti.UI.createWindow({
		});
		var scrollView = Titanium.UI.createScrollView({
		    contentHeight:'auto',
		    contentWidth:'auto',
		    showVerticalScrollIndicator:true,
		    showHorizontalScrollIndicator:true
		});
		var view2 = Ti.UI.createView({
		});
		scrollView.add(view2);
		win.addEventListener("open", function(e) {
			valueOf(testRun, view2.size.width).shouldBe(scrollView.size.width);
			valueOf(testRun, view2.size.height).shouldBe(scrollView.size.height);

			finish(testRun);
		});
		win.add(scrollView);
		win.open();
	};

	this.scrollViewLargeContentHeight = function(testRun) {
		var win = Ti.UI.createWindow({
		});
		var scrollView = Titanium.UI.createScrollView({
		    contentHeight:'2000',
		    contentWidth:'auto',
		    showVerticalScrollIndicator:true,
		    showHorizontalScrollIndicator:true
		});
		var view2 = Ti.UI.createView({
		});
		scrollView.add(view2);
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, view2.size.width).shouldBe(scrollView.size.width);
			valueOf(testRun, view2.size.height).shouldBe(2000);

			finish(testRun);
		});
		win.add(scrollView);
		win.open();
	};

	this.scrollViewMinimumContentHeight = function(testRun) {
		var win = Ti.UI.createWindow({
		});
		var scrollView = Titanium.UI.createScrollView({
		    contentHeight:'50',
		    contentWidth:'auto',
		    showVerticalScrollIndicator:true,
		    showHorizontalScrollIndicator:true
		});
		var view2 = Ti.UI.createView({
		});
		scrollView.add(view2);
		win.addEventListener("open", function(e) {
			valueOf(testRun, view2.size.width).shouldBe(scrollView.size.width);
			valueOf(testRun, view2.size.height).shouldBe(scrollView.size.height);

			finish(testRun);
		});
		win.add(scrollView);
		win.open();
	};

	this.horizontalScrollViewMinimumContentHeight = function(testRun) {
		var win = Ti.UI.createWindow({
		});
		var scrollView = Titanium.UI.createScrollView({
		    contentHeight:'auto',
		    contentWidth:'50',
		    showVerticalScrollIndicator:true,
		    showHorizontalScrollIndicator:true,
			scrollType:'horizontal'
		});
		var view2 = Ti.UI.createView({
		});
		scrollView.add(view2);
		win.addEventListener("open", function(e) {
			valueOf(testRun, view2.size.width).shouldBe(scrollView.size.width);
			valueOf(testRun, view2.size.height).shouldBe(scrollView.size.height);

			finish(testRun);
		});
		win.add(scrollView);
		win.open();
	};

	this.horizontalScrollViewLargeContentHeight = function(testRun) {
		var win = Ti.UI.createWindow({
		});
		var scrollView = Titanium.UI.createScrollView({
		    contentHeight:'auto',
		    contentWidth:'50',
		    showVerticalScrollIndicator:true,
		    showHorizontalScrollIndicator:true,
				scrollType:'horizontal'
		});
		var view2 = Ti.UI.createView({
		});
		scrollView.add(view2);
		win.addEventListener("open", function(e) {
			valueOf(testRun, view2.size.width).shouldBe(scrollView.size.width);
			valueOf(testRun, view2.size.height).shouldBe(scrollView.size.height);

			finish(testRun);
		});
		win.add(scrollView);
		win.open();
	};

	//TIMOB-8362
	this.scrollViewWithSIZE = function(testRun) {
		var win = Ti.UI.createWindow({
			backgroundColor : '#7B6700',
			layout : 'vertical',
		});
		var NavBarView = Ti.UI.createView({
			height : '25',
			top : 0,
			backgroundColor : 'green',
			width : '100%'
		});
		var scrollView = Ti.UI.createScrollView({
			height : Ti.UI.SIZE,
			width: Ti.UI.SIZE,
			scrollType : 'vertical',
			layout : 'vertical',
			backgroundColor : 'red',

		});
		var button = Ti.UI.createButton({
			title : 'Click',
			width : '100',
			height : '50'
		});
		scrollView.add(button);
		win.add(NavBarView);
		win.add(scrollView);
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, scrollView.size.height).shouldBe(50);
			valueOf(testRun, scrollView.size.width).shouldBe(100);

			finish(testRun);
		});
		win.open();
	};

	//TIMOB-8891
	this.scrollViewWithLargeVerticalLayoutChild = function(testRun) {
		var win = Ti.UI.createWindow();
		var scrollView = Ti.UI.createScrollView({
		    contentHeight:'auto',
		    backgroundColor: 'green'
		});
		win.add(scrollView);

		var innerView = Ti.UI.createView({
		    height:Ti.UI.SIZE, // works if set to 1000
		    layout:'vertical',
		    left:0,
		    top:0,
		    right:0
		});
		scrollView.add(innerView);
		var colors = ['red', 'blue', 'pink', 'white', 'black'];
		var max = 10;
		for(var i = 0; i < max; i++){
		    innerView.add(Ti.UI.createView({
		        backgroundColor: colors[i%colors.length],
		        height: 100,
		        top: 20
		    }));
		}
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, innerView.size.height).shouldBe(1200);
			valueOf(testRun, innerView.size.width).shouldBe(scrollView.size.width);

			finish(testRun);
		});
		win.open();
	};

	// Functional Test #1087-#1097
	this.convertUnits = function(testRun) {
		// android
		var dpi = Ti.Platform.displayCaps.dpi;

		if (isAndroid) {
			// 1087 
			valueOf(testRun, Ti.UI.convertUnits('1in', Ti.UI.UNIT_PX)).shouldBe(dpi);
			valueOf(testRun, Ti.UI.convertUnits('100', Ti.UI.UNIT_PX)).shouldBe(100);
			// 1092
			valueOf(testRun, Ti.UI.convertUnits('25.4mm', Ti.UI.UNIT_PX)).shouldBe(dpi);
			
		} else if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad' ) {
			// 1091
			valueOf(testRun, Ti.UI.convertUnits('1in', Ti.UI.UNIT_DIP)).shouldBe(dpi);
			valueOf(testRun, Ti.UI.convertUnits('100', Ti.UI.UNIT_DIP)).shouldBe(100);
			valueOf(testRun, Ti.UI.convertUnits('25.4mm', Ti.UI.UNIT_DIP)).shouldBe(dpi);
		}
		
		// 1088
		valueOf(testRun, Math.round(Ti.UI.convertUnits(dpi.toString(), Ti.UI.UNIT_MM))).shouldBe(25);
		// 1089
		valueOf(testRun, Math.round(Ti.UI.convertUnits(dpi.toString(), Ti.UI.UNIT_CM))).shouldBe(3);
		
		// 1088
		valueOf(testRun, Math.round(Ti.UI.convertUnits(dpi.toString(), Ti.UI.UNIT_MM))).shouldBe(25);
		// 1089
		valueOf(testRun, Math.round(Ti.UI.convertUnits(dpi.toString(), Ti.UI.UNIT_CM))).shouldBe(3);
		// 1090
		valueOf(testRun, Math.round(Ti.UI.convertUnits(dpi.toString(), Ti.UI.UNIT_IN))).shouldBe(1);
		
		// 1093
		// result of Ti.UI.convertUnits is float it is NOT equals to INT and its normal. So we round it!
		valueOf(testRun, Math.round(Ti.UI.convertUnits('100cm', Ti.UI.UNIT_MM))).shouldBe(1000);
		// 1094
		// result of Ti.UI.convertUnits is float it is NOT equals to INT and its normal. So we round it!
		valueOf(testRun, Math.round(Ti.UI.convertUnits('100in', Ti.UI.UNIT_CM))).shouldBe(254);
		
		// 1097
		valueOf(testRun, Math.round(Ti.UI.convertUnits('abc', Ti.UI.UNIT_PX))).shouldBe(0);

		finish(testRun);
	};

	this.fourPins = function(testRun) {
		var win = Ti.UI.createWindow({
			width: 100, height: 100
		});
		var label = Ti.UI.createLabel({
			left: 10, right: 10,
			top: 10, bottom: 10
		});
		win.add(label);
		win.addEventListener(openEvent, function(e) {
			valueOf(testRun, label.size.width).shouldBe(80);
			valueOf(testRun, label.size.height).shouldBe(80);
			valueOf(testRun, label.left).shouldBe(10);
			valueOf(testRun, label.right).shouldBe(10);
			valueOf(testRun, label.top).shouldBe(10);
			valueOf(testRun, label.bottom).shouldBe(10);
			valueOf(testRun, label.rect.x).shouldBe(10);
			valueOf(testRun, label.rect.width).shouldBe(80);
			valueOf(testRun, label.rect.y).shouldBe(10);
			valueOf(testRun, label.rect.height).shouldBe(80);

			finish(testRun);
		});
		win.open();
	}

	this.viewPixelTest = function(testRun) {
		var cp = new CountPixels(),
			// Create white window which will be used as background
			win = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: 320,
				height: 510
			}),
			// Ccreate black view wich will be checked later
			view = Ti.UI.createView({
				top: 20,
				left: 30,
				height: 100,
				width: 200,
				backgroundColor: '#000000'
			}),
			// This is the expected number of black pixels of view
			expected = 20000;

		win.add(view);
		view.addEventListener('postlayout', checkViewColor);
		win.addEventListener('close', function() {
			finish(testRun);
		});
		win.open();

		// This is the final function wich will be called after colors are checked
		var fin = (function() {
			var repeat = true;
			return function() {
				// On the first call, it will change the view size and repeat the test again
				if (repeat) {
					expected = 45000;
					repeat = false;

					view.applyProperties({
						top : 30,
						left : 45,
						width : 150,
						height : 300
					})
				} else {
					// On the second call, it finish will finish the test
					win.close();
				} 
			}
		}());

		// Check black bixel count in the rectangle where the view is placed
		function checkViewColor() {
			cp.countPixels([0, 0, 0], 
				win, 
				function(count){
					valueOf(testRun, count).shouldBe(expected);
					checkWindowWhite();	
				},
				// This is position object
				{
					top: view.top,
					left: view.left,
					height: view.height,
					width: view.width
				}
			);

			// Check all white pixels on window
			// The number should be equal to the expected number of white pixels on window
			function checkWindowWhite() {
				cp.countPixels([255, 255, 255], 
					win, 
					function(count){
						valueOf(testRun, count).shouldBe(win.width * win.height - expected);
						checkWindowBlack();	
					}
				);
			}

			// Check all black pixels on window
			// The number should be equal to the number of view's pixels
			// It will mean that the view appers in the specified place with thes specified size
			function checkWindowBlack() {
				cp.countPixels([0, 0, 0], 
					win, 
					function(count) {
						valueOf(testRun, count).shouldBe(expected);
						fin();	
					}
				);
			}
		}
	}

	this.viewBorderPixelTest = function(testRun) {
		var cp = new CountPixels(),
			// Create white window which be used as background
			win = Ti.UI.createWindow({
				backgroundColor : '#ffffff',
				width: 320,
				height: 510
			}),
			// Create black view with red border wich will be checked later
			view = Ti.UI.createView({
				top: 20,
				left: 30,
				height: 100,
				width: 200,
				backgroundColor: '#000000',
				borderColor: '#ff0000', 
				borderWidth: 10,
			}),
			// This is the expected number of colored pixels in the view
			expectedBlack = 14400,
			expectedRed = 5600,
			expectedWhite = win.width * win.height - expectedRed - expectedBlack;

		win.add(view);
		view.addEventListener('postlayout', checkViewColor);
		win.addEventListener('close', function() {
			finish(testRun);
		});
		win.open();

		function fin() { 				
			win.close();
		}

		// Check black bixel count in the rectangle where the view should be placed
		// If all of the follow functions succeed, then it is guaranteed that the border has the right location and the right width 
		function checkViewColor() {
			cp.countPixels([0, 0, 0], 
				win, 
				function(count) {
					valueOf(testRun, count).shouldBe(expectedBlack);
					checkWindowWhite();	
				},
				// This is position object
				{
					top: view.top + view.borderWidth,
					left: view.left + view.borderWidth,
					height: view.height - 2 * view.borderWidth,
					width: view.width - 2 * view.borderWidth
				}
			);

			// Check red pixels of the view
			// Their number should be equal to the expected number of red pixels in the window
			function checkViewRed() {
				cp.countPixels([255, 0, 0], 
					win, 
					function(count) {
						valueOf(testRun, count).shouldBe(expectedRed);
						checkWindowBlack();	
					},
					{
						top: view.top,
						left: view.left,
						height: view.height,
						width: view.width
					}
				);
			}

			// Ccheck all white pixels in the window
			// Their number should be equal to the number of view's pixels
			function checkWindowWhite() {
				cp.countPixels([255, 255, 255], 
					win, 
					function(count) {
						valueOf(testRun, count).shouldBe(expectedWhite);
						fin();	
					}
				);
			}

		}
	}

	this.viewOpacityPixelTest = function(testRun) {
		var cp = new CountPixels(),
			// Create white window which  will be used as background
			win = Ti.UI.createWindow({
				backgroundColor: '#ffffff',
				width: 320,
				height: 510
			}),
			// Create black view wich will be checked later
			view = Ti.UI.createView({
				top: 20,
				left: 30,
				height: 100,
				width: 200,
				backgroundColor: '#000000',
				opacity: 0.5
			}),
			// This is the expected number of colored pixels in the view
			expected = 20000;

		win.add(view);
		view.addEventListener('postlayout', checkViewColor);
		win.addEventListener('close', function() {
			finish(testRun);
		});
		win.open();

		function fin() {
			win.close();
		}

		// Check grey pixel count where the view should be located
		function checkViewColor() {
			cp.countPixels([127, 127, 127], 
				win, 
				function(count) {
					valueOf(testRun, count).shouldBe(expected);
					fin();	
				}
			);
		}
	}

	// Test Ti.UI.View's backgroundImage and backgroundRepeat properties
	this.viewImagePixelTest = function(testRun) {
		var cp = new CountPixels(),
			// Create white window which  will be used as background
			win = Ti.UI.createWindow({
				backgroundColor : '#ffffff',
				width: 320,
				height: 510
			}),
			// Create black view wich will be checked later
			// As background image in this view, we use image which consists of two equal horizontal rectangles of green and red colors
			view = Ti.UI.createView({
				top: 10,
				left: 10,
				height: 200,
				width: 200,
				backgroundColor: '#000000',
				backgroundImage: "suites/ui/image_view/image2.png",
				backgroundSelectedImage: 'suites/ui/image_view/image.png',
				focusable: true
				
			}),
			// This is the expected numbers of colored pixels in the view
			expectedRed = 20000,
			expectedGreen = 20000;

		win.add(view);
		view.addEventListener('postlayout', checkRedColor);
		win.addEventListener('close', function(){
			finish(testRun);
		});

		win.open();

		var fin = (function() {
			var repeat = true;
			return function() {
				// On the first call, it will change the view size,
				// Set bakgroundRepeat property to true and repeat the test again
				if (repeat) {
					expectedRed = 20000;
					// The image fills view in a way, that number of green pixel increasing twice	
					expectedGreen = 40000;
					repeat = false;

					view.applyProperties({
						height : 300,
						backgroundRepeat : true
					})
				} else {
					// On the second call, it will finish the test
					win.close();
				} 
			}
		}());

		// Check red pixel count where the view should be located
		function checkRedColor() {
			cp.countPixels([255, 0, 0], 
				win, 
				function(count){
					valueOf(testRun, count).shouldBe(expectedRed);
					checkGreenColor();	
				}
			);
		}

		// Check red pixel count where the view should be located
		function checkGreenColor() {
			cp.countPixels([0, 255, 0], 
				win, 
				function(count) {
					valueOf(testRun, count).shouldBe(expectedGreen);
					fin();
				}
			);
		}
	}

	this.viewAddRemovePixelTest = function(testRun) {
		/* 1. Create a green parent view. Verify there is the right count of green pixels on the screen
				(parent window area) and red pixels (0) .
			2. Create a red child view. Verify there is the right count of green pixels on the screen
				(parent window area minus child window area) and red pixels
				(child window area).
			Remove the red child view. Verify there is the right count of red and green pixels, as in
				item 1. */

		var cp = new CountPixels(),
			win = Ti.UI.createWindow(),
			// Create green view which  will be used as container for other view
			parentView = Ti.UI.createView({
				backgroundColor : '#00ff00',
			}),
			// Create red view wich will be used as child view later
			childView = Ti.UI.createView({
				top: 10,
				left: 10,
				height: 200,
				width: 200,
				backgroundColor: '#ff0000'
			}),
			// This is the expected numbers of red pixels in the window
			expectedRed = 0;

		// First veiw will been rendered without child view
		parentView.addEventListener('postlayout', function(){
			checkRedColor(addChild);
		});

		childView.addEventListener('postlayout', function(){
			checkRedColor(removeChild);
		});

		win.add(parentView)
		win.addEventListener('close', function() {
			finish(testRun);
		});
		win.open();

		function addChild() {
			expectedRed = 40000;
			parentView.add(childView);
		}

		function removeChild() {
			parentView.removeEventListener('postlayout');
			childView.removeEventListener('postlayout');
			parentView.addEventListener('postlayout', function() {
				checkRedColor(fin);
			});
			expectedRed = 0;
			parentView.remove(childView);
		}

		function fin() {
			// Then finish test
			win.close()
		}

		// Check red pixel count where the view should be located
		function checkRedColor(callback) {
			cp.countPixels([255, 0, 0], 
				win, 
				function(count){
					valueOf(testRun, count).shouldBe(expectedRed);
					checkGreenColor(callback);	
				},
				{
					top: 10,
					left: 10,
					height: childView.height,
					width: childView.width
				}
			);
		}

		// Check red pixel count where the view should be located
		function checkGreenColor(callback) {
			cp.countPixels([0, 255, 0], 
				win, 
				function(count){
					valueOf(testRun, count).shouldBe(parentView.rect.width*parentView.rect.height - expectedRed);
					callback();	
				}
			);
		}
	}
		
	this.viewZindex = function(testRun) {
		// Verify if second view's green pixels is presents
		// Change the zIndex for first view
		// Verify if first view's red pixels is presents
		var cp = new CountPixels(),
			win = Ti.UI.createWindow({
				backgroundColor : '#ffffff'
			}),
			view1 = Ti.UI.createView({
				backgroundColor : '#ff0000'
			}),
			view2 = Ti.UI.createView({
				backgroundColor : '#00ff00'
			});
		
		var onChangedZindex = function(count) {
			var zi;
			valueOf(testRun, count).shouldBeEqual(100);
			
			valueOf(testRun, function() {
				zi = view1.getZIndex();
			}).shouldNotThrowException();
			
			valueOf(testRun, view1.zIndex).shouldBeEqual(5);
			valueOf(testRun, zi).shouldBeEqual(5);
			
			win.close();
			finish(testRun);
		}
		
		var onStartTest = function(count) {
			valueOf(testRun, count).shouldBeEqual(100);
			
			valueOf(testRun, function() {
				view1.setZIndex(5);
			}).shouldNotThrowException();
			
			setTimeout(function() {
				cp.countPixelsPercentage([255, 0, 0], win, onChangedZindex);
			}, 1000);
		}
		
		win.addEventListener('postlayout', function() {
			var zi;
			
			valueOf(testRun, function() {
				zi = view1.getZIndex();
			}).shouldNotThrowException();
			
			valueOf(testRun, view1.zIndex).shouldBeUndefined();
			valueOf(testRun, zi).shouldBeUndefined();
			
			cp.countPixelsPercentage([0, 255, 0], win, onStartTest);
		});

		win.add(view1);
		win.add(view2);
		win.open();
	}

	this.viewVisible = function(testRun) {
		// Verify if view's green pixels is presents
		// Change the visible for view to false
		// Verify if green view's red pixels is not presents
		// Change the visible for view to true
		// Verify if green view's red pixels is presents		
		var cp = new CountPixels(),
			win = Ti.UI.createWindow({
				backgroundColor : '#ff0000'
			}),
			view1 = Ti.UI.createView({
				backgroundColor : '#00ff00'
			});
		
		var onShow = function(count) {
			valueOf(testRun, count).shouldBeEqual(100);
			win.close();
			finish(testRun);
		}
		
		var onHide = function(count) {
			 valueOf(testRun, count).shouldBeEqual(0);
			 
			 valueOf(testRun, function() {
				view1.show();
			}).shouldNotThrowException();
			
			setTimeout(function() {
				cp.countPixelsPercentage([0, 255, 0], win, onShow);
			}, 1000);
		}
		
		var onChangedVisibleToTrue = function(count) {
			var zi;

			valueOf(testRun, count).shouldBeEqual(100);
			valueOf(testRun, function(){
				zi = view1.getVisible();
			}).shouldNotThrowException();
			
			valueOf(testRun, view1.visible).shouldBeTrue();
			valueOf(testRun, zi).shouldBeTrue();
			
			valueOf(testRun, function(){
				view1.hide();
			}).shouldNotThrowException();
			
			setTimeout(function(){
				cp.countPixelsPercentage([0, 255, 0], win, onHide);
			}, 1000);
		}
		
		var onChangedVisibleToFalse = function(count) {
			var zi;

			valueOf(testRun, count).shouldBeEqual(100);
			valueOf(testRun, function() {
				zi = view1.getVisible();
			}).shouldNotThrowException();
			
			valueOf(testRun, view1.visible).shouldBeFalse();
			valueOf(testRun, zi).shouldBeFalse();
			
			valueOf(testRun, function() {
				view1.setVisible(true);
			}).shouldNotThrowException();
			
			setTimeout(function() {
				cp.countPixelsPercentage([0, 255, 0], win, onChangedVisibleToTrue);
			}, 1000);
		}
		
		var onStartTest = function(count) {
			valueOf(testRun, count).shouldBeEqual(100);
			
			valueOf(testRun, function() {
				view1.setVisible(false);
			}).shouldNotThrowException();
			
			setTimeout(function() {
				cp.countPixelsPercentage([255, 0, 0], win, onChangedVisibleToFalse);
			}, 1000);
		}
		
		win.addEventListener('postlayout', function() {
			var zi;
			
			valueOf(testRun, function() {
				zi = view1.getVisible();
			}).shouldNotThrowException();
			
			valueOf(testRun, view1.visible).shouldBeUndefined();
			valueOf(testRun, zi).shouldBeUndefined();
			
			cp.countPixelsPercentage([0, 255, 0], win, onStartTest);
		});

		win.add(view1);
		win.open();
	}

	this.viewLayoutPixelTest = function(testRun) {
		var cp = new CountPixels(),
			// Create window
			win = Ti.UI.createWindow(),
			// Create veiw with composite layout
			// In this view child views, which have the same coordinates and size, will overlap
			parentViewComposite = Ti.UI.createView({
				backgroundColor : '#ffffff',
				layout: 'composite'
			}),
			// Create veiw with composite layout
			// In this view child views, which have the same coordinates and size, are placed one under the other
			parentViewVertical = Ti.UI.createView({
				backgroundColor : '#ffffff',
				layout: 'vertical'
			}),
			// Create veiw with composite layout
			// In this view child views, which have the same coordinates and size placed next to one another
			parentViewHorizontal = Ti.UI.createView({
				backgroundColor : '#ffffff',
				layout: 'horizontal'
			}),
			// These options will be used for creating the red views
			childViewRedOptions = {
				top: 10,
				left: 10,
				height: 100,
				width: 100,
				backgroundColor: '#ff0000'
			},
			// These options will be used for creating the green views
			childViewGreenOptions = {
				top: 10,
				left: 10,
				height: 100,
				width: 100,
				backgroundColor: '#00ff00'
			},
			positionRed, positionGreen, expectedRed, expectedGreen;

		parentViewComposite.add(Ti.UI.createView(childViewGreenOptions));
		parentViewComposite.add(Ti.UI.createView(childViewRedOptions));

		parentViewVertical.add(Ti.UI.createView(childViewGreenOptions));
		parentViewVertical.add(Ti.UI.createView(childViewRedOptions));

		parentViewHorizontal.add(Ti.UI.createView(childViewGreenOptions));
		parentViewHorizontal.add(Ti.UI.createView(childViewRedOptions));

		parentViewComposite.addEventListener('postlayout', prepareComposite);
		parentViewVertical.addEventListener('postlayout' , prepareVertical);
		parentViewHorizontal.addEventListener('postlayout' , prepareHorizontal);

		win.add(parentViewComposite);
		win.addEventListener('close', function() {
			finish(testRun);
		});
		// PrepareComposite() will begin executing
		win.open();

		function prepareComposite() {
			// In composite layout, the red will completely cover the green
			expectedRed = 10000,
			expectedGreen = 0,
			positionRed = {
				top: 10,
				left: 10,
				width: 100,
				heigth: 100,
			};
			positionGreen = {};

			// Initiate the sequence of callbacks that will perform the following checks:
			// - check that there are 10000 red pixels in the rectangle "positionred" (function checkRedColor)
			// - check that there are 0 green pixels in the rectangle "positionGreen" (function checkGreenColor)
			// - check that there are {windows_area - expectedGreen - expectedRed} white pixels (function CheckWhiteColor)
			// - proceed to vertical layout test (function addVerticalWindow)
			checkRedColor(addVerticalWindow);	
		}

		function prepareVertical() {
			// In vertical layout, child views with same coordinates and sizes are placed one under the other
			console.log('prepareVertical')
			expectedRed = 10000,
			expectedGreen = 10000,
			positionRed = {
				top: 120,
				left: 10,
				width: 100,
				heigth: 100,
			};
			positionGreen = {
				top: 10,
				left: 10,
				width: 100,
				heigth: 100,
			};

			// Initiate the sequence of callbacks that will perform the following checks:
			// - check that there are 10000 red pixels in the rectangle "positionred" (function checkRedColor)
			// - check that there are 10000 green pixels in the rectangle "positionGreen" (function checkGreenColor)
			// - check that there are {windows_area - expectedGreen - expectedRed} white pixels (function CheckWhiteColor)
			// - proceed to horizontal layout test (function addHorizontalWindow)			
			checkRedColor(addHorizontalWindow);	
		}

		function prepareHorizontal() {
			// In horizontal layout, child views with same coordinates and sizes are placed one beside the other
			expectedRed = 10000,
			expectedGreen = 10000,
			positionRed = {
				top: 10,
				left: 120,
				width: 100,
				heigth: 100,
			};
			positionGreen = {
				top: 10,
				left: 10,
				width: 100,
				heigth: 100,
			};

			// Initiate the sequence of callbacks that will perform the following checks:
			// - check that there are 10000 red pixels in the rectangle "positionred" (function checkRedColor)
			// - check that there are 10000 green pixels in the rectangle "positionGreen" (function checkGreenColor)
			// - check that there are {windows_area - expectedGreen - expectedRed} white pixels (function CheckWhiteColor)
			// - finish the test (function fin)			
			checkRedColor(fin);	
		}

		function addVerticalWindow() {
			win.removeEventListener('postlayout');
			win.addEventListener('postlayout', function() {
				setTimeout(function() {
					win.add(parentViewVertical);    // prepareVertical will execute
				}, 0);
			});

			win.remove(parentViewComposite);
		}

		function addHorizontalWindow() {
			win.removeEventListener('postlayout');
			win.addEventListener('postlayout', function() {
				setTimeout(function() {
					win.add(parentViewHorizontal);		// prepareHorizontal will execute
				}, 0);
			});

			win.remove(parentViewVertical);
		}

		function fin() {
			// Then finish test
			win.close()
		}

		function checkRedColor(callback) {
			cp.countPixels([255, 0, 0], 
				win, 
				function(count){
					valueOf(testRun, count).shouldBe(expectedRed);
					checkGreenColor(callback);	
				},
				positionRed
			);
		}

		function checkGreenColor(callback) {
			cp.countPixels([0, 255, 0], 
				win, 
				function(count) {
					valueOf(testRun, count).shouldBe(expectedGreen);
					checkWhiteColor(callback);	
				},
				positionGreen
			);
		}

		function checkWhiteColor(callback) {
			cp.countPixels([255, 255, 255], 
				win, 
				function(count) {
					valueOf(testRun, count).shouldBe( win.rect.width*win.rect.height - expectedRed - expectedGreen);
					callback();	
				}
			);
		}
	}

	this.viewTransformPixelTest = function(testRun) {
		var cp = new CountPixels(),
			// Create white window which  will be used as background
			win = Ti.UI.createWindow({
				backgroundColor : '#ffffff',
				width: 320,
				height: 510
			}),
			// Create black view wich will be used as container
			// Wich contain two colored bands
			parentView = Ti.UI.createView({
				top: 205,
				left: 110,
				height: 100,
				width: 100,
				backgroundColor: '#000000',
			}),
			// The green band
			greenView = Ti.UI.createView({
				top: 0,
				height: 50,
				width: 100,
				backgroundColor: '#00ff00'
			}),
			// The red band
			redView = Ti.UI.createView({
				bottom: 0,			
				height: 50,
				width: 100,
				backgroundColor: '#ff0000'
			});

		parentView.add(redView);
		parentView.add(greenView);

		//create matrix wich will be transform our veiew
		var matrix = Ti.UI.create2DMatrix();
		matrix = matrix.rotate(270);
		matrix = matrix.scale(2, 2);

		//this is the expected numbers of colored pixels in the view and their expected rectangle
		//before transformation
		var expectedRed = 5000,
			expectedGreen = 5000,
			redRectangle = {
				top: 255,
				left: 110,
				height: 50,
				width: 100
			},
			greenRectangle = {
				top: 205,
				left: 110,
				height: 50,
				width: 100
			};

		win.add(parentView);
		parentView.addEventListener('postlayout', checkRedColor);
		win.addEventListener('close', function() {
			finish(testRun);
		});

		win.open();

		var fin = (function() {
			var repeat = true;
			return function() {
				if (repeat) {
					// On the first call, it will transform the view
					repeat = false;
					expectedRed = 20000;
					// View should be rotated on 270 degree and scale twice
					expectedGreen = 20000;
					// That's why we specify appropriative coordinates and expected counts
					redRectangle = {
						top: 155,
						left: 160,
						height: 200,
						width: 100
					},
					greenRectangle = {
						top: 155,
						left: 60,
						height: 200,
						width: 100
					},
					parentView.applyProperties({
						transform: matrix
					});

					setTimeout(checkRedColor, 500);
				} else {
					// On the second call, it will finish the test
					win.close();
				} 
			}
		}());

		// Check red pixel count where the view should be located
		function checkRedColor() {
			cp.countPixels([255, 0, 0], 
				win, 
				function(count) {
					valueOf(testRun, count).shouldBe(expectedRed);
					checkGreenColor();	
				},
				redRectangle
			);
		}

		// Check green pixel count where the view should be located
		function checkGreenColor() {
			cp.countPixels([0, 255, 0], 
				win, 
				function(count) {
					valueOf(testRun, count).shouldBe(expectedGreen);
					checkWhiteColor();	
				},
				greenRectangle
			);
		}

		// Check white pixel count on window
		function checkWhiteColor() {
			cp.countPixels([255, 255, 255], 
				win, 
				function(count) {
					valueOf(testRun, count).shouldBe(win.rect.width*win.rect.height - expectedRed - expectedGreen);
					fin();	
				}
			);
		}
	}
};