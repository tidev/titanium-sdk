function list_selection_style(_args) {
	var win = Ti.UI.createWindow({
		title:'Selection Style'
	});
	
	var data = [
	{properties: {title:'SELECTION STYLE UNDEFINED'}},
	{properties: {title:'SELECTION STYLE BLUE',selectionStyle:Ti.UI.iPhone.ListViewCellSelectionStyle.BLUE}},
	{properties: {title:'SELECTION STYLE GRAY',selectionStyle:Ti.UI.iPhone.ListViewCellSelectionStyle.GRAY}},
	{properties: {title:'SELECTION STYLE NONE',selectionStyle:Ti.UI.iPhone.ListViewCellSelectionStyle.NONE}},
	];
	
	var section = Ti.UI.createListSection({
		headerTitle:'SELECTION STYLES',
		items:data
	})
	
	var listView = Ti.UI.createListView({
		sections:[section]
	})
	
	listView.addEventListener('itemclick',function(e){
		alert('ITEM CLICK EVENT');
	})
	
	win.add(listView);
	
	return win;
}

module.exports = list_selection_style;
