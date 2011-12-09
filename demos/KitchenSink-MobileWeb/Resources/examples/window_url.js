var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:10,
	left:10,
	font:{fontSize:20},
	backgroundColor:"#fff"
});
Ti.UI.currentWindow.add(closeButton);

closeButton.addEventListener('click', function()
{
	Ti.UI.currentWindow.close();
});