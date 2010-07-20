SplitViewPlain = {};

// WINDOWS
SplitViewPlain.masterWindow = Ti.UI.createWindow({backgroundColor:'#ffffff'});
SplitViewPlain.detailWindow = Ti.UI.createWindow({backgroundColor:'#336699'});

// LABELS
SplitViewPlain.masterLabel = Ti.UI.createLabel({
	color:'#777',
	font:{fontSize:20},
	text:'Master Window (Landscape Only)',
	textAlign:'center'
});

SplitViewPlain.masterWindow.add(SplitViewPlain.masterLabel);

SplitViewPlain.modalButton = Ti.UI.createButton({
	title:'Show modal',
	width:150,
	height:40
});
SplitViewPlain.detailWindow.add(SplitViewPlain.modalButton);
SplitViewPlain.modalButton.addEventListener('click', function() {
    var modal = Titanium.UI.createWindow({ 
        backgroundColor:'#336699',     
        title:'Modal Window',
        barColor:'black',
        modal:true
    });
    
    var flexSpace = Titanium.UI.createButton({
        systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
    });
    
    var bb = Ti.UI.createButton({
    	title:'Dismiss modal',
    	width:150,
    	height:40
    });
    bb.addEventListener('click', function() {
    	modal.close();
    });
    
    modal.add(bb);
    modal.open();
});

// SPLIT VIEW
SplitViewPlain.splitView = Titanium.UI.iPad.createSplitWindow({
	masterView:SplitViewPlain.masterWindow,
	detailView:SplitViewPlain.detailWindow,
});

SplitViewPlain.splitView.orientationModes = [
	Titanium.UI.LANDSCAPE_LEFT,
	Titanium.UI.LANDSCAPE_RIGHT,
];

SplitViewPlain.open = function()
{
	SplitViewPlain.splitView.open();	
};
