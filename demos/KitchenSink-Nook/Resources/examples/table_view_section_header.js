//
//  This is a test that is meant to verify that a row object can have a header
//  and the table view has no table view header - the header should be displayed

var win = Titanium.UI.currentWindow;

var inputData = [
	{title:'row 1', header:'Header 1'},
	{title:'row 2'},
	{title:'row 3'},
	{title:'row 4', header:'Header 2'},
	{title:'row 5'}
];
var tableView = Titanium.UI.createTableView({
	data:inputData,
	style:Titanium.UI.iPhone.TableViewStyle.GROUPED
});
win.add(tableView);
