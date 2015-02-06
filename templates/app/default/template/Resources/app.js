// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

// create tab group
var tabGroup = Titanium.UI.createTabGroup();


//
// create base UI tab and root window
//
var win1 = Titanium.UI.createWindow({});
win1.title = 'Tab 1';
win1.backgroundColor = '#fff';

var tab1 = Titanium.UI.createTab({});
tab1.icon = 'KS_nav_views.png';
tab1.title = 'Tab 1';
tab1.window = win1;

var label1 = Titanium.UI.createLabel({});
label1.color = '#999';
label1.text = 'I am Window 1';
label1.font = {fontSize:20,fontFamily:'Helvetica Neue'};
label1.textAlign = 'center';
label1.width = 'auto';

win1.add(label1);

//
// create controls tab and root window
//
var win2 = Titanium.UI.createWindow({});
win2.title = 'Tab 2';
win2.backgroundColor = '#fff';

var tab2 = Titanium.UI.createTab({});
tab2.icon = 'KS_nav_ui.png';
tab2.title = 'Tab 2';
tab2.window = win2;

var label2 = Titanium.UI.createLabel({});
label2.color = '#999';
label2.text = 'I am Window 2';
label2.font = {fontSize:20,fontFamily:'Helvetica Neue'};
label2.textAlign = 'center';
label2.width = 'auto';

win2.add(label2);



//
//  add tabs
//
tabGroup.addTab(tab1);  
tabGroup.addTab(tab2);  


// open tab group
tabGroup.open();
