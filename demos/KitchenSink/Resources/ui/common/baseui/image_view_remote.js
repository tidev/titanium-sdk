function image_view_remote(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var imageView = Titanium.UI.createImageView({
		image:'http://static.appcelerator.com/images/header/appc_logo.png',
		defaultImage:'/images/cloud.png',
		top:20,
		width:100,
		height:100
	});
		
	win.add(imageView);
	
	var l = Titanium.UI.createLabel({
		text:'This is a remote image URL',
		bottom:30,
		color:'#999',
		height:20,
		width:300,
		textAlign:'center'
	});
	win.add(l);
	
	var imageView2 = Titanium.UI.createImageView({
		defaultImage:'/images/cloud.png',
		top:140,
		width:100,
		height:100
	});
	win.add(imageView2);
	
	var b = Titanium.UI.createButton({
		title : 'Assign remote image url',
		top : 260,
		height : 50,
		width : Ti.UI.SIZE
	});
	win.add(b);
	b.addEventListener('click', function(e) {
			imageView2.image = 'http://static.appcelerator.com/images/header/appc_logo.png';
	});
	return win;
};

module.exports = image_view_remote;
