function getData(section){
    var data = [];
    
    for (i=0;i<5;i++){
    	data.push({template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT, properties: {title:'SECTION '+section+' ITEM '+i}})
    }
    return data;
}

function getSections(){
	//BOTH
	var section1 = Ti.UI.createListSection({
		headerTitle:'Section 1 Header',
		footerTitle:'Section 1 Footer'
	})
	//HEADER ONLY
	var section2 = Ti.UI.createListSection({
		headerTitle:'Section 2 Header'
	})
	//FOOTER ONLY
	var section3 = Ti.UI.createListSection({
		footerTitle:'Section 3 Footer'
	})
	//Neither
	var section4 = Ti.UI.createListSection()
	section1.setItems(getData(1))
	section2.setItems(getData(2))
	section3.setItems(getData(3))
	section4.setItems(getData(4))
	
	return [section1,section2,section3,section4];
}

function getListView(style){
	var listView = Ti.UI.createListView({
		style:style,
		sections:getSections(),
		headerTitle:'THIS IS LIST VIEW HEADER',
		footerTitle:'THIS IS LIST VIEW FOOTER. SHOULD BE AT BOTTOM.'
	});
	
	return listView;
}

function list_headers_footers(_args) {
	var win = Ti.UI.createWindow({
		title:'Headers & Footers'
	});
	
	var platformName = Titanium.Platform.osname;
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	
	var listView = Ti.UI.createListView({
		sections:getSections(),
		headerTitle:'THIS IS LIST VIEW HEADER',
		footerTitle:'THIS IS LIST VIEW FOOTER. SHOULD BE AT BOTTOM'
	});
	
	win.add(listView);
	
	if(isIOS) {
		var btn = Ti.UI.createButton({
			title:'SHOW GROUPED',
			bottom:0
		})
		
		win.add(btn);
		
		btn.addEventListener('click',function(){
			win.remove(listView);
			listView = null;
			listView = getListView(Ti.UI.iPhone.ListViewStyle.GROUPED);
			win.add(listView);
			btn.enabled = false;
		})
	}
	
	return win;

};


module.exports = list_headers_footers;