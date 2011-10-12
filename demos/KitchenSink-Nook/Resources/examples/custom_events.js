var win = Titanium.UI.currentWindow;

//
// FIRE EVENT WITH DATA ARRAY
//
var b1 = Titanium.UI.createButton({
	title:'Button 1\n\'event_one\'',
	width:200,
	height:60,
	top:10
});
b1.addEventListener('click', function()
{
	Titanium.App.fireEvent('event_one',{data:['1','2','3']});
});

win.add(b1);

//
// FIRE EVENT WITH OBJECT DATA
//
var b2 = Titanium.UI.createButton({
	title:'Button 2\n\'event_two\'',
	width:200,
	height:60,
	top:80
});
b2.addEventListener('click', function()
{
	Titanium.App.fireEvent('event_two',{name:'Foo', city:'Palo Alto'});
});

win.add(b2);


//
// FIRE EVENT WITH OBJECT DATA
//
var b3 = Titanium.UI.createButton({
	title:'Button 3\n\'click\' Button 2',
	width:200,
	height:60,
	top:150
});
b3.addEventListener('click', function()
{
	b2.fireEvent('click');
});
win.add(b3);

