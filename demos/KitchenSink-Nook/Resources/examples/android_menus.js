Ti.include('../common.js');

//create table view data object
var data = [];

data.push({title:'Basic Menu', hasChild:true, test:'../examples/android_menu_1.js'});
data.push({title:'Menu Handlers (Window Options)', hasChild:true, test:'../examples/android_menu_2.js'});
data.push({title:'Menu Handlers (Activity Property)', hasChild:true, test:'../examples/android_menu_3.js'});

Titanium.UI.currentWindow.add(NookKS.createNavigationTableView(data));
