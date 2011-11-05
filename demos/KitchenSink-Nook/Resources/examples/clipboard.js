var win = Titanium.UI.currentWindow;

// initialize to all modes
win.orientationModes = [
	Titanium.UI.PORTRAIT,
	Titanium.UI.LANDSCAPE_LEFT,
	Titanium.UI.LANDSCAPE_RIGHT
]; 

var source = Titanium.UI.createTextField({
	height:55,
	top:10,
	left:10,
	width:250,
	hintText: 'type here',
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});
win.add(source);

var copy = Titanium.UI.createButton({
	title:'Copy',
	height:50,
	top:70,
	left:10,
	width:250
});
copy.addEventListener('click', function()
{
	Titanium.UI.Clipboard.setText(source.value);
});
win.add(copy);

var dest = Titanium.UI.createTextField({
	height:55,
	top:140,
	left:10,
	width:250,
	hintText: 'paste here',
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});
win.add(dest);

var paste = Titanium.UI.createButton({
	title:'Paste',
	height:50,
	top:200,
	left:10,
	width:250
});
paste.addEventListener('click', function()
{
	if (Titanium.UI.Clipboard.hasText()) {
		dest.value = Titanium.UI.Clipboard.getText();
	} else {
		alert('No text on clipboard.');
	}
});
win.add(paste);

// TODO: add demo of copy/pasting images, URLs on iPhone
