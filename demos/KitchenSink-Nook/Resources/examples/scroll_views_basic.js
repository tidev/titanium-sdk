var win = Titanium.UI.currentWindow;

var scrollView = Titanium.UI.createScrollView({
	contentWidth:'auto',
	contentHeight:'auto',
	top:0,
	showVerticalScrollIndicator:true,
	showHorizontalScrollIndicator:true
});


var view = Ti.UI.createView({
	backgroundColor:'#336699',
	borderRadius:10,
	width:300,
	height:2000,
	top:10
});

scrollView.add(view);

var button = Titanium.UI.createButton({
	title:'Scroll to Top',
	height:40,
	width:200,
	bottom:10
});
view.add(button);
button.addEventListener('click', function()
{
	scrollView.scrollTo(0,0);
});

var button2 = Titanium.UI.createButton({
	title:'Add to Scroll View',
	height:40,
	width:200,
	top:20
});
scrollView.add(button2);
button2.addEventListener('click', function()
{
	var view = Ti.UI.createView({
		backgroundColor:'red',
		borderRadius:10,
		width:300,
		height:300,
		top:2020
	});
	scrollView.add(view);

});

win.add(scrollView);


