var win = Titanium.UI.currentWindow;

var scanner = Titanium.UI.createView({
	width:260,
	height:200,
	borderColor:'red',
	borderWidth:5,
	borderRadius:15
});

var button = Titanium.UI.createButton({
	color:'#fff',
	backgroundImage:'../images/BUTT_grn_on.png',
	backgroundSelectedImage:'../images/BUTT_grn_off.png',
	backgroundDisabledImage: '../images/BUTT_gry_on.png',
	bottom:10,
	width:301,
	height:57,
	font:{fontSize:20,fontWeight:'bold',fontFamily:'Helvetica Neue'},
	title:'Take Picture'
});

var messageView = Titanium.UI.createView({
	height:30,
	width:250,
	visible:false
});

var indView = Titanium.UI.createView({
	height:30,
	width:250,
	backgroundColor:'#000',
	borderRadius:10,
	opacity:0.7
});
messageView.add(indView);

// message
var message = Titanium.UI.createLabel({
	text:'Picture Taken',
	color:'#fff',
	font:{fontSize:20,fontWeight:'bold',fontFamily:'Helvetica Neue'},
	width:'auto',
	height:'auto'
});
messageView.add(message);

var overlay = Titanium.UI.createView();
overlay.add(scanner);
overlay.add(button);
overlay.add(messageView);

button.addEventListener('click',function()
{
	scanner.borderColor = 'blue';
	Ti.Media.takePicture();
	messageView.animate({visible:true});
	setTimeout(function()
	{
		scanner.borderColor = 'red';
		messageView.animate({visible:false});
	},500);
});


Titanium.Media.showCamera({

	success:function(event)
	{
		Ti.API.debug("picture was taken");
		
		// place our picture into our window
		var imageView = Ti.UI.createImageView({
			image:event.media,
			width:win.width,
			height:win.height
		});
		win.add(imageView);
		
		// programatically hide the camera
		Ti.Media.hideCamera();
	},
	cancel:function()
	{
	},
	error:function(error)
	{
		var a = Titanium.UI.createAlertDialog({title:'Camera'});
		if (error.code == Titanium.Media.NO_CAMERA)
		{
			a.setMessage('Please run this test on device');
		}
		else
		{
			a.setMessage('Unexpected error: ' + error.code);
		}
		a.show();
	},
	overlay:overlay,
	showControls:false,	// don't show system controls
	mediaTypes:Ti.Media.MEDIA_TYPE_PHOTO,
	autohide:false 	// tell the system not to auto-hide and we'll do it ourself
});
