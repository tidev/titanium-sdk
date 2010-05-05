SplitViewPlain = {};

// WINDOWS
SplitViewPlain.masterWindow = Ti.UI.createWindow({backgroundColor:'#ffffff'});
SplitViewPlain.detailWindow = Ti.UI.createWindow({backgroundColor:'#336699'});

// LABELS
SplitViewPlain.masterLabel = Ti.UI.createLabel({
	color:'#777',
	font:{fontSize:20},
	text:'Master Window',
	textAlign:'center'
});

SplitViewPlain.masterWindow.add(SplitViewPlain.masterLabel);

SplitViewPlain.detailLabel = Ti.UI.createLabel({
	color:'#fff',
	font:{fontSize:20},
	text:'Detail Window',
	textAlign:'center'
});

SplitViewPlain.detailWindow.add(SplitViewPlain.detailLabel);

// SPLIT VIEW
SplitViewPlain.splitView = Titanium.UI.iPad.createSplitWindow({
	masterView:SplitViewPlain.masterWindow,
	detailView:SplitViewPlain.detailWindow,
});

SplitViewPlain.open = function()
{
	SplitViewPlain.splitView.open();	
};
