	//
	//  When you open windows outside of tab groups, they are appear on top of either
	//  the current window or the current tab group.  These examples show you different ways
	//  to open windows outside of tab groups.
	//
function win_standalone(_args) {
	var isMobileWeb = Ti.Platform.osname === 'mobileweb',
		isTizen = Ti.Platform.osname === 'tizen',
		isAndroid = Ti.Platform.osname === 'android',
		isIOS = (Ti.Platform.osname == 'iphone' || Ti.Platform.osname == 'ipad');
		win = Titanium.UI.createWindow({
			title:_args.title
		});
	
	win.orientationModes = [
		Titanium.UI.PORTRAIT,
		Titanium.UI.LANDSCAPE_LEFT,
		Titanium.UI.LANDSCAPE_RIGHT
	];
	win.addEventListener('focus', function()
	{
		Ti.API.info('FOCUSED EVENT RECEIVED');
	});

	Ti.include("/etc/version.js");
	var isIOS7 = isiOS7Plus();
	
	//
	//  OPEN WINDOW OUTSIDE OF TAB GROUP
	//
	var b1 = Titanium.UI.createButton({
		title:'Open (Plain)',
		width:200,
		height:40,
		top:10
	});
	
	b1.addEventListener('click', function()
	{
	
		var w = Titanium.UI.createWindow({
			backgroundColor:'#336699'
		});
	
		// create a button to close window
		var b = Titanium.UI.createButton({
			title:'Close',
			height:Ti.UI.SIZE,
			width:150
		});
		w.add(b);
		b.addEventListener('click', function()
		{
			w.close();
		});
	
		w.open();
	});

	if (!isMobileWeb) {
		//
		//  OPEN (ANIMATE FROM BOTTOM RIGHT)
		//
		var b2 = null;
		if (isAndroid && Ti.version < "3.3.0") {
			var b2 = Titanium.UI.createButton({
				title: 'Open (Nav Bar Covered)',
				width: 200,
				height: 40,
				top: 60
			});
		}
		//
		//  TRADITIONAL MODAL (FROM 0.8.x)
		//
		var b3 = Titanium.UI.createButton({
			title: 'Traditional Modal',
			width: 200,
			height: 40,
			top: 110
		});
		b3.addEventListener('click', function() {
			var Win = require('ui/common/phone/vibrate'),
				w = new Win({title: 'Modal Window'}),
				b = Titanium.UI.createButton( {title: 'Close'} );

			isTizen || (b.style = Titanium.UI.iPhone.SystemButtonStyle.PLAIN);
			w.title = 'Modal Window';
			w.barColor = 'black';
			w.add(b);
			b.addEventListener('click',function() {
				w.close();
			});
			w.open({ modal: true });
		});
		if (isTizen) {
			b2.addEventListener('click', function()
			{
				var t = Titanium.UI.create2DMatrix().scale(0),
					options = {
						height: Titanium.Platform.displayCaps.platformHeight,
						width: Titanium.Platform.displayCaps.platformWidth,
						backgroundColor: '#336699',
						transform: t
					},
					t1 = Titanium.UI.create2DMatrix().scale(1),
					w = Titanium.UI.createWindow(options),
					a = Titanium.UI.createAnimation();
			
				a.transform = t1;
				a.duration = 300;
			
				// create a button to close window
				var b = Titanium.UI.createButton({
					title: 'Close',
					height: 30,
					width: 150
				});
				w.add(b);
				b.addEventListener('click', function()
				{
					a.transform = t;
					a.addEventListener('complete', function(){
						w.close();
					});
					w.animate(a);
				});

				w.addEventListener('postlayout', function(){
					w.animate(a);
				});

				w.open();
			});
		} else if (b2 != null) {
			b2.addEventListener('click', function() {
				var options = {
					backgroundColor: '#336699',
					bottom: 0,
					right: 0
				};
				if (Ti.Platform.name === 'android') {
					options.navBarHidden = true;
				} else {
					options.height = 0;
					options.width = 0;
				}
				var w = Titanium.UI.createWindow(options);
				var a = Titanium.UI.createAnimation();

				// NOTE: good example of making dynamic platform height / width values
				// iPad vs. iPhone vs Android etc.
				if (isIOS) {
					a.height = Ti.UI.FILL;
					a.width = Ti.UI.FILL;
				} else {
					a.height = Titanium.Platform.displayCaps.platformHeight;
					a.width = Titanium.Platform.displayCaps.platformWidth;
				}
				a.duration = 300;

				// create a button to close window
				var b = Titanium.UI.createButton({
					title: 'Close',
					height: 30,
					width: 150
				});
				w.add(b);
				b.addEventListener('click', function() {
					a.height = 0;
					a.width = 0;
					w.close(a);
				});

				w.open(a);
			});
		}
	}
	//
	//  OPEN (WITH ANIMATED WOBBLE)
	//
	var b4 = Titanium.UI.createButton({
		title:'Open (Animation Fun)',
		width:200,
		height:40,
		top:160
	});
	
	b4.addEventListener('click', function()
	{
		var t = Titanium.UI.create2DMatrix();
		t = t.scale(0);
	
		var w = Titanium.UI.createWindow({
			backgroundColor:'#336699',
			borderWidth:8,
			borderColor:'#999',
			height:400,
			width:300,
			borderRadius:10,
			opacity:0.92,
			transform:t
		});
	
		// create first transform to go beyond normal size
		var t1 = Titanium.UI.create2DMatrix();
		t1 = t1.scale(1.1);
		var a = Titanium.UI.createAnimation();
		a.transform = t1;
		a.duration = 200;
	
		// when this animation completes, scale to normal size
		a.addEventListener('complete', function()
		{
			Titanium.API.info('here in complete');
			var t2 = Titanium.UI.create2DMatrix();
			t2 = t2.scale(1.0);
			w.animate({transform:t2, duration:200});
	
		});
	
		// create a button to close window
		var b = Titanium.UI.createButton({
			title:'Close',
			height:30,
			width:150
		});
		w.add(b);
		b.addEventListener('click', function()
		{
			var t3 = Titanium.UI.create2DMatrix();
			t3 = t3.scale(0);
			w.close({transform:t3,duration:300});
		});
	
		w.open(a);
	
	
	});
	
	//
	// OPEN (ANIMATE FROM BOTTOM)
	//
	var b5 = Titanium.UI.createButton({
		title:'Open (Nav Bar Visible)',
		width:200,
		height:40,
		top:210
	});
	
	b5.addEventListener('click', function()
	{
		var w = Titanium.UI.createWindow({
			top:Ti.Platform.displayCaps.platformHeight,
			backgroundColor:'#000',
		});
	
		// create window open animation
		var a = Titanium.UI.createAnimation();
		
		if (isIOS7) {
			a.top = Ti.Platform.displayCaps.platformHeight - win.size.height;
		} else {
			a.top = Ti.Platform.displayCaps.platformHeight - win.size.height - 20;
		}
		a.duration = 300;
	
		// create a button to close window
		var b = Titanium.UI.createButton({
			title:'Close',
			height:30,
			width:150
		});
		w.add(b);
		b.addEventListener('click', function()
		{
			a.top=Ti.Platform.displayCaps.platformHeight,
			w.close(a);
		});
		
		
		
		function nav_back_handler(e){
			w.close();
		}
		
		function gestureHandler(e) {
			if (isIOS7) {
				w.top = Ti.Platform.displayCaps.platformHeight - win.size.height;
			} else {
				w.top = Ti.Platform.displayCaps.platformHeight - win.size.height - 20;
			}
		}
		
		Ti.Gesture.addEventListener('orientationchange', gestureHandler);
		Ti.App.addEventListener('nav_back', nav_back_handler);
		w.addEventListener('close',function(e){
			Ti.Gesture.removeEventListener('orientationchange', gestureHandler);
			Ti.App.removeEventListener('nav_back', nav_back_handler);
		});
	
		w.open(a);
	});
	
	
	//
	//  OPEN (FULLSCREEN)
	//
	var b6 = Titanium.UI.createButton({
		title:'Open (Fullscreen)',
		width:200,
		height:40,
		top:260
	});
	
	b6.addEventListener('click', function()
	{
		var w = Titanium.UI.createWindow({
			title: 'New Window (Fullscreen)',
			backgroundColor:'#336699'
		});
	
		// create a button to close window
		var b = Titanium.UI.createButton({
			title:'Close',
			height:Ti.UI.SIZE,
			width:150
		});
		w.add(b);
		b.addEventListener('click', function()
		{
			w.close();
		});
	
		w.open({fullscreen:true});
	});
	
	
	//
	//  OPEN (CUSTOM TOOLBAR)
	//
	var b7 = Titanium.UI.createButton({
		title:'Open (Toolbar)',
		width:200,
		height:40,
		top:310
	});
	
	b7.addEventListener('click', function()
	{
		var label = Titanium.UI.createButton({
			title:'Custom Toolbar',
			color:'#fff',
			style:Titanium.UI.iPhone.SystemButtonStyle.PLAIN
		});
	
		var flexSpace = Titanium.UI.createButton({
			systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
		});
		var close = Titanium.UI.createButton({
			title:'Close',
			style:Titanium.UI.iPhone.SystemButtonStyle.DONE
		});
		var hello = Titanium.UI.createButton({
			title:'Hello',
			style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
		});
	
	
		var w = Titanium.UI.createWindow({
			backgroundColor:'#336699'
		});
		close.addEventListener('click', function()
		{
			Ti.API.info('IN HERE');
			w.close();
		});
		
		if(isIOS7) {
			theTop = 20;
		} else {
			theTop = 0;
		}
		
		// create and add toolbar
		var toolbar = Titanium.UI.iOS.createToolbar({
			items:[hello,flexSpace,label, flexSpace,close],
			top:theTop,
			borderTop:false,
			borderBottom:true
		});
		w.add(toolbar);
	
		var move = Titanium.UI.createButton({
			title:'Move Toolbar',
			height:40,
			width:200
		});
		w.add(move);
	
		move.addEventListener('click', function()
		{
			if(isIOS7) {
				toolbar.animate({top:40,duration:500});
			} else {
				toolbar.animate({top:20,duration:500});
			}
		});
	
		w.open();
	});
	
	
	
	//
	// ODD SHAPED WINDOWS
	//
	var t = Titanium.UI.create2DMatrix();
	t= t.rotate(-90);
	var menuWin = Titanium.UI.createWindow({
		backgroundImage:'/images/menubox.png',
		height:178,
		width:204,
		top:32,
		right:40,
		anchorPoint:{x:1,y:0},
		transform:t,
		opacity:0
	});
	
	var t2 = Titanium.UI.create2DMatrix();
	
	var navButton = Titanium.UI.createButton({
		title:'Toggle Window'
	});
	var visible = false;
	navButton.addEventListener('click', function()
	{
		if (!visible)
		{
			menuWin.open();
			menuWin.animate({transform:t2,opacity:1,duration:800});
			visible=true;
			win.addEventListener('close', function() {
				menuWin.close();
			});
		}
		else
		{
			var t = Titanium.UI.create2DMatrix();
			t= t.rotate(-90);
			menuWin.animate({transform:t,opacity:0,duration:800}, function()
			{
				menuWin.close();
			});
			visible=false;
		}
	});
	
	
	win.add(b1);
	if (!isMobileWeb) {
		win.add(b2);
		win.add(b3);
	}
	win.add(b6);
	
	if (Titanium.Platform.name == 'iPhone OS')
	{
		win.setRightNavButton(navButton);
		win.add(b7);
		win.add(b4);
		win.add(b5);
		var flexSpace = Titanium.UI.createButton({
			systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
		});
	
	
		var b8 = Titanium.UI.createButton({
			title:'Open Tab Animation',
			style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
		});
	
		var b9 = Titanium.UI.createButton({
			title:'Open Tab w/o Animation',
			style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
		});
	
		b8.addEventListener('click', function()
		{
			var w = Ti.UI.createWindow({backgroundColor:"red"});
			var b = Ti.UI.createButton({
				title:"Close with Animation",
				width:180,
				height:40
			});
			_args.containingTab.open(w);
			w.add(b);
			b.addEventListener('click',function()
			{
				w.close({animated:true});
			});
		});
	
		b9.addEventListener('click', function()
		{
			var w = Ti.UI.createWindow({backgroundColor:"red"});
			var b = Ti.UI.createButton({
				title:"Close w/o Animation",
				width:180,
				height:40
			});
			_args.containingTab.open(w,{animated:false});
			w.add(b);
			b.addEventListener('click',function()
			{
				w.close({animated:false});
			});
		});
	
		win.setToolbar([flexSpace,b8,flexSpace,b9,flexSpace],{translucent:true});
		
		win.addEventListener('close',function(e){
			Ti.App.fireEvent('nav_back',{});
		});
	}
	else
	{
		navButton.top = 310;
		navButton.width = 200;
		navButton.height = 40;
	//	win.add(navButton);
	}
	
	return win;
};

module.exports = win_standalone;
