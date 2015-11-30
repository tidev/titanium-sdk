// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

// create tab group
var tabGroup = Titanium.UI.createTabGroup({backgroundColor:'#fff'});
var fb = require('facebook');
//
// create base UI tab and root window
//

tabGroup.addTab(Titanium.UI.createTab({  
    icon:'KS_nav_views.png',
    title:'Login',
    window:require('facebook_login_logout').window()
}));
tabGroup.addTab(Titanium.UI.createTab({  
    icon:'KS_nav_views.png',
    title:'Read',
    window:require('facebook_read_stream').window()
}));

tabGroup.addTab(Titanium.UI.createTab({  
    icon:'KS_nav_views.png',
    title:'Publish',
    window:require('facebook_publish_stream').window()
}));

tabGroup.addTab(Titanium.UI.createTab({  
    icon:'KS_nav_views.png',
    title:'Photo',
    window:require('facebook_photos').window()
}));

fb.initialize(); // after you set up login/logout listeners and permissions

// open tab group
if (Ti.Platform.osname == 'android') {
	tabGroup.fbProxy = fb.createActivityWorker({lifecycleContainer: tabGroup});
}
	
tabGroup.open();
