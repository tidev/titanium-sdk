Ti.include('../common.js');

// create table view data object
var data = [
	{title:'Twitter', test:'../examples/twitter.js', title_image:'../images/twitter_logo_header.png'},
	{title:'Foursquare', test:'../examples/foursquare.js', title_image:'../images/light-poweredby-foursquare.png'},
	{title:'Facebook', test:'../examples/facebook.js'},
	{title:'YQL', test:'../examples/yql.js'},
	{title:'SOAP', test:'../examples/soap.js'}
];
NookKS.formatTableView(data);
 
// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	if (e.rowData.test)
	{
		var win = Titanium.UI.createWindow({
			url:e.rowData.test,
			title:e.rowData.title
		});
		if (e.rowData.barColor)
		{
			win.barColor = e.rowData.barColor;
		}
		if (e.rowData.title_image)
		{
			win.titleImage = e.rowData.title_image;
		}
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
