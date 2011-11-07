var win = Titanium.UI.currentWindow;

var imageView = Titanium.UI.createImageView({
	image:'http://developer.appcelerator.com.s3.amazonaws.com/blog/post_images/appc.jpg',
	defaultImage:'../images/cloud.png',
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
	defaultImage:'../images/cloud.png',
	top:140,
	width:100,
	height:100
});
win.add(imageView2);

var b = Titanium.UI.createButton({
	title : 'Assign remote image url',
	top : 260,
	height : 50,
	width : "auto"
});
win.add(b);
b.addEventListener('click', function(e) {
		imageView2.image = 'http://developer.appcelerator.com.s3.amazonaws.com/blog/post_images/appc.jpg';
});

