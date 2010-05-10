MainTests = {};

Ti.include('popover.js','video.js','option_dialog.js');

Popover.init();
Video.init();
OptionDialog.init();

// WINDOWS
MainTests.masterWindow = Ti.UI.createWindow({
	barColor:'#111',
	title:'Test List',
	backgroundColor:'#fff'
});
MainTests.detailWindow = Ti.UI.createWindow({
	barColor:'#111',
	title:'Test Detail',
	backgroundColor:'#fff'
});

// MASTER NAV GROUP
MainTests.masterNav = Ti.UI.iPhone.createNavigationGroup({
	window:MainTests.masterWindow
});

// DETAIL NAV GROUP
MainTests.detailNav = Ti.UI.iPhone.createNavigationGroup({
	window:MainTests.detailWindow
});

// SPLIT VIEW
MainTests.splitView = Titanium.UI.iPad.createSplitWindow({
	masterView:MainTests.masterNav,
	detailView:MainTests.detailNav,
});

// SPLIT VIEW EVENT LISTENER
MainTests.splitView.addEventListener('visible',function(e)
{
	Ti.API.info('HERE ' + e.view  + ' button ' + e.button)
	// show master list when in detail mode via left nav button
	if (e.view == 'detail')
	{
		e.button.title = "Show List";
		MainTests.detailWindow.leftNavButton = e.button;
	}
	
	// hide it
	else if (e.view == 'master')
	{
		MainTests.detailWindow.leftNavButton = null;
	}
});

// MASTER TABLE VIEW
MainTests.tableVewData = [
	{title:'Popovers', v:Popover.view},
	{title:'Option Dialogs', v:OptionDialog.view},
	{title:'Embedded Video', v:Video.view},
];

MainTests.tableView = Ti.UI.createTableView({
	data:MainTests.tableVewData
});

MainTests.tableView.addEventListener('click', function(e)
{
	MainTests.detailWindow.animate({view:e.rowData.v,transition:Ti.UI.iPhone.AnimationStyle.CURL_UP});
});

MainTests.masterWindow.add(MainTests.tableView);

MainTests.button = Titanium.UI.createButton({
	title:'Hello'
});
MainTests.button.addEventListener('click', function()
{
	alert('hello');
});
MainTests.detailWindow.rightNavButton = MainTests.button;

MainTests.open =  function()
{
	MainTests.splitView.open();
};
