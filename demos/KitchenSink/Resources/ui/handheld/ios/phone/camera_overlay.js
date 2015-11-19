function cam_overlay(_args) {
	container ={};
	container.win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	container.scanner = Titanium.UI.createView({
		width:260,
		height:200,
		borderColor:'red',
		borderWidth:5,
		borderRadius:15
	});
	
	container.button = Titanium.UI.createButton({
		color:'#fff',
		backgroundImage:'/images/BUTT_grn_on.png',
		backgroundSelectedImage:'/images/BUTT_grn_off.png',
		backgroundDisabledImage: '/images/BUTT_gry_on.png',
		bottom:10,
		width:301,
		height:57,
		font:{fontSize:20,fontWeight:'bold',fontFamily:'Helvetica Neue'},
		title:'Take Picture'
	});
	
	container.closebutton = Titanium.UI.createButton({
		color:'#fff',
		backgroundImage:'/images/BUTT_red_on.png',
		backgroundSelectedImage:'/images/BUTT_red_off.png',
		backgroundDisabledImage: '/images/BUTT_gry_on.png',
		top:10,
		width:301,
		height:57,
		font:{fontSize:20,fontWeight:'bold',fontFamily:'Helvetica Neue'},
		title:'Close Camera'
	});

	container.messageView = Titanium.UI.createView({
		height:30,
		width:250,
		visible:false
	});
	
	container.indView = Titanium.UI.createView({
		height:30,
		width:250,
		backgroundColor:'#000',
		borderRadius:10,
		opacity:0.7
	});
	container.messageView.add(container.indView);
	
	// message
	container.message = Titanium.UI.createLabel({
		text:'Picture Taken',
		color:'#fff',
		font:{fontSize:20,fontWeight:'bold',fontFamily:'Helvetica Neue'},
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE
	});
	container.messageView.add(container.message);
	
	container.overlay = Titanium.UI.createView();
	container.overlay.add(container.scanner);
	container.overlay.add(container.button);
	container.overlay.add(container.messageView);
	container.overlay.add(container.closebutton);
	
	container.button.addEventListener('click',function() {
		container.scanner.borderColor = 'blue';
		Ti.Media.takePicture();
		container.messageView.animate({visible:true});
		setTimeout(function()
		{
			container.scanner.borderColor = 'red';
			container.messageView.animate({visible:false});
		},500);
	});
	
	
	container.closebutton.addEventListener('click',function() {
		Ti.Media.hideCamera();
		alert("Camera closed");
		container.win.close();
	});
	
	container.showCamera = function() {
		container.win.removeEventListener('focus', container.showCamera);
		Titanium.Media.showCamera({		
			success:function(event) {
				Ti.API.debug("picture was taken");
				
				// place our picture into our window
				var imageView = Ti.UI.createImageView({
					image:event.media,
					width:container.win.width,
					height:container.win.height
				});
				container.win.add(imageView);
				
				// programatically hide the camera
				Ti.Media.hideCamera();
			},
			cancel:function() {
			},
			error:function(error) {
				var a = Titanium.UI.createAlertDialog({title:'Camera'});
				if (error.code == Titanium.Media.NO_CAMERA)
				{
					a.setMessage('Please run this test on device');
				} else {
					a.setMessage('Unexpected error: ' + error.code);
				}
				a.show();
			},
			overlay:container.overlay,
			showControls:false,	// don't show system controls
			mediaTypes:Ti.Media.MEDIA_TYPE_PHOTO,
			autohide:false // tell the system not to auto-hide and we'll do it ourself
		});
	};
	
	container.win.addEventListener('focus', container.showCamera);
	return container.win;
};

module.exports = cam_overlay;