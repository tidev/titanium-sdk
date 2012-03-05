win = Ti.UI.currentWindow;
win.backgroundColor = '#EEE';

var scrollView = Ti.UI.createScrollView({
left: 10,
top: 10,
width: 300,
height: 280,
focusable: true,
showVerticalScrollIndicator: true,
showHorizontalScrollIndicator: true,
backgroundColor: '#EEC',
contentHeight: 1000,
contentWidth: 1000,
borderColor: 'blue',
borderWidth: 3
});

win.add(scrollView);

var disableVert = Ti.UI.createButton({
	left: 10,
	top: 5,
	title: 'Hide vertical scroll indicator',
	width: 280,
	height: 50,
	fontSize: 16
});

var disableHor = Ti.UI.createButton({
	left: 10,
	top: 60,
	title: 'Hide horizontal scroll indicator',
	width: 280,
	height: 50,
	fontSize: 16
});
var scrollButton = Ti.UI.createButton({
	left: 10,
	top: 115,
	title: 'Move to position',
	width: 280,
	height: 50,
	fontSize: 16
});
var scrollBegin = Ti.UI.createButton({
	left: 800,
	top: 800,
	title: 'Scroll to top',
	width: 100,
	height: 100,
	fontSize: 16
});
var closeButton = Ti.UI.createButton({
	left: 10,
	top: 170,
	title: 'Close Window',
	width: 280,
	height: 50,
	fontSize: 16
})


scrollView.add(closeButton);
scrollView.add(disableHor);
scrollView.add(disableVert);
scrollView.add(scrollBegin);
scrollView.add(scrollButton);

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});


disableVert.addEventListener('click',function(){
	if (scrollView.showVerticalScrollIndicator == true){
	scrollView.showVerticalScrollIndicator = false;
	disableVert.title = 'Show vertical scroll indicator';}
	else
	{
	scrollView.showVerticalScrollIndicator = true;
	disableVert.title = 'Hide vertical scroll indicator';}
});

disableHor.addEventListener('click',function(){
	if (scrollView.showHorizontalScrollIndicator == true){
	scrollView.showHorizontalScrollIndicator = false;
	disableHor.title = 'Show horizontal scroll indicator';}
	else
	{
	scrollView.showHorizontalScrollIndicator = true;
	disableHor.title = 'Hide horizontal scroll indicator';}
});


scrollButton.addEventListener('click',function(){
	scrollView.scrollTo(700,700);
});

scrollBegin.addEventListener('click',function(){
	scrollView.scrollTo(0,0);
	
});

