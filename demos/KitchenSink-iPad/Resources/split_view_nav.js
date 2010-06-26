SplitViewNav = {};

// WINDOWS
SplitViewNav.masterWindow = Ti.UI.createWindow({title:'Master',backgroundColor:'red'});
SplitViewNav.detailWindow = Ti.UI.createWindow({title:'Detail',backgroundColor:'#336699'});

// MASTER NAV GROUP
SplitViewNav.masterNav = Ti.UI.iPhone.createNavigationGroup({
	window:SplitViewNav.masterWindow
});

// DETAIL NAV GROUP
SplitViewNav.detailNav = Ti.UI.iPhone.createNavigationGroup({
	window:SplitViewNav.detailWindow
});

// SPLIT VIEW
SplitViewNav.splitView = Titanium.UI.iPad.createSplitWindow({
	masterView:SplitViewNav.masterNav,
	detailView:SplitViewNav.detailNav,
});


// MASTER BUTTON
SplitViewNav.masterButton = Ti.UI.createButton({
	title:'Open Window',
	height:50,
	width:200
});
SplitViewNav.masterButton.addEventListener('click', function()
{
	var w = Ti.UI.createWindow({backgroundColor:'#ff9900'});
	var l = Ti.UI.createLabel({
		text:'New Window',
		color:'white',
		textAlign:'center'
	});
	w.add(l)
	SplitViewNav.masterNav.open(w,{animated:true});
});
SplitViewNav.masterWindow.add(SplitViewNav.masterButton);

// DETAIL BUTTON
SplitViewNav.detailButton = Ti.UI.createButton({
	title:'Open Window',
	height:50,
	width:200,
	textAlign:'center'
});
SplitViewNav.detailButton.addEventListener('click', function()
{
	var w = Ti.UI.createWindow({backgroundColor:'#fff'});
	var l = Ti.UI.createLabel({
		text:'New Window',
		textAlign:'center'
	});
	w.add(l)
	SplitViewNav.detailNav.open(w,{animated:true});
});
SplitViewNav.detailWindow.add(SplitViewNav.detailButton);



SplitViewNav.open = function()
{
	Ti.API.info('in open for split view nav')
	SplitViewNav.splitView.open();	
};

SplitViewNav.splitView.addEventListener('visible', function(e) {
	Ti.API.log('View: '+e.view);
	if (e.view == 'detail') {
		e.button.title = "Popover";
		SplitViewNav.detailWindow.leftNavButton = e.button;
		Ti.API.log('Set button');
	}
	else if (e.view == 'master') {
		SplitViewNav.detailWindow.leftNavButton = null;
		Ti.API.log('Removed button');
	}
});
