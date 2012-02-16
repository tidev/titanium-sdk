describe("Ti.UI Layout tests", {
	// functional test cases #1010, #1011
	// ViewSize, ViewRect
	viewSizeAndRectPx: asyncTest(function() {
		var win = Ti.UI.createWindow({
			top: 0, left: 0, right: 0, bottom: 0
		});
		var view = Ti.UI.createView({width: "310px", height: "60"});
		var label = Ti.UI.createLabel({
			top: 20, left: 10, height: "40px", width: "300px"
		});
		view.add(label);
		win.add(view);
		win.addEventListener("open", this.async(function(e) {
			valueOf(view.size.width).shouldBe(310);
			valueOf(view.size.height).shouldBe(60);
			valueOf(view.rect.top).shouldBe(Math.floor((win.size.height - view.size.height) / 2));
			valueOf(view.top).shouldBeUndefined();
			valueOf(view.rect.left).shouldBe(Math.floor((win.size.width - view.size.width) / 2));
			valueOf(view.left).shouldBeUndefined();
			valueOf(view.bottom).shouldBeUndefined();
			valueOf(view.rect.height).shouldBeUndefined();
			valueOf(view.rect.width).shouldBeUndefined();
			valueOf(view.right).shouldBeUndefined();

			valueOf(label.size.width).shouldBe(300);
			valueOf(label.width).shouldBe("300px");
			valueOf(label.size.height).shouldBe(40);
			valueOf(label.height).shouldBe("40px");
			valueOf(label.rect.top).shouldBe(label.top);
			valueOf(label.rect.left).shouldBe(label.left);
			valueOf(label.rect.right).shouldBe(310);
			valueOf(label.right).shouldBeUndefined();
			valueOf(label.rect.bottom).shouldBe(60);
			valueOf(label.bottom).shouldBeUndefined();
		}));
		win.open();
	}),
	// functional test case #1012: ViewLeft
	viewLeft: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			left: 10, width: 10
		});
		win.add(view);
		win.addEventListener("open", this.async(function(e) {
			valueOf(view.left).shouldBe(10);
			valueOf(view.rect.left).shouldBe(10);
			valueOf(view.right).shouldBeUndefined();
			valueOf(view.rect.right).shouldBe(20);
			valueOf(view.width).shouldBe(10);
			valueOf(view.size.width).shouldBe(10);
		}));
		win.open();
	}),
	// functional test case #1014: ViewRight
	viewRight: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			right: 10, width: 10
		});
		win.add(view);
		win.addEventListener("open", this.async(function(e) {
			valueOf(view.right).shouldBe(10);
			valueOf(view.left).shouldBeUndefined();
			valueOf(view.rect.left).shouldBe(win.size.width - 20);
			valueOf(view.rect.right).shouldBe(win.size.width - 10);
			valueOf(view.width).shouldBe(10);
			valueOf(view.size.width).shouldBe(10);
		}));
		win.open();
	}),
	// functional test case #1016: ViewTop
	viewTop: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			top: 10, height: 10
		});
		win.add(view);
		win.addEventListener("open", this.async(function(e) {
			valueOf(view.top).shouldBe(10);
			valueOf(view.bottom).shouldBeUndefined();
			valueOf(view.rect.top).shouldBe(10);
			valueOf(view.rect.bottom).shouldBe(20);
			valueOf(view.height).shouldBe(10);
			valueOf(view.size.height).shouldBe(10);
		}));
		win.open();
	}),
	// functional test case #1018: ViewBottom
	viewBottom: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView({
			bottom: 10, height: 10
		});
		win.add(view);
		win.addEventListener("open", this.async(function(e) {
			valueOf(view.bottom).shouldBe(10);
			valueOf(view.rect.bottom).shouldBe(win.size.height - 10);
			valueOf(view.top).shouldBeUndefined();
			valueOf(view.rect.top).shouldBe(win.size.height - 20);
			valueOf(view.size.height).shouldBe(10);
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
			valueOf(view.rect.center).shouldBeUndefined();
			valueOf(view.left).shouldBeUndefined();
			valueOf(view.right).shouldBeUndefined();
			valueOf(view.top).shouldBeUndefined();
			valueOf(view.bottom).shouldBeUndefined();
			valueOf(view.height).shouldBe(40);
			valueOf(view.width).shouldBe(40);
			valueOf(view.rect.left).shouldBe(view.center.x - 20);
			valueOf(view.rect.right).shouldBe(view.center.x + 20);
			valueOf(view.rect.top).shouldBe(view.center.y - 20);
			valueOf(view.rect.bottom).shouldBe(view.center.y + 20);
			valueOf(view.size.width).shouldBe(40);
			valueOf(view.size.height).shouldBe(40);
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
			valueOf(view.rect.left).shouldBe(Math.floor((win.size.width - view.size.width) / 2));
			valueOf(view.rect.top).shouldBe(Math.floor((win.size.height - view.size.height) / 2));
			valueOf(view.rect.right).shouldBe(view.rect.left + 10);
			valueOf(view.rect.bottom).shouldBe(view.rect.top + 10);
		}));
		win.open();
	}),
	// functional test case #1025: ViewDefault
	viewDefault: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var view = Ti.UI.createView();
		win.add(view);
		win.addEventListener("open", this.async(function(e) {
			valueOf(view.top).shouldBeUndefined();
			valueOf(view.bottom).shouldBeUndefined();
			valueOf(view.left).shouldBeUndefined();
			valueOf(view.right).shouldBeUndefined();
			valueOf(view.center).shouldBeUndefined();
			valueOf(view.zIndex).shouldBeUndefined();
			valueOf(view.padding).shouldBeUndefined();
			valueOf(view.margin).shouldBeUndefined();

			valueOf(view.rect.top).shouldBe((win.size.height - view.size.height) / 2);
			valueOf(view.rect.left).shouldBe((win.size.width - view.size.width) / 2);
			valueOf(win.size.height/view.size.height).shouldBe(1);
			valueOf(win.size.width/view.size.width).shouldBe(1);
		}));
		win.open();
	}),
	// functional test #1025a SizeViewDefault
	sizeViewDefault: asyncTest(function() {
		var win = Ti.UI.createWindow();
		var label1 = Ti.UI.createLabel({
			text: "a",
			font: {
				fontSize: 14,
				fontFamily: "monospace"
			}
		});
		win.add(label1);
		var label2 = Ti.UI.createLabel({
			text: "ab",
			font: {
				fontSize: 14,
				fontFamily: "monospace"
			}
		});
		win.add(label2);
		win.addEventListener("open", this.async(function(e) {
			valueOf(label2.left).shouldBeUndefined();
			valueOf(label2.right).shouldBeUndefined();
			valueOf(label2.top).shouldBeUndefined();
			valueOf(label2.bottom).shouldBeUndefined();
			valueOf(label2.center).shouldBeUndefined();
			valueOf(label2.width).shouldBeUndefined();
			valueOf(label2.height).shouldBeUndefined();
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