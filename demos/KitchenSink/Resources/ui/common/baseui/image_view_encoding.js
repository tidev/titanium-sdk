function image_view_encode(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	// this is a remote URL with a UTF-8 character encoded. We should be able
	// to fetch this image OK
	
	var test_img = Titanium.UI.createImageView({
			image: 'http://appcelerator.qe.test.data.s3.amazonaws.com/KSResources/image/' + encodeURIComponent('ΜΟΥΣΙΚΗ') + '/appc_logo200.png'
	
	}); 
	
	win.add(test_img);

	return win;
};

module.exports = image_view_encode;