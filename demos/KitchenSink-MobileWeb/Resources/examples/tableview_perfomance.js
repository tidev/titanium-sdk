var win = Ti.UI.currentWindow;
var view = Ti.UI.createView();
var tableView = Ti.UI.createTableView({
	top:0,
	height:280,
	width: 200,
	borderWidth:1,
	borderColor:"black"
});
var label = Ti.UI.createLabel({
	text:"running",
	width:"auto",
	height:"auto",
	bottom:15
});
view.add(tableView);
view.add(label);
win.add(view);

var count = 500;
var ts = new Date;

var data = [];

for (var cc=0;cc<count;cc++)
{
	var row = Ti.UI.createTableViewRow({title:"Row "+(cc+1)});
	data[cc] = row;
}

tableView.data = data;

var ts2 = new Date;
var duration = ts2.getTime() - ts.getTime();
var each = duration / count;
label.text = "Executed: "+count+" iterations\nTook: " + duration +" ms\n" + each.toFixed(2) + " ms/row";



var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top: 290,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

Ti.UI.currentWindow.add(closeButton);
