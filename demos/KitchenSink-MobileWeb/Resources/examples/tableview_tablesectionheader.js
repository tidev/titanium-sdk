var win = Titanium.UI.currentWindow;

var inputData = [
	{title:'row 1', header:'Header 1'},
	{title:'row 2'},
	{title:'row 3'},
	{title:'row 4'},
	{title:'row 5'},
	{title:'row 6'},
	{title:'row 7'},
	{title:'row 8'},
	{title:'row 9'},
	{title:'row 10'},
	{title:'row 11', header:'Header 2'},
	{title:'row 12'},
	{title:'row 13'},
	{title:'row 14'},
	{title:'row 15'},
	{title:'row 16'},
	{title:'row 17'}	
];
var tableView = Titanium.UI.createTableView({
	data:inputData,
	height: 150,
	width: 100,
	top: 20,
	left: 20,
	style:Titanium.UI.iPhone.TableViewStyle.GROUPED
});
win.add(tableView);



var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	left:10,
	top: 180,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

Ti.UI.currentWindow.add(closeButton);
