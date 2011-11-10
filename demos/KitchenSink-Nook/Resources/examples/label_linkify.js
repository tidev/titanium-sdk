// NOOK Color supports only email and URL links. If you attempt map or 
// phone number links and click on them, your app will likely fail.

// TODO: Currently NOOK Color provides no way to get back to your app 
//       if you click an email link. 

var win = Ti.UI.currentWindow;
win.backgroundColor = 'white';
var defaultText = ' Email: test@test.com\n\n URL: http://bit.ly';

var l = Ti.UI.createLabel({
	autoLink : Ti.UI.Android.LINKIFY_ALL,
	left : 5, top : 5, right : 5, height : 300,
	backgroundColor : '#222',
	text : defaultText,
	font: {
		fontSize: 20	
	}
});
win.add(l);

var btnAll = Ti.UI.createButton({
	title : 'All', width: 150, height: 40,
	top : 310
});
btnAll.addEventListener('click', function(e) {
	l.autoLink = Ti.UI.Android.LINKIFY_ALL;
});
win.add(btnAll);

var btnEmail = Ti.UI.createButton({
	title : 'Email Addresses', width: 150, height: 40,
	top : 355
});
btnEmail.addEventListener('click', function(e) {
	l.autoLink = Ti.UI.Android.LINKIFY_EMAIL_ADDRESSES;
});
win.add(btnEmail);

var btnWeb = Ti.UI.createButton({
	title : 'Web URLs', width: 150, height: 40,
	top : 400
});
btnWeb.addEventListener('click', function(e) {
	l.autoLink = Ti.UI.Android.LINKIFY_WEB_URLS;
});
win.add(btnWeb);

var ta = Ti.UI.createTextArea({
	left : 5, top : 445, right : 5, bottom : 5,
	value: defaultText 
});
ta.addEventListener('return', function(e) {
	l.text = e.value;
});
win.add(ta);
