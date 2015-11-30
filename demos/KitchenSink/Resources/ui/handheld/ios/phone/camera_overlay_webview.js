function cam_overlay_web(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var overlay = Titanium.UI.createView();
	
	var html = '<html><body>';
	html += '<div id="button" style="background-color:green;height:80px;width:150px;color:white;text-align:center;line-height:80px;">Take Photo</div>';
	html += '<div id="closebutton" style="background-color:red;height:80px;width:150px;color:white;text-align:center;line-height:80px;left:170px;top:-80px;position:relative;">Close Camera</div>';
	html += '<script>document.getElementById("button").onclick= function(){Ti.App.fireEvent("camera_button")}</script>';
	html += '<script>document.getElementById("closebutton").onclick= function(){Ti.App.fireEvent("camera_closebutton")}</script>';
	html += '</body></html>';
	
	var webview = Ti.UI.createWebView({
		bottom:10,
		height:80,
		width:320,
		backgroundColor:'transparent',
		html:html
	});
	overlay.add(webview);
	
	function onCameraButton() {
		Ti.Media.takePicture();
	}

	function onCameraCloseButton() {
		Ti.Media.hideCamera();
		// Avoid memory leaks, remove these global events:
		Ti.App.removeEventListener('camera_button', onCameraButton);
		Ti.App.removeEventListener('camera_closebutton', onCameraCloseButton);
		win.close();
	}

	Ti.App.addEventListener('camera_button', onCameraButton);
	Ti.App.addEventListener('camera_closebutton', onCameraCloseButton);
	
	function showCamera() {
		win.removeEventListener('focus', showCamera);
		Titanium.Media.showCamera({
			success:function(event) {
				Ti.API.debug("picture was taken");
				
				// place our picture into our window
				var imageView = Ti.UI.createImageView({image:event.media});
				win.add(imageView);
				
				// programatically hide the camera
				Ti.Media.hideCamera();
			},
			cancel:function() {
			},
			error:function(error) {
				var a = Titanium.UI.createAlertDialog({title:'Camera'});
				if (error.code == Titanium.Media.NO_CAMERA) {
					a.setMessage('Please run this test on device');
				} else {
					a.setMessage('Unexpected error: ' + error.code);
				}
				a.show();
			},
			overlay:overlay,
			showControls:false,	// don't show system controls
			mediaTypes:Ti.Media.MEDIA_TYPE_PHOTO,
			autohide:false // tell the system not to auto-hide and we'll do it ourself
		});
	};
	
	win.addEventListener('focus', showCamera);
	
	return win;
};

module.exports = cam_overlay_web;