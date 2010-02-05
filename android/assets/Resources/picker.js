var win = Ti.UI.createWindow({
	backgroundColor : '#ccc'
});

var value = new Date();
value.setFullYear(2008);
value.setMonth(0);
value.setDate(1);

var datePicker = Ti.UI.createDatePicker({
    left : '10px',
    top : '10px',
    height: '200px',
    value: value
});

var button = Ti.UI.createButton({
    title: 'set date',
    top: '210px',
    left: '10px',
    width: '75px',
    height: '40px'
});

button.addEventListener("click", function(e) {
    var d = new Date();
    d.setFullYear(2005);
    d.setMonth(3);
    d.setDate(23);
    datePicker.value = d;
});

/*var timePicker = Ti.UI.createTimePicker({
    left : '210px',
    top : '210px',
    height: '200px'
});*/

win.add(datePicker);
//win.add(timePicker);
win.add(button);

win.open();
