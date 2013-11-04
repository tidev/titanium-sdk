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
	
	this.name = "ui_toolbar";
	this.tests = [
		{name: "ui_IOS_Toolbar"},
		{name: "keyBoardToolbar"},
		{name: "toolbarLabel"}
	]
	
	//TIMOB-4911
	this.ui_IOS_Toolbar = function(testRun) {
		var win =Ti.UI.createWindow();
		var send = Titanium.UI.createButton({
			title: 'Send',
			style: Titanium.UI.iPhone.SystemButtonStyle.DONE
		});
		var cancel = Titanium.UI.createButton({
			systemButton: Titanium.UI.iPhone.SystemButton.CANCEL
		});
		var toolbar = Titanium.UI.iOS.createToolbar({
			items:[send, cancel],
			bottom:0,
			borderTop:true,
			barColor:"red",
			visible:true,
			borderBottom:false
		});
		win.addEventListener("focus", function(){
			valueOf(testRun, function(){
				win.add(toolbar)
			}).shouldNotThrowException();
			valueOf(testRun,toolbar.getBottom()).shouldBe(0);
			valueOf(testRun,toolbar.getBorderTop()).shouldBeTrue();
			valueOf(testRun,toolbar.getBarColor()).shouldBe("red");
			valueOf(testRun,toolbar.getVisible()).shouldBeTrue();
			valueOf(testRun,toolbar.getBorderBottom()).shouldBeFalse();
			
			finish(testRun);
		})
		win.open();
	}
	
	//TIMOB-7830
	this.keyBoardToolbar = function(testRun) {
		var win1 = Titanium.UI.createWindow({backgroundColor:'#fff'});
		var textfields=[];
		var send = Titanium.UI.createButton({
			style : Titanium.UI.iPhone.SystemButtonStyle.DONE
		});
		var cancel = Titanium.UI.createButton({
			systemButton : Titanium.UI.iPhone.SystemButton.CANCEL
		});
		var toolbar1 = Titanium.UI.iOS.createToolbar({
			items:[cancel, send],
			borderTop:true,
			borderBottom:false,
			translucent:true,
			barColor:'green'
		});
		for(var j=0;j<3;j++){
			textfields[j]= Titanium.UI.createTextField({
				height : 35,
				width : 300,
				top : 50,
				borderStyle : Titanium.UI.INPUT_BORDERSTYLE_BEZEL,
				keyboardToolbar : toolbar1
			});
		}
		win1.addEventListener("focus",function(){
			for(var i=0;i<3;i++){
				textfields[i].focus();
				for(var k=0;k<2;k++){
					valueOf(testRun,textfields[i].getKeyboardToolbar().items[k].getEnabled()).shouldBeTrue();
				}
				valueOf(testRun, textfields[i].getKeyboardToolbar().items.length).shouldBe(2);
				valueOf(testRun, textfields[i].getKeyboardToolbar().items).shouldNotBeNull();
				valueOf(testRun, textfields[i].getKeyboardToolbar().items).shouldNotBeUndefined();
				valueOf(testRun, textfields[i].getKeyboardToolbar().borderTop).shouldBeTrue();
				valueOf(testRun, textfields[i].getKeyboardToolbar().borderBottom).shouldBeFalse();
				valueOf(testRun, textfields[i].getKeyboardToolbar().translucent).shouldBeTrue();
				valueOf(testRun, textfields[i].getKeyboardToolbar().barColor).shouldBe('green');
			}
			finish(testRun);
		})
		win1.add(textfields);
		win1.open();
	}
	
	//TIMOB-9058
	this.toolbarLabel = function(testRun) {
		var win = Titanium.UI.createWindow({
			backgroundColor : 'white',
			navBarHidden : false,
			tabBarHidden : true
		});
		var tabGroup = Ti.UI.createTabGroup();
		var tab = Ti.UI.createTab({
			window : win
		});
		var companyBar = Ti.UI.iOS.createToolbar({
			items:items,
			top:'0dp',
			borderTop:true,
			borderBottom:true,
			right : '-6dp'
		});
		win.add(companyBar);
		var companyBarLabel = Ti.UI.createLabel({
			left : '10',
			text : 'Greenlight Towing Company',
			color : 'red',
			font : {fontSize : '14dp', fontWeight : 'bold'},
			textAlign : 'left',
			width : Ti.UI.FILL
		});
		companyBarLabel.addEventListener("postlayout", function(){
			valueOf(testRun,companyBarLabel.getLeft()).shouldBe(10);
			valueOf(testRun,companyBarLabel.getTextAlign()).shouldBe('left');
			valueOf(testRun,companyBarLabel.getText()).shouldBeString();
			valueOf(testRun,companyBarLabel.getColor()).shouldBe('red');
			valueOf(testRun,companyBarLabel.getFont().fontSize).shouldBe('14dp');
			valueOf(testRun,companyBarLabel.getFont().fontWeight).shouldBe('bold');
			valueOf(testRun,companyBarLabel.getWidth()).shouldNotBeNull();
			valueOf(testRun,companyBarLabel.size.getWidth()).shouldBeGreaterThan(companyBarLabel.text.length);
			
			finish(testRun);
		})
		var items = [companyBarLabel];
		companyBar.items = items;
		tabGroup.addTab(tab);
		tabGroup.open();
	}
}




