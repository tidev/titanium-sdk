var win = Ti.UI.createWindow({
    backgroundColor: 'white'
});

var camera = Ti.UI.createButton({
    systemButton : Titanium.UI.iPhone.SystemButton.CAMERA,
});

var cancel = Ti.UI.createButton({
    systemButton : Titanium.UI.iPhone.SystemButton.CANCEL
});
cancel.addEventListener("click", function(){
	textfield.blur();
});

var flexSpace = Ti.UI.createButton({
    systemButton : Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});

var textfield = Ti.UI.createTextField({
    borderStyle : Ti.UI.INPUT_BORDERSTYLE_BEZEL,
    hintText : 'Focus to see keyboard with toolbar',
    keyboardToolbar : [camera, flexSpace, cancel],
    keyboardToolbarColor : '#999',
    keyboardToolbarHeight : 40,
    top : 80,
    width : 300, height : 35
});

win.add(textfield);
win.open();
