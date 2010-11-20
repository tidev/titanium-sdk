var win = Titanium.UI.currentWindow;
win.backgroundImage='../images/chip.jpg';

var data =[];

var section = Ti.UI.createTableViewSection();
data.push(section);

// ROW 1
var row1 = Ti.UI.createTableViewRow();
row1.backgroundColor = '#670000';
row1.selectedBackgroundColor = '#670000';
row1.height = 60;
var item1 = Ti.UI.createLabel({
	color:'#fff',
	text:'Burger',
	font:{fontSize:20, fontWeight:'bold'},
	top:3,
	left:10,
	height:30,
	width:100
});
row1.add(item1);

var cost1 = Ti.UI.createLabel({
	color:'#fff',
	text:'$2.50',
	font:{fontSize:16},
	top:26,
	left:10,
	height:25,
	width:150
});
row1.add(cost1);

var add1 = Ti.UI.createButton({
	backgroundImage:'../images/groupedview/addDefault.png',
	height:27,
	width:27,
	top:15,
	right:10
});
add1.addEventListener('click', function()
{
	row1.backgroundColor = '#390A0E';
	setTimeout(function()
	{
		delete1.show();
	},100);
	add1.hide();
	cost1.animate({left:50, duration:100});
	item1.animate({left:50, duration:100});

});
row1.add(add1);

var delete1 = Ti.UI.createButton({
	backgroundImage:'../images/groupedview/minusDefault.png',
	height:27,
	width:27,
	top:15,
	left:10,
	visible:false
});
delete1.addEventListener('click', function()
{
	row1.backgroundColor = '#670000';
	delete1.hide();
	add1.show();
	cost1.animate({left:10, duration:100});
	item1.animate({left:10, duration:100});

});
row1.add(delete1);

section.add(row1);

// ROW 2
var row2 = Ti.UI.createTableViewRow();
row2.backgroundColor = '#670000';
row2.selectedBackgroundColor = '#670000';
row2.height = 60;
var item2 = Ti.UI.createLabel({
	color:'#fff',
	text:'Cheese Burger',
	font:{fontSize:20, fontWeight:'bold'},
	top:3,
	left:10,
	height:30,
	width:100
});
row2.add(item2);

var cost2 = Ti.UI.createLabel({
	color:'#fff',
	text:'$3.25',
	font:{fontSize:16},
	top:26,
	left:10,
	height:25,
	width:150
});
row2.add(cost2);

var add2 = Ti.UI.createButton({
	backgroundImage:'../images/groupedview/addDefault.png',
	height:27,
	width:27,
	top:15,
	right:10
});
add2.addEventListener('click', function()
{
	row2.backgroundColor = '#390A0E';

	setTimeout(function()
	{
		delete2.show();
	},100);

	add2.hide();
	cost2.animate({left:50, duration:100});
	item2.animate({left:50, duration:100});

});
row2.add(add2);

var delete2 = Ti.UI.createButton({
	backgroundImage:'../images/groupedview/minusDefault.png',
	height:27,
	width:27,
	top:15,
	left:10,
	visible:false
});
delete2.addEventListener('click', function()
{
	row2.backgroundColor = '#670000';
	delete2.hide();
	add2.show();
	cost2.animate({left:10, duration:100});
	item2.animate({left:10, duration:100});

});
row2.add(delete2);


section.add(row2);

var tableview = Titanium.UI.createTableView({
	data:data,
	style:Titanium.UI.iPhone.TableViewStyle.GROUPED,
	backgroundColor:'transparent',
	separatorColor:'#390A0E'
});

win.add(tableview);