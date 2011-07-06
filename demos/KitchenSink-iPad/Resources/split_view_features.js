SplitFeatures = {};

// WINDOWS
SplitFeatures.masterWindow = Ti.UI.createWindow({backgroundColor:'#ffffff'});
SplitFeatures.detailWindow = Ti.UI.createWindow({backgroundColor:'#336699'});

SplitFeatures.masterDisplayButton = Ti.UI.createButton({
	title:'Display master (portrait)',
	width:300,
	height:40
});
SplitFeatures.detailWindow.add(SplitFeatures.masterDisplayButton);
SplitFeatures.masterDisplayButton.addEventListener('click', function() {
	if (!SplitFeatures.splitView.showMasterInPortrait) {
		SplitFeatures.masterDisplayButton.title = "Don't display master (portrait)";
		SplitFeatures.splitView.showMasterInPortrait = true;
	}
	else {
		SplitFeatures.masterDisplayButton.title = 'Display master (portrait)';
		SplitFeatures.splitView.showMasterInPortrait = false;		
	}
});

// SPLIT VIEW
SplitFeatures.splitView = Titanium.UI.iPad.createSplitWindow({
	masterView:SplitFeatures.masterWindow,
	detailView:SplitFeatures.detailWindow,
});

SplitFeatures.open = function()
{
	SplitFeatures.splitView.open();	
};
