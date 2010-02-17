//
//  This is a test that is meant to verify that a row object can have a header 
//  and the table view has no table view header - the header should be displayed

var win = Titanium.UI.currentWindow

var inputData = [{title:'I should have a header', hasChild:true, test:'../examples/table_view_basic.js', header:'Simple Table API'}]; 
var tableView = Titanium.UI.createTableView({ 
data:inputData, 
style:Titanium.UI.iPhone.TableViewStyle.GROUPED, 
}); 
win.add(tableView);
win.open();
