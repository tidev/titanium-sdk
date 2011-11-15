var currentWindow = Ti.UI.currentWindow;

var l = Ti.UI.createLabel({
	top:10,
	font:{fontSize:20, fontWeight:'bold'},
	color:'black',
	text:'I am text',
	height:20,
	width:200,
	left:60,
	backgroundColor:'#777',
	borderRadius:10,
	borderColor:'red',
	borderWidth:2,
	isvisible:true,
	textAlign:'center'
});
currentWindow.add(l);

var view = Ti.UI.createView({
	layout:'vertical',
	top:40,
	left:0,
	height:400,
	width:320
});
currentWindow.add(view);

var hideButton = Ti.UI.createButton({
	title:'Hide Label',
	height:40,
	top:10,
	width:200,
	left:60,
	font:{fontSize:20}
});
view.add(hideButton);
	
hideButton.addEventListener('click', function()
{	
	if (l.isvisible){
		l.hide();
	}
	l.isvisible = false;
});

var showButton = Ti.UI.createButton({
	title:'Show Label',
	height:40,
	width:200,
	left:60,
	top:10,
	font:{fontSize:20}
});
view.add(showButton);

showButton.addEventListener('click', function()
{
	l.show();
	l.isvisible = true;
});

var changeButton = Ti.UI.createButton({
	title:'Change Label',
	height:40,
	width:200,
	left:60,
	top:10,
	font:{fontSize:20}
});
view.add(changeButton);
var	chng = false;
changeButton.addEventListener('click', function()
{ 	
	if (!chng){
	l.text = 'You changed me!';
	chng = true;}
	else
	{
	l.text = 'I am text';
	chng = false; 
	}
});

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:200,
	left:60,
	top:10,
	font:{fontSize:20}
});
view.add(closeButton);

closeButton.addEventListener('click', function()
{
	currentWindow.close();
});