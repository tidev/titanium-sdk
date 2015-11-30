function image_view_position(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	var view = Ti.UI.createImageView({
		image:'http://static.appcelerator.com/images/header/appc_logo.png',
		top:10,
		left:10,
		height:Ti.UI.SIZE,
		width:Ti.UI.SIZE
	});
	
	win.add(view);
	
	var label = Ti.UI.createLabel({
		text:'Image should be at top 10 and left 10',
		height:Ti.UI.SIZE,
		bottom:20,
		textAlign:'center'
	});
	
	win.add(label);
	
	return win;
};

module.exports = image_view_position;