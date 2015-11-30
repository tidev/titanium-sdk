function cam_video(_args) {
	container = {};
	container.win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	container.button = Titanium.UI.createButton({
		color:'#fff',
		backgroundImage:'/images/BUTT_grn_on.png',
		backgroundSelectedImage:'/images/BUTT_grn_off.png',
		backgroundDisabledImage: '/images/BUTT_gry_on.png',
		bottom:10,
		width:120,
		height:40,
		font:{fontSize:16,fontWeight:'bold',fontFamily:'Helvetica Neue'},
		title:'Start Video'
	});
	
	container.closebutton = Titanium.UI.createButton({
		color:'#fff',
		backgroundImage:'/images/BUTT_red_on.png',
		backgroundSelectedImage:'/images/BUTT_red_off.png',
		backgroundDisabledImage: '/images/BUTT_gry_on.png',
		top:10,
		width:120,
		height:40,
		font:{fontSize:16,fontWeight:'bold',fontFamily:'Helvetica Neue'},
		title:'Close cameras'
	});

	container.overlay = Titanium.UI.createView();
	container.overlay.add(container.button);
	container.overlay.add(container.closebutton);

	container.cameraFlash = Ti.UI.createButton({
		color:'#fff',
		title:"auto",
		left:20,
		top:20,
		height:40,
		width:80,
		backgroundImage:"/images/BUTT_drk_on.png",
		font:{fontSize:16,fontWeight:'bold',fontFamily:'Helvetica Neue'}
	});
	container.overlay.add(container.cameraFlash);
	
	container.current = Ti.Media.CAMERA_FLASH_AUTO;
	container.cameraFlashModes = Ti.Media.availableCameraFlashModes;
	container.cameraFlash.addEventListener('click',function() {
		if (Ti.Media.cameraFlashMode == Ti.Media.CAMERA_FLASH_AUTO) {
			container.cameraFlash.title = "on";
			Ti.Media.cameraFlashMode = Ti.Media.CAMERA_FLASH_ON;
		} else if (Ti.Media.cameraFlashMode == Ti.Media.CAMERA_FLASH_ON) {
			container.cameraFlash.title = "off";
			Ti.Media.cameraFlashMode = Ti.Media.CAMERA_FLASH_OFF;
		} else {
			container.cameraFlash.title = "auto";
			Ti.Media.cameraFlashMode = Ti.Media.CAMERA_FLASH_AUTO;
		}
	});
	
	container.cameraType = Ti.UI.createButton({
		color:'#fff',
		title:"front",
		top:20,
		right:20,
		height:40,
		width:80,
		backgroundImage:"/images/BUTT_drk_on.png",
		font:{fontSize:16,fontWeight:'bold',fontFamily:'Helvetica Neue'}
	});
	
	container.cameras = Ti.Media.availableCameras;
	for (var c=0;c<container.cameras.length;c++) {
		// if we have a rear camera ... we add switch button
		if (container.cameras[c]==Ti.Media.CAMERA_REAR) {
			container.overlay.add(container.cameraType);
	
			container.cameraType.addEventListener('click',function() {
				if (Ti.Media.camera == Ti.Media.CAMERA_FRONT) {
					container.cameraType.title = "front";
					Ti.Media.switchCamera(Ti.Media.CAMERA_REAR);
				} else {
					container.cameraType.title = "rear";
					Ti.Media.switchCamera(Ti.Media.CAMERA_FRONT);
				}
			});
			break;
		}
	}
	 
	container.button.addEventListener('click',function() {
		Ti.Media.startVideoCapture();
		container.button.title = "Stop Video";
		container.button.backgroundImage = "/images/BUTT_red_on.png";
		container.button.backgroundSelectedImage = '/images/BUTT_red_off.png';
		container.cameraType.visible = false;
		container.cameraFlash.visible = false;
	});
	

	container.closebutton.addEventListener('click',function(){
		Ti.Media.hideCamera();
		container.win.close();
		container = null;
	});

	container.showCamera = function() {
		container.win.removeEventListener('focus',container.showCamera);
		Titanium.Media.showCamera({
		
			success:function(event)
			{
				Ti.API.debug("video was taken");
		
				// programatically hide the camera
				Ti.Media.hideCamera();
		
				var activeMovie = Titanium.Media.createVideoPlayer({
					media:event.media,
					backgroundColor:'#111',
					mediaControlStyle:Titanium.Media.VIDEO_CONTROL_FULLSCREEN,
					scalingMode:Titanium.Media.VIDEO_SCALING_MODE_FILL
				});
				container.win.add(activeMovie);
			},
			cancel:function()
			{
			},
			error:function(error)
			{
				var a = Titanium.UI.createAlertDialog({title:'Camera'});
				if (error.code == Titanium.Media.NO_CAMERA) {
					a.setMessage('Please run this test on device');
				} else {
					a.setMessage('Unexpected error: ' + error.code);
				}
				a.show();
			},
			overlay:container.overlay,
			showControls:false,	// don't show system controls
			mediaTypes:Ti.Media.MEDIA_TYPE_VIDEO,
			videoQuality:Ti.Media.QUALITY_640x480,
			autohide:false // tell the system not to auto-hide and we'll do it ourself
		});		
	};

	container.win.addEventListener('focus', container.showCamera);

	return container.win;
};

module.exports = cam_video;