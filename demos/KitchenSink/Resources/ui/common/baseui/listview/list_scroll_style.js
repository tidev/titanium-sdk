function list_scroll_style(_args) {
	var win = Ti.UI.createWindow({
		title:'Scroll Style'
	});
	
	var data = [
	{properties: {title:'STYLE DEFAULT'}},
	{properties: {title:'STYLE BLACK'}},
	{properties: {title:'STYLE WHITE'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}},
	{properties:{title:'Item'}}
	];
	
	var section = Ti.UI.createListSection({
		headerTitle:'SCROLL INDICATOR STYLES',
		//items:data
	})
	section.setItems(data);
	
	var listView = Ti.UI.createListView({
		sections:[section],
		backgroundColor:'white'
	})
	
	listView.addEventListener('itemclick',function(e){
		if(e.itemIndex == 0) {
			listView.backgroundColor = 'white';
			listView.scrollIndicatorStyle = Ti.UI.iPhone.ScrollIndicatorStyle.DEFAULT;
		} else if(e.itemIndex == 1) {
			listView.backgroundColor = 'white';
			listView.scrollIndicatorStyle = Ti.UI.iPhone.ScrollIndicatorStyle.BLACK;
		} else if(e.itemIndex == 2){
			listView.backgroundColor = '#ccc';
			listView.scrollIndicatorStyle = Ti.UI.iPhone.ScrollIndicatorStyle.WHITE;
		}
	})

	win.add(listView)

	return win;
}

module.exports = list_scroll_style;
