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
	
	this.name = "ui_tabgroup";
	this.tests = [
		{name: "tabgroup", timeout: 10000},
		{name: "changeTitle", timeout: 10000},
		{name: "getActiveTab", timeout: 10000},
		{name: "tabGroupEvents"},
		{name: "tabGroupFocus"}, 
		{name: "activeTab"},
		{name: "removeEventListener"},
		{name: "source_Name"},
		{name: "openingAndClosingNewTab"},
		{name: "tabGroup_Open"}
	];

	//TIMOB-12134
	this.tabgroup = function(testRun){
		var mywin = Titanium.UI.createWindow({
			backgroundColor:'white',
			borderWidth : 0 
		});
		var tabGroup = Ti.UI.createTabGroup();
		var tab = Titanium.UI.createTab({
			window:mywin
		});
		tabGroup.addTab(tab);
		mywin.addEventListener('focus', function(){
			finish(testRun);
		});
		tabGroup.open();
	}

	//TIMOB-6144
	this.changeTitle = function(testRun){
		var win1 = Ti.UI.createWindow();
		var tab1 = Ti.UI.createTab({  
			title: 'PRODUCTS',
			window: win1
		});
		valueOf(testRun, tab1.getTitle()).shouldBe('PRODUCTS');
		win1.addEventListener('focus', function(e) {
			tab1.title = "changeTitle";
			setTimeout(function(){
				valueOf(testRun, tab1.getTitle()).shouldBe('changeTitle');

				finish(testRun);
			},3000);
		});
		var tabGroup = Ti.UI.createTabGroup();
		tabGroup.addTab(tab1);
		tabGroup.open();
	}

	//TIMOB-9444
	this.getActiveTab = function(testRun){
		var tabGroup = Ti.UI.createTabGroup();
		var win1 = Ti.UI.createWindow ({
			title: "Win 1",
			layout: "vertical"
		});
		var tab1 = Ti.UI.createTab({  
			window: win1
		});
		var win2 = Ti.UI.createWindow ({
			title: "Win 2"
		});
		tabGroup.addTab(tab1);  
		tabGroup.open();
		setTimeout(function(){
			tabGroup.getActiveTab().open(win2);
			tabGroup.close(win2);
			var t = tabGroup.getActiveTab().getWindow ().title;
			valueOf(testRun, t).shouldBe('Win 1');

			finish(testRun);
		},3000);
	}

	//TIMOB-9436, TIMOB-8910, TIMOB-7926, TIMOB-3139
	this.tabGroupEvents = function(testRun){
		var tabGroup = Ti.UI.createTabGroup();
		var win1 = Ti.UI.createWindow();
		var tab1 = Ti.UI.createTab({
			window:win1
		});
		var win2 = Ti.UI.createWindow();
		var tab2 = Ti.UI.createTab({
			window:win2
		});
		tabGroup.addTab(tab1);
		tabGroup.addTab(tab2);
		var tabfocus = 0;
		var tab1focus = 0;
		var tab2focus =0
		var win1focus = 0;
		var win2focus = 0;
		var tab1blur =0;
		var tab2blur=0;
		var win1blur =0;
		var win2blur=0;
		tabGroup.addEventListener('focus', function(){
			tabfocus +=1;
		});
		tab1.addEventListener('focus', function(){
			tab1focus +=1;
		});
		tab2.addEventListener('focus', function(){
			tab2focus +=1;
		});
		win1.addEventListener('focus', function(){
			win1focus +=1;
		});
		win2.addEventListener('focus', function(){
			win2focus +=1;
		});
		tab1.addEventListener('blur', function(){
			tab1blur +=1;
		});
		tab2.addEventListener('blur', function(){
			tab2blur +=1;
		});
		win1.addEventListener('blur', function(){
			win1blur +=1;
		});
		win2.addEventListener('blur', function(e){
			win2blur +=1;
		});
		setTimeout(function(){
			tabGroup.setActiveTab(tab2);
			tabGroup.setActiveTab(tab1);
			setTimeout(function(){
				valueOf(testRun, tab1focus).shouldBe(2);
				valueOf(testRun, win1focus).shouldBe(2);
				valueOf(testRun, win2focus).shouldBe(1);
				valueOf(testRun, tab1blur).shouldBe(1);
				valueOf(testRun, tab2focus).shouldBe(1);
				valueOf(testRun, tab2blur).shouldBe(1);
				valueOf(testRun, win1blur).shouldBe(1);
				valueOf(testRun, win2blur).shouldBe(1);

				finish(testRun);
			},3000)
		},2000);
		tabGroup.open();
	}

	//TIMOB-10946
	this.tabGroupFocus = function(testRun){
		var win1 = Ti.UI.createWindow();
		var tab1 = Ti.UI.createTab({  
			window: win1
		});
		var win2 = Ti.UI.createWindow();
		var tab2 = Ti.UI.createTab({ 
			window: win2
		});
		var tabGroup = Ti.UI.createTabGroup();
		var tabgroupFocus = 0;          
		tabGroup.addTab(tab1);
		tabGroup.addTab(tab2);
		tabGroup.setActiveTab(tab1);
		setTimeout(function(){
			tabGroup.setActiveTab(tab2);
		},1000);
		tabGroup.addEventListener('focus', function() {
			tabgroupFocus += 1;
			if(tabgroupFocus == 2){
				finish(testRun);
			}
		});
		tabGroup.open();
	}

	//TIMOB-10916
	this.activeTab = function(testRun){
		var win1 = Ti.UI.createWindow();
		var tab1 = Ti.UI.createTab({  
			window: win1
		});
		var win2 = Ti.UI.createWindow();
		var tab2 = Ti.UI.createTab({  
			window: win2
		});
		var tabGroup = Ti.UI.createTabGroup();
		tabGroup.addTab(tab1);
		tabGroup.addTab(tab2);
		tabGroup.open();
		setTimeout(function(){
			valueOf(testRun,tabGroup.activeTab).shouldBeObject();

			finish(testRun);
		},2000);
	}

	//TIMOB-8048
	this.removeEventListener = function(testRun){
		var tabGroup = Ti.UI.createTabGroup();
		var win1 = Ti.UI.createWindow();
		var tab1 = Ti.UI.createTab({  
			window: win1
		});
		var win2 = Ti.UI.createWindow();
		var tab2 = Ti.UI.createTab({ 
			window: win2
		});
		tabGroup.addTab(tab1);
		tabGroup.addTab(tab2);
		var focusEvent = 0;
		var onFocus = function ()
		{
			focusEvent += 1;
		}
		win1.addEventListener('focus', onFocus);
		setTimeout(function(){
			win1.removeEventListener ('focus', onFocus);
			tabGroup.setActiveTab(tab2);
			tabGroup.setActiveTab(tab1);
			setTimeout(function(){
				valueOf(testRun,focusEvent).shouldBe(1);

				finish(testRun);
			}, 3000)
		},1000)
		tabGroup.open();
	}

	//TIMOB-9811
	this.source_Name = function(testRun){
		var tabGroup = Ti.UI.createTabGroup({
			name: "tabgroup"
		});
		var win1 = Ti.UI.createWindow({
			name: "win 1"
		});
		var tab1 = Ti.UI.createTab({
			name: "Tab 1",
			window: win1
		});
		var win2 = Ti.UI.createWindow({
			name: "win 2"
		});
		var tab2 = Ti.UI.createTab({
			name: "Tab 2",
			window:win2
		});
		tabGroup.addTab(tab1);
		tabGroup.addTab(tab2);
		var source_name2;
		var source_name3;
		var source_name4;
		var source_name5;
		var source_name6;
		var source_name7;
		tab1.addEventListener('focus', function(e){
			source_name2 = e.source.name
		});
		win1.addEventListener('focus', function(e){
			source_name3 = e.source.name;
		});
		tab2.addEventListener('focus', function(e){
			source_name4 = e.source.name;
		});
		win2.addEventListener('focus', function(e){
			source_name5 = e.source.name;
		});
		tab1.addEventListener('blur', function(e){
			source_name6 = e.source.name;
		});
		win1.addEventListener('blur', function(e){
			source_name7 = e.source.name;
		});
		setTimeout(function(){
			tabGroup.setActiveTab(tab2);
			setTimeout(function(){
				valueOf(testRun, source_name2).shouldBe('Tab 1');
				valueOf(testRun, source_name3).shouldBe('win 1');
				valueOf(testRun, source_name4).shouldBe('Tab 2');
				valueOf(testRun, source_name5).shouldBe('win 2');
				valueOf(testRun, source_name6).shouldBe('Tab 1');
				valueOf(testRun, source_name7).shouldBe('win 1');

				finish(testRun);
			},2000);
		},3000);
		tabGroup.open();
	}

	//TIMOB-7573, TIMOB-7572
	this.openingAndClosingNewTab = function(testRun){
		var win = Ti.UI.createWindow({
			fullscreen: false,
			exitOnClose: true
		});
		var tabGroup = Ti.UI.createTabGroup();
		var tabWin = Ti.UI.createWindow();
		var tab = Ti.UI.createTab({
			title: 'blue',
			window: tabWin
		});
		var count = 0;
		var timer = setInterval(function(){
			count ++;
			tabGroup.open();
			setTimeout(function(){
				tabGroup.close();
			},500);
			if (count == 4) {
				clearInterval(timer);
				valueOf(testRun, win.fullscreen).shouldBeFalse();
				valueOf(testRun, win.exitOnClose).shouldBeTrue();

				finish(testRun);
			}
		},2000);
		tabGroup.addTab(tab); 		
	}

	//TIMOB-7000
	this.tabGroup_Open = function(testRun){
		var tabGroup = Ti.UI.createTabGroup();
		var win1 = Ti.UI.createWindow();
		var tab1 = Ti.UI.createTab();
		tab1.window = win1;
		var win2 = Ti.UI.createWindow();
		var tab2 = Ti.UI.createTab();
		tab2.setWindow(win2);
		tabGroup.addTab(tab1); 
		tabGroup.addTab(tab2); 
		valueOf(testRun, function(){
			tabGroup.open();
		}).shouldNotThrowException();

		finish(testRun);
	}
}

