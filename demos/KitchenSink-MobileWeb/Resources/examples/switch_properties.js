var win = Titanium.UI.currentWindow;
win.backgroundColor = '#EEE';

var button = Ti.UI.createButton({
	title: 'I am a button!',
	left: 50,
	top: 10,
	width: 220,
	height: 50
});

var changeSwitch = Titanium.UI.createSwitch({
	value:false,
	height: 40,
	width: 100,
	left: 200,
	top:70
});

var changeTitle = Ti.UI.createLabel({
	text:'Change title',
	height: 40,
	width: 120,
	left: 75,
	top:70 
});

var enabledTitle = Ti.UI.createLabel({
	text:'Enabled',
	height: 40,
	width: 120,
	left: 75,
	top:120 
});

var visibleTitle = Ti.UI.createLabel({
	text:'Visible',
	height: 40,
	width: 120,
	left: 75,
	top:170 
});

var enabledSwitch = Titanium.UI.createSwitch({
	value:true,
	height: 40,
	width: 100,
	left: 200,
	top:120
});

var visibleSwitch = Titanium.UI.createSwitch({
	value:true,
	height: 40,
	width: 100,
	left: 200,
	top:170
});

var closeButton = Ti.UI.createButton({
	title: 'Close Window',
	left: 50,
	top: 220,
	width: 220,
	height: 50
});
win.add(changeTitle);
win.add(enabledTitle);
win.add(visibleTitle);
win.add(closeButton);
win.add(button);
win.add(changeSwitch);
win.add(enabledSwitch);
win.add(visibleSwitch);

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

changeSwitch.addEventListener('change', function(){
	if (changeSwitch.value){
	button.title = 'Title changed!';
	}
	else{
	button.title = 'I am a button!';
	}
});

enabledSwitch.addEventListener('change', function(){
	if (enabledSwitch.value){
		button.enabled = true;
	}
	else{
		button.enabled = false;
	};
	
});

visibleSwitch.addEventListener('change', function(){
	if (visibleSwitch.value){
		button.visible = true;
		changeSwitch.enabled = true;
		enabledSwitch.enabled = true;
	}
	else{
		button.visible = false;
		changeSwitch.enabled = false;
		enabledSwitch.enabled = false;
	};
	
});







