function getData(){
    var data = [{template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT, properties: {title:'My background is yellow', backgroundColor:'yellow'}}];
    
    for (i=1;i<100;i++){
    	
    	data.push({template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT, properties: {title:'ITEM '+i}})
    }
    return data;
}
function list_background_color(_args) {
	var win = Ti.UI.createWindow({
		title:'Background Color'
	});
	
	var platformName = Titanium.Platform.osname;
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	
	var views = [];
	
	var section1 = Ti.UI.createListSection({
        headerTitle:'PLAIN NO BG',
    })
    section1.setItems(getData())
    var listView1 = Ti.UI.createListView({
    	sections:[section1],
    	showVerticalScrollIndicator:true
    });
	views.push(listView1);

	var section2 = Ti.UI.createListSection({
        headerTitle:'PLAIN RED BG',
    })
    section2.setItems(getData())
    var listView2 = Ti.UI.createListView({
    	sections:[section2],
    	backgroundColor:'red',
    	showVerticalScrollIndicator:false
	});
	views.push(listView2);

	
	if (isIOS) {
		var section3 = Ti.UI.createListSection({
        	headerTitle:'GROUPED NO BG',
        })
    	section3.setItems(getData())

		var listView3 = Ti.UI.createListView({
			sections:[section3],
			style:Ti.UI.iPhone.ListViewStyle.GROUPED,
			showVerticalScrollIndicator:true
		});
		views.push(listView3);

		var section4 = Ti.UI.createListSection({
        	headerTitle:'GROUPED RED BG',
        })
		section4.setItems(getData())
		var listView4 = Ti.UI.createListView({
			sections:[section4],
			style:Ti.UI.iPhone.ListViewStyle.GROUPED,
	    	showVerticalScrollIndicator:false,
			backgroundColor:'red',
		});
		views.push(listView4);
	}
	
	//Yes we nested scrolling containers. 
	//But scrolling is disabled on the scrollable view
	var scrollableView = Ti.UI.createScrollableView({
		top:'15%',
		views:views,
		showPagingControl:false,
		scrollingEnabled:false
	})
	
	var prev = Ti.UI.createButton({
		title:'BACK',
		top:0,
		left:5,
		height:'12%'
	})
	
	var next = Ti.UI.createButton({
		title:'NEXT',
		top:0,
		right:5,
		height:'12%'
	})
	
	var label = Ti.UI.createLabel({
		text:'ScrollIndicator=true',
		font: { fontFamily:'Arial', fontSize: '13sp', fontWeight:'bold'},
		height:'12%',
		top:0
	})
	win.add(prev);
	win.add(next);
	win.add(label);
	win.add(scrollableView);
	
	prev.addEventListener('click',function(){
		var page = scrollableView.currentPage - 1;
		if(page < 0){
			page = 0;
		}
		if(page%2==0){
			label.text = 'ScrollIndicator=true'
		}else {
			label.text = 'ScrollIndicator=false'
		}
		scrollableView.currentPage = page;
	})
	next.addEventListener('click',function(){
		var page = scrollableView.currentPage + 1;
		if(page >= views.length){
			page = views.length - 1;
		}
		if(page%2==0){
			label.text = 'ScrollIndicator=true'
		}else {
			label.text = 'ScrollIndicator=false'
		}
		scrollableView.currentPage = page;
	})
	
	return win;
};


module.exports = list_background_color;