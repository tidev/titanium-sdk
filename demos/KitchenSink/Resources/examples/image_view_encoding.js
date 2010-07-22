var win = Ti.UI.currentWindow;

// this is a remote URL with a UTF-8 character encoded. We should be able
// to fetch this image OK

var test_img = Titanium.UI.createImageView({
	image:'http://www.zoomout.gr/assets/media/PICTURES/ΜΟΥΣΙΚΗ/651_thumb1.jpg'
}); 

win.add(test_img);

