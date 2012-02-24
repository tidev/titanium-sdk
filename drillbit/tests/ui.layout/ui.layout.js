describe("Ti.UI Layout tests", {
	// functional test cases #1010, #1011, #1025, #1025a
	//rect and size properties should not be undefined
	viewSizeAndRectPx: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			valueOf(view.size).shouldNotBeUndefined();
			valueOf(view.size.width).shouldNotBeUndefined();
			valueOf(view.size.height).shouldNotBeUndefined();
			valueOf(view.size.x).shouldNotBeUndefined();
			valueOf(view.size.y).shouldNotBeUndefined();
			valueOf(view.rect).shouldNotBeUndefined();
			valueOf(view.rect.width).shouldNotBeUndefined();
			valueOf(view.rect.height).shouldNotBeUndefined();
			valueOf(view.rect.x).shouldNotBeUndefined();
			valueOf(view.rect.y).shouldNotBeUndefined();
			
			//size and rect properties return the same width and height
			valueOf(view.size.width).shouldBe(view.size.width);
			valueOf(view.size.height).shouldBe(view.size.height);
			
			//size property returns 0 for x and y
			valueOf(view.size.x).shouldBe(0);
			valueOf(view.size.y).shouldBe(0);
			
			//Functonal test case 1025
			valueOf(view.top).shouldBeUndefined();
			valueOf(view.bottom).shouldBeUndefined();
			valueOf(view.left).shouldBeUndefined();
			valueOf(view.right).shouldBeUndefined();
			valueOf(view.center).shouldBeUndefined();
			valueOf(view.zIndex).shouldBeUndefined();
			valueOf(view.padding).shouldBeUndefined();
			valueOf(view.margin).shouldBeUndefined();
			
			//Functonal test case 1025a
			valueOf(label.top).shouldBeUndefined();
			valueOf(label.bottom).shouldBeUndefined();
			valueOf(label.left).shouldBeUndefined();
			valueOf(label.right).shouldBeUndefined();
			valueOf(label.center).shouldBeUndefined();
			valueOf(label.zIndex).shouldBeUndefined();
			valueOf(label.padding).shouldBeUndefined();
			valueOf(label.margin).shouldBeUndefined();
			
			//FILL behavior
			valueOf(view.rect.x).shouldBe(0);
			valueOf(view.rect.y).shouldBe(0);
			valueOf(win.size.height/view.size.height).shouldBe(1);
			valueOf(win.size.width/view.size.width).shouldBe(1);
		}));
		win.open();
	}),
	// functional test cases #1012, #1014: 
	// ViewLeft and ViewRight
	viewLeft: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			left: 10, width: 10
		});
		var view2 = Ti.UI.createView({
			right: 10, width:10
		});
		win.add(view);
		win.add(view2);
		win.addEventListener("open", this.async(function(e) {
			valueOf(view.left).shouldBe(10);
			valueOf(view.rect.x).shouldBe(10);
			valueOf(view.rect.width).shouldBe(10);
			valueOf(view.right).shouldBeUndefined();
			
			valueOf(view2.right).shouldBe(10);
			valueOf(view2.rect.x).shouldBe(win.size.width - 20);
			valueOf(view2.rect.width).shouldBe(10);
			valueOf(view2.left).shouldBeUndefined();
		}));
		win.open();
	}),
	// functional test case #1016, #1018
	// ViewTop and ViewBottom
	viewTop: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			top: 10, height: 10
		});
		var view2 = Ti.UI.createView({
			bottom: 10, height: 10
		});
		win.add(view);
		win.add(view2);
		win.addEventListener("open", this.async(function(e) {
			valueOf(view.top).shouldBe(10);
			valueOf(view.rect.y).shouldBe(10);
			valueOf(view.rect.height).shouldBe(10);
			valueOf(view.bottom).shouldBeUndefined();
			
			valueOf(view2.bottom).shouldBe(10);
			valueOf(view2.rect.y).shouldBe(win.size.height - 20);
			valueOf(view2.rect.height).shouldBe(10);
			valueOf(view2.top).shouldBeUndefined();
		}));
		win.open();
	}),
	// functional test case #1020: ViewCenter
	viewCenter: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			center: {
				x: 50, y: 50
			},
			height: 40, width: 40
		});
		win.add(view);
		win.addEventListener("open", this.async(function(e) {
			valueOf(view.center.x).shouldBe(50);
			valueOf(view.center.y).shouldBe(50);
			valueOf(view.rect.x).shouldBe(30);
			valueOf(view.rect.y).shouldBe(30);
		}));
		win.open();
	}),
	// functional test case #1022, #1024
	// ViewWidth, ViewHeight
	viewWidth: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			width: 10, height: 10
		});
		win.add(view);
		win.addEventListener("open", this.async(function(e) {
			valueOf(view.width).shouldBe(10);
			valueOf(view.size.width).shouldBe(10);
			valueOf(view.height).shouldBe(10);
			valueOf(view.size.height).shouldBe(10);

			valueOf(view.left).shouldBeUndefined()
			valueOf(view.right).shouldBeUndefined();
			valueOf(view.top).shouldBeUndefined();
			valueOf(view.bottom).shouldBeUndefined();
			//Centered View with width and height defined
			valueOf(view.rect.x).shouldBe(Math.floor((win.size.width - view.size.width) / 2));
			valueOf(view.rect.y).shouldBe(Math.floor((win.size.height - view.size.height) / 2));
		}));
		win.open();
	}),
	// functional test #1026 ViewError
	viewError: asyncTest(function() {
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
		win.addEventListener('open', this.async(function(e){
			valueOf(view.left).shouldBe("leftString");
			valueOf(view.right).shouldBe("rightString");
			valueOf(view.top).shouldBe("topString");
			valueOf(view.bottom).shouldBe("bottomString");
			valueOf(view.center.y).shouldBe("centerYString");
			valueOf(view.center.x).shouldBe("centerXString");
			valueOf(view.width).shouldBe("widthString");
			valueOf(view.height).shouldBe("heightString");
		}));

		win.open();

	}),
	// functional test #1027 ViewPaddingZero
	viewPaddingZero: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			padding: 0
		});

		win.addEventListener('open', this.async(function(e){
			//Invalid value test. Must be defined as Rect(duck type)
			valueOf(view.padding).shouldBeUndefined();
		}));

		win.add(view);
		win.open();

	}),
	// functional test #1028 ViewPadding
	viewPadding: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			padding: {left:10}
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.padding.left).shouldBe(10);
			valueOf(view.padding.right).shouldBeUndefined();
			//Padding should not effect this views positioning
			valueOf(view.rect.x).shouldBe(0);
		}));

		win.add(view);
		win.open();

	}),
	// functional test #1029 ViewPaddingDiffrerent
	viewPaddingZero: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			padding: {top:1, left:2, right:3, bottom:4}
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.padding.top).shouldBe(1);
			valueOf(view.padding.left).shouldBe(2);
			valueOf(view.padding.right).shouldBe(3);
			valueOf(view.padding.bottom).shouldBe(4);
		}));

		win.add(view);
		win.open();

	}),
	// functional test #1030 ViewMarginZero
	viewMarginZero: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			margin: 0
		});

		win.addEventListener('open', this.async(function(e){
			//Invalid value test. Must be defined as Rect(duck type)
			valueOf(view.margin).shouldBeUndefined();
		}));

		win.add(view);
		win.open();

	}),
	// functional test #1031 ViewMargin
	viewMargin: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			margin: {left:10}
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.margin.left).shouldBe(10);
			valueOf(view.margin.right).shouldBeUndefined();
			//Margin will effect this views positioning
			valueOf(view.rect.x).shouldBe(10);
		}));

		win.add(view);
		win.open();

	}),
	// functional test #1032 ViewMarginDifferent
	viewMarginDifferent: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			margin: {top:1, left:2, right:3, bottom:4}
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.margin.top).shouldBe(1);
			valueOf(view.margin.left).shouldBe(2);
			valueOf(view.margin.right).shouldBe(3);
			valueOf(view.margin.bottom).shouldBe(4);
		}));

		win.add(view);
		win.open();

	}),
	// functional test #1033, 1033a, 1033b 
	// UndefinedWidth Implicit calculations
	undefinedWidth: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var parentView = Ti.UI.createView({
			padding:{right:10,top:10},
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

		win.addEventListener('open', this.async(function(e){
			// Don't check for actual values here since rect will be different depending on device
			valueOf(view1.width).shouldBeUndefined();
			valueOf(view2.width).shouldBeUndefined();
			valueOf(view3.width).shouldBeUndefined();
			
			valueOf(view1.rect.width).shouldBe(85);
			valueOf(view2.rect.width).shouldBe(10);
			valueOf(view3.rect.width).shouldBe(30);
			
			//Parentview padding should effect positioning of views
			valueOf(view1.rect.y).shouldBe(10);
			valueOf(view2.rect.y).shouldBe(10);
			valueOf(view3.rect.y).shouldBe(10);
		
			valueOf(view1.rect.x).shouldBe(-5);
			valueOf(view2.rect.x).shouldBe(-5);
			valueOf(view3.rect.x).shouldBe(50);
		}));
		
		parentView.add(view1);
		parentView.add(view2);
		parentView.add(view3);
		win.add(parentView);
		win.open();

	}),
	// functional test #1034/1034a/1034b UndefinedLeft
	undefinedLeft: asyncTest(function() {
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

		win.addEventListener('open', this.async(function(e){
			valueOf(view1.left).shouldBeUndefined();
			valueOf(view2.left).shouldBeUndefined();
			valueOf(view3.left).shouldBeUndefined();
			
			valueOf(view1.rect.x).shouldNotBeUndefined();
			valueOf(view2.rect.x).shouldNotBeUndefined();
			valueOf(view3.rect.x).shouldNotBeUndefined();
			valueOf(view1.rect.y).shouldNotBeUndefined();
			valueOf(view2.rect.y).shouldNotBeUndefined();
			valueOf(view3.rect.y).shouldNotBeUndefined();
			valueOf(view1.rect.width).shouldNotBeUndefined();
			valueOf(view2.rect.width).shouldNotBeUndefined();
			valueOf(view3.rect.width).shouldNotBeUndefined();
			valueOf(view1.rect.height).shouldNotBeUndefined();
			valueOf(view2.rect.height).shouldNotBeUndefined();
			valueOf(view3.rect.height).shouldNotBeUndefined();
		}));

		win.add(view1);
		win.add(view2);
		win.add(view3);
		win.open();

	}),
	// functional test #1035 & #1039 UndefinedCenter
	undefinedCenter: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.center).shouldBeUndefined();
			//Dynamic center can be calculated from view.rect
			valueOf(view.rect).shouldNotBeUndefined();
		}));

		win.add(view);
		win.open();
	}),
	// functional test #1036 UndefinedRight
	undefinedRight: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			center: {x:50},
			left:10
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.rect.right).shouldNotBeUndefined();
			valueOf(view.right).shouldBeUndefined();
		}));

		win.add(view);
		win.open();

	}),
	// functional test #1037 UndefinedHeight
	undefinedHeight: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			top: 5,
			bottom: 10
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.rect.bottom - view.rect.top).shouldBe(view.size.height);
			valueOf(view.height).shouldBeUndefined();
		}));

		win.add(view);
		win.open();

	}),
	// functional test #1037a & #1037b UndefinedHeightCenterBottom UndefinedHeightCenterTop
	undefinedHeightCenter: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			top: 5,
			bottom: 10
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.rect.bottom - view.rect.top).shouldBe(view.size.height);
			valueOf(view.height).shouldBeUndefined();
		}));

		win.add(view);
		win.open();

	}),
	// functional test #1038 UndefinedTop
	undefinedTop: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			height: 50,
			center: {y:200}
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.rect.top).shouldNotBeUndefined();
			valueOf(view.top).shouldBeUndefined();
		}));

		win.add(view);
		win.open();

	}),
	// functional test #1038a #1038b UndefinedTopCenterBottom UndefinedTopHeightBottom
	undefinedTopCenter: asyncTest(function() {
		var win = Ti.UI.createWindow();
		
		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			bottom: 10,
			center: {y:5}
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.rect.bottom - view.rect.top).shouldBe(view.size.height);
			valueOf(view.height).shouldBeUndefined();
		}));

		win.add(view);
		win.open();
	}),
	// functional test #1040 UndefinedBottom
	undefinedBottom: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			center: {y:50},
			top: 10
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.rect.bottom).shouldNotBeUndefined();
			valueOf(view.bottom).shouldBeUndefined();
		}));

		win.add(view);
		win.open();
	}),
	// functional test #1042 WidthPrecedence
	widthPrecedence: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			left: 10,
			right: 15,
			width: 10
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.size.width).shouldBe(10);
		}));

		win.add(view);
		win.open();
	}),
	// functional test #1043 LeftPrecedence
	leftPrecedence: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			left: 10,
			right: 100,
			center: {x:30}
		});

		win.addEventListener('open', this.async(function(e){
			// FIXME need to figure out what the correct value is
			valueOf(view.size.width).shouldBe(40);
		}));

		win.add(view);
		win.open();
	}),
	// functional test #1044 CenterXPrecedence
	centerXPrecedence: asyncTest(function() {
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

		win.addEventListener('open', this.async(function(e){
			// FIXME need to figure out what the correct value is
			valueOf(viewChild.size.width).shouldBe(100);
		}));

		view.add(viewChild);
		win.add(view);
		win.open();
	}),
	// functional test #1046 HeightPrecedence
	heightPrecedence: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			top: 10,
			bottom: 15,
			height: 10
		});

		win.addEventListener('open', this.async(function(e){
			valueOf(view.size.height).shouldBe(10);
		}));

		win.add(view);
		win.open();
	}),
	// functional test #1047 TopPrecedence
	topPrecedence: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view = Ti.UI.createView({
			backgroundColor: 'yellow',
			top: 10,
			bottom: 100,
			center: {y: 30}
		});

		win.addEventListener('open', this.async(function(e){
			// FIXME need to figure out what the correct value is
			valueOf(view.size.height).shouldBe(40);
		}));

		win.add(view);
		win.open();
	}),
	// functional test #1048 CenterYPrecedence
	centerYPrecedence: asyncTest(function() {
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

		win.addEventListener('open', this.async(function(e){
			// FIXME need to figure out what the correct value is
			valueOf(viewChild.size.height).shouldBe(100);
		}));

		view.add(viewChild);
		win.add(view);
		win.open();
	}),
	// functional test #1053 ScrollViewSize
	scrollViewSize: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var label = Ti.UI.createLabel({
			text: 'View Size is: ',
			top: 20,
			left: 10,
			height: 200,
			color: 'black'
		});

		var label2 = Ti.UI.createLabel({
			color: 'red'
		})
		var scrollView = Titanium.UI.createScrollView({
		    contentHeight:'auto',
		    contentWidth:'auto',
		    showVerticalScrollIndicator:true,
		    showHorizontalScrollIndicator:true
		});

		var view = Titanium.UI.createView();
		label2.add(scrollView);

		win.addEventListener('open', this.async(function(e){
			valueOf(scrollView.size).shouldNotBeUndefined();
			valueOf(scrollView.size.height).shouldNotBe(0);
			valueOf(scrollView.size.width).shouldNotBe(0);
		}));

		win.add(label2);
		win.add(view);
		view.add(label);
		win.open();
	}),
	// functional test #1106 ZIndexMultiple
	zIndexMultiple: asyncTest(function() {
		var win = Ti.UI.createWindow();

		var view1 = Ti.UI.createView({backgroundColor:'red', zIndex:0, height: 50, width: 50, top: 10});
		var view2 = Ti.UI.createView({backgroundColor:'orange',zIndex:1, height: 50, width: 50, top: 20});
		var view3 = Ti.UI.createView({backgroundColor:'yellow',zIndex:2, height: 50, width: 50, top: 30});
		var view4 = Ti.UI.createView({backgroundColor:'green', zIndex:3, height: 50, width: 50, top: 40});
		var view5 = Ti.UI.createView({backgroundColor:'blue', zIndex:4, height: 50, width: 50, top: 50});

		win.addEventListener('open', this.async(function(e){
			valueOf(view1.zIndex).shouldBe(0);
			valueOf(view2.zIndex).shouldBe(1);
			valueOf(view3.zIndex).shouldBe(2);
			valueOf(view4.zIndex).shouldBe(3);
			valueOf(view5.zIndex).shouldBe(4);
		}));

		win.add(view5);
		win.add(view4);
		win.add(view3);
		win.add(view2);
		win.add(view1);
		win.open();
	}),
	fourPins: asyncTest(function() {
		var win = Ti.UI.createWindow({
			width: 100, height: 100
		});
		var label = Ti.UI.createLabel({
			left: 10, right: 10,
			top: 10, bottom: 10
		});
		win.add(label);
		win.addEventListener("open", this.async(function(e) {
			valueOf(label.size.width).shouldBe(80);
			valueOf(label.size.height).shouldBe(80);
			valueOf(label.left).shouldBe(10);
			valueOf(label.right).shouldBe(10);
			valueOf(label.top).shouldBe(10);
			valueOf(label.bottom).shouldBe(10);
			valueOf(label.rect.left).shouldBe(10);
			valueOf(label.rect.right).shouldBe(90);
			valueOf(label.rect.top).shouldBe(10);
			valueOf(label.rect.bottom).shouldBe(90);
		}));
		win.open();
	})
});