function genData(section)
{
	var data = [];
	for(i=0;i<5;i++){
		data.push({properties:{title:'Section '+section+' Item '+i, backgroundColor:'white'}})
	}
	
	return data;
}

function genSections()
{
	var sections = [];
	for(j=0;j<5;j++){
		var section = Ti.UI.createListSection({headerTitle:'Section '+j});
		section.setItems(genData(j));
		sections.push(section);
	}
	
	return sections;
}

function list_v2_ui_misc(_args) {
	var win = Ti.UI.createWindow({
		title:'Miscellaneous',
		layout:'vertical'
	});
	
	var b1 = Ti.UI.createButton({
		left:20,
		right:20,
		title:'Toggle canScroll'
	})
	
	var b2 = Ti.UI.createButton({
		left:20,
		right:20,
		top:10,
		title:'Toggle insets'
	})

	var listView = Ti.UI.createListView({
		sections: genSections(),
		top:10,
		backgroundColor:'red'
	})
	
	win.add(b1);
	win.add(b2);
	win.add(listView);
	
	var canScroll = true;
	var zeroInsets = true;
	var animate = true;
	b1.addEventListener('click',function(){
		canScroll = !canScroll;
		listView.canScroll = canScroll;
	})
	
	b2.addEventListener('click',function(){
		if (zeroInsets == true) {
			listView.setContentInsets({top:20,bottom:20}, {animated:animate})
		} else {
			listView.setContentInsets({top:0,left:0,right:0,bottom:0}, {animated:animate});
			animate = !animate;
		}
		zeroInsets = !zeroInsets;
	})
	
	
	return win;
};

module.exports = list_v2_ui_misc;
