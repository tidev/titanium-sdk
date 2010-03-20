var win = Titanium.UI.currentWindow;
win.backgroundColor = 'black';

var picker = Ti.UI.createPicker();

function addRow(x)
{
	var row = Ti.UI.createPickerRow();
	var img = Ti.UI.createImageView({url:'../images/imageview/'+x+'.jpg',width:40,height:40});
	row.add(img);
	picker.add(row);
}

for(var c=0;c<=10;c++)
{
	addRow(c);
}

// turn on the selection indicator (off by default)
picker.selectionIndicator = true;

win.add(picker);

var label = Ti.UI.createLabel({
	text:'Make a move',
	top:10,
	width:'auto',
	height:'auto',
	textAlign:'center',
	color:'white'
});
win.add(label);


picker.addEventListener('change',function(e)
{
	Ti.API.info("You selected row: "+e.row+", column: "+e.column+", custom_item: "+e.row.custom_item);
	label.text = "row index: "+e.rowIndex+", column index: "+e.columnIndex;
});
