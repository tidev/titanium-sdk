var view = Ti.UI.createView({
	layout:'vertical',
	backgroundColor:'#fff'	
});


var changeButton = Ti.UI.createButton({
	title:"Set Value to \"grapes\"",
	height:40,
	top:10,
	left:10,
	width:300,
	font:{fontSize:20}
});
view.add(changeButton);

changeButton.addEventListener('click', function()
{
	picker.setSelectedRow(0,3,false);
});

var closeButton = Ti.UI.createButton({
	title:'Close',
	height:40,
	top:10,
	left:10,
	width:300,
	font:{fontSize:20}
});
view.add(closeButton);

closeButton.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});
Ti.UI.currentWindow.add(view);

var picker = Ti.UI.createPicker({top:10});

var data = [];
data[0]=Ti.UI.createPickerRow({title:'Bananas'});
data[1]=Ti.UI.createPickerRow({title:'Strawberries'});
data[2]=Ti.UI.createPickerRow({title:'Mangos'});
data[3]=Ti.UI.createPickerRow({title:'Grapes'});

// turn on the selection indicator (off by default)
picker.selectionIndicator = true;

picker.add(data);

picker.addEventListener('change', function(e){
	alert('change fired ' + e.row + ' index ' + e.rowIndex)
});
view.add(picker);
