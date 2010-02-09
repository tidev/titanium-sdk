// use a closure to (a) test it and (b) not expose this into global scope
(function()
{
	// window container
	var welcomeWindow = Titanium.UI.createWindow({
		height:80,
		width:200
	});

	// black view
	var indView = Titanium.UI.createView({
		height:80,
		width:200,
		backgroundColor:'#000',
		borderRadius:10,
		opacity:0.8
	});
	welcomeWindow.add(indView);

	// message
	var message = Titanium.UI.createLabel({
		text:'Appcelerator Titanium '+Titanium.version,
		color:'#fff',
		textAlign:'center',
		font:{fontSize:18,fontWeight:'bold'},
		xbottom:20
	});
	welcomeWindow.add(message);
	welcomeWindow.open();
	
	var t = Ti.UI.create2DMatrix().translate(-200,200).scale(0);
	welcomeWindow.animate({transform:t,delay:1000,duration:1400,opacity:0.1},function()
	{
		welcomeWindow.close();
	});
})();

