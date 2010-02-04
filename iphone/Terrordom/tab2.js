Ti.API.debug("inside tab2.js - starting");

var view = Ti.UI.createView({backgroundColor:'blue',left:0,top:0,width:320,height:480});
var square = Ti.UI.createView({backgroundColor:'red',top:150,left:20,height:40,width:40});
view.add(square);
Ti.UI.currentWindow.add(view);

//tab.openWindow(window, {animated:true,title:"jeff"});

var dragging = false;
var point = {x:0,y:0};

Ti.API.debug("inside tab2.js - before add touch start event handler");

square.addEventListener('touchstart',function(e)
{
	Ti.API.debug("on touch start");
	if (!dragging)
	{
		dragging = true;
		point = {x:e.x,y:e.y};
		square.animate({opacity:0.5,backgroundColor:'#0f0'},{duration:0.1});
	}
});

Ti.API.debug("inside tab2.js - after add touch start event handler");

square.addEventListener('touchmove',function(e)
{
	Ti.API.debug("on touch move - x="+e.x+",y="+e.y);
	square.animate({center:{x:e.x,y:e.y}},{duration:0.1});
});

square.addEventListener('touchend',function(e)
{
	Ti.API.debug("on touch end");
	if (dragging)
	{
		dragging = false;
		square.animate({center:{x:point.x,y:point.y},opacity:0.7,backgroundColor:'#006'},
					   {repeat:3,autoreverse:true,delay:200,curve:Ti.UI.ANIMATION_CURVE_EASE_OUT,duration:700},
					   function()
					   {
							square.animate({center:{x:e.x,y:e.y},opacity:1,backgroundColor:'#f00'},{curve:Ti.UI.ANIMATION_CURVE_EASE_IN,duration:500});
					   }
		);
	}
});


Ti.API.debug("inside tab2.js - exiting");
