var win = Titanium.UI.currentWindow;
win.backgroundColor = 'black';

var picker = Ti.UI.createPicker();

var data = [];
data[0]=Ti.UI.createPickerRow({title:'Bananas',custom_item:'b'});
data[1]=Ti.UI.createPickerRow({title:'Strawberries',custom_item:'s'});
data[2]=Ti.UI.createPickerRow({title:'Mangos',custom_item:'m'});
data[3]=Ti.UI.createPickerRow({title:'Grapes',custom_item:'g'});

// turn on the selection indicator (off by default)
picker.selectionIndicator = true;

picker.add(data);

win.add(picker);

var label = Ti.UI.createLabel({
	text:'Make a move',
	top:6,
	width:'auto',
	height:'auto',
	textAlign:'center',
	color:'white'
});
win.add(label);

var button = Ti.UI.createButton({
	title:'Set to Grapes',
	top:34,
	width:120,
	height:30
});
win.add(button);

button.addEventListener('click',function()
{
	// column, row, animated (optional)
	picker.setSelectedRow(0,3,true);
});

picker.addEventListener('change',function(e)
{
	Ti.API.info("You selected row: "+e.row+", column: "+e.column+", custom_item: "+e.row.custom_item);
	label.text = "row index: "+e.rowIndex+", column index: "+e.columnIndex;
});

picker.setSelectedRow(0,1,false);
