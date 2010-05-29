var w = Ti.UI.currentWindow;
var tv = Ti.UI.createTableView({
	scrollable:false
});
w.add(tv);

var data = [];
var count = 5;

for (var c=0;c<count;c++)
{
	var row = Ti.UI.createTableViewRow({title:"Row "+(c+1)});
	data[c] = row;
}

tv.data = data;

