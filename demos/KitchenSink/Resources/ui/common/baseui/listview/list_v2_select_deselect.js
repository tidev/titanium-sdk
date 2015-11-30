function genData(section)
{
	var data = [];
	for(i=0;i<10;i++){
		data.push({properties:{title:'Section '+section+' Item '+i}})
	}
	
	return data;
}

function genSections()
{
	var sections = [];
	for(j=0;j<10;j++){
		var section = Ti.UI.createListSection({headerTitle:'Section '+j});
		section.setItems(genData(j));
		sections.push(section);
	}
	
	return sections;
}


function list_v2_select_deselect(_args) {
	var win = Ti.UI.createWindow({
		title:'Select Deselect',
		layout:'vertical'
	});
	
	var actionContainer = Ti.UI.createView({
		layout:'horizontal',
		height:Ti.UI.SIZE
	})
	
	var b1 = Ti.UI.createButton({
		width:'45%',
		left:'2%',
		title:'Select Random'
	})

	var b2 = Ti.UI.createButton({
		width:'45%',
		left:'4%',
		title:'Deselect',
		enabled:false
	})
	
	actionContainer.add(b1);
	actionContainer.add(b2);
	
	win.add(actionContainer);
	
	var listView = Ti.UI.createListView({
		sections: genSections(),
		top:10
	})
	
	win.add(listView);
	
	var sectionIndex;
	var itemIndex;
	
	listView.addEventListener('itemclick',function(e){
		sectionIndex = e.sectionIndex;
		itemIndex = e.itemIndex;
		b2.enabled = true;
	});
	
	b1.addEventListener('click',function(){
		sectionIndex = Math.floor(Math.random()*173)%10;
		itemIndex = Math.floor(Math.random()*83)%10;
		listView.selectItem(sectionIndex,itemIndex);
		b2.enabled = true;
	})
	
	b2.addEventListener('click',function(){
		listView.deselectItem(sectionIndex,itemIndex);
		b2.enabled = false;
	})


	return win;
}

module.exports = list_v2_select_deselect;		