/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "ui_window";
	this.tests = [
		{name: "windowRelativeUrl", timeout:10000},
		{name: "closeEventListenerInOpenEvent", timeout: 10000},
		{name: "borderWidthWindowInTabgroup", timeout: 30000},
		{name: "modalAndExitoncloseTogether", timeout:60000},
		{name: "events_Navigationbar", timeout: 5000},
		{name: "openAndFocusEventOrder", timeout: 5000},
		//{name: "postlyoutEvent", timeout: 5000}, due to TIMOB-15853
		{name: "exposePixelFormat", timeout: 5000},
		{name: "openEventInNavigationalGroup", timeout: 5000},
		{name: "fireCloseEvent", timeout: 5000},
		{name: "openAndFocusOnFirstWindow", timeout: 5000}, 
		{name: "removeChildren", timeout: 10000},
		{name: "parentwindowFocus"},
		{name: "closeEventHW"},
		{name: "openHW"},
		{name: "numberOfFireCloseEvent"},
		{name: "windowPropertyOfTab"},
		{name: "numberOfOpenEventFire"},
		{name: "closeMethodInOpenEvent"},
		//{name: "postLayoutEventInParentView"}, due to TIMOB-15853
		{name: "barimageForNavbar"},
		{name: "openEventOfNormalwindow"}
	];

	//TIMOB-11525
	this.windowRelativeUrl = function(testRun){
		var w = Ti.UI.createWindow({
			url : 'dir/relative.js'
		});
		w.addEventListener("close", function() {
			valueOf(testRun, w.getBackgroundColor()).shouldBe("blue");
			valueOf(testRun, w.getTitle()).shouldBe("relativeWindow");

			finish(testRun);
		});
		w.open();
	}

	//TIMOB-9482
	this.closeEventListenerInOpenEvent = function(testRun){
		var win = Ti.UI.createWindow ();
		var win2 = Ti.UI.createWindow ({
			layout: 'vertical'
		});
		win2.addEventListener ('open', function () {
			win2.title = "win2";
			win2.addEventListener ('close', function () {
				valueOf(testRun, win2.getTitle()).shouldBe("win2");

				finish(testRun);
			});
		});
		setTimeout(function(){
			win2.open();
			setTimeout(function(){
				win2.close();
			},4000);
		},2000);
		win.open();
	}

	//TIMOB-12134
	this.borderWidthWindowInTabgroup = function(testRun){
		var tabGroup = Titanium.UI.createTabGroup();
		var openEvent =false;
		var win1 = Titanium.UI.createWindow({  
			borderWidth : 1,
			borderColor: 'red'
		});
		var tab1 = Titanium.UI.createTab({  
			window:win1
		});
		tabGroup.addTab(tab1); 
		win1.addEventListener("open", function(){
			openEvent = true;
		});
		tabGroup.open();
		setTimeout(function(){
			valueOf(testRun, openEvent).shouldBeTrue();

			finish(testRun);	
		},4000);
	}

	//TIMOB-9462
	this.modalAndExitoncloseTogether = function(testRun){
		var win = Ti.UI.createWindow({
			modal: true,
			exitOnClose: true
		});
		var webview = Titanium.UI.createWebView({url:'http://www.appcelerator.com'});
		win.add(webview);
		win.addEventListener('close', function(){
			finish(testRun);
		});
		setTimeout(function(){
			valueOf(testRun, function(){
				win.close();
			}).shouldNotThrowException();
		},5000);
		win.open();
	}

	//TIMOB-5192 ios
	this.events_Navigationbar = function(testRun){
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			var navGroup = Titanium.UI.iOS.createNavigationWindow();
			var win1 = Titanium.UI.createWindow();
			var win2 = Titanium.UI.createWindow();
			var winOpen = 0;
			var winFocus = 0;
			var winBlur = 0;
			var navWinOpen = 0;
			var navWinClose = 0;
			win1.addEventListener("focus",function(){
				winFocus += 1;
				if(winFocus == 1){
					navGroup.openWindow(win2);
					navGroup.closeWindow(win2);
				}
				else{
					valueOf(testRun, winFocus).shouldBe(2);
					valueOf(testRun, winOpen).shouldBe(1);
					valueOf(testRun, winBlur).shouldBe(1);
					valueOf(testRun, navWinOpen).shouldBe(1);
					valueOf(testRun, navWinClose).shouldBe(1);

					finish(testRun);
				}
			});
			win1.addEventListener("open",function(){
				winOpen += 1;
			});
			win2.addEventListener("close",function(){
				navWinClose += 1;
			});
			win2.addEventListener("open",function(){
				navWinOpen += 1;
			});
			win1.addEventListener("blur",function(){
				winBlur+= 1;
			});
			navGroup.window = win1;
			navGroup.open();
		}
		else {
			finish(testRun);
		}
	}

	//TIMOB-7023 TIMOB-8331
	this.openAndFocusEventOrder = function(testRun){
		var win1 = Titanium.UI.createWindow({  
			navBarHidden:true
		});
		var openevent = false;
		var focusevent = false;
		win1.addEventListener("open", function(e) {
			openevent = true;
			valueOf(testRun,focusevent).shouldBeFalse();
			valueOf(testRun,openevent).shouldBeTrue();
		});
		win1.addEventListener("focus", function(e) {
			focusevent = true;
			valueOf(testRun,focusevent).shouldBeTrue();
			valueOf(testRun,openevent).shouldBeTrue();
			
			finish(testRun);
		});
		win1.open();
	}

	//TIMOB-10005
	this.postlyoutEvent = function(testRun){
		var win = Ti.UI.createWindow({
			layout: 'vertical',
			navBarHidden: true
		});
		var button = Ti.UI.createButton();
		win.add(button);
		var label = Ti.UI.createLabel({
			height: Ti.UI.SIZE, 
			width: Ti.UI.FILL 
		});
		win.add(label);
		var buttonEvent = 0;
		var labelEvent = 0;
		var winEvent = 0;
		button.addEventListener('postlayout', function(e) {
			buttonEvent += 1;
		});
		label.addEventListener('postlayout', function(e) {
			labelEvent += 1;
		});
		win.addEventListener('postlayout', function(e) {
			winEvent += 1;
		});
		setTimeout(function(){
			valueOf(testRun, buttonEvent).shouldBe(1);  
			valueOf(testRun, labelEvent).shouldBe(1);  
			valueOf(testRun, winEvent).shouldBe(1);  
			
			finish(testRun);
		},2000);
		win.open();
	}

	//TIMOB-4104
	this.exposePixelFormat = function(testRun){
		if (Ti.Platform.osname === 'android') {
			var w = Ti.UI.createWindow({
				navBarHidden: false,
				exitOnClose: true,
				backgroundImage: 'gradient.png',
				windowPixelFormat: Ti.UI.Android.PIXEL_FORMAT_RGB_565
			});
			w.addEventListener('focus', function(){
				valueOf(testRun, function(){
					w.windowPixelFormat = Ti.UI.Android.PIXEL_FORMAT_RGB_565;
				}).shouldNotThrowException();
				valueOf(testRun, function(){
					w.setWindowPixelFormat(Ti.UI.Android.PIXEL_FORMAT_RGBA_8888);
				}).shouldNotThrowException();
				
				finish(testRun);
			});
			w.open();
		}
		else {
			finish(testRun);
		}
	} 

	//TIMOB-8027
	this.openEventInNavigationalGroup = function(testRun){
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			var win2 = Titanium.UI.createWindow();
			var f1 = 0; 
			var f2 = 0;
			var win1 = Titanium.UI.iOS.createNavigationWindow({
				window: win2
			});
			var win3 = Titanium.UI.createWindow();
			win2.addEventListener("open", function(){
				f1 += 1;
			});
			win3.addEventListener("open", function(){
				f2 += 1;
			});
			win1.open();
			win1.openWindow(win3, {animated:true});
			setTimeout(function(){
				valueOf(testRun, f1).shouldBe(1);
				valueOf(testRun, f2).shouldBe(1);

				finish(testRun);
			},3000);
		}
		else {
			finish(testRun);
		}
	}
	
	//TIMOB-8314
	this.fireCloseEvent = function(testRun){
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			var win1 = Titanium.UI.createWindow();
			var winFocus = 0;
			var winClose = 0;
			var nav = Titanium.UI.iOS.createNavigationWindow({
				window: win1
			});
			var win2 = Titanium.UI.createWindow();
			win2.addEventListener('focus', function(){
				winFocus += 1;
			});
			win2.addEventListener('close', function(){
				winClose += 1;
			});
			setTimeout(function(){
				valueOf(testRun,winFocus).shouldBe(1);
				valueOf(testRun,winClose).shouldBe(1);
				
				finish(testRun);
			},5000);
			nav.open();
			nav.openWindow(win2);
			nav.closeWindow(win2);
		}
		else {
			finish(testRun);
		}
	}
	
	//TIMOB-9502
	this.openAndFocusOnFirstWindow = function(testRun){
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			var win = Ti.UI.createWindow({
				height: 100,
				width: 100,
				url: '/suites/ui_window/window.js',
				layout: 'vertical'
			});
			var nav = Ti.UI.iOS.createNavigationWindow({
				window: win
			});
			var mainWin = Ti.UI.createWindow();
			var openEvent = 0;
			var focusEvent = 0;
			win.addEventListener('open',function(){
				openEvent += 1;
			});
			win.addEventListener('focus',function(){
				focusEvent += 1;
				valueOf(testRun,openEvent ).shouldBe(1);
				valueOf(testRun,focusEvent ).shouldBe(1);

				finish(testRun);
			});
			mainWin.addEventListener('open', function(){
				nav.open();
			});
			mainWin.open();
		}
		else {
			finish(testRun);
		}
	}

	//TIMOB-9100
	this.removeChildren = function(testRun){
		var win = Ti.UI.createWindow({
			width: 100,
			height: 100
		});
		var view = Ti.UI.createView();
		win.add(view);
		win.addEventListener('focus',function(){
			valueOf(testRun, win.children.length).shouldBe(1);
			valueOf(testRun,function(){
				win.remove(win.children[0]);
			}).shouldNotThrowException();

			finish(testRun);
		});
		win.open();
	}

	//TIMOB-8976 , TIMOB-9262 , TIMOB-9483
	this.parentwindowFocus = function(testRun) {
		var win1 = Titanium.UI.createWindow();
		var firstWinFocusEvent = 0;
		var firstWinBlurEvent = 0;
		var secondWinBlurEvent = 0;
		var secondWinFocusEvent = 0;
		var tabGroup = Titanium.UI.createTabGroup();
		var tab1 = Titanium.UI.createTab({  
			window:win1
		});
		tabGroup.addTab(tab1); 
		win1.addEventListener('focus', function(){
			firstWinFocusEvent += 1;
			if(firstWinFocusEvent == 1){
				win2.open();
				win2.close();
			}
			else{
				valueOf(testRun, firstWinFocusEvent).shouldBe(2);
				valueOf(testRun, secondWinFocusEvent).shouldBe(1);
				valueOf(testRun, firstWinBlurEvent).shouldBe(1);
				valueOf(testRun, secondWinBlurEvent).shouldBe(1);

				finish(testRun);
			}
		});
		win1.addEventListener('blur', function(){
			firstWinBlurEvent += 1;
		}); 
		var win2 = Ti.UI.createWindow();
		win2.addEventListener('focus', function(){
			secondWinFocusEvent += 1;
		});
		win2.addEventListener('blur', function(){
			secondWinBlurEvent +=1;
		}); 
		tabGroup.open();
	}

	//TIMOB-4947
	this.closeEventHW = function(testRun) {
		var win = Ti.UI.createWindow();
		var win2 = Ti.UI.createWindow({
			modal: true,
			backgroundColor: 'red'
		});
		win.addEventListener('open', function(){
			win2.open();
			setTimeout(function(){
				win2.close();
			},1000)
		});
		win2.addEventListener('close', function(){
			
			finish(testRun);
		});
		win.open();
	}

	//TIMOB-4759
	this.openHW = function(testRun){
		var win = Ti.UI.createWindow({
			modal: true,
			layout: 'vertical'
		});
		win.open();
		valueOf(testRun, function(){
			win.open();
		}).shouldNotThrowException();
		
		finish(testRun);
	}

	//TIMOB-1827
	this.numberOfFireCloseEvent = function(testRun) {
		var tabGroup = Titanium.UI.createTabGroup();
		var win1 = Titanium.UI.createWindow();
		var tab1 = Titanium.UI.createTab({  
			window: win1
		});
		tabGroup.addTab(tab1);
		var closecount = 0;
		win1.addEventListener('open', function() {
			var win = Ti.UI.createWindow({
				fullscreen: true,
				layout: 'vertical'
			});
			win.open();
			valueOf(testRun,win.fullscreen).shouldBeTrue();
			valueOf(testRun, win.layout).shouldBe('vertical');
			setTimeout(function(){
				win.close();
			},500);
			win.addEventListener('close', function() {
				closecount += 1;
			});
			setTimeout(function(){
				valueOf(testRun, closecount).shouldBe(1);
				
				finish(testRun);
			},3000)
		}); 
		tabGroup.open();
	}

	//TIMOB-6891
	this.windowPropertyOfTab = function(testRun){
		valueOf(testRun, function(){
			Ti.UI.createTab({window: Ti.UI.createWindow()}).
			window.addEventListener("focus", function(){});
		}).shouldNotThrowException();

		finish(testRun);
	}

	//TIMOB-8030
	this.numberOfOpenEventFire = function(testRun){
		var win = Ti.UI.createWindow({
			top: 10,
			right: 0,
			bottom: 10,
			left: 0,
		});
		var num = 0;
		win.addEventListener('open', function() {
			num += 1;
			valueOf(testRun, win.top).shouldBe(50);
			valueOf(testRun, win.bottom).shouldBe(50);
		});
		setTimeout(function(){
			valueOf(testRun, num).shouldBe(1);
			
			finish(testRun);
		},1000);
		win.top = 50;
		win.bottom = 50;
		win.open({
			top: 50,
			bottom: 50,
			duration: 0
		});
	}

	//TIMOB-9387
	this.closeMethodInOpenEvent = function(testRun){
		var win = Ti.UI.createWindow({  
			exitOnClose: true,
			navBarHidden: false
		});
		win.addEventListener('open', function(){
			valueOf(testRun, win.exitOnClose).shouldBe(1);
			valueOf(testRun, win.navBarHidden).shouldBe(0);
			win.close();
		});
		win.addEventListener('close', function(){
			
			finish(testRun);
		});
		win.open();
	}

	//TIMOB-10136
	this.postLayoutEventInParentView = function(testRun){
		var win = Ti.UI.createWindow({
			layout: 'vertical',
			navBarHidden: true
		});
		var view = Ti.UI.createView({
			width: 200,
			height: 200
		});
		win.add(view);
		var viewEvent = 0;
		var winEvent = 0;
		view.addEventListener('postlayout', function(){
			viewEvent += 1; 
		});
		win.addEventListener('postlayout', function() {
			winEvent += 1;
		});
		setTimeout(function(){
			valueOf(testRun,viewEvent).shouldBe(2);
			valueOf(testRun,winEvent).shouldBe(1);
			
			finish(testRun);
		},3000)
		win.open();
	}

	//TIMOB-5047
	this.barimageForNavbar = function(testRun){
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			var tabGroup = Titanium.UI.createTabGroup();
			var win1 = Titanium.UI.createWindow({  
				height: 100,
				width: 100
			});
			var tab1 = Titanium.UI.createTab({  
				window:win1
			});
			tabGroup.addTab(tab1);  
			tabGroup.addEventListener('focus', function(){
				valueOf(testRun, function(){
					win1.setBarImage('/suites/ui_window/gradient.png');
				}).shouldNotThrowException();
				valueOf(testRun, win1.height).shouldBe(100);
				valueOf(testRun, win1.width).shouldBe(100);
				
				finish(testRun);
			});
			tabGroup.open();
		}
		else {
			finish(testRun);
		}
	}

	//TIMOB-7569
	this.openEventOfNormalwindow = function(testRun){
		var modalwindow = Ti.UI.createWindow({
			backgroundColor:'red',
			modal: true,
		});
		var normalwindowCount = 0;
		var normalwindow = Ti.UI.createWindow();
		var win = Ti.UI.createWindow({
			height: 100,
			width: 100,
			backgroundColor: 'green'
		});
		win.addEventListener('open', function(){
			modalwindow.open();
			normalwindow.open();
			normalwindow.close();
			modalwindow.close();  
		});
		normalwindow.addEventListener('open', function(){
			normalwindowCount += 1;
		});
		setTimeout(function(){
			valueOf(testRun, win.height).shouldBe(100);
			valueOf(testRun,win.width).shouldBe(100);
			valueOf(testRun, normalwindowCount).shouldBe(1);
			
			finish(testRun);
		},3000);
		win.open();
	}
}
