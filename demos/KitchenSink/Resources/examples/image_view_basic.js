var win = Titanium.UI.currentWindow;

if (Titanium.Platform.name == 'android') {
	// iphone moved to a single image property - android needs to do the same
	var imageView = Titanium.UI.createImageView({
		url:'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png',
		width:261,
		height:178,
		top:20
	});

}
else
{
	var imageView = Titanium.UI.createImageView({
		image:'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png',
		width:261,
		height:178,
		top:20
	});
	
}

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
	textAlign:'center'
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