var win = Ti.UI.currentWindow;

var redLabel = Ti.UI.createLabel({
	text: 'Red:',
	top: 10,
	left: 10,
	fontSize: 20
});

var greenLabel = Ti.UI.createLabel({
	text: 'Green:',
	top: 60,
	left: 10,
	fontSize: 20
});

var blueLabel = Ti.UI.createLabel({
	text: 'Blue:',
	top: 110,
	left: 10,
	fontSize: 20
});

var redField = Ti.UI.createTextField({
	top:10,
	left: 80,
	width: 40,
	height: 25,
	value: '0'
});

var greenField = Ti.UI.createTextField({
	top:60,
	left: 80,
	width: 40,
	height: 25,
	value: '0'
});

var blueField = Ti.UI.createTextField({
	top:110,
	left: 80,
	width: 40,
	height: 25,
	value: '0'
});

var colorLabel = Ti.UI.createLabel({
	left: 20,
	top: 160,
	fontSize: 25,
	text: '#000000'
});


var colorView = Ti.UI.createView({
	top:210,
	left: 10,
	width: 100,
	height: 100,
	backgroundColor: '#000000'
});

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:320,
	left:10,
	font:{fontSize:20}
});
Ti.UI.currentWindow.add(closeButton);

closeButton.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});


win.add(redLabel);
win.add(greenLabel);
win.add(blueLabel);
win.add(redField);
win.add(greenField);
win.add(blueField);
win.add(colorView);
win.add(colorLabel);
win.add(closeButton);


var changeColor = function(){
	
	var checkColor = function(checkedColor){
		var val = checkedColor;
		var returnVal = 0;
	switch(true){
		
		case 0 === val:
		returnVal = '00';
		break
		
		case 1 <= val && val <= 15:
		returnVal = '0' + checkedColor.toString(16);
		break
		
		case 16 <= val && val <= 255:
		returnVal = checkedColor.toString(16);
		break
		
		case val >= 256:
			returnVal = 'ff';
			switch(checkedColor){
				case 'red':
				redField.value = 255;
				break
				
				case 'green':
				greenField.value = 255;
				break

				case 'blue':
				blueField.value = 255;
				break
			} 
			break
		default: 
			returnVal = '00';
				
		  
	}	
	return returnVal;
	}
	var red = parseInt(redField.value);
	var green = parseInt(greenField.value);
	var blue = parseInt(blueField.value);

	red = checkColor(red);
	green = checkColor(green);
	blue = checkColor(blue);

	
	var color = '#'+red+green+blue;
	colorView.backgroundColor = color;
	colorLabel.text = color;
};

redField.addEventListener('change',changeColor);
greenField.addEventListener('change',changeColor);
blueField.addEventListener('change',changeColor);
