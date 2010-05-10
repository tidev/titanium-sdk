NavController = {};

NavController.mainWindow = Ti.UI.createWindow();

// WINDOWS
NavController.win = Ti.UI.createWindow({title:'Navigation Group',backgroundColor:'#336699'});

// NAV GROUP
NavController.navGroup = Ti.UI.iPhone.createNavigationGroup({
	window:NavController.win
});

NavController.mainWindow.add(NavController.navGroup)

// BUTTON
NavController.button = Ti.UI.createButton({
	title:'Open Window',
	width:300,
	height:50,
	top:100
});
NavController.button.addEventListener('click', function()
{
	var w = Ti.UI.createWindow({
		title:'New Window',
		backgroundColor:'#fff'
	});
	var l = Ti.UI.createLabel({
		textAlign:'center',
		text:'New Window'
	})
	NavController.navGroup.open(w,{animated:true});
});
NavController.win.add(NavController.button);

// CLOSE BUTTON
NavController.closeButton = Ti.UI.createButton({
	title:'Close Nav Group',
	width:300,
	height:50,
	top:170
});
NavController.closeButton.addEventListener('click', function()
{
	NavController.mainWindow.close();
});
NavController.win.add(NavController.closeButton);

NavController.open = function()
{
	Ti.API.info('IN OPEN')
	NavController.mainWindow.open();	
};