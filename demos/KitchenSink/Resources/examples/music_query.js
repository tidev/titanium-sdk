var win = Ti.UI.currentWindow;

var desc1 = Ti.UI.createLabel({
	left:10,
	width:"auto",
	height:"auto",
	text:'Title: '
});
var field1 = Ti.UI.createTextField({
	right:10,
	width:200,
	height:30,
	clearOnEdit:true,
	borderStyle:Ti.UI.INPUT_BORDERSTYLE_BEZEL
});
var exact1 = Ti.UI.createLabel({
	left:10,
	top:70,
	width:"auto",
	height:"auto",
	text:'Exact: '
});
var switch1 = Ti.UI.createSwitch({
	value:true,
	right:10,
	top:70
});
var v1 = Ti.UI.createView({
	top:0,
	height:"auto",
});
v1.add(desc1);
v1.add(field1);
v1.add(exact1);
v1.add(switch1);
win.add(v1);

var desc2 = Ti.UI.createLabel({
	left:10,
	width:"auto",
	height:"auto",
	text:'Artist: '
});
var field2 = Ti.UI.createTextField({
	right:10,
	width:200,
	height:30,
	clearOnEdit:true,
	borderStyle:Ti.UI.INPUT_BORDERSTYLE_BEZEL
});
var exact2 = Ti.UI.createLabel({
	left:10,
	top:70,
	width:"auto",
	height:"auto",
	text:'Exact: '
});
var switch2 = Ti.UI.createSwitch({
	value:true,
	right:10,
	top:70
});
var v2 = Ti.UI.createView({
	top:90,
	height:"auto"
});
v2.add(desc2);
v2.add(field2);
v2.add(exact2);
v2.add(switch2);
win.add(v2);

var desc3 = Ti.UI.createLabel({
	left:10,
	width:"auto",
	height:"auto",
	text:'Genre: '
});
var field3 = Ti.UI.createTextField({
	right:10,
	width:200,
	height:30,
	clearOnEdit:true,
	borderStyle:Ti.UI.INPUT_BORDERSTYLE_BEZEL
});
var exact3 = Ti.UI.createLabel({
	left:10,
	top:70,
	width:"auto",
	height:"auto",
	text:'Exact: '
});
var switch3 = Ti.UI.createSwitch({
	value:true,
	right:10,
	top:70
});
var v3 = Ti.UI.createView({
	top:180,
	height:"auto"
});
v3.add(desc3);
v3.add(field3);
v3.add(exact3);
v3.add(switch3);
win.add(v3);

var button = Ti.UI.createButton({
	width:200,
	bottom:20,
	height:40,
	title:'Query! [Check your log]'
});
button.addEventListener('click', function() {
	var query = {}
	if (field1.value != '') {
		query['title'] = {value:field1.value, exact:switch1.value};
	}
	if (field2.value != '') {
		query['artist'] = {value:field2.value, exact:switch2.value};
	}
	if (field3.value != '') {
		query['genre'] = {value:field3.value, exact:switch3.value};
	}
	
	var result = Ti.Media.queryMusicLibrary(query);
	
	if (result.length == 0) {
		Ti.API.info("No results!");
	}
	else {
		for (var i=0; i < result.length; i++) {
			Ti.API.info(i+': ('+result[i].title+','+result[i].artist+','+result[i].genre+')');
		}
	}
});
win.add(button);