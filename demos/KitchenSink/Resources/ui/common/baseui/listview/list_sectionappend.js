function getSection(count){
	var data = [
	{properties:{title:'ITEM 0 in Section '+count}},
	{properties:{title:'ITEM 1 in Section '+count}},
	{properties:{title:'ITEM 2 in Section '+count}},
	]
	var section = Ti.UI.createListSection({
		headerTitle:'Section '+count
	})
	section.setItems(data);
	return section;
}

function list_append_section(_args) {
	var win = Ti.UI.createWindow({
		title:'Append Section',
		layout:'vertical'
	});
	
	var button = Ti.UI.createButton({
		title:'APPEND'
	});
	
	var listView = Ti.UI.createListView();
	
	win.add(button);
	win.add(listView);
	
	var appendCount = 0;
	
	button.addEventListener('click',function(){
		listView.appendSection(getSection(appendCount));
		appendCount++;
	})
	
	return win;
}

module.exports = list_append_section;