var win = Ti.UI.currentWindow;
win.backgroundColor = 'white';

var chooseObjectView = Ti.UI.createView({
	layout: 'vertical'
});
var createObjectButton = Ti.UI.createButton({
	title: 'Create object',
	top: 10,
	left: 60,
	height: 30,
	width: 200,
	font:{fontSize: 14}
});

var picker = Ti.UI.createPicker({
	top:10,
	left: 60,
	width: 200,
	font:{fontSize: 14}
});

picker.add([
	Ti.UI.createPickerRow({title:'Text Field'}),
	Ti.UI.createPickerRow({title:'Text Area'}),
	Ti.UI.createPickerRow({title:'Button'}),
	Ti.UI.createPickerRow({title:'Label'})
]);


chooseObjectView.add(createObjectButton);

createObjectButton.addEventListener('click', function(e){
	showObjectView(picker.getSelectedRow(0).title);
});

var closeButton1 = Ti.UI.createButton({
	title: 'Close window',
	top: 10,
	left: 60,
	height: 30,
	width: 200,
	font:{fontSize: 14}
});

chooseObjectView.add(closeButton1);

chooseObjectView.add(picker);

closeButton1.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});

win.add(chooseObjectView);

var workWithObjectView = Ti.UI.createView({
	top: 0,
	left: 0,
	width: 320,
	height: 455,
	backgroundColor: 'darkGray'
});

var hideObject = Ti.UI.createButton({
	title: 'Hide object',
	top: 10,
	left: 10,
	height: 30, 
	width: 145
});
workWithObjectView.add(hideObject);
hideObject.addEventListener('click', function(){if (object.isVisible == true) 
	{object.hide();
	object.isVisible = false;}})

var showObject = Ti.UI.createButton ({
	title: 'Show object',
	top: 10,
	left: 165,
	height: 30, 
	width: 145
});
workWithObjectView.add(showObject);
showObject.addEventListener('click', function(){if (object.isVisible == false) 
	{object.show();
	object.isVisible = true;}})
/*
var addObject = Ti.UI.createButton ({
	title: 'Add child obj',
	top: 55,
	left: 125,
	height: 30, 
	width: 110
});
workWithObjectView.add(addObject);
addObject.addEventListener('click', function(){
	var addLabel = Ti.UI.createLabel ({
		text: 'label',
		height: 25,
		width: 50,
		backgroundColor: 'red'	
	});

	object.add(addLabel);
});
*/
function listenerFunc(){
	alert('addEventListener works!');
}

var addListenerObject = Ti.UI.createButton ({
	title: 'Add event',
	top: 50,
	left: 10,
	height: 40, 
	width: 93
});
workWithObjectView.add(addListenerObject);
addListenerObject.addEventListener('click', function(){
	alert('Click object to see listeners');
	object.addEventListener('click', listenerFunc);
});

var removeListenerObject = Ti.UI.createButton ({
	title: 'Rm event',
	top: 50,
	left: 113,
	height: 40, 
	width: 93
});
workWithObjectView.add(removeListenerObject);
removeListenerObject.addEventListener('click', function(){object.removeEventListener('click', listenerFunc);})

var fireEventObject = Ti.UI.createButton({
	title: 'Fire event',
	top: 50,
	left: 216,
	height: 40, 
	width: 93
});
workWithObjectView.add(fireEventObject);
fireEventObject.addEventListener('click', function(){object.fireEvent('click');})

var bgColorProp = Ti.UI.createButton({
	title: 'bgColorProp',
	top: 105,
	left: 10,
	height: 30, 
	width: 145
});
workWithObjectView.add(bgColorProp);
var bgColorSet = false; 
bgColorProp.addEventListener('click', function(){
	object.backgroundColor = bgColorSet ? '' :'green';
	object.backgroundSelectedColor = bgColorSet ? '' : 'red';
	bgColorSet = !bgColorSet;
});

var bgImageProp = Ti.UI.createButton ({
	title: 'bgImageProp',
	top: 105,
	left: 165,
	height: 30, 
	width: 145
});
workWithObjectView.add(bgImageProp);
var bgImageSet = false;
bgImageProp.addEventListener('click', function(){
	object.backgroundImage = bgImageSet ? '' : '/images/appcelerator_small.png';
	object.backgroundSelectedImage = bgImageSet ? '' : '/images/appcelerator_small.png';

	bgImageSet = !bgImageSet;
});

