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

function list_scrollto(_args) {
	var win = Ti.UI.createWindow({
		title:'Scroll To',
		orientationModes:[Ti.UI.PORTRAIT],
		layout:'vertical'
	});

	var desc = Ti.UI.createLabel({
		text:'Click Button. See me scroll'
	})
	
	var button = Ti.UI.createButton({title:'Scroll To Random',top:0});
	
	win.add(button);
	win.add(desc);
	
	var listView = Ti.UI.createListView({
		sections: genSections()
	})
	
	win.add(listView);
	
	var isIOS = (Titanium.Platform.name == 'iPhone OS');
	if (isIOS) {
		var message = ['NONE','TOP','MIDDLE','BOTTOM'];
		var pos = {
			'NONE':Ti.UI.iPhone.ListViewScrollPosition.NONE,
			'TOP':Ti.UI.iPhone.ListViewScrollPosition.TOP,
			'MIDDLE':Ti.UI.iPhone.ListViewScrollPosition.MIDDLE,
			'BOTTOM':Ti.UI.iPhone.ListViewScrollPosition.BOTTOM,
		}
		
		var counter = 0;
	}
	
	button.addEventListener('click',function(){
		var sectionIndex = Math.floor(Math.random()*173)%10;
		var itemIndex = Math.floor(Math.random()*83)%10;
		
		
		if(isIOS) {
			counter = counter%4;
			desc.text = 'scrollToItem('+sectionIndex+','+itemIndex+','+message[counter]+'('+pos[message[counter]]+'))'
			listView.scrollToItem(sectionIndex,itemIndex,{position:pos[message[counter]]});
			counter++;
		} else {
			desc.text = 'scrollToItem('+sectionIndex+','+itemIndex+')';
			listView.scrollToItem(sectionIndex,itemIndex);
		}
	})
	
	return win;
}

module.exports = list_scrollto;