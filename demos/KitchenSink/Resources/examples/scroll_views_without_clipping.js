//
// SETUP WINDOW STYLES
//
Titanium.UI.iPhone.statusBarStyle = Titanium.UI.iPhone.StatusBar.OPAQUE_BLACK;
var win = Ti.UI.currentWindow;
win.title = 'All Friends';

var cover = Titanium.UI.createView({
	backgroundImage:'../images/scrollable_view/bg.png',
	zIndex:5
});
win.add(cover);
cover.animate({opacity:0,duration:2000});


//
// CREATE COMPOSE WINDOW/BUTTON
//
var composeWin = Ti.UI.createWindow({
	top:5,
	right:5,
	height:39,
	width:33
});
var compose = Titanium.UI.createButton({
	backgroundImage:'../images/scrollable_view/compose.png',
	height:39,
	width:33,
});
composeWin.add(compose);
composeWin.open();
compose.addEventListener('click', function()
{
	var win2 = Titanium.UI.createWindow({top:-400});
	var ta1 = Titanium.UI.createTextArea({
		value:'',
		height:220,
		width:320,
		top:40,
		font:{fontSize:18,fontFamily:'Helvetica Neue', fontWeight:'bold'},
		color:'#333',
		textAlign:'left',
		appearance:Titanium.UI.KEYBOARD_APPEARANCE_ALERT,	
		keyboardType:Titanium.UI.KEYBOARD_NUMBERS_PUNCTUATION,
		returnKeyType:Titanium.UI.RETURNKEY_EMERGENCY_CALL,

	});
	win2.add(ta1);
	
	var cancel = Titanium.UI.createButton({
		title:'Cancel',
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
	});
	cancel.addEventListener('click', function()
	{
		win2.animate({top:-400,duration:500}, function()
		{
			win2.close();
		});
		setTimeout(function()
		{
			ta1.blur();	
		},50)
	});
	var send = Titanium.UI.createButton({
		title:'Send',
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED		
	});

	send.addEventListener('click', function()
	{
	});

	var title = Titanium.UI.createButton({
		title:'New Tweet',
		style:Titanium.UI.iPhone.SystemButtonStyle.PLAIN		
	});
	var flexSpace = Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});

	var toolbar= Titanium.UI.createToolbar({
		items:[cancel,flexSpace,title,flexSpace,send],
		top:0,
		borderTop:true,
		borderBottom:true,
		barColor:'#111',
	});
	win2.add(toolbar)
	
	win2.open({top:0,duration:400});
	setTimeout(function()
	{
		ta1.focus();
			
	}, 100);
	


});

var data = [];
for (var i=0;i<20;i++)
{
	var row = Titanium.UI.createTableViewRow();
	row.height = 69;
	row.backgroundImage = '../images/scrollable_view/table_view_row.png';
	
	var label = Titanium.UI.createLabel({
		color:'#fff',
		font:{fontSize:14},
		text:'Hello World',
		top:5,
		left:10
	});
	
	row.add(label);
	data.push(row);
}
var t = Ti.UI.create2DMatrix().scale(0.75);
var tableview = Titanium.UI.createTableView({
	data:data,
	backgroundColor:'transparent',
	separatorStyle:0,
	transform:t,
	top:-7,
	visible:true
});

var data2 = [];
for (var i=0;i<20;i++)
{
	var row = Titanium.UI.createTableViewRow();
	row.height = 69;
	row.backgroundImage = '../images/scrollable_view/table_view_row.png';
	
	var label = Titanium.UI.createLabel({
		color:'#fff',
		font:{fontSize:14},
		text:'Hello World',
		top:5,
		left:10
	});
	
	row.add(label);
	data2.push(row);
}
var t2 = Ti.UI.create2DMatrix().scale(0.75);
var tableview2 = Titanium.UI.createTableView({
	data:data2,
	backgroundColor:'transparent',
	separatorStyle:0,
	transform:t2,
	visible:true
});

var data3 = [];
for (var i=0;i<20;i++)
{
	var row = Titanium.UI.createTableViewRow();
	row.height = 69;
	row.backgroundImage = '../images/scrollable_view/table_view_row.png';
	
	var label = Titanium.UI.createLabel({
		color:'#fff',
		font:{fontSize:14},
		text:'Hello World',
		top:5,
		left:10
	});
	Ti.API.info('ROW ADDED')
	row.add(label);
	data3.push(row);
}
var t3 = Ti.UI.create2DMatrix().scale(0.75);

var tableview3 = Titanium.UI.createTableView({
	data:data3,
	backgroundColor:'transparent',
	separatorStyle:0,
	transform:t3,
	visible:true,

});

win.add(tableview);
win.add(tableview2);
win.add(tableview3);

var image1 = tableview.toImage();
var image2 = tableview2.toImage();
var image3 = tableview3.toImage();

var iv1 = Ti.UI.createImageView({image:image1,height:290, width:240});
var iv2 = Ti.UI.createImageView({image:image2,height:290, width:240});
var iv3 = Ti.UI.createImageView({image:image3,height:290, width:240});

tableview.visible = false;
tableview2.visible = false;
tableview3.visible = false;

var scrollView = Titanium.UI.createScrollableView({
	views:[iv1,iv2,iv3],
	showPagingControl:true,
	clipViews:false,
	top:65,
	left:30,
	right:30,
	height:330,
});
win.add(scrollView);

iv1.addEventListener('singletap', function()
{
	header.hide();
	tableview.visible=true;
	scrollView.visible=false;
	win.showNavBar();
	var t = Ti.UI.create2DMatrix();
	tableview.animate({transform:t,duration:100});
	
})
var header = Ti.UI.createLabel({
	text:'All Friends',
	color:'#fff',
	font:{fontSize:17,fontWeight:'bold'},
	top:50,
	height:'auto',
	width:'auto'
	
})
win.add(header);

