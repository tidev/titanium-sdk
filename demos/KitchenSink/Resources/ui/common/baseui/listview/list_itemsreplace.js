function getReplaceDataIOS(animation){
    var data = [
	    {properties: {itemId:'2'},template:'myCell',mainLabel:{text:'REPLACE 2. Animated with '+animation},childLabel:{text:'Replace 2 items. This and next row will be gone'}},
	    {properties: {itemId:'1'},template:'myCell',mainLabel:{text:'REPLACE 1. Animated with '+animation},childLabel:{text:'Replace 1 item. This row will be gone'}},
	    {properties: {itemId:'0'},template:'myCell',mainLabel:{text:'REPLACE 0. Animated with '+animation},childLabel:{text:'Replace 0 items. Like doing an insert'}},
    ];
    return data;
}

function getReplaceDataAndroid(){
    var data = [
	    {properties: {itemId:'2'},template:'myCell',mainLabel:{text:'REPLACE 2'},childLabel:{text:'Replace 2 items. This and next row will be gone'}},
	    {properties: {itemId:'1'},template:'myCell',mainLabel:{text:'REPLACE 1'},childLabel:{text:'Replace 1 item. This row will be gone'}},
	    {properties: {itemId:'0'},template:'myCell',mainLabel:{text:'REPLACE 0'},childLabel:{text:'Replace 0 items. Like doing an insert'}},
    ];
    return data;
}
function getData(){
    var data = [
    {properties: {itemId:'0'},template:'myCell',mainLabel:{text:'REPLACE 0'},childLabel:{text:'Replace 0 items. Like doing an insert'}},
    {properties: {itemId:'1'},template:'myCell',mainLabel:{text:'REPLACE 1'},childLabel:{text:'Replace 1 items. This row will be gone'}},
    {properties: {itemId:'2'},template:'myCell',mainLabel:{text:'REPLACE 2'},childLabel:{text:'Bad Call. Must fail gracefully. Check for parity'}},
    ];

    return data;
}

function list_replaceitems(_args) {
	var win = Ti.UI.createWindow({
		title:'Replace Items'
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
	section1.setItems(getData())
	var listView = Ti.UI.createListView({
		sections: [ section1 ],
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
	var counter1 = 1;
	
	listView.addEventListener('itemclick',function(e){
		var pos = e.itemIndex;
		var replaceCount = 0;
		if(e.itemId == '1'){
			replaceCount = 1;
		} 
		else if(e.itemId == '2'){
			replaceCount = 2;
		}
		var theSection = e.section;
		if (isIOS) {
			counter1 = counter1 % 6;
			var animation = animationsArray[counter1];
			theSection.replaceItemsAt(pos,replaceCount,getReplaceDataIOS(animation),{animationStyle: animationStyles[animation] });
			counter1 ++;
		}
		else {
			theSection.replaceItemsAt(pos,replaceCount,getReplaceDataAndroid());
		}
	})
	
	
	return win;
};


module.exports = list_replaceitems;