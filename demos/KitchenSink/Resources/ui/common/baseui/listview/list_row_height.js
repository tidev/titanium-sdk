function list_row_height(_args) {
	var win = Ti.UI.createWindow({
		title:'Row Heights'
	});
	
	var myTemplate = {
  		properties: {height: 60},
	  	childTemplates: [
  		{
    		type: 'Ti.UI.Label',
    		bindId:'cellLabel',
    		properties: {
      			color: '#576996',
      			highlightedColor:'white',
      			font: { fontFamily:'Arial', fontSize: 13, fontWeight:'bold'},
      			width: Ti.UI.FILL, height: Ti.UI.FILL,
    		}
  		}
  	]}
  	
  	var section = Ti.UI.createListSection({});
	var listView = Ti.UI.createListView({
  		templates: { 'myCell': myTemplate },
  		sections: [ section ]
	});
	
    var data = [
    {template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT, properties: {title:'I have no height property.'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT, properties: {title:'My height is 100',height:100,color:'#576996'}},
    {template:'myCell', cellLabel:{text:'My height is coming from the template. My color when highlighted must be white on IOS'}},
    {template:'myCell', properties:{height:100},cellLabel:{
    	highlightedColor:'green',
    	color:'white',
    	text:'My height is coming from properties of the item. Must be 100. My color when highlighted must be green on IOS.',
    	backgroundColor:'gray'}},
    {template:'myCell', properties:{height:120},cellLabel:{
    	text:'IOS only supports absolute heights. No FILL, SIZE, PERCENT, AUTO SUPPORT',
    	font: { fontFamily:'Arial', fontSize: 20, fontWeight:'bold'},
    	backgroundColor:'red',color:'white'}},
    ];
    
    section.setItems(data);
    
	win.add(listView);
	
	return win;

};
module.exports = list_row_height;