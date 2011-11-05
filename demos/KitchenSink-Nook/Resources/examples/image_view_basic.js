var win = Titanium.UI.currentWindow;

var imageView = Titanium.UI.createImageView({
	image:'http://developer.appcelerator.com.s3.amazonaws.com/blog/post_images/appc.jpg',
	width:300,
	height:300,
	top:20
});

imageView.addEventListener('load', function()
{
	Ti.API.info('LOAD CALLED');
});
win.add(imageView);

var l = Titanium.UI.createLabel({
	text:'Click Image',
	bottom:30,
	color:'#999',
	height:'auto',
	width:300,
	textAlign:'center',
	font: {
		fontSize:24	
	}
});
win.add(l);

function clicker()
{
	Titanium.UI.createAlertDialog({title:'Image View', message:'You clicked me!'}).show();
	l.text = "Try again. You shouldn't get alert and the image should be different";
	imageView.image = '../images/cloud.png';
	imageView.removeEventListener('click',clicker);
}

imageView.addEventListener('click', clicker);
