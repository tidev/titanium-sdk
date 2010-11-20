var win = Titanium.UI.currentWindow;
win.backgroundColor = 'black';

var picker = Ti.UI.createPicker();

var data = [
	{title:'Bananas',custom_item:'b',fontSize:18},
	{title:'Strawberries',custom_item:'s',fontSize:20},
	{title:'Mangos',custom_item:'m',fontSize:22,selected:true},
	{title:'Grapes',custom_item:'g',fontSize:24}
];

picker.add(data);


// turn on the selection indicator (off by default)
picker.selectionIndicator = true;

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

var label2 = Ti.UI.createLabel({
	text:'',
	bottom:16,
	zIndex:10,
	width:'auto',
	height:'auto',
	textAlign:'center',
	color:'white'
});
win.add(label2);

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
	label2.text = "row value: "+e.selectedValue[0];
});
