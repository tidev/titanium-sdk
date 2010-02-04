
/*
var titleBtn = Ti.UI.createButton({title:'Squish Tab View',top:90,left:10,height:30,width:100});
titleBtn.addEventListener('click',function()
{
	tabGroup.animate({width:200,height:200,opacity:0.5},{duration:200,curve:Ti.UI.ANIMATION_CURVE_EASE_IN_OUT},function()
	{
		tabGroup.animate({width:320,height:480,opacity:1,curve:Ti.UI.ANIMATION_CURVE_EASE_OUT},
								{duration:50});
	});
});
*/

var view1 = Ti.UI.createView({backgroundColor:'red'});
var view2 = Ti.UI.createView({backgroundColor:'black'});

var clouds = Ti.UI.createView({backgroundImage:'images/cloud.png',width:261,height:178,top:10});
view1.add(clouds);

view1.add(Ti.UI.createLabel({text:'Click anywhere to animate',height:20,top:100,textAlignment:'center',font:{fontFamily:'Georgia',fontWeight:'normal',fontSize:18}}));
view2.add(Ti.UI.createLabel({text:'Click anywhere to animate again',height:20,top:100,textAlignment:Ti.UI.TEXT_ALIGNMENT_CENTER,color:'white'}));

view1.addEventListener('touchstart',function()
{
	/*
	Ti.UI.currentWindow.showView(view2,{
		animated:true,
		animationStyle: Ti.UI.iPhone.AnimationStyle.CURL_UP
	});*/
	
	var animation = Ti.UI.createAnimation();
	animation.transition = Ti.UI.iPhone.AnimationStyle.CURL_UP;
	animation.opacity = 0.8;
	animation.addEventListener('complete',function()
	{
		view2.opacity = 1.0;
	});

	Ti.UI.currentWindow.showView(view2,animation);

});

view2.addEventListener('touchstart',function()
{
	Ti.UI.currentWindow.showView(view1,{
		animated:true,
		animationStyle: Ti.UI.iPhone.AnimationStyle.CURL_DOWN
	});
});

Ti.UI.currentWindow.addView(view1);
Ti.UI.currentWindow.addView(view2);

Ti.UI.currentWindow.showView(view1);


// create a modal view

var v = Ti.UI.createView({width:220, height:150, borderRadius:10, backgroundColor:'#999', opaque:true});
var w = Ti.UI.createWindow({width:320,height:480,top:0,left:0,right:0,bottom:0, backgroundColor:'black',opacity:0.8});
w.add(v);
w.open();


var t = Ti.UI.createLabel({text:'Modal Window Example',top:50, height:30,textAlignment:'center',font:{ fontFamily:'helvetica neue', fontSize:'18px', fontWeight: 'bold'}});
v.add(t);
var b = Ti.UI.createButton({title:'Close',width:80,height:36,bottom:20});
v.add(b);
b.addEventListener('click',function()
{
	w.close();
	var x = Ti.UI.createDialog({width:200,height:150,backgroundColor:'purple',top:0,opacity:0});
	x.open({modal:true});
	var xt = Ti.UI.createLabel({text:'Modal dialog example',textAlignment:'center', top:25});
	var xb = Ti.UI.createButton({title:'Close',width:80,height:36,bottom:50});
	xb.addEventListener('click',function()
	{
		x.close({top:0,opacity:0},{duration:350,curve:Ti.UI.ANIMATION_CURVE_EASE_IN});
	});
	x.add(xt);
	x.add(xb);
	x.animate({top:200,opacity:1},{duration:500,curve:Ti.UI.ANIMATION_CURVE_EASE_IN_OUT});
});


// create a modeless dialog that points to another URL

var d = Ti.UI.createDialog({height:40,bottom:40,backgroundColor:'red',url:'dialog.js'});
d.open({modal:false});


Ti.API.info(">>>>>>>>>>> LOADED TAB1");
