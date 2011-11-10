var win = Titanium.UI.currentWindow;

//
// BASIC SWITCH
//
var basicSwitchLabel = Titanium.UI.createLabel({
	text:'Basic Switch value = false' ,
	color:'#777',
	font:{
		fontFamily:'Helvetica Neue',
		fontSize:18
	},
	textAlign:'center',
	top:10,
	height:'auto'
});

var basicSwitch = Titanium.UI.createSwitch({
	value:false,
	top:50,
	height: 60,
	width: 120
});
basicSwitch.addEventListener('change',function(e)
{
	basicSwitchLabel.text = 'Basic Switch value = ' + e.value + ' act val ' + basicSwitch.value;
});

//
// CHANGE SWITCH
//
var changeButton = Titanium.UI.createButton({
	title:'Change Switch',
	height:50,
	width:200,
	top:120
});
changeButton.addEventListener('click', function()
{
	if (basicSwitch.value === false)
	{
		basicSwitch.value = true;
	}
	else
	{
		basicSwitch.value = false;
	}
});

//
// HIDE/SHOW SWITCH
//
var hideShowButton = Titanium.UI.createButton({
	title:'Hide/Show Switch',
	height:50,
	width:200,
	top:180
});
var hidden=false;
hideShowButton.addEventListener('click', function()
{
	if (hidden === true)
	{
		basicSwitch.show();
		hidden=false;
	}
	else
	{
		basicSwitch.hide();
		hidden=true;
	}
});

win.add(basicSwitchLabel);
win.add(basicSwitch);
win.add(changeButton);
win.add(hideShowButton);

//
// CHECKBOX
//
var checkBox = Titanium.UI.createSwitch({
		style:Titanium.UI.Android.SWITCH_STYLE_CHECKBOX,
		title:"CheckBox: " + false,
		color: '#fff',
		value:false,
		top:240
});
checkBox.addEventListener('change', function(e) {
	checkBox.title = "CheckBox: " + e.value;
});

//
// TOGGLEBUTTON W/ TITLE
//
var titleSwitch = Titanium.UI.createSwitch({
		style:Titanium.UI.Android.SWITCH_STYLE_TOGGLEBUTTON,
		titleOff:"LO",
		titleOn:"HI",
		value:false,
		top:290,
		height: 60,
		width: 120
});

win.add(checkBox);
win.add(titleSwitch);

