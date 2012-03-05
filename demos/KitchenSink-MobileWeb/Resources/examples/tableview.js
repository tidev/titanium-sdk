var win = Titanium.UI.currentWindow;
// create table view data object
var data = [
	{title:'Basic', hasChild:true, test:'/examples/tableview_basic.js'},
	{title:'Add and remove rows', hasChild:true, test:'/examples/tableview_adddel.js'},
	{title:'Select rows', hasChild:true, test:'/examples/tableview_select.js'},
	{title:'Insert rows', hasChild:true, test:'/examples/tableview_insert.js'},
	{title:'Headers', hasChild:true, test:'/examples/tableview_headers.js'},
	{title:'Footers', hasChild:true, test:'/examples/tableview_footers.js'},
	{title:'Perfomance', hasChild:true, test:'/examples/tableview_perfomance.js'},
	{title:'Table Section Header', hasChild:true, test:'/examples/tableview_tablesectionheader.js'},
	{title:'Table Custom Row Header', hasChild:true, test:'/examples/tableview_tablecustomrowheader.js'},
	{title:'Row data from sections', hasChild:true, test:'/examples/tableview_rowdatafromsections.js'},
	{title:'Table View (Layout)', hasChild:true, test:'/examples/tableview_layout.js'},
	{title:'Table View (Layout 2)', hasChild:true, test:'/examples/tableview_layout2.js'},
	{title:'Table View (Layout 3)', hasChild:true, test:'/examples/tableview_layout3.js'},
	{title:'Table Auto Height', hasChild:true, test:'/examples/tableview_tableautoheight.js'},
	{title:'Table View w/TextField', hasChild:true, test:'/examples/tableview_textfield.js'},
	{title:'Table View Dynamic Update', hasChild:true, test:'/examples/tableview_dynamicupdate.js'},
	{title:'Table View Custom Footer', hasChild:true, test:'/examples/tableview_customfooter.js'},
	{title:'Table View with controls', hasChild:true, test:'/examples/tableview_controls.js'}
];

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	if (e.rowData.test) {
		var w = Ti.UI.createWindow({url:e.rowData.test});
		w.open();
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:1060,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

win.add(closeButton);
