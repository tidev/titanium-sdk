function getSection(replaceCount){
	var data = [{properties:{title:'I am Replaced',itemId:'0',height:44}}]
	
	var section = Ti.UI.createListSection({headerTitle:'REPLACED SECTION '+replaceCount})
	section.setItems(data);

	return section;
}

function getInitSection(){
	var sections = [];
	for(i=0;i<4;i++){
		var data = [{properties:{title:'Replace',itemId:'1',height:44}}]
		var section = Ti.UI.createListSection({headerTitle:'REPLACE SECTION'})
		section.setItems(data);
		sections.push(section);
	}
	return sections;
}

function list_replace_section(_args) {
	var win = Ti.UI.createWindow({
		title:'Replace Section'
	});
	
	
	var listView = Ti.UI.createListView();
	var sections = getInitSection();
	listView.sections = sections;
	win.add(listView);
	var replaceCount = 0;
	
	listView.addEventListener('itemclick',function(e){
		if(e.itemId == '1'){
			listView.replaceSectionAt(e.sectionIndex,getSection(replaceCount));
			replaceCount ++;
		}
	})
	
	return win;
}

module.exports = list_replace_section;