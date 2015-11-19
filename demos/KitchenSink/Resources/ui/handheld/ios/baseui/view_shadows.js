function genTest(win) {
    var hasShadow = false;
    var hasBorder = false;

    //The Views
    var parent = Ti.UI.createView({left:10,width:100,height:100,backgroundColor:'red', top:20, borderWidth:0,borderRadius:0,borderColor:'black',viewShadowOffset:{x:0,y:0},viewShadowRadius:5,viewShadowColor:'transparent'});
    var child = Ti.UI.createView({left:50,width:100,height:50,backgroundColor:'green'});
    parent.add(child);
    win.add(parent);
    
    var controlsView = Ti.UI.createScrollView({layout:'vertical'});
    win.add(controlsView);

    //Clip Mode
    var label = Ti.UI.createLabel({top:5,text:'CLIP MODE'});
    controlsView.add(label);
    var tb = Titanium.UI.iOS.createTabbedBar({
        labels:['DISABLED', 'DEFAULT', 'ENABLED'],
        top:5,
        index:1,
        style:Titanium.UI.iPhone.SystemButtonStyle.BAR,
        height:25,
        width:300
    });
    tb.addEventListener('click',function(e){
        parent.clipMode = e.index - 1;
    });
    controlsView.add(tb);

    var b1 = Ti.UI.createButton({title:'TOGGLE SHADOW'});
    var b2 = Ti.UI.createButton({title:'TOGGLE BORDER'});
    var b3 = Ti.UI.createButton({title:'ANIMATE'});

    controlsView.add(b1);
    controlsView.add(b2);
    controlsView.add(b3);

    b1.addEventListener('click',function(e){
        if(hasShadow == true) {
            parent.viewShadowColor = 'transparent';
        } else {
            parent. viewShadowColor = 'blue';
        }
        hasShadow = !hasShadow;
    });

    b2.addEventListener('click',function(e){
        if(hasBorder == true) {
            parent.borderWidth = 0;
            parent.borderRadius = 0;
        } else {
            parent.borderWidth = 1;
            parent.borderRadius = 5;
        }
        hasBorder = !hasBorder;
    });

    b3.addEventListener('click',function(e){
        var t = Ti.UI.create2DMatrix();
        t = t.scale(2,0.5);
        var anim = Ti.UI.createAnimation({left:50,autoreverse:true,duration:1000,transform:t});
        parent.animate(anim);
    });
    
}

function view_shadows(_args) {
	var win = Titanium.UI.createWindow({
		title:'View Clipping',
		backgroundColor: 'white',
		layout:'vertical'
	});
	
	var scrollView = Ti.UI.createScrollView({layout:'vertical'});
	
	var desc = Ti.UI.createLabel({
		text:'This test shows the behavior of the following new properties on iOS.\n\n'+
		'* shadow properties (viewShadowOffset, viewShadowColor, viewShadowRadius)\n\n'+
		'* clipMode\n'+
		'-Setting this to Ti.UI.iOS.CLIP_MODE_ENABLED enforces all child views to be clipped to this views bounds.\n'+
		'-Setting this to Ti.UI.iOS.CLIP_MODE_DISABLED allows child views to be drawn outside the bounds of this view.\n'+
		'-Setting this to Ti.UI.iOS.CLIP_MODE_DEFAULT (or undefined) forces clipping to be defined by the following rules.\n',
		left:10,
    	right:10,
    	font: {fontSize:12}
	});
	
	var desc2 = Ti.UI.createLabel({
		text:'* If the `viewShadowColor` is defined to be a color with alpha > 0, clipping is disabled.\n'+
		'* If the `borderWidth` or `borderRadius` of the view is set to a value > 0, clipping is enabled.\n'+
		'* If the view has one or more `children` clipping is enabled.\n'+
		'* If none of the conditions are met, clipping is disabled.',
		top:5,
		left:10,
		right:10,
		font:{fontSize:10}
	});

	scrollView.add(desc);
	scrollView.add(desc2);
	
	var button = Ti.UI.createButton({
		top:10,
		title:'I understand'
	});
	
	scrollView.add(button);
	
	button.addEventListener('click',function(){
		win.remove(scrollView);
		genTest(win);
	});
	
	win.add(scrollView);

	return win;
};

module.exports = view_shadows;