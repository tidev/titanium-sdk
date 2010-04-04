
var tabGroup = Titanium.UI.createTabGroup();

var demoWin = Titanium.UI.createWindow({
	navBarHidden:true
});

var demoTab = Titanium.UI.createTab({
	window:demoWin,
	title:"Demos"
});

var apiWin = Titanium.UI.createWindow({
	navBarHidden:true
});

var apiTab = Titanium.UI.createTab({
	window:apiWin,
	title:"API Guide"
});

var vidWin = Titanium.UI.createWindow({
	navBarHidden:true,
	backgroundColor:"black"
});

var videoTab = Titanium.UI.createTab({
	window:vidWin,
	title:"Videos"
});

tabGroup.addTab(demoTab);
tabGroup.addTab(apiTab);
tabGroup.addTab(videoTab);


function createMasterDetail(title,leftTableData,rightTableData)
{
	var mainWindow = Titanium.UI.createWindow({
		title: title
	});

	var navbar = Titanium.UI.iPhone.createNavigationGroup({
		window:mainWindow
	});

	var search = Titanium.UI.createSearchBar({
		showCancel:false,
		height:40,
		width:200,
		top:0,
		hintText:"Search"
	});

	mainWindow.rightNavButton = search;

	var leftTable = Ti.UI.createTableView({
		data: leftTableData,
		backgroundColor:"#eee",
		separatorStyle:Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
		width:200,
		left:0,
		allowsSelection:true
	});

	var leftLine = Ti.UI.createView({
		backgroundColor:"#999",
		width:1,
		left:201
	});

	var rightTable = null;
	
	if (rightTableData!=null)
	{
		rightTable = Ti.UI.createTableView({
			data: rightTableData,
			left:202,
			right:0
		});
	}
	else
	{
		rightTable = Ti.UI.createWebView({
			left:202,
			right:0,
			top:0,
			bottom:0,
			url:"apidoc.html"
		});
	}

	mainWindow.add(leftTable);
	mainWindow.add(leftLine);
	mainWindow.add(rightTable);

	return {
		window: mainWindow,
		leftTable: leftTable,
		rightTable: rightTable,
		navBar: navbar,
		search: search
	};
}

tabGroup.open();


Titanium.include("data.js","demos.js","apidoc.js");


