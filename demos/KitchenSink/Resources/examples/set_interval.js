var win = Titanium.UI.currentWindow;

var label = Ti.UI.createLabel({
	text:'Running...',
	font:{fontFamily:'Helvetica Neue',fontSize:24,fontWeight:'bold'},
	color:'black',
	textAlign:'center',
	width:'auto',
	height:'auto'
});

var act = Ti.UI.createActivityIndicator({
	bottom:10,
});
act.style = Titanium.UI.iPhone.ActivityIndicatorStyle.DARK;
act.font = {fontFamily:'Helvetica Neue', fontSize:15,fontWeight:'bold'};
act.color = 'black';
act.message = 'Waiting for next interval...';
act.show();

win.add(label);
win.add(act);

var started = new Date().getTime();

setInterval(function()
{
	act.hide();
	label.text = "3 sec interval fired in\n" + (new Date().getTime()-started)/1000 + " seconds";
	started = new Date().getTime();
	// just delay a bit on reshowing
	setTimeout(function()
	{
		label.text="Running...";
		act.show();
	},500);
},3000);

