var tabGroup = Titanium.UI.createTabGroup();

//
// create window 1 and tab 1
//
var uiWin = Titanium.UI.createWindow({  
    url:'ui.js',
    title:'UI',
    barColor:'#336699'
});
var tab1 = Titanium.UI.createTab({  
    icon:'images/KS_nav_phone.png',
    title:'UI',
    badge:null,
    window:uiWin
});

//
// create window 2 and tab 2
//
var win2 = Titanium.UI.createWindow({  
    url:'window2.js',
    title:'foo2',
    barColor:'#090'
});
var tab2 = Titanium.UI.createTab({  
    icon:'images/KS_nav_ui.png',
    title:'UI',
    badge:1,
    window:win2
});


//
// create window 3 and tab 3 (this one is a web view)
//
var win3 = Titanium.UI.createWindow({  
    url:'window3.html',
    title:'foo2',
    barColor:'#900'
});
var tab3 = Titanium.UI.createTab({  
    icon:'images/KS_nav_platform.png',
    title:'Tab 3',
    badge:0,
    window:win3
});

//
//  add tabs
//
tabGroup.addTab(tab1);  
tabGroup.addTab(tab2);  
tabGroup.addTab(tab3);


// var win = Titanium.UI.createWindow({
//  backgroundImage:'images/darkstripes_bg.jpg'
// });

var win = Titanium.UI.createWindow({  
    backgroundColor:'#081d35'
});

var cloud1 = Titanium.UI.createView({  
    backgroundColor:'transparent',
    backgroundImage:'images/cloud.png',
    height:178,
    width:265,
    top:20,
    left:20
});
win.add(cloud1);

var cloud2 = Titanium.UI.createView({  
    backgroundColor:'transparent',
    backgroundImage:'images/cloud.png',
    height:178,
    width:265,
    top:100,
    left:50
});
win.add(cloud2);

var m = Ti.UI.create2DMatrix().scale(0.5);  
var animation = Ti.UI.createAnimation();  
animation.transform = m;  
animation.duration = 0;

var m2 = m.scale(1.5);  
var animation2 = Ti.UI.createAnimation();  
animation2.transform = m2;  
animation2.autoreverse=true;  
animation2.repeat=10;  
animation2.duration = 2000;

cloud1.animate(animation).animate(animation2);


var m3 = Ti.UI.create2DMatrix().scale(0.2);  
var animation3 = Ti.UI.createAnimation();  
animation3.transform = m3;  
animation3.duration = 0;

var m4 = m.scale(1.3);  
var animation4 = Ti.UI.createAnimation();  
animation4.transform = m4;  
animation4.autoreverse=true;  
animation4.repeat=10;  
animation4.duration = 3500;

cloud2.animate(animation3).animate(animation4);

var view3 = Titanium.UI.createView({backgroundColor:'red', height:100, width:100, zIndex:5, top:50,borderRadius:50,borderColor:'red',borderWidth:5, opacity:0.7});  
win.add(view3)  
var dragging = false;  
var point = {x:0,y:0};

view3.addEventListener('touchstart',function(e)  
{
    Ti.API.debug("on touch start");
    if (!dragging)
    {
        dragging = true;
        point = {x:e.x,y:e.y};
        view3.animate({opacity:0.5,backgroundColor:'#0f0'});
    }
});

view3.addEventListener('touchmove',function(e)  
{
    view3.animate({center:{x:e.x,y:e.y}});
});

tabGroup.open();
win.open();

view3.addEventListener('doubletap',function(e)
{
	view3.bgColor = 'navy';
});
