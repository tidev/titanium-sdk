describe("Horizontal/Veritcal Layout tests", {

	horizontalTopBottomUndefinedHeight: asyncTest(function() {
		var win = Ti.UI.createWindow({ backgroundColor: 'white'});
		var parent = Ti.UI.createView({backgroundColor:'red',layout:'horizontal', horizontalWrap: true, width:200, height:300});

		var child1 =Ti.UI.createView({backgroundColor:'green', width: 40, top: 10,bottom:10, height: 50});
		var child2 =Ti.UI.createView({backgroundColor:'blue', left: 5, right:20, top: 20, bottom: 10,width:55});
		var child3 =Ti.UI.createView({backgroundColor:'#eee',height:120,width:50});

		parent.add(child1);
		parent.add(child2);
		parent.add(child3);

		win.addEventListener("open", this.async(function(e) {
			valueOf(child1.rect.height).shouldBe(50);
			valueOf(child1.rect.width).shouldBe(40);
			valueOf(child1.rect.y).shouldBe(10);
			valueOf(child1.rect.x).shouldBe(0);

			valueOf(child2.rect.height).shouldBe(270);
			valueOf(child2.rect.width).shouldBe(55);
			valueOf(child2.rect.y).shouldBe(20);
			valueOf(child2.rect.x).shouldBe(45);

			valueOf(child3.rect.height).shouldBe(120);
			valueOf(child3.rect.width).shouldBe(50);
			valueOf(child3.rect.y).shouldBe(90);
			valueOf(child3.rect.x).shouldBe(120);
		}));

		win.add(parent);
		win.open();
	}),
	horizontalLeftRightUndefinedWidth: asyncTest(function() {
		var win = Ti.UI.createWindow({ backgroundColor: 'white'});
		var parent = Ti.UI.createView({backgroundColor:'red',layout:'horizontal', horizontalWrap: true, width:200, height:300});

		var child1 =Ti.UI.createView({backgroundColor:'green', left: 10, right:10, height: 50});
		var child2 =Ti.UI.createView({backgroundColor:'blue', left: 5, right:20, height: 90,width:55});
		var child3 =Ti.UI.createView({backgroundColor:'#eee',left: 5,height:120,width:50});

		parent.add(child1);
		parent.add(child2);
		parent.add(child3);

		win.addEventListener("open", this.async(function(e) {
			valueOf(child1.rect.height).shouldBe(50);
			valueOf(child1.rect.width).shouldBe(180);
			valueOf(child1.rect.y).shouldBe(0);
			valueOf(child1.rect.x).shouldBe(10);

			valueOf(child2.rect.height).shouldBe(90);
			valueOf(child2.rect.width).shouldBe(55);
			// ((120 - 90) / 2) + 50
			// child3 determines the maximum height of that row, so we have to calculate accordingly. 
			// We have to add 50 since the previous row just fills and this is in the second row
			valueOf(child2.rect.y).shouldBe(65);
			valueOf(child2.rect.x).shouldBe(5);

			valueOf(child3.rect.height).shouldBe(120);
			valueOf(child3.rect.width).shouldBe(50);
			valueOf(child3.rect.y).shouldBe(50);
			valueOf(child3.rect.x).shouldBe(85);
		}));

		win.add(parent);
		win.open();
	}),
	horizontalLeftRightUndefinedWidthNoWrap: asyncTest(function() {
		var win = Ti.UI.createWindow({ backgroundColor: 'white'});
		var parent = Ti.UI.createView({backgroundColor:'red',layout:'horizontal', horizontalWrap: false, width:200, height:300});

		var child1 =Ti.UI.createView({backgroundColor:'green', left: 10, right:10, height: 50});
		var child2 =Ti.UI.createView({backgroundColor:'blue', left: 5, right:20, height: 90,width:55});
		var child3 =Ti.UI.createView({backgroundColor:'#eee',left: 5,height:120,width:50});

		parent.add(child1);
		parent.add(child2);
		parent.add(child3);

		win.addEventListener("open", this.async(function(e) {
			valueOf(child1.rect.height).shouldBe(50);
			valueOf(child1.rect.width).shouldBe(180);
			// (300-50)/2
			valueOf(child1.rect.y).shouldBe(125);
			valueOf(child1.rect.x).shouldBe(10);

			valueOf(child2.rect.height).shouldBe(90);
			valueOf(child2.rect.width).shouldBe(55);
			valueOf(child2.rect.y).shouldBe(105);
			valueOf(child2.rect.x).shouldBe(205);

			valueOf(child3.rect.height).shouldBe(120);
			valueOf(child3.rect.width).shouldBe(50);
			valueOf(child3.rect.y).shouldBe(90);
			valueOf(child3.rect.x).shouldBe(285);
		}));
		win.add(parent);
		win.open();
	}),
	
	horizontalTopBottomUndefinedHeightNoWrap: asyncTest(function() {
		var win = Ti.UI.createWindow({ backgroundColor: 'white'});
		var parent = Ti.UI.createView({backgroundColor:'red',layout:'horizontal', horizontalWrap: false, width:200, height:300});

		var child1 =Ti.UI.createView({backgroundColor:'green', width: 40, top: 10,bottom:10, height: 50});
		var child2 =Ti.UI.createView({backgroundColor:'blue', left: 5, right:20, top: 20, bottom: 10,width:55});
		var child3 =Ti.UI.createView({backgroundColor:'#eee',height:120,width:50});

		parent.add(child1);
		parent.add(child2);
		parent.add(child3);

		win.addEventListener("open", this.async(function(e) {
			valueOf(child1.rect.height).shouldBe(50);
			valueOf(child1.rect.width).shouldBe(40);
			valueOf(child1.rect.y).shouldBe(10);
			valueOf(child1.rect.x).shouldBe(0);

			valueOf(child2.rect.height).shouldBe(270);
			valueOf(child2.rect.width).shouldBe(55);
			valueOf(child2.rect.y).shouldBe(20);
			valueOf(child2.rect.x).shouldBe(45);

			valueOf(child3.rect.height).shouldBe(120);
			valueOf(child3.rect.width).shouldBe(50);
			valueOf(child3.rect.y).shouldBe(90);
			valueOf(child3.rect.x).shouldBe(120);
		}));

		win.add(parent);
		win.open();
	})

})