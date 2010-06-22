var win = Ti.UI.currentWindow;

if (Titanium.Platform.name == 'android') 
{
	// iphone moved to a single image property - android needs to do the same
	var view = Ti.UI.createImageView({
		url:'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png',
		top:10,
		left:10,
		height:'auto',
		width:'auto'
	});

}
else
{
	var view = Ti.UI.createImageView({
		image:'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png',
		top:10,
		left:10,
		height:'auto',
		width:'auto'
	});
	
}

win.add(view);

var label = Ti.UI.createLabel({
	text:'Image should be at top 10 and left 10',
	height:'auto',
	bottom:20,
	textAlign:'center'
});

win.add(label);