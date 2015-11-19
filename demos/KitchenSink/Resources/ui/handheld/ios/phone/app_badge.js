function app_badge(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	win.addEventListener('open', function()
	{
		Ti.App.iOS.registerUserNotificationSettings({
			types: [Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE]
		});
	});
	
	var b1 = Titanium.UI.createButton({
		title:'Set App Badge',
		width:200,
		height:40,
		top:10
	});
	b1.addEventListener('click', function()
	{
		Titanium.UI.iPhone.appBadge = 20;
	});
	
	win.add(b1);
	
	var b2 = Titanium.UI.createButton({
		title:'Reset App Badge',
		width:200,
		height:40,
		top:60
	});
	b2.addEventListener('click', function()
	{
		Titanium.UI.iPhone.appBadge = null;
	});
	
	win.add(b2);
	
	return win;
};

module.exports = app_badge;