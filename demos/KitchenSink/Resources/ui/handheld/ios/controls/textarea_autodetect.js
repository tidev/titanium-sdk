function textarea_auto(_args) {
	//TODO Update before 2.2.0 Release to use Ti.UI.AUTOLINK constants
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	win.backgroundColor = 'white';
	
	var currentDetection;
	
	var containerView = Ti.UI.createScrollView({
		width:Ti.UI.FILL,
		height:Ti.UI.FILL,
		contentHeight:Ti.UI.SIZE,
		contentWidth:Ti.UI.SIZE,
		layout: 'vertical'
	});
	
	var ta = Ti.UI.createTextArea({
		autoLink:Ti.UI.AUTOLINK_ALL,
		left:5, right: 5, height: 80,
		editable: false, // this needs to be set to false, otherwise data detection type will fail
		backgroundColor:'#ccc',
		value:'Contact\n test@test.com\n 817-555-5555\n http://bit.ly\n 444 Castro Street, Mountain View, CA'
	});

	var btn01 = Ti.UI.createButton({
		height:50, top:5, width:120,
		title:'Detect Links', color:'#000'
	});
	
	var btn02 = Ti.UI.createButton({
		height:50, top:5, width:120,
		title:'Detect Phone', color:'#000'
	});
	
	var btn03 = Ti.UI.createButton({
		height:50, top:5, width:120,
		title:'Detect All', color:'#000'
	});
	
	var btn04 = Ti.UI.createButton({
		height:50, top:5, left:5, right:5, type:'toggle', color:'#000'
	});
	
	// NO DOCS ON WHAT CONSTITUTES A "CALENDAR EVENT STRING" SO WE CAN'T TEST IT.
	
	var btn05 = Ti.UI.createButton({
		height:50, top:5, width:120,
		title:'Detect Adress', color:'#000'
	});
	
	var label = Ti.UI.createLabel({
		height:40, top:5, left:5, right:5,
		font:{fontSize:12}
	});
	
	function updateViews(e) {
		label.text = 'Editable: ' + ta.editable + '\nautoLink: ' + ta.autoLink;
		btn04.title = (ta.editable) ? 'Editable: Disable' : 'Editable: Enable';
		
		
		if (e) {
			currentDetectionBtn.color = (e.source.type) ? currentDetectionBtn.color : '#000';
			e.source.color = (e.source.type) ? '#000' : '#f00';
			currentDetectionBtn = (e.source.type) ? currentDetectionBtn : e.source;
		} else {
			currentDetectionBtn.color = '#f00';
		}
	}
	
	function toggleEditable(e) {
		ta.editable = (ta.editable) ? false : true;
		
		updateViews(e);
	}
	
	function setDetection(e) {	
		switch (e.source.title) {
			case btn01.title: 
				ta.autoLink = Ti.UI.AUTOLINK_URLS; // detect links
				break;
			case btn02.title: 
				ta.autoLink = Ti.UI.AUTOLINK_PHONE_NUMBERS; // detect phone
				break;
			case btn03.title: 
				ta.autoLink = Ti.UI.AUTOLINK_ALL; // detect all, including email and addresses
				break;
			case btn05.title:
				ta.autoLink =  Ti.UI.AUTOLINK_MAP_ADDRESSES;
				break;
			default: break;
		}
		
		updateViews(e);
	}
	
	btn01.addEventListener('click', setDetection);
	btn02.addEventListener('click', setDetection);
	btn03.addEventListener('click', setDetection);
	btn05.addEventListener('click', setDetection);
	
	btn04.addEventListener('click', toggleEditable);
	
	containerView.add(ta);
	containerView.add(label);
	containerView.add(btn01);
	containerView.add(btn02);
	containerView.add(btn03);
	containerView.add(btn04);
	containerView.add(btn05);

    win.add(containerView);
    
	// setup to improve visual feedback
	currentDetectionBtn = btn03;
	updateViews();
	
	return win;
}

module.exports = textarea_auto;