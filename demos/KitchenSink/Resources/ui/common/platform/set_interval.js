function set_interval(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var label = Ti.UI.createLabel({
		text:'Running...',
		font:{fontFamily:'Helvetica Neue',fontSize:24,fontWeight:'bold'},
		color:'#999',
		textAlign:'center',
		width:Ti.UI.SIZE,
		height:Ti.UI.SIZE
	});
	win.add(label);
	var count = 0;
	setInterval(function()
	{
		count++;
		label.text = "Interval fired " + count;
	},10);

	return win;
};

module.exports = set_interval;