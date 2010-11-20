var win = Ti.UI.currentWindow;

var webView = Ti.UI.createWebView({
	url:'webview_repaint_source.html',
	height:'auto'

});

win.add(webView);


var bb1 = Titanium.UI.createButtonBar({
	labels:['+', '-'],
	backgroundColor:'#336699',
	style:Titanium.UI.iPhone.SystemButtonStyle.BAR
});

win.rightNavButton = bb1;

var size = 15;
bb1.addEventListener('click', function(e)
{
	if (e.index == 0)
	{
		size +=5;
		Ti.App.fireEvent('fontchange', {amount:size});
		webView.repaint();
	}
	else
	{
		size -=5;
		Ti.App.fireEvent('fontchange', {amount:size});
		webView.repaint();
	}
});