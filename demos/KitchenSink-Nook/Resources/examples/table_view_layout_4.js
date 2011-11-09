//THANKS TO MATT GALLAGHER
//FOR DEMO ON HOW TO DO THIS IN OBJECTIVE-C WHICH WE PORTED BELOW 
//TO TITANIUM.
//http://cocoawithlove.com/2009/04/easy-custom-uitableview-drawing.html

var win = Titanium.UI.currentWindow;
win.backgroundImage = '../images/tableview/easycustom/gradientBackground.png';

var data = [];

var headerView = Ti.UI.createView({
	height:80
});

var headerLabel = Ti.UI.createLabel({
	top:10,
	left:20,
	width:'auto',
	height:'auto',
	text:'Cocoa with Love',
	color:'white',
	shadowColor:'black',
	shadowOffset:{x:0,y:1},
	font:{fontWeight:'bold',fontSize:22}
});

var footerLabel = Ti.UI.createLabel({
	text:'Thanks for Matt Gallagher for this awesome example (in Cocoa)',
	color:'white',
	width:'auto',
	height:'auto',
	textAlign:'center',
	shadowColor:'black',
	shadowOffset:{x:0,y:1},
	font:{fontWeight:'bold',fontSize:15}
});

var footerView = Ti.UI.createView({
	height:60
});

headerView.add(headerLabel);
footerView.add(footerLabel);

for (var c=0;c<30;c++)
{
	var row = Ti.UI.createTableViewRow();
	row.rightImage = '../images/tableview/easycustom/indicator.png';
	if (c === 0)
	{
		row.backgroundImage = '../images/tableview/easycustom/topRow.png';
		row.selectedBackgroundImage = '../images/tableview/easycustom/topRowSelected.png';
	}
	else if (c < 29)
	{
		row.backgroundImage = '../images/tableview/easycustom/middleRow.png';
		row.selectedBackgroundImage = '../images/tableview/easycustom/middleRowSelected.png';
	}
	else
	{
		row.backgroundImage = '../images/tableview/easycustom/bottomRow.png';
		row.selectedBackgroundImage = '../images/tableview/easycustom/bottomRowSelected.png';
	}
	if ((c % 3) == 0)
	{
		row.leftImage = "../images/tableview/easycustom/imageA.png";
	}
	else if ((c % 3) == 1)
	{
		row.leftImage = "../images/tableview/easycustom/imageB.png";
	}
	else
	{
		row.leftImage = "../images/tableview/easycustom/imageC.png";
	}
	var label = Ti.UI.createLabel({
		text: 'Cell at row ' + (c+1),
		color: '#420404',
		shadowColor:'#FFFFE6',
		shadowOffset:{x:0,y:1},
		textAlign:'left',
		top:20,
		left:85,
		width: 'auto',
		height:'auto',
		font:{fontWeight:'bold',fontSize:18}
	});
	if (Titanium.Platform.name == 'android') {
		label.top = 10;
	}
	row.add(label);
	
	label.addEventListener('click',function(e)
	{
		Ti.API.info("clicked on label "+e.source);
	});

	var label2 = Ti.UI.createLabel({
		text: "Other information could go here if you'd like",
		color: '#420404',
		shadowColor:'#FFFFE6',
		textAlign:'left',
		shadowOffset:{x:0,y:1},
		font:{fontWeight:'bold',fontSize:13},
		bottom:22,
		height:'auto',
		left:85,
		right:50
	});
	if (Titanium.Platform.name == 'android') {
		label2.right = 30;
	}
	row.add(label2);
	data[c]=row;
}

var tableview = Titanium.UI.createTableView({
	data:data,
	style:Titanium.UI.iPhone.TableViewStyle.PLAIN,
	backgroundColor:'transparent',
	headerView:headerView,
	footerView:footerView,
	maxRowHeight:100,
	minRowHeight:100,
	separatorStyle: Ti.UI.iPhone.TableViewSeparatorStyle.NONE
});

tableview.addEventListener('click',function(e)
{
	Ti.API.info("clicked on table view = "+e.source);
});

win.add(tableview);