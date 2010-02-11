var win = Titanium.UI.currentWindow;


Ti.Facebook.addEventListener('login',function()
{
	Ti.API.debug("facebook login = "+JSON.stringify(Ti.Facebook.permissions));
	Ti.API.debug("facebook session = "+JSON.stringify(Ti.Facebook.session));
	
	Titanium.Facebook.query("SELECT uid, name, pic_square, status FROM user where uid IN (SELECT uid2 FROM friend WHERE uid1 = " + Titanium.Facebook.getUserId() + ") order by last_name",function(r)
	{
		Ti.API.debug("Facebook execute returned: " + JSON.stringify(r));
	});
});

var fbbutton = Titanium.Facebook.createLoginButton({
	'style':'wide',
	'apikey':'9494e611f2a93b8d7bfcdfa8cefdaf9f',
	'secret':'a65766d631c8e6f73f0fafc84b9885bc',
	'xsessionProxy':'http://api.appcelerator.net/p/fbconnect/'
});

fbbutton.addEventListener('login',function(e)
{
	Ti.API.debug("facebook login = "+Ti.Facebook.permissions);
});
fbbutton.addEventListener('logout',function(e)
{
	Ti.API.debug("facebook logout");
});
fbbutton.addEventListener('cancel',function(e)
{
	Ti.API.debug("facebook cancel");
});

win.add(fbbutton);
