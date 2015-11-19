function getInsertDataIOS(insertCount, sectionIndex, itemIndex, message, animation){
    var data = [{properties:{itemId:message},template:'myCell',mainLabel:{text:insertCount+' Insert at '+itemIndex+' in Section '+sectionIndex + ' Animation '+animation},childLabel:{text:'Insert '+message}}];
    return data;
}

function getInsertDataAndroid(insertCount, sectionIndex, itemIndex, message){
    var data = [{properties:{itemId:message},template:'myCell',mainLabel:{text:insertCount+' Insert at '+itemIndex+' in Section '+sectionIndex},childLabel:{text:'Insert '+message}}];
    return data;
}
function getData(){
    var data = [
    {properties: {title:'Insert Here',itemId:'Here',height:60}},
    {properties: {title:'Insert One Above',itemId:'One Above',height:60}},
    {properties: {title:'Insert Below',itemId:'Below',height:60}}
    ];

    return data;
}

function list_insertitems(_args) {
	var win = Ti.UI.createWindow({
		title:'Insert Items'
	});
	var myTemplate = {
  		properties: {height: 60},
	  	childTemplates: [
  		{
    		type: 'Ti.UI.Label',
    		bindId:'mainLabel',
    		properties: {
      			color: '#576996',
      			font: { fontFamily:'Arial', fontSize: 13, fontWeight:'bold'},
      			width: Ti.UI.FILL, height: 30,top:0
    		}
  		},
  		{
    		type: 'Ti.UI.Label',
    		bindId:'childLabel',
    		properties: {
      			color: '#576996',
      			font: { fontFamily:'Arial', fontSize: 13, fontWeight:'bold'},
      			width: Ti.UI.FILL, height: 30,top:30
    		}
  		}
  	]}
	
	var platformName = Titanium.Platform.osname;
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	
	var section1 = Ti.UI.createListSection({headerTitle:'SECTION ONE'});
	var section2 = Ti.UI.createListSection({headerTitle:'SECTION TWO'});
	section1.setItems(getData())
	section2.setItems(getData())
	var listView = Ti.UI.createListView({
		sections: [ section1, section2 ],
		templates:{'myCell':myTemplate}
	})

	win.add(listView);
	
	var animationStyles = {
		'None': Ti.UI.iPhone.RowAnimationStyle.NONE,
		'Left': Ti.UI.iPhone.RowAnimationStyle.LEFT,
		'Right': Ti.UI.iPhone.RowAnimationStyle.RIGHT,
		'Top': Ti.UI.iPhone.RowAnimationStyle.TOP,
		'Bottom': Ti.UI.iPhone.RowAnimationStyle.BOTTOM,
		'Fade': Ti.UI.iPhone.RowAnimationStyle.FADE,
	};
	var animationsArray = ['None', 'Left', 'Right', 'Top', 'Bottom', 'Fade'];
	var counter = 1;
	var counter1 = 1;
	var insertCount = 0;
	var messageArray = ['Here', 'One Above', 'Below'];
	
	listView.addEventListener('itemclick',function(e){
		var pos = e.itemIndex;
		if(e.itemId == 'One Above'){
			pos --;
		} 
		else if(e.itemId == 'Below'){
			pos ++;
		}
		if(pos < 0){
			pos = 0;
		}
		counter = counter % 3;
		var message = messageArray[counter];
		counter ++;
		var theSection = e.section;
		if (isIOS) {
			counter1 = counter1 % 6;
			var animation = animationsArray[counter1];
			theSection.insertItemsAt(pos,getInsertDataIOS(insertCount,e.sectionIndex,pos,message,animation),{animationStyle: animationStyles[animation] });
			counter1 ++;
		}
		else {
			theSection.insertItemsAt(pos,getInsertDataAndroid(insertCount,e.sectionIndex,pos,message));
		}
		insertCount ++;
	})
	
	
	return win;
};


module.exports = list_insertitems;