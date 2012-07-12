var win = Ti.UI.currentWindow;

// this is our second view for the view transition example
// we add it first, so the next one will be initially visible (last on the stack)
var view2 = Ti.UI.createView({
	backgroundColor:'#13386c'
});
win.add(view2);

// this is our main container view
// NOTE: when you want to transition between full-page views, you must
// transition between two full views.   
view = Ti.UI.createView({
	backgroundColor:'#fff'
});
win.add(view);

// initialize container view 
var imageView = Titanium.UI.createView({
	height:75,
	width:75,
	top:110,
	backgroundColor:'red'
});

//
// FULL WINDOW TRANSITON. 
// This is a transition between a full window (not in a tab group) and the current tab group
//
var b1 = Ti.UI.createButton({
	title:'Full Window',
	width:200,
	height:40,
	top:10
});
view.add(b1);

b1.addEventListener('click', function()
{
	var w = Ti.UI.createWindow({
		backgroundColor:'#13386c'
	});

	// create close button for our window
	var b = Ti.UI.createButton({title:'Close',width:200,height:40});
	b.addEventListener('click',function()
	{
		w.close();
	});
	w.add(b);
	
	// open window and transiton with tab group
	w.open({transition:Ti.UI.iPhone.AnimationStyle.CURL_UP});
});

//
// VIEW WITHIN THIS WINDOW
// In this example, we will transition between the current view and a new full screen view
//
var b2 = Ti.UI.createButton({
	title:'Full View',
	width:200,
	height:40,
	top:60
});

view.add(b2);

b2.addEventListener('click', function()
{
	// create close button for our window
	var b = Ti.UI.createButton({title:'Close Me',width:200,height:40});
	b.addEventListener('click',function()
	{
		win.animate({view:view,transition:Ti.UI.iPhone.AnimationStyle.CURL_UP});
	});
	view2.add(b);
	
	// transition to view
	win.animate({view:view2, transition:Ti.UI.iPhone.AnimationStyle.CURL_DOWN});
});
// 
//
// SUB VIEWS
//
var image1 = Titanium.UI.createView({
	backgroundImage:'../images/smallpic1.jpg',
	height:75,
	width:75,
	borderWidth:3,
	borderColor:'#777'
});

var image2 = Titanium.UI.createView({
	backgroundImage:'../images/smallpic2.jpg',
	height:75,
	width:75,
	borderWidth:3,
	borderColor:'#777'
});

var image3 = Titanium.UI.createView({
	backgroundImage:'../images/smallpic3.jpg',
	height:75,
	width:75,
	borderWidth:3,
	borderColor:'#777'
});

image1.addEventListener('click', function()
{
	imageView.animate({view:image2,transition:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT});
});

image2.addEventListener('click', function()
{
	imageView.animate({view:image3,transition:Ti.UI.iPhone.AnimationStyle.CURL_DOWN});
});

image3.addEventListener('click', function()
{
	imageView.animate({view:image1,transition:Ti.UI.iPhone.AnimationStyle.CURL_UP});
});

view.add(imageView);

imageView.add(image1);

//
// CONTROLS
//
var controlView = Titanium.UI.createView({
	height:50,
	width:300,
	top:200
});
view.add(controlView);

var bb1 = Titanium.UI.createButtonBar({
	labels:['One', 'Two', 'Three', 'Four', 'Five'],
	backgroundColor:'maroon',
	style:Titanium.UI.iPhone.SystemButtonStyle.BAR,
	width:'auto',
	height:'auto'
});
var bb2 = Titanium.UI.createButtonBar({
	labels:['Six', 'Seven', 'Eight'],
	backgroundColor:'#336699',
	style:Titanium.UI.iPhone.SystemButtonStyle.BAR,
	width:'auto',
	height:'auto'
});
var bb3 = Titanium.UI.createButtonBar({
	labels:['Nine', 'Ten', 'Eleven', 'Twelve'],
	backgroundColor:'#ff9900',
	style:Titanium.UI.iPhone.SystemButtonStyle.BAR,
	width:'auto',
	height:'auto'
});
bb1.addEventListener('click', function()
{
	controlView.animate({view:bb2,transition:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT});
});
bb2.addEventListener('click', function()
{
	controlView.animate({view:bb3,transition:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT});
});
bb3.addEventListener('click', function()
{
	controlView.animate({view:bb1,transition:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT});
});

controlView.add(bb1);


//
// TOOLBAR
//

var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});
var one = Titanium.UI.createButton({
	title:'One',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
});
var two = Titanium.UI.createButton({
	title:'Two',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
});
var three = Titanium.UI.createButton({
	title:'Three',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
});


var toolbarView = Ti.UI.createView({
	height:45,
	bottom:0
});
view.add(toolbarView);

// create and add toolbar
var toolbar = Titanium.UI.createToolbar({
	items:[flexSpace,one,flexSpace],
	bottom:0,
	borderTop:true,
	borderBottom:true
});
var toolbar2 = Titanium.UI.createToolbar({
	items:[flexSpace,two,flexSpace],
	bottom:0,
	borderTop:true,
	borderBottom:true,
	barColor:'black'
});
var toolbar3 = Titanium.UI.createToolbar({
	items:[flexSpace,three,flexSpace],
	bottom:0,
	borderTop:true,
	borderBottom:true,
	barColor:'maroon'
});


one.addEventListener('click', function()
{
	toolbarView.animate({view:toolbar2,transition:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT});
});
two.addEventListener('click', function()
{
	toolbarView.animate({view:toolbar3,transition:Ti.UI.iPhone.AnimationStyle.CURL_UP});
});
three.addEventListener('click', function()
{
	toolbarView.animate({view:toolbar,transition:Ti.UI.iPhone.AnimationStyle.CURL_DOWN});
});

toolbarView.add(toolbar);


//
// FUN
//
var funView = Titanium.UI.createView({
	height:40,
	width:200,
	borderRadius:10,
	top:260,
	backgroundColor:'#fff'
});
view.add(funView);

// our first view - button
var b = Titanium.UI.createButton({
	title:'Click Me',
	height:40,
	width:200
});

b.addEventListener('click', function()
{
	funView.animate({view:b2, transition:Ti.UI.iPhone.AnimationStyle.CURL_UP});	
});

// view with label (our second view)
var b2 = Titanium.UI.createView({
	height:40,
	width:200,
	borderRadius:10,
	backgroundColor:'red'
});

b2.addEventListener('click', function()
{
	funView.animate({view:b, transition:Ti.UI.iPhone.AnimationStyle.CURL_DOWN});	
});
var bViewLabel = Titanium.UI.createLabel({
	text:'Ouch!',
	color:'#fff',
	width:'auto',
	height:'auto'
});
b2.add(bViewLabel);


funView.add(b);