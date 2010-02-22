var win = Ti.UI.currentWindow;

//
// Login Status
//
var label = Ti.UI.createLabel({
	text:'Logged In = ' + Titanium.Facebook.isLoggedIn(),
	font:{fontSize:14},
	height:'auto',
	top:10,
	textAlign:'center'
});
win.add(label);

// capture
Titanium.Facebook.addEventListener('login', function()
{
	label.text = 'Logged In = ' + Titanium.Facebook.isLoggedIn();
});

//
// Login Button
//
var fbButton = Titanium.Facebook.createLoginButton({
	'style':'wide',
	'apikey':'9494e611f2a93b8d7bfcdfa8cefdaf9f',
	'sessionProxy':'http://api.appcelerator.net/p/fbconnect/',
	top:30
});
win.add(fbButton);

fbButton.addEventListener('login',function()
{
	label.text = 'Logged In = ' + Titanium.Facebook.isLoggedIn();
	Ti.API.info('fbButton login event fired');	
});
fbButton.addEventListener('logout', function()
{
	label.text = 'Logged In = ' + Titanium.Facebook.isLoggedIn();	
	Ti.API.info('fbButton logout event fired');	
});

