var v = Ti.UI.createView({backgroundImage:'images/cloud.png'});
var w = Ti.UI.createWindow({backgroundColor:'black'});
var b = Ti.UI.createButton({title:'Close',width:100,height:50,zIndex:1});
w.add(v);
w.add(b);

var v2 = Ti.UI.createView({backgroundImage:'images/JEFF_trio1.png'});
var w2 = Ti.UI.createWindow({backgroundColor:'black'});
w2.add(v2);
//w2.open({animated:true,animationStyle:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT});
w2.open();
//w.open({animated:true,animationStyle:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT});
w.open();

var animation = Ti.UI.createAnimation();
animation.transition = Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT;

b.addEventListener('click',function()
{
	w.close({animated:true,animationStyle:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT});
});


/*
var tg = Ti.UI.createTabGroup();
var tab1 = Titanium.UI.createTab({  
    icon:'images/KS_nav_phone.png',
    title:'UI',
    badge:null,
    window:w
});
var tab2 = Titanium.UI.createTab({  
    icon:'images/KS_nav_phone.png',
    title:'UI',
    badge:null
});
var w2 = Ti.UI.createWindow();
tab2.openWindow(w2);
tg.addTab(tab1);
tg.addTab(tab2);
tg.open({animated:true,animationStyle:Ti.UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT});
*/