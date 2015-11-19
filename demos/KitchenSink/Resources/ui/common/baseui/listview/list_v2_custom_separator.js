function list_v2_custom_separator(_args) {
	var win = Ti.UI.createWindow({
		title:'Custom Separator',
		layout:'vertical'
	});
	
	var platformName = Titanium.Platform.osname;
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	
	var container = Ti.UI.createView({
		layout:'vertical',
		height:Ti.UI.SIZE
	});
	
	var actionContainer = Ti.UI.createView({
		layout:'horizontal',
		height:Ti.UI.SIZE
	});
	
	var b1 = Ti.UI.createButton({
		width:'45%',
		left:'2%',
		title:'Change Style'
	});

	var b2 = Ti.UI.createButton({
		width:'45%',
		left:'4%',
		title:'Change Color'
	});
	
	if (isIOS) {
		actionContainer.add(b1);
	} else {
		b2.left = '23%';
	}
	actionContainer.add(b2);
	
	var statusLabel = Ti.UI.createLabel({
		width:Ti.UI.FILL,
		height:Ti.UI.SIZE
	});
	
	container.add(actionContainer);
	container.add(statusLabel);
	
	win.add(container);
	
	var styleData = [];
	if (isIOS) {
		styleData = [Ti.UI.iPhone.ListViewSeparatorStyle.SINGLE_LINE, Ti.UI.iPhone.ListViewSeparatorStyle.NONE];
	}
	var colorData = ['gray','red','green','blue','yellow','transparent'];
	var styleCounter = 0;
	var colorCounter = 0;
	
	function updateLabel()
	{
		var text = 'Separator Color is ' + colorData[colorCounter];
		if (isIOS) {
			text = text + ' Separator Style is ';
			if (styleCounter == 0) {
				text += 'Single Line';
			} else {
				text += 'None';
			} 
		}
		statusLabel.text = text;		
	}
	
	var data = [];
	var i=1;
	for (i=1; i<100; i++) {
		data.push({properties:{title:'ROW '+i}});
	}
	var listSection1 = Ti.UI.createListSection();
	listSection1.setItems(data);
	
	var listView;
	if (isIOS) {
	    listView = Ti.UI.createListView({
			separatorColor:colorData[colorCounter],
			separatorStyle:styleData[styleCounter]
		});
	} else {
		listView = Ti.UI.createListView({
			separatorColor:colorData[colorCounter]
		});
	}
	listView.setSections([listSection1]);
	updateLabel();
	
	win.add(listView);
	
	b1.addEventListener('click',function(){
		styleCounter = (styleCounter + 1) % styleData.length;
		listView.separatorStyle = styleData[styleCounter];
		updateLabel();
	});
	
	b2.addEventListener('click',function(){
		colorCounter = (colorCounter + 1) % colorData.length;
		listView.separatorColor = colorData[colorCounter];
		updateLabel();
	});
	
	return win;

};

module.exports = list_v2_custom_separator;