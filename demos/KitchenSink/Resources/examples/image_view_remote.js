var win = Titanium.UI.currentWindow;

if (Titanium.Platform.name == 'android') 
{
	// iphone moved to a single image property - android needs to do the same
	var imageView = Titanium.UI.createImageView({
		url:'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png',
		top:20,
		width:100,
		height:100
	});

}
else
{
	var imageView = Titanium.UI.createImageView({
		image:'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png',
		top:20,
		width:100,
		height:100
	});
	
}

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

