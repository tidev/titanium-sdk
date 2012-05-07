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
			
			//Functonal test case 1025a
			valueOf(label.top).shouldBeUndefined();
			valueOf(label.bottom).shouldBeUndefined();
			valueOf(label.left).shouldBeUndefined();
			valueOf(label.right).shouldBeUndefined();
			valueOf(label.center).shouldBeUndefined();
			valueOf(label.zIndex).shouldBeUndefined();
			
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
	// functional test #1033, 1033a, 1033b 
	// UndefinedWidth Implicit calculations
	undefinedWidth: asyncTest(function() {
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

		win.addEventListener('open', this.async(function(e){
			valueOf(view1.width).shouldBeUndefined();
			valueOf(view2.width).shouldBeUndefined();
			valueOf(view3.width).shouldBeUndefined();
			
			valueOf(view1.rect.width).shouldBe(85);
			valueOf(view2.rect.width).shouldBe(10);
			valueOf(view3.rect.width).shouldBe(30);
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
			valueOf(view.right).shouldBeUndefined();
			valueOf(view.rect.width).shouldBe(80);
			valueOf(view.rect.x).shouldBe(10);
		}));

		win.add(view);
		win.open();

	}),
	// functional test #1037, #1037a, #1037b 
	// UndefinedHeight Implicit calculations
	undefinedHeight: asyncTest(function() {
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

		win.addEventListener('open', this.async(function(e){
			valueOf(view1.height).shouldBeUndefined();
			valueOf(view2.height).shouldBeUndefined();
			valueOf(view3.height).shouldBeUndefined();
			
			valueOf(view1.rect.height).shouldBe(85);
			valueOf(view2.rect.height).shouldBe(10);
			valueOf(view3.rect.height).shouldBe(30);
		}));
		
		parentView.add(view1);
		parentView.add(view2);
		parentView.add(view3);
		win.add(parentView);
		win.open();

	}),
	// functional test #1038, 1038a, 1038b
	// UndefinedTop. Dynamic top calculation
	undefinedTop: asyncTest(function() {
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

		win.addEventListener('open', this.async(function(e){
			//Static Tops
			valueOf(view1.top).shouldBeUndefined();
			valueOf(view2.top).shouldBeUndefined();
			valueOf(view3.top).shouldBeUndefined();
			//Dynamic Tops
			valueOf(view1.rect.y).shouldBe(175);
			if(win.size.height <= 250)
			{
				//View Height of 0 positioned at center
				valueOf(view2.rect.y).shouldBe(50);
			}
			else
			{
				//View height = 2x(wh - bottom - center)
				//View top = center - height/2 = 2c + b - wh
				valueOf(view2.rect.y).shouldBe(300 - win.size.height);
			}
			
			valueOf(view3.rect.y).shouldBe(win.size.height-300);
		}));
		
		win.add(view1);
		win.add(view2);
		win.add(view3);
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
			valueOf(view.bottom).shouldBeUndefined();
			//Dynamic bottom is rect.y + rect.height
			valueOf(view.rect.height).shouldNotBeUndefined();
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
			valueOf(viewChild.size.height).shouldBe(100);
		}));

		view.add(viewChild);
		win.add(view);
		win.open();
	}),
	// functional test #1053 ScrollViewSize
	scrollViewSize: asyncTest(function() {
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

		win.addEventListener('open', this.async(function(e){

			var isAndroid = (Ti.Platform.osname === 'android');
			//LABEL HAS SIZE AUTO BEHAVIOR. 
			//SCROLLVIEW HAS FILL BEHAVIOR
			//LABEL will have 0 size (no text)
			//LABEL2 will have non 0 size (has text/pins)
			valueOf(label.size).shouldNotBeUndefined();
			valueOf(label2.size).shouldNotBeUndefined();
			valueOf(scrollView.size).shouldNotBeUndefined();
			valueOf(scrollView2.size).shouldNotBeUndefined();

			if (!isAndroid) {
				//Android does not return 0 height even when there is no text
				valueOf(label.size.width).shouldBe(0);
				valueOf(label.size.height).shouldBe(0);
				// Adding a scroll view to a label does not work in android: TIMOB-7817
				valueOf(scrollView.size.width).shouldBe(0);
				valueOf(scrollView.size.height).shouldBe(0);

				valueOf(label2.size.height).shouldNotBe(0);
				valueOf(label2.size.width).shouldNotBe(0);

				valueOf(scrollView2.size.height).shouldNotBe(0);
				valueOf(scrollView2.size.width).shouldNotBe(0);

				valueOf(label2.size.width).shouldBe(scrollView2.size.width);
				valueOf(label2.size.height).shouldBe(scrollView2.size.height);
			}

			// This is not working yet due to TIMOB-5303

			// valueOf(scrollView3.size.height).shouldNotBe(0);
			// valueOf(scrollView3.size.width).shouldNotBe(0);
			// 
			// valueOf(view.size.width).shouldBe(scrollView3.size.width);
			// valueOf(view.size.height).shouldBe(scrollView3.size.height);
		}));

		view.add(scrollView);
		win.add(view);
		win.add(label2);
		win.add(label);
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
	fillInVerticalLayout: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			valueOf(parent.size.width).shouldBe(40);
			valueOf(parent.size.height).shouldBe(50);
			valueOf(child.size.width).shouldBe(40);
			valueOf(child.size.height).shouldBe(50);
		}));
		win.open();
	}),
	sizeFillConflict: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			valueOf(grandParent.size.width).shouldBe(200);
			valueOf(grandParent.size.height).shouldBe(300);

			valueOf(parent.size.width).shouldBe(200);
			valueOf(parent.size.height).shouldBe(300);

			valueOf(child1.size.width).shouldBe(200);
			valueOf(child1.size.height).shouldBe(300);

			valueOf(child2.size.width).shouldBe(200);
			valueOf(child2.size.height).shouldBe(50);

			valueOf(child3.size.width).shouldBe(30);
			valueOf(child3.size.height).shouldBe(300);
		}));
		win.open();
	}),
	// Functional Test #1000 SystemMeasurement
	systemMeasurement: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			if (Ti.Platform.osname === 'android') {
				valueOf(parent.size.width).shouldBe(40);
			} else if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad' ) {
				valueOf(parent.size.height).shouldBe(50);
			}
		}));
		win.open();
	}),
	// Functional Test #1001 #1002 #1003 #1004 #1005 #1006
	unitMeasurements: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			valueOf(child.size.width).shouldNotBe(0);
			valueOf(child.size.height).shouldNotBe(0);
			
			valueOf(child1.size.width).shouldNotBe(0);
			valueOf(child1.size.height).shouldNotBe(0);
			
			valueOf(child2.size.width).shouldNotBe(0);
			valueOf(child2.size.height).shouldNotBe(0);
			
			valueOf(child3.size.width).shouldBe(0);
			valueOf(child3.size.height).shouldBe(0);
		}));
		win.open();
	}),
	// Scrollview
	scrollViewAutoContentHeight: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			valueOf(view2.size.width).shouldBe(scrollView.size.width);
			valueOf(view2.size.height).shouldBe(scrollView.size.height);
		}));
		win.add(scrollView);
		win.open();
	}),
	scrollViewLargeContentHeight: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			valueOf(view2.size.width).shouldBe(scrollView.size.width);
			valueOf(view2.size.height).shouldBe(2000);
		}));
		win.add(scrollView);
		win.open();
	}),
	scrollViewMinimumContentHeight: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			valueOf(view2.size.width).shouldBe(scrollView.size.width);
			valueOf(view2.size.height).shouldBe(scrollView.size.height);
		}));
		win.add(scrollView);
		win.open();
	}),
	horizontalScrollViewMinimumContentHeight: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			valueOf(view2.size.width).shouldBe(scrollView.size.width);
			valueOf(view2.size.height).shouldBe(scrollView.size.height);
		}));
		win.add(scrollView);
		win.open();
	}),
	horizontalScrollViewLargeContentHeight: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			valueOf(view2.size.width).shouldBe(scrollView.size.width);
			valueOf(view2.size.height).shouldBe(scrollView.size.height);
		}));
		win.add(scrollView);
		win.open();
	}),
	//TIMOB-8362
	scrollViewWithSIZE: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			valueOf(scrollView.size.height).shouldBe(50);
			valueOf(scrollView.size.width).shouldBe(100);
		}));
		win.open();
	}),
	//TIMOB-8891
	scrollViewWithLargeVerticalLayoutChild: asyncTest(function() {
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
		win.addEventListener("open", this.async(function(e) {
			valueOf(innerView.size.height).shouldBe(1200);
			valueOf(innerView.size.width).shouldBe(scrollView.size.width);
		}));
		win.open();
	}),
	// Functional Test #1087-#1097
	convertUnits: function() {
		// android
		var dpi = Ti.Platform.displayCaps.dpi;

		if (Ti.Platform.osname === 'android') {
			// 1087 
			valueOf(Ti.UI.convertUnits('1in', Ti.UI.UNIT_PX)).shouldBe(dpi);
			valueOf(Ti.UI.convertUnits('100', Ti.UI.UNIT_PX)).shouldBe(100);
			// 1092
			valueOf(Ti.UI.convertUnits('25.4mm', Ti.UI.UNIT_PX)).shouldBe(dpi);
			
		} else if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad' ) {
			// 1091
			valueOf(Ti.UI.convertUnits('1in', Ti.UI.UNIT_DIP)).shouldBe(dpi);
			valueOf(Ti.UI.convertUnits('100', Ti.UI.UNIT_DIP)).shouldBe(100);
			valueOf(Ti.UI.convertUnits('25.4mm', Ti.UI.UNIT_DIP)).shouldBe(dpi);
		}
		
		// 1088
		valueOf(Math.round(Ti.UI.convertUnits(dpi.toString(), Ti.UI.UNIT_MM))).shouldBe(25);
		// 1089
		valueOf(Math.round(Ti.UI.convertUnits(dpi.toString(), Ti.UI.UNIT_CM))).shouldBe(3);
		
		// 1088
		valueOf(Math.round(Ti.UI.convertUnits(dpi.toString(), Ti.UI.UNIT_MM))).shouldBe(25);
		// 1089
		valueOf(Math.round(Ti.UI.convertUnits(dpi.toString(), Ti.UI.UNIT_CM))).shouldBe(3);
		// 1090
		valueOf(Math.round(Ti.UI.convertUnits(dpi.toString(), Ti.UI.UNIT_IN))).shouldBe(1);
		
		// 1093
		valueOf(Ti.UI.convertUnits('100cm', Ti.UI.UNIT_MM)).shouldBe(1000);
		// 1094
		valueOf(Ti.UI.convertUnits('100in', Ti.UI.UNIT_CM)).shouldBe(254);
		
		// 1097
		valueOf(Ti.UI.convertUnits('abc', Ti.UI.UNIT_PX)).shouldBe(0);
		
	},
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
			valueOf(label.rect.x).shouldBe(10);
			valueOf(label.rect.width).shouldBe(80);
			valueOf(label.rect.y).shouldBe(10);
			valueOf(label.rect.height).shouldBe(80);
		}));
		win.open();
	})
});