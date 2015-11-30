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
	    {properties: {title:'bad index=100. check parity',itemId:'101',height:44}},
	    {properties: {title:'Delete Two',itemId:'2',height:44}},
	    {properties: {title:'I will go too',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Delete Two',itemId:'2',height:44}},
	    {properties: {title:'I will go too',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Delete Me',itemId:'1',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Delete Me',itemId:'1',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Delete Two',itemId:'2',height:44}},
	    {properties: {title:'I will go too',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Delete Me',itemId:'1',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Delete Me',itemId:'1',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Delete Me',itemId:'1',height:44}},
	    {properties: {title:'excesive count=100. check parity',itemId:'100',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Item',height:44}},
	    {properties: {title:'Item',height:44}}
    ];

    return data;
}

function list_deleteitems(_args) {
	var win = Ti.UI.createWindow({
		title:'Delete Items'
	});
	
	var platformName = Titanium.Platform.osname;
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	
	var section1 = Ti.UI.createListSection({headerTitle:'SECTION ONE'});
	section1.setItems(getData())
	var listView = Ti.UI.createListView({
		sections: [ section1 ],
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
		if(e.itemId !== undefined && e.itemId !== null)
		{
			var deleteCount = parseInt(e.itemId);
			var pos = e.itemIndex;
			var theSection = e.section;
			if(deleteCount == 101) {
				pos = 1000;
			}
			if (isIOS) {
				counter1 = counter1 % 6;
				var animation = animationsArray[counter1];
				theSection.deleteItemsAt(pos,deleteCount,{animationStyle: animationStyles[animation] });
				counter1 ++;
			}
			else {
				theSection.deleteItemsAt(pos,deleteCount);
			}
		}
	})
	
	
	return win;
};


module.exports = list_deleteitems;