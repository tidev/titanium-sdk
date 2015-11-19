function getSection(count){
	var data = [{properties:{title:'Delete Section '+count, height:44}}]
	var section = Ti.UI.createListSection({headerTitle:'SECTION HEADER '+count})
	section.setItems(data);
	return section;
}

function list_delete_section(_args) {
	var win = Ti.UI.createWindow({
		title:'Delete Section',
	});
	
	
	var listView = Ti.UI.createListView();
	var sections = [];
	for(i=0;i<10;i++){
		sections.push(getSection(i))
	}
	
	listView.sections = sections;
	win.add(listView);
	
	listView.addEventListener('itemclick',function(e){
		listView.deleteSectionAt(e.sectionIndex);
	})
	
	return win;
}

module.exports = list_delete_section;