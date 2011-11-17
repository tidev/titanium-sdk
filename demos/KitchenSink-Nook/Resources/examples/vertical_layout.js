Ti.include('../common.js');

//create table view data object
var data = [
	{title:'Basic', test:'../examples/vertical_layout_basic.js'},
	{title:'Table View', test:'../examples/vertical_layout_table_view.js'}
];

Titanium.UI.currentWindow.add(NookKS.createNavigationTableView(data));


