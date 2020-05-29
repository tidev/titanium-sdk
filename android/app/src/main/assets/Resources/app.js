'use strict';

function openWindow() {
	Ti.UI.setBackgroundColor('#000');
	var tabGroup = Ti.UI.createTabGroup();
	var win1 = Ti.UI.createWindow({
		title: 'Tab 1',
		backgroundColor: '#fff'
	});
	var tab1 = Ti.UI.createTab({
		icon: 'KS_nav_views.png',
		title: 'Tab 1',
		window: win1
	});
	win1.add(Ti.UI.createLabel({
		color: '#999',
		text: 'I am Window 1',
		font: { fontSize: 20, fontFamily: 'Helvetica Neue' },
		textAlign: 'center',
		width: 'auto'
	}));
	var win2 = Ti.UI.createWindow({
		title: 'Tab 2',
		backgroundColor: '#fff'
	});
	var tab2 = Ti.UI.createTab({
		icon: 'KS_nav_ui.png',
		title: 'Tab 2',
		window: win2
	});
	win2.add(Ti.UI.createLabel({
		color: '#999',
		text: 'I am Window 2',
		font: { fontSize: 20, fontFamily: 'Helvetica Neue' },
		textAlign: 'center',
		width: 'auto'
	}));
	tabGroup.addTab(tab1);
	tabGroup.addTab(tab2);
	tabGroup.open();
}

Ti.UI.addEventListener('sessionbegin', function () {
	openWindow();
});
if (Ti.UI.hasSession) {
	openWindow();
}
