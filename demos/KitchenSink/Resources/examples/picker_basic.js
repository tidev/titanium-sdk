var win = Titanium.UI.currentWindow;
win.backgroundColor = 'black';

var picker = Ti.UI.createPicker();

var data = [];
data[0]=Ti.UI.createPickerRow({title:'Bananas'});
data[1]=Ti.UI.createPickerRow({title:'Strawberries'});
data[2]=Ti.UI.createPickerRow({title:'Mangos'});
data[3]=Ti.UI.createPickerRow({title:'Grapes'});

picker.add(data);

win.add(picker);