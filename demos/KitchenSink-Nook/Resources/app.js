// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

// create tab group
var tabGroup = Titanium.UI.createTabGroup();

var win1 = Titanium.UI.createWindow({  
    title:'Base UI',
    url:'main_windows/base_ui.js'
});
var tab1 = Titanium.UI.createTab({  
    icon:'KS_nav_views.png',
    title:'Base UI',
    window:win1
});

var win2 = Titanium.UI.createWindow({  
    title:'Controls',
    url:'main_windows/controls.js'
});
var tab2 = Titanium.UI.createTab({  
    icon:'KS_nav_ui.png',
    title:'Controls',
    window:win2
});

var win3 = Titanium.UI.createWindow({  
    title:'Miscellaneous',
    url:'main_windows/phone.js'
});
var tab3 = Titanium.UI.createTab({  
    icon:'KS_nav_ui.png',
    title:'Miscellaneous',
    window:win3
});

var win4 = Titanium.UI.createWindow({  
    title:'Platform',
	url:'main_windows/platform.js'
});
var tab4 = Titanium.UI.createTab({  
    icon:'KS_nav_ui.png',
    title:'Platform',
    window:win4
});

var win5 = Titanium.UI.createWindow({  
    title:'Mashups',
    url:'main_windows/mashups.js'
});
var tab5 = Titanium.UI.createTab({  
    icon:'KS_nav_ui.png',
    title:'Mashups',
    window:win5
});

tabGroup.addTab(tab1);  
tabGroup.addTab(tab2);  
tabGroup.addTab(tab3);  
tabGroup.addTab(tab4);  
tabGroup.addTab(tab5);  

// open tab group
tabGroup.open();
