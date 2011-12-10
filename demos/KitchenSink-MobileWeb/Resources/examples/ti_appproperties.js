var win = Ti.UI.currentWindow;
win.backgroundColor = '#eee';
var addView = Ti.UI.createView ({
	borderRadius: 7,
	top: 5,
	left: 5,
	width: 310,
	height: 75,
	borderWidth: 1,
	borderColor: '#000'
});

var propNameField = Ti.UI.createTextField({
	borderWidth: 1,
	borderColor: '#000',
	borderRadius: 3,
	top: 5,
	left: 5,
	width: 145,
	height: 30,
	fontSize: 18,
	backgroundColor:'#FFF',
	color:'#000',
	hintText: 'Property name'
});


var propValField = Ti.UI.createTextField({
	borderWidth: 1,
	borderColor: '#000',
	borderRadius: 3,
	top: 5,
	left: 160,
	width: 145,
	height: 30,
	fontSize: 18,
	backgroundColor:'#FFF',
	color:'#000',
	hintText: 'Value'
});

var addPropButton = Ti.UI.createButton({
	title: 'Add property',
	top: 40,
	left: 50,
	width: 210,
	height: 30,
	borderRadius:5,
	fontSize: 20
});

win.add(addView);
addView.add(propNameField);
addView.add(propValField);
addView.add(addPropButton);

var rmView = Ti.UI.createView ({
	borderRadius: 7,
	top: 85,
	left: 5,
	width: 310,
	height: 40,
	borderWidth: 1,
	borderColor: '#000'
});

var rmPropField = Ti.UI.createTextField({
	borderWidth: 1,
	borderColor: '#000',
	borderRadius: 3,
	left: 5,
	top: 5,
	height: 30,
	width: 145,
	backgroundColor:'#FFF',
	color:'#000',
	fontSize: 18,
	hintText: 'Property name'
});

var rmPropButton = Ti.UI.createButton({
	title: 'Remove',
	top: 5,
	left: 160,
	width: 145,
	height: 30,
	borderRadius:5,
	fontSize:20
});

win.add(rmView);
rmView.add(rmPropField);
rmView.add(rmPropButton);

var getView = Ti.UI.createView ({
	borderWidth: 1,
	borderColor: '#000',
	borderRadius: 7,
	top: 130,
	left: 5,
	width: 310,
	height: 75
});

var getNameField = Ti.UI.createTextField({
	borderWidth: 1,
	borderColor: '#000',
	borderRadius: 3,
	top: 5,
	left: 5,
	width: 145,
	height: 30,
	backgroundColor:'#FFF',
	color:'#000',
	fontSize: 18,
	hintText: 'Property name'
});


var getValField = Ti.UI.createTextField({
	borderWidth: 1,
	borderColor: '#000',
	borderRadius: 3,
	top: 5,
	left: 160,
	width: 145,
	height: 30,
	fontSize: 18,
	backgroundColor:'#FFF',
	color:'#000',
	enabled:false
});

var getValButton = Ti.UI.createButton({
	title: 'Get value',
	top: 40,
	left: 50,
	width: 210,
	height: 30,
	borderRadius:5,
	fontSize: 20
});

win.add(getView);
getView.add(getNameField);
getView.add(getValField);
getView.add(getValButton);

var listLabel = Ti.UI.createLabel({
	text: 'List of properties',
	top: 210,
	left: 50,
	width: 220,
	height: 25,
	fontSize: 20,
});

var listTextArea = Ti.UI.createTextArea({
	left: 5,
	top: 240,
	width: 310,
	height: 60,
	backgroundColor:'#FFF',
	color:'#000',
	fontSize: 18,
	borderRadius: 5
});

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:310,
	left:5,
	top:305,
	font:{fontSize:20}
});
win.add(closeButton);

closeButton.addEventListener('click', function(){
	win.close();
});

win.add(listLabel);
win.add(listTextArea);

addPropButton.addEventListener('click',function(){
	Ti.App.Properties.setString(propNameField.value,propValField.value);
	listTextArea.value = Ti.App.Properties.listProperties();
	
});

rmPropButton.addEventListener('click',function(){
	Ti.App.Properties.removeProperty(rmPropField.value);
	listTextArea.value = Ti.App.Properties.listProperties();
});

getValButton.addEventListener('click',function(){
	getValField.value = Ti.App.Properties.getString(getNameField.value);	
});



















