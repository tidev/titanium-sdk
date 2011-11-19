var win = Titanium.UI.currentWindow;
win.backgroundColor = '#EEE';

//
// BASIC SWITCH
//
var basicSwitchLabel = Titanium.UI.createLabel({
	text:'Basic Switch value = false' ,
	color:'#999',
	font:{
		fontFamily: 'Helvetica Neue',
		fontSize: 15
	},
	textAlign:'center',
	top:10,
	height:'auto'
});

var basicSwitch = Titanium.UI.createSwitch({
	title: "Default title",
	value:false,
	top:40
});

basicSwitch.addEventListener('change',function(e){
	basicSwitchLabel.text = 'Basic Switch value = ' + e.value + ' act val ' + basicSwitch.value;
});

//
// CHANGE SWITCH
//
var changeButton = Titanium.UI.createButton({
	title:'Toggle Switch',
	height:40,
	width:200,
	top:70,
	fontSize:20
});
changeButton.addEventListener('click', function() {
	basicSwitch.value = !basicSwitch.value;
});

//
// HIDE/SHOW SWITCH
//
var hideShowButton = Titanium.UI.createButton({
	title:'Hide/Show Switch',
	height:40,
	width:200,
	top:120,
	fontSize:20
});

var hidden = false;
hideShowButton.addEventListener('click', function() {
	hidden ? basicSwitch.show() : basicSwitch.hide();
	hidden = !hidden;
});

//
// CHANGE title
//
var updateTitleButton = Titanium.UI.createButton({
	title:'Change title',
	height:40,
	width:200,
	top:170,
	fontSize:20
});

updateTitleButton.addEventListener('click', function() {
	basicSwitch.title = "Switch title " + Math.floor(Math.random() * 1000);
});


var closeButton = Ti.UI.createButton({
	title:'Close',
	height:40,
	top:220,
	width:200,
	fontSize:20
});

closeButton.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});

win.add(basicSwitchLabel);
win.add(basicSwitch);
win.add(changeButton);
win.add(hideShowButton);
win.add(updateTitleButton);
win.add(closeButton);
