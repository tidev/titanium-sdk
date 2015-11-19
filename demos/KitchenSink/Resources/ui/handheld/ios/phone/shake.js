function shake(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var l = Titanium.UI.createLabel({
		text:'Shake your phone',
		top:10,
		color:'#999',
		height:Ti.UI.SIZE,
		width:Ti.UI.SIZE
	});
	
	win.add(l);
	
	Ti.Gesture.addEventListener('shake',function(e)
	{
		Titanium.UI.createAlertDialog({title:'Shake',message:'it worked!'}).show();
	});
	return win;
};

module.exports = shake;