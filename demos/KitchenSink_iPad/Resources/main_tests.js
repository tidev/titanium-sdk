MainTests = {};

// WINDOWS
MainTests.masterWindow = Ti.UI.createWindow({
	barColor:'#111',
	title:'Test List',
	backgroundColor:'#f00'
});
MainTests.detailWindow = Ti.UI.createWindow({
	barColor:'#111',
	title:'Test Detail',
	backgroundColor:'#0f0'
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
	{title:'Popovers', test:'popover.js',title:'Popovers', bar:'green', bg:'blue'},
	{title:'Option Dialogs', test:'option_dialog.js', title:'Option Dialogs', bar:'red', bg:'orange'},
	{title:'Embedded Video', test:'video.js', title:'Embedded Video', bar:'transparent', bg:'purple'},
];

MainTests.tableView = Ti.UI.createTableView({
	data:MainTests.tableVewData
});

MainTests.tableView.addEventListener('click', function(e)
{
	Ti.API.debug('sup');
	Ti.API.debug('Launching '+e.source.test);
	var w = Ti.UI.createWindow({
		url:e.source.test,
		title:e.source.title,
		backgroundColor:e.source.bg,
		barColor:e.source.bar,
		leftNavButton:null,
	});
	w.addEventListener('focus',function(e){Ti.API.debug('Foo!');});
	w.addEventListener('open',function(e){Ti.API.debug('Fum!');});
	MainTests.detailNav.open(w,{animated:true})
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

