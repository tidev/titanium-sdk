var win = Ti.UI.currentWindow;

var values = {cancel:function() {info.text = 'Cancelled';}};
var show = Ti.UI.createButton({
	title:'Show picker',
	bottom:20,
	width:200,
	height:40
});
show.addEventListener('click', function() {
	Titanium.Contacts.showContacts(values);
});

var info = Ti.UI.createLabel({
	text:'',
	bottom:70,
	height:'auto',
	width:'auto'
});

var v1 = Ti.UI.createView({
	top:20,
	width:300,
	height:40,
	left:10
});
var l1 = Ti.UI.createLabel({
	text:'Animated:',
	left:0,
});
var s1 = Ti.UI.createSwitch({
	value:true,
	right:10,
});
s1.addEventListener('change', function() {
	if (s1.value) {
		values.animated = true;
	}
	else {
		values.animated = false;
	}
});
v1.add(l1);
v1.add(s1);

var v2 = Ti.UI.createView({
	top:70,
	width:300,
	height:40,
	left:10
});
var l2 = Ti.UI.createLabel({
	text:'Address only:',
	left:0,
});
var s2 = Ti.UI.createSwitch({
	value:true,
	right:10,
});
s2.addEventListener('change', function() {
	values.fields = ['address'];
});
v2.add(l2);
v2.add(s2);

var v3 = Ti.UI.createView({
	top:120,
	width:300,
	height:40,
	left:10
});
var l3 = Ti.UI.createLabel({
	text:'Stop on person:',
	left:0
});
var s3 = Ti.UI.createSwitch({
	value:true,
	right:10
});
s3.addEventListener('change', function() {
/*
	values.selectedPerson = function(e) {
		info.text = e.person.fullName;
	}
*/
});
v3.add(l3);
v3.add(s3);

var v4 = Ti.UI.createView({
	top:170,
	width:300,
	height:40,
	left:10
});
var l4 = Ti.UI.createLabel({
	text:'Stop on property:',
	left:0
});
var s4 = Ti.UI.createSwitch({
	value:true,
	right:10
});
s4.addEventListener('change', function() {
	values.selectedProperty = function(e) {
		info.text = e.label + ':' + e.value.Street;
	}
});
v4.add(l4);
v4.add(s4);

win.add(v1);
win.add(v2);
win.add(v3);
win.add(v4);
win.add(info);
win.add(show);