var win = Titanium.UI.currentWindow;
var tab = Titanium.UI.currentTab;

var l = Titanium.UI.createLabel({
	top:10,
	width:300,
	height:'auto',
	color:'#777',
	font:{fontSize:16},
	text:'We are going to place custom properties on a new window then retrieve them in the new window.'
});
win.add(l);
var b = Titanium.UI.createButton({
	title:'Launch Window',
	height:40,
	width:200,
	top:100
});

b.addEventListener('click', function()
{
	// set properties on the window object, then open.  we will print them out in the new window
	var w2 = Titanium.UI.createWindow({title:'Custom Prop Test', url:'custom_properties_2.js'});
	w2.stringProp1 = 'Foo';
	w2.stringProp2 = 'Bar';
	w2.numProp1 = 1;
	w2.numProp2 = 2;
	w2.objProp1 = {name:'Jane', age:30};
	w2.myFunc = function()
	{
		return 'myFunc was called';
	};
	tab.open(w2,{animated:true});	
});
win.add(b);

