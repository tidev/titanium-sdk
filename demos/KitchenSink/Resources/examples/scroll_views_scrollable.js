var win = Titanium.UI.currentWindow;

var view1 = Ti.UI.createView({
	backgroundColor:'red'
});
var l1 = Ti.UI.createLabel({
	text:'View 1',
	color:'#fff'
});
view1.add(l1);

var view2 = Ti.UI.createView({
	backgroundColor:'blue'
});
var l2 = Ti.UI.createLabel({
	text:'View 2',
	color:'#fff'
});
view2.add(l2);

var view3 = Ti.UI.createView({
	backgroundColor:'green'
});
var l3 = Ti.UI.createLabel({
	text:'View 3',
	color:'#fff'
});
view3.add(l3);

var view4 = Ti.UI.createView({
	backgroundColor:'black'
});
var l4 = Ti.UI.createLabel({
	text:'View 4',
	color:'#fff',
});
view4.add(l4);


var scrollView = Titanium.UI.createScrollableView({
	views:[view1,view2,view3,view4],
	showPagingControl:true,
	pageControlHeight:30
});

win.add(scrollView);

var i =0;
var activeView = view1;

scrollView.addEventListener('scroll', function(e)
{
	Ti.API.info('IN SCROLL...');
    var activeView = e.view  // the object handle to the view that is about to become visible
	var i = e.currentPage;
	Titanium.API.info("scroll called - current index " + i + ' active view ' + activeView);
});


// change button to dynamically change the image
var change = Titanium.UI.createButton({
	title:'Change View',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
change.addEventListener('click',function()
{
	
});

// move scroll view left
var left = Titanium.UI.createButton({
	image:'../images/icon_arrow_left.png'
});
left.addEventListener('click', function(e)
{
	if (i == 0) return;
	
	i--;		
	activeView = (i==0)?view1:view2;
	
	// change view using index
	scrollView.scrollToView(i)
});

// move scroll view right
var right = Titanium.UI.createButton({
	image:'../images/icon_arrow_right.png'
});
right.addEventListener('click', function(e)
{
	if (i == 2) return;

	i++;
	activeView = (i==2)?view4:view3;
	
	// change view using instance var
	switch(i)
	{
		case 1:
		{
			scrollView.scrollToView(view3);
			break;
		}
		case 2:
		{
			scrollView.scrollToView(view4);
			break;
		}
	}
	
});
var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});
win.setToolbar([flexSpace,left,change,right,flexSpace]);
