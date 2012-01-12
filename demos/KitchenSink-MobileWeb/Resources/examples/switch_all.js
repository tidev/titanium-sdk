var win = Titanium.UI.currentWindow;
win.backgroundColor = '#EEE';

var allSwitch = Titanium.UI.createSwitch({
	value:false,
	height: 40,
	width: 100,
	left: 200,
	top:30
});

var allSwitchTitle = Ti.UI.createLabel({
	text:'Select all',
	height: 40,
	width: 95,
	left: 100,
	top:30 
});

var option1Title = Ti.UI.createLabel({
	text:'Option 1',
	height: 40,
	width: 95,
	left: 100,
	top:80 
});

var option2Title = Ti.UI.createLabel({
	text:'Option 2',
	height: 40,
	width: 95,
	left: 100,
	top:130 
});

var option3Title = Ti.UI.createLabel({
	text:'Option 3',
	height: 40,
	width: 95,
	left: 100,
	top:180 
});
win.add(allSwitchTitle);
win.add(option1Title);
win.add(option2Title);
win.add(option3Title);

var switch1 = Titanium.UI.createSwitch({
	value:false,
	height: 40,
	width: 100,
	left: 200,
	top:80
});
var switch2 = Titanium.UI.createSwitch({
	value:false,
	height: 40,
	width: 100,
	left: 200,
	top:130
});
var switch3 = Titanium.UI.createSwitch({
	value:false,
	height: 40,
	width: 100,
	left: 200,
	top:180
});

allSwitch.addEventListener('change',function(e){
	if (allSwitch.value == true){
		switch1.value = true;
		switch2.value = true;
		switch3.value = true;
	}
	else{
		switch1.value = false;
		switch2.value = false;
		switch3.value = false;
	};
});

/*switch1.addEventListener('click', function(){
	if (switch1.value == false){
		allSwitch.value = false;
	};
})
*/
var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:50,
	width:140,
	fontSize: 16,
	top:240,
	left:90
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});



win.add(closeButton);


win.add(allSwitch);
win.add(switch1);
win.add(switch2);
win.add(switch3);

