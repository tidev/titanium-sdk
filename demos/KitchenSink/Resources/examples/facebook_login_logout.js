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


//
// API Login
// 
var login = Ti.UI.createButton({
	title:'Login to Facebook',
	width:200,
	height:40,
	top:40
});

login.addEventListener('click', function()
{
	Titanium.Facebook.login()
});
win.add(login);

//
// API Logout
// 
var logout = Ti.UI.createButton({
	title:'Logout from Facebook',
	width:200,
	height:40,
	top:90
});

logout.addEventListener('click', function()
{
	Titanium.Facebook.logout()
});
win.add(logout);


//
// Login Button
//
var fbButton = Titanium.Facebook.createLoginButton({
	'style':'wide',
	'apikey':'9494e611f2a93b8d7bfcdfa8cefdaf9f',
	'sessionProxy':'http://api.appcelerator.net/p/fbconnect/',
	top:140
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

