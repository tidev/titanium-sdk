/*global Ti,Titanium,alert */
var w = Ti.UI.currentWindow;
var status = Ti.UI.createLabel({
	top: 5, left: 5, right: 5, height: 40, textAlign:'center',
	font: {
		fontSize: 24	
	}
});
w.add(status);

function showStatus(s) {status.text = s;}

var names = ['Joanie', 'Mickey', 'Jean-Pierre', 'Gustav', 'Raul', 'Mimi', 'Emily', 'Sandra', 'Carrie', 'Chachi'];
var verbs = ['loves', 'likes', 'visits', 'loathes', 'waves to', 'babysits', 'accompanies', 'teaches', 'announces', 'supports', 'knows', 'high-fives'];

var rows1 = [];
for (var i = 0; i < names.length; i++) {
	rows1.push(Ti.UI.createPickerRow({title: names[i]}));
}

var rows2 = [];
for (i = 0; i < verbs.length; i++) {
	rows2.push(Ti.UI.createPickerRow({title: verbs[i]}));
}

var rows3 = [];
for (i = (names.length -1); i >=0; i--) {
	rows3.push(Ti.UI.createPickerRow({title: names[i]}));
}

var column1 = Ti.UI.createPickerColumn( {
	rows: rows1, font: {fontSize: "24"}
});
var column2 = Ti.UI.createPickerColumn( {
	rows: rows2, font: {fontSize: "24"}
});
var column3 = Ti.UI.createPickerColumn( {
	rows: rows3, font: {fontSize: "24"}
});

var picker = Ti.UI.createPicker({
	useSpinner: true, visibleItems: 7,
	type : Ti.UI.PICKER_TYPE_PLAIN,
	top: 170, height: 300,
	columns: [ column1, column2, column3 ]
});

picker.addEventListener('change', function(e) {
	showStatus(e.selectedValue[0] + " " + e.selectedValue[1] + " " + e.selectedValue[2]);
});

w.add(picker);
var btnSelect = Ti.UI.createButton({
	left: 5, height: 40, top: 70, width: 150,
	title: 'Select idxs 2/4/6'
});
btnSelect.addEventListener('click', function() {
	picker.setSelectedRow(0, 2);
	picker.setSelectedRow(1, 4);
	picker.setSelectedRow(2, 6);
});
w.add(btnSelect);

var btnAdd = Ti.UI.createButton({
	left: 165, height: 40, top: 70, width: 150,
	title: 'Add "Manny"'
});
btnAdd.addEventListener('click', function() {
	picker.columns[0].addRow(Ti.UI.createPickerRow({title: 'Manny'}));
	picker.columns[2].addRow(Ti.UI.createPickerRow({title: 'Manny'}));
	showStatus('"Manny" added to columns 0 & 2');
});
w.add(btnAdd);

var btnRemove = Ti.UI.createButton({
	left: 5, height: 40, top: 120, width: 150,
	title: 'Remove all idx 3'
});
btnRemove.addEventListener('click', function() {
	picker.columns[0].removeRow( picker.columns[0].rows[3] );
	picker.columns[1].removeRow( picker.columns[1].rows[3] );
	picker.columns[2].removeRow( picker.columns[2].rows[3] );
	showStatus("value at index 3 of each col. removed");
});
w.add(btnRemove);

var btnCheckSelection = Ti.UI.createButton({
	left: 165, height: 40, top: 120, width: 150,
	title: 'Check sel.'
});
btnCheckSelection.addEventListener('click', function() {
	showStatus(picker.getSelectedRow(0).title + ' ' + picker.getSelectedRow(1).title + ' ' + picker.getSelectedRow(2).title);
	var color = status.backgroundColor || w.backgroundColor || "black";
	status.backgroundColor = 'red';
	setTimeout(function(){status.backgroundColor=color;},1000);
});
w.add(btnCheckSelection);
