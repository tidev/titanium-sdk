function list_v2_custom_header_footer(_args) {
	var win = Ti.UI.createWindow({
		title:'Custom Headers & Footers',
	});
	
	var listHeader = Ti.UI.createView({
		layout:'horizontal',
		height:Ti.UI.SIZE
	})
	var imageView = Ti.UI.createImageView({
		left:5,
		width:50,
		height:50,
		image:'/images/flower.jpg'
	})
	var label = Ti.UI.createLabel({
		left:5,
		width:Ti.UI.FILL,
		text:'Custom header with an image and a label'
	})
	
	listHeader.add(imageView);
	listHeader.add(label);
	
	var listFooter = Ti.UI.createLabel({
		text:'I am a custom list footer (just a label) but with color',
		color:'red'
	})
	
	var section = Ti.UI.createListSection();
	var data = [];
	var i=1;
	for (i=1; i<10; i++) {
		data.push({properties:{title:'ROW '+i}})
	}
	section.setItems(data);
	
	var sectionHeaderView = Ti.UI.createLabel({
		backgroundColor:'magenta',
		text:'I am a section header',
		font:{ fontWeight: 'bold', size:'30' },
		color: 'white',
		width:Ti.UI.FILL,
		height:'50 dp',
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
	})
	
	var sectionFooterView = Ti.UI.createLabel({
		backgroundColor:'green',
		text:'I am a section footer',
		font:{ fontStyle: 'italic', size:'15' },
		color: 'white',
		width:Ti.UI.FILL,
		height:'30 dp',
		textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT
	})
	
	section.headerView = sectionHeaderView;
	section.footerView = sectionFooterView;
	
	var listView = Ti.UI.createListView({
		headerView:listHeader,
		footerView:listFooter
	});
	
	listView.setSections([section]);
	
	win.add(listView);

	return win;
};

module.exports = list_v2_custom_header_footer;