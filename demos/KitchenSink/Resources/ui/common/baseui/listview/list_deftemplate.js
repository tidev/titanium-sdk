function list_background_color(_args) {
	var win = Ti.UI.createWindow({
		title:'Default Template',
		layout:'vertical',
		orientationModes:[Ti.UI.PORTRAIT,Ti.UI.LANDSCAPE_LEFT,Ti.UI.LANDSCAPE_RIGHT]
	});
	
	var label = Ti.UI.createLabel({
		text:'Change orientation and see layout change by just switching the defaultItemTemplate property on listview'
	})
	
	win.add(label);
	
	var portraitTemplate = {
  		properties: {height: 60},
	  	childTemplates: [
  		{
    		type: 'Ti.UI.View',
    		properties: {
    			left:0,
    			width:'50%',
    			height:50,
    			backgroundColor:'red'
    		}
  		},
  		{
    		type: 'Ti.UI.View',
    		properties: {
    			width:'50%',
    			height:50,
    			left:'50%',
    			backgroundColor:'green'
    		}
  		}
  	]}

	var landscapeTemplate = {
  		properties: {height: 40},
	  	childTemplates: [
  		{
    		type: 'Ti.UI.View',
    		properties: {
    			left:0,
    			width:'33%',
    			height:35,
    			backgroundColor:'red'
    		}
  		},
  		{
    		type: 'Ti.UI.View',
    		properties: {
    			width:'33%',
    			height:35,
    			left:'34%',
    			backgroundColor:'green'
    		}
  		},
  		{
    		type: 'Ti.UI.View',
    		properties: {
    			width:'33%',
    			height:35,
    			left:'68%',
    			backgroundColor:'blue'
    		}
  		}
  	]}

	var section = Ti.UI.createListSection()
	var data = [{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]	
	section.setItems(data);
	
	var defTemplate = 'one';
	if (Ti.Gesture.isLandscape()){
		defTemplate = 'two';
	}
	var listView = Ti.UI.createListView({
		templates:{'one':portraitTemplate,'two':landscapeTemplate},
		defaultItemTemplate:defTemplate,
		sections:[section]
	})
	
	function updateDefault(){
		if (win.orientation != Ti.UI.PORTRAIT){
			listView.defaultItemTemplate = 'two';
		} else {
			listView.defaultItemTemplate = 'one';
		}
	}
	
	Ti.Gesture.addEventListener('orientationchange',updateDefault);
	
	win.addEventListener('close',function(){
		Ti.Gesture.removeEventListener('orientationchange',updateDefault);
	})
	
	win.add(listView);
	
	return win;
};
module.exports = list_background_color;