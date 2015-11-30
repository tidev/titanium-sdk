function image_view_basic(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var imageView = Titanium.UI.createImageView({
		image:'http://static.appcelerator.com/images/header/appc_logo.png',
		width:261,
		height:178,
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
		height:Ti.UI.SIZE,
		width:300,
		textAlign:'center'
	});
	win.add(l);
	
	function clicker()
	{
		Titanium.UI.createAlertDialog({title:'Image View', message:'You clicked me!'}).show();
		l.text = "Try again. You shouldn't get alert and the image should be different";
		imageView.image = '/images/cloud.png';
		imageView.removeEventListener('click',clicker);
	}
	
	imageView.addEventListener('click', clicker);

	return win;
};

module.exports = image_view_basic;