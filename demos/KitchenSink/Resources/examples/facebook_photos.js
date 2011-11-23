/*globals Titanium, Ti, alert, require, setTimeout, setInterval, JSON*/
var win = Ti.UI.currentWindow;
Titanium.Facebook.appid = "134793934930";
Titanium.Facebook.permissions = ['publish_stream', 'read_stream'];

var B1_TITLE = "Upload Photo from Gallery with Graph API";
var B2_TITLE = "Upload Photo from file with REST API";

var b1 = Ti.UI.createButton({
	title:B1_TITLE,
	left: 10, right: 10, top: 0, height: 40
});

var b2 = Ti.UI.createButton({
	title: B2_TITLE,
	left: 10, right: 10, top: 50, height: 40
});

function showRequestResult(e) {
	var s = '';
	if (e.success) {
		s = "SUCCESS";
		if (e.result) {
			s += "; " + e.result;
		}
	} else {
		s = "FAIL";
		if (e.error) {
			s += "; " + e.error;
		}
	}
	b1.title = B1_TITLE;
	b2.title = B2_TITLE;
	alert(s);
}

var login = Titanium.Facebook.createLoginButton({
	top: 10
});
if(Titanium.Platform.name == 'iPhone OS')
{
	login.style = Ti.Facebook.BUTTON_STYLE_WIDE;
}
else
{
	login.style ='wide';
}
win.add(login);

var actionsView = Ti.UI.createView({
	top: 55, left: 0, right: 0, visible: Titanium.Facebook.loggedIn, height: 'auto'
});
actionsView.add(b1);
actionsView.add(b2);

Titanium.Facebook.addEventListener('login', function(e) {
	if (e.success) {
		actionsView.show();
	}
	if (e.error) {
		alert(e.error);
	}
});

Titanium.Facebook.addEventListener('logout', function(e){
	Ti.API.info('logout event');
	actionsView.hide();
});

b1.addEventListener('click', function() {
	Titanium.Media.openPhotoGallery({
		success:function(event)
		{
			b1.title = 'Uploading Photo...';
			var data = {picture: event.media};
			Titanium.Facebook.requestWithGraphPath('me/photos', data, "POST", showRequestResult);
		},
		cancel:function()
		{
		},
		error:function(error)
		{
		},
		allowEditing:true
	});
});

b2.addEventListener('click', function() {
	b2.title = 'Uploading Photo...';
	var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'images', 'flower.jpg');
	var blob = f.read();
	var data = {
		caption: 'behold, a flower',
		picture: blob
	};
	Titanium.Facebook.request('photos.upload', data, showRequestResult);
});

win.add(actionsView);
