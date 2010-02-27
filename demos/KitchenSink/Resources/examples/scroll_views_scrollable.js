var win = Titanium.UI.currentWindow;
win.backgroundColor = 'black';

var view1 = Ti.UI.createView({
	backgroundColor:'red'
});
var l1 = Ti.UI.createLabel({
	text:'View 1',
	color:'#fff',
	width:'auto',
	height:'auto'
});
view1.add(l1);

var view2 = Ti.UI.createView({
	backgroundColor:'blue'
});
var l2 = Ti.UI.createLabel({
	text:'View 2',
	color:'#fff',
	width:'auto',
	height:'auto'
});
view2.add(l2);

var view3 = Ti.UI.createView({
	backgroundColor:'green'
});
var l3 = Ti.UI.createLabel({
	text:'View 3',
	color:'#fff',
	width:'auto',
	height:'auto'
});
view3.add(l3);

var view4 = Ti.UI.createView({
	backgroundColor:'black'
});
var l4 = Ti.UI.createLabel({
	text:'View 4',
	color:'#fff',
	width:'auto',
	height:'auto'
});
view4.add(l4);


var scrollView = Titanium.UI.createScrollableView({
	views:[view1,view2,view3,view4],
	showPagingControl:true,
	pagingControlHeight:30,
	maxZoomScale:2.0
});

win.add(scrollView);

var i=0;
var activeView = view1;

scrollView.addEventListener('scroll', function(e)
{
    activeView = e.view  // the object handle to the view that is about to become visible
	i = e.currentPage;
	Titanium.API.info("scroll called - current index " + i + ' active view ' + activeView);
});


// add button to dynamically add a view
var add = Titanium.UI.createButton({
	title:'Add',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
add.addEventListener('click',function()
{
	var newView = Ti.UI.createView({
		backgroundColor:'purple'
	});
	var l = Ti.UI.createLabel({
		text:'View ' + (scrollView.views.length+1),
		color:'#fff',
		width:'auto',
		height:'auto'
	});
	newView.add(l);
	scrollView.addView(newView);
});

// jump button to dynamically change go directly to a page (non-animated)
var jump = Titanium.UI.createButton({
	title:'Jump',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
jump.addEventListener('click',function()
{
	i = (scrollView.currentPage + 1) % scrollView.views.length;
	scrollView.currentPage = i;
});

// change button to dynamically change a view
var change = Titanium.UI.createButton({
	title:'Change',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
change.addEventListener('click',function()
{
	var newView = Ti.UI.createView({
		backgroundColor:'#ff9900'
	});
	var l = Ti.UI.createLabel({
		text:'View (Changed) ' + (i+1),
		color:'#fff',
		height:'auto',
		width:'auto'
	});
	newView.add(l);
	var ar = [];
	for (var x=0;x<scrollView.views.length;x++)
	{
		if (x==i)
		{
			Ti.API.info('SETTING TO NEW VIEW ' + x)
			ar[x] = newView
		}
		else
		{
			Ti.API.info('SETTING TO OLD VIEW ' + x)

			ar[x] = scrollView.views[x];
		}
	}
	scrollView.views = ar;
});

// move scroll view left
var left = Titanium.UI.createButton({
	image:'../images/icon_arrow_left.png'
});
left.addEventListener('click', function(e)
{
	if (i == 0) return;
	i--;
	scrollView.scrollToView(i)
});

// move scroll view right
var right = Titanium.UI.createButton({
	image:'../images/icon_arrow_right.png'
});
right.addEventListener('click', function(e)
{
	if (i == (scrollView.views.length-1)) return;
	i++;
	scrollView.scrollToView(scrollView.views[i]);
});
var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});

// set toolbar
win.setToolbar([flexSpace,left,change,add,jump,right,flexSpace]);
