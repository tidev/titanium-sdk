
'use strict';

// create tab group
const tabGroup = Ti.UI.createTabGroup({
	tabsBackgroundColor: '#cccccc',
	style: Ti.UI.Android.TABS_STYLE_BOTTOM_NAVIGATION,
	labelVisibilityMode: Ti.UI.Android.LABEL_VISIBILITY_UNLABELED
});

//
// create base UI tab and root window
//
const win1 = Ti.UI.createWindow({
	title: 'Tab 1',
	backgroundColor: '#fff'
});
const tab1 = Ti.UI.createTab({
	icon: 'KS_nav_views.png',
	window: win1
});

const label1 = Ti.UI.createLabel({
	color: '#000',
	text: 'I am Window 1'
});
win1.add(label1);

//
// create controls tab and root window
//
const win2 = Ti.UI.createWindow({
	title: 'Tab 2',
	backgroundColor: '#fff'
});
const tab2 = Ti.UI.createTab({
	icon: 'KS_nav_ui.png',
	window: win2
});
const label2 = Ti.UI.createLabel({
	color: '#000',
	text: 'I am Window 2'
});
win2.add(label2);

//
//  add tabs
//
tabGroup.addTab(tab1);
tabGroup.addTab(tab2);

// open tab group
tabGroup.open();
