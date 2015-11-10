//this sets the background color of the master UIView (when there are no windows/tab groups on it)
var previousePos = 0;
var win = Titanium.UI.createWindow({
	backgroundColor : "#FFFFFF"
});

var bswitchingViews = false;

var tab1 = Ti.UI.createTab({
    window: win,
    title: 'Normal View'
});

var view = Titanium.UI.createView({
   borderRadius:10,
   backgroundColor:'blue',
   width:Ti.UI.FILL,
   height:Ti.UI.FILL
});

var label1 = Ti.UI.createLabel({
    text : 'Main Screen',
    accessibilityLabel : 'Label on first Scrollview',
    color : 'white'
});

var button1 = Ti.UI.createButton({
	title : 'TouchEnd Button',
	color : 'White',
	top 	: -40,
	left	: 5,
   	width 	: 150,
   	height	: 150


});


var forceButton = Ti.UI.createButton({
	title : 'Enable/Dissable',
	color : 'White',
	top 	: -40,
	right	: 10,
   	width 	: 180,
   	height	: 150


});

forceButton.addEventListener("singletap",function (e) { 
	bswitchingViews = !bswitchingViews; 
	label2.text = 'Enables/Dissables switching between views with force touch. Current status =' + bswitchingViews;
});

var label2 = Ti.UI.createLabel({
    text : 'Enables/Disables switching between views with force touch. Current status =' + bswitchingViews,
    accessibilityLabel : 'Label on first Scrollview',
    color 	: 'white',
    top 	: 10,
	right	: 5,
	font: { fontSize:12 },
   	width 	: 150,
   	height	: 150
});



view.addEventListener("touchmove", function(e) {
	printNewProperties(e,"View:touchmove");
});


button1.addEventListener("touchend", function(e) {
 	printNewProperties(e,"Button:touchEnd");
});

function printNewProperties(e, touchType) {
	Ti.API.info(touchType+":force "+e.force);
	var forceString = touchType+":force "+e.force;
	Ti.API.info(touchType+":maximumPossibleForce "+e.maximumPossibleForce);
	Ti.API.info(touchType+":altitudeAngle "+ e.altitudeAngle);
	Ti.API.info(touchType+":time stamp "+ e.timeStamp);
	printToScreen(e);
}

/*Second Wndow and Second  Tab*/
var win2 = Titanium.UI.createWindow({
	backgroundColor : "#FFFFFF"
});

var tab2 = Ti.UI.createTab({
    window: win2,
    title: 'Table View'
});

var justStuff = Ti.UI.createTableViewSection({ headerTitle: 'Items' });
	justStuff.add(Ti.UI.createTableViewRow({ title: 'Arrow' }));
	justStuff.add(Ti.UI.createTableViewRow({ title: 'Bow'}));

var justStuff2 = Ti.UI.createTableViewSection({ headerTitle: 'More Items' });
	justStuff2.add(Ti.UI.createTableViewRow({ title: 'Bottle' }));
	justStuff2.add(Ti.UI.createTableViewRow({ title: 'Apple' }));

var table = Ti.UI.createTableView({
  data: [justStuff,justStuff2]
});

table.addEventListener("touchstart", function(e){
	printNewProperties(e,"touchstart");
});

win2.add(table);

var tabGroup = Ti.UI.createTabGroup({
    tabs: [tab1, tab2]
});



/*Window 3 and 4 for the longPress and Force Press*/
var win3 = Titanium.UI.createWindow({
	backgroundColor : "Green"
});

var win3View = Titanium.UI.createView({
   borderRadius:10,
   backgroundColor:'Green',
   width:Ti.UI.FILL,
   height:Ti.UI.FILL
});

var labelWin3 = Titanium.UI.createLabel({
	text : 'Label for the longTouch window',
});

var win4 = Titanium.UI.createWindow({
	backgroundColor : "Red"
});

var win4View = Titanium.UI.createView({
   borderRadius:10,
   backgroundColor:'Red',
   width:Ti.UI.FILL,
   height:Ti.UI.FILL
});

var labelWin4 = Titanium.UI.createLabel({
	text : 'Label for Force Touch',
	color : 'White'
});

win3View.add(labelWin3);
win3.add(win3View);

view.addEventListener("longpress", function(e){
	if (bswitchingViews == true) { 
		win3.open();
	}
	
});

win4View.add(labelWin4);
win4.add(win4View);

view.addEventListener("touchmove", function(e){
	if (e.force > 2 && bswitchingViews == true) { 
	win4.open();
	}
});

//Return to Main Window
win3View.addEventListener("singletap" , function(e){
	win3.close();
});

win4View.addEventListener("singletap" , function(e){
	win4.close();
});

/*Console within App*/

var textArea = Ti.UI.createTextArea({
  borderWidth		: 2,
  borderColor		: '#bbb',
  borderRadius 		: 5,
  color 			: 'Red',
  font      		: {fontSize:10},
  editable  		: false,
  textAlign			: 'left',
  bottom 			: 0,
  height 			: 100,
  width 			: Ti.UI.FILL,
  opacity			: 0.5
});

function printToScreen(values) { 
	if (values.y >  previousePos.y + 10 || values.y <  previousePos.y -10
		||values.x >  previousePos.x + 10 || values.x <  previousePos.x -10) {

		textArea.value = textArea.value + "forceValue" + values.force +"\n";
		previousePos = values;
	}

	previousePos = values;
}

view.add(button1);
view.add(label1);
view.add(label2);
view.add(forceButton);
view.add(textArea);
win.add(view);
tabGroup.open();
