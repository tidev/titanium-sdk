describe("Avoid OOM loading res images (lh 2313)",
{
	test_images: function() {
		var win = Ti.UI.createWindow();
		win.open();
		var tv = Ti.UI.createTableView();
		var i = 0;
		win.add(tv);

		var images = [];
		for (i = 0; i < 25; i++) {
			images.push('images/test.png');
		}

		for (i = 0 ; i < 50; i++) {
			var tr = Ti.UI.createTableViewRow();
			tr.add(
				Ti.UI.createImageView({images: images})
			);
			tv.appendRow(tr);
		}
		win.close();
		var x = Ti.Filesystem.createFile('test.txt');
		valueOf(x.exists()).shouldBe(true);
		// If you make it here, you're golden
		valueOf(1).shouldBe(1);
	}
});
