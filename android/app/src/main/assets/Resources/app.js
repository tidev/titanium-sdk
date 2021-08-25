'use strict';

// create tab group
const tabGroup = Titanium.UI.createTabGroup({
	style: Ti.UI.Android.TABS_STYLE_BOTTOM_NAVIGATION,
});

//
// create base UI tab and root window
//
const win1 = Titanium.UI.createWindow({
	title: 'Tab 1',
});
const tab1 = Titanium.UI.createTab({
	icon: 'KS_nav_views.png',
	title: 'Tab 1',
	window: win1
});

const label1 = Titanium.UI.createLabel({
	text: 'I am Window 1',
	font: { fontSize: 20, fontFamily: 'Helvetica Neue' },
	textAlign: 'center',
	width: 'auto'
});

win1.add(label1);

//
// create controls tab and root window
//
const win2 = Titanium.UI.createWindow({
	title: 'Tab 2',
});
const tab2 = Titanium.UI.createTab({
	icon: 'KS_nav_ui.png',
	title: 'Tab 2',
	window: win2
});
var label2 = Titanium.UI.createLabel({
	text: 'I am Window 2',
	font: { fontSize: 20, fontFamily: 'Helvetica Neue' },
	textAlign: 'center',
	width: 'auto'
});
win2.add(label2);

//
//  add tabs
//
tabGroup.addTab(tab1);
tabGroup.addTab(tab2);

// open tab group
tabGroup.open();