var bgGradientProp = Ti.UI.createButton ({
	title: 'bgGradientProp',
	top: 150,
	left: 10,
	height: 30, 
	width: 145
});
workWithObjectView.add(bgGradientProp);
var bgGradientSet = false;
bgGradientProp.addEventListener('click', function(){
	object.backgroundGradient = bgGradientSet ? {} : {
		type: 'linear',
		// colors: ['#0000ff','#ffffff'],
		// startPoint: {x:'left',y:'top'},
		// endPoint: {x:'left',y:'bottom'},
		backFillStart: true,
		colors: ['#0000ff','#ffffff'],
		startPoint: {x:0,y:0},
		endPoint: {x:50,y:50},
	};

	bgGradientSet = !bgGradientSet;
});

var borderProp = Ti.UI.createButton ({
	title: 'borderProp',
	top: 150,
	left: 165,
	height: 30, 
	width: 145
});
workWithObjectView.add(borderProp);
var borderSet = false;
borderProp.addEventListener('click', function(){
	object.borderWidth = borderSet ? 1 : 8;
	object.borderRadius = borderSet ? 0 : 5;
	object.borderColor = borderSet ? '#000000' : '#FF0000';
	borderSet = !borderSet;
});

var fontProp = Ti.UI.createButton ({
	title: 'fontProp',
	top: 195,
	left: 10,
	height: 30, 
	width: 145
});
workWithObjectView.add(fontProp);
var fontPropSet = false;
fontProp.addEventListener('click', function(){
	var fontSize = fontPropSet ? '20' : 30;
	var fontFamily = fontPropSet ? '' : 'Helvetica Neue';
	var fontStyle = fontPropSet ? 'normal' : 'italic';
	var fontWeight = fontPropSet ? 'normal' : 'bold';
	object.font = {
		fontSize: fontSize,
		fontFamily: fontFamily,
		fontStyle: fontStyle,
		fontWeight: fontWeight
	};
	fontPropSet = !fontPropSet;
});

var opacityVisible = Ti.UI.createButton ({
	title: 'opacity',
	top: 195,
	left: 165,
	height: 30, 
	width: 145
});
workWithObjectView.add(opacityVisible);
var opacitySet = false;
opacityVisible.addEventListener('click', function(){
	object.opacity = opacitySet ? 1 : 0.5;
	opacitySet = !opacitySet;
});

var removeObject = Ti.UI.createButton ({
	title: 'Remove object',
	top: 370,
	left: 60,
	height: 30,
	width: 200
});
workWithObjectView.add(removeObject);
removeObject.addEventListener('click', function(){
	workWithObjectView.remove(object);
	object = null;
	chooseObjectView.show();
	workWithObjectView.hide();
});

var closeButton = Ti.UI.createButton ({
	title: 'Close window',
	top: 410,
	left: 60,
	height: 30,
	width: 200
});
workWithObjectView.add(closeButton);
closeButton.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});

win.add(workWithObjectView);
workWithObjectView.hide();

function getNewObject(typ){
	switch(typ) {
		case "Text Field": 
			return Ti.UI.createTextField({
				value: 'Text field',
				color: 'red',
				top: 250,
				left: 60,
				width: 200,
				height: 100,
				font:{fontSize: 20},
				isvisible: true
			});
		case 'Text Area':
			return Ti.UI.createTextArea ({
				value: 'Text area',
				color: 'red',
				top: 250,
				left: 60,
				width: 200,
				height: 100,
				font:{fontSize: 20},
				borderStyle:Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
				borderWidth:2,
    			borderColor:'#bbbbbb',
    			borderRadius:5
			});
		case 'Button':
			return Ti.UI.createButton({
				title: 'Button',
				top: 250,
				left: 60,
				width: 200,
				height: 50,
				font:{fontSize: 20},
			});
		case 'Label':
			return Ti.UI.createLabel({
				text: 'Label',
				backgroundColor: 'yellow',
				top: 250,
				left: 60,
				width: 200,
				height: 100,
				font:{fontSize: 20},
			});
	}
}

var object;
function showObjectView(typ){
	object = getNewObject(typ);
	if(!object){
		return;
	}
	object.isVisible = true;
	workWithObjectView.add(object);
	chooseObjectView.hide();
	workWithObjectView.show();
}

