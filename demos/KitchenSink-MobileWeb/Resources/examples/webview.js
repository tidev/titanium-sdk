var win = Titanium.UI.currentWindow;
win.backgroundColor = '#fff';

var webView1 = Ti.UI.createWebView({
	height:100,
	width:300,
	top:10,
	left:10,
	backgroundColor:'#336699',
	borderRadius:10,
	html:'<div style="color:#fff">I am a web view with in-line HTML</div>'
});

Ti.UI.currentWindow.add(webView1)

var changeHTML = Ti.UI.createButton({
	title:'Change HTML',
	height:40,
	left:10,
	top:120,
	width:300,
	font:{fontSize:20}
});
Ti.UI.currentWindow.add(changeHTML);
	
changeHTML.addEventListener('click', function(){
	webView1.html = '<div style="color:#fff">Changed</div>';
	setTimeout(function(){alert('HTML in Web View is: ' + webView1.html)},50);
});

var remoteURL = Ti.UI.createButton({
	title:'Remote URL',
	height:40,
	left:10,
	top:170,
	width:300,
	font:{fontSize:20}
});
Ti.UI.currentWindow.add(remoteURL);
	
remoteURL.addEventListener('click', function(){
	var webView2 = Ti.UI.createWebView({
		height:100,
		width:300,
		top:10,
		left:10,
		backgroundColor:'#336699',
		borderRadius:10,
		url:'/examples/window.html'
		
	});
	Ti.UI.currentWindow.add(webView2);

});

var close = Ti.UI.createButton({
	title:'Close',
	height:40,
	top:220,
	left:10,
	width:300,
	font:{fontSize:20}
});
Ti.UI.currentWindow.add(close);
	
close.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});