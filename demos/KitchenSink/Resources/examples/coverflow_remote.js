var win = Titanium.UI.currentWindow;

var images = [];
var prefix = 'http://grin.hq.nasa.gov/IMAGES/SMALL/GPN-2000-0000';
var start = 38;
for (var c=0;c<30;c++)
{
	var name = prefix + (start+c) + '.jpg'; 
	images[c]= {image:name, width:225, height:225};
}

// create coverflow view with images
var view = Titanium.UI.iOS.createCoverFlowView({
	images:images,
	backgroundColor:'#000'
});

// click listener - when image is clicked
view.addEventListener('click',function(e)
{
	Titanium.API.info("image clicked: "+e.index+', selected is '+view.selected);	
});

// change listener when active image changes
view.addEventListener('change',function(e)
{
	Titanium.API.info("image changed: "+e.index+', selected is '+view.selected);	
});
win.add(view);

// change button to dynamically change the image
var change = Titanium.UI.createButton({
	title:'Change Image',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
change.addEventListener('click',function()
{
	Titanium.API.info("selected is = "+view.selected);
	view.setImage(view.selected,'../images/imageview/28.jpg');
});

// move scroll view left
var left = Titanium.UI.createButton({
	image:'../images/icon_arrow_left.png'
});
left.addEventListener('click', function(e)
{
	var i = view.selected - 1;
	if (i < 0) 
	{
		i = 0;
	}
	view.selected = i;
});

// move scroll view right
var right = Titanium.UI.createButton({
	image:'../images/icon_arrow_right.png'
});
right.addEventListener('click', function(e)
{
	var i = view.selected + 1;
	if (i >= images.length) 
	{
		i = images.length - 1;
	}
	view.selected = i;
});
var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});
win.setToolbar([flexSpace,left,change,right,flexSpace]);
