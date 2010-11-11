var win = Ti.UI.currentWindow;

var l1 = Ti.UI.createLabel({
	text : 'Keyboard or Click focus TextField to Show Keyboard',
	top : 20, left : 10, right : 10, height : 40
});
win.add(l1);

var tf1 = Ti.UI.createTextField({
	top: 70, left: 10, right: 10, height:40,
	softKeyboardOnFocus : Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS
});

win.add(tf1);

var btn = Ti.UI.createButton({
	title: 'Request Hide Keyboard',
	top: 120, left: 10, right: 10, height:40,
	softKeyboardOnFocus : Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS
});
win.add(btn);
btn.addEventListener('click', function() {
	Ti.UI.Android.hideSoftKeyboard();
});

//tf1.focus();