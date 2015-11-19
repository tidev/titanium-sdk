function SplitView_Features(){

	SplitFeatures = {};

	// WINDOWS
	SplitFeatures.masterWindow = Ti.UI.createWindow({
		title:'Master',
		backgroundColor:'#ffffff'
	});
	SplitFeatures.detailWindow = Ti.UI.createWindow({
		title:'Detail',
		backgroundColor:'#336699'
	});

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

	//CLOSE TEST
	SplitFeatures.closeButton = Ti.UI.createButton({
		title:'Close Test',
		width:300,
		height:40,
		top:10
	});
	SplitFeatures.detailWindow.add(SplitFeatures.closeButton);
	SplitFeatures.closeButton.addEventListener('click', function() {
		SplitFeatures.splitView.close();
	});

	SplitFeatures.open = function()
	{
		SplitFeatures.splitView.open();	
	};

	return SplitFeatures;
}

module.exports = SplitView_Features;