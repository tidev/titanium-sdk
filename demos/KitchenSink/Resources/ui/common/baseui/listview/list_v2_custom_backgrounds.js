function list_v2_custom_backgrounds(_args) {
	var platformName = Titanium.Platform.osname;
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	if (isIOS) {
		return iOS_custom_backgrounds();
	} else {
		return android_custom_backgrounds();
	}
}

function android_custom_backgrounds() {

	var myTemplate1 = {
		properties : {
			backgroundColor : 'blue',
			height : '100sp'
		},
		childTemplates : [{
			type : 'Ti.UI.Label',
			bindId : 'cellLabel',
			properties : {
				font : {
					fontSize : '12dp'
				},
				text : "Hello"
			}
		}]
	};

	var section = Ti.UI.createListSection({
		headerTitle : "Header 1"
	});
	var data = [];

	for (var i = 0; i < 3; i++) {
		var item = {
			properties : {
				selectedBackgroundColor : "green"
			},
			cellLabel : {
				text : "selectedBackgroundColor: green"
			}
		};
		if (i == 1) {
			item.properties = {
				selectedBackgroundImage : "appicon.png"
			};
			item.cellLabel.text = "selectedBackgroundImage: appicon";
		} else if (i == 2) {
			item.properties = {
				backgroundGradient : {
					type : 'linear',
					startPoint : {
						x : '0%',
						y : '50%'
					},
					endPoint : {
						x : '100%',
						y : '50%'
					},
					colors : [{
						color : 'red',
						offset : 0.0
					}, {
						color : 'blue',
						offset : 0.25
					}, {
						color : 'red',
						offset : 1.0
					}],
				}
			};
			item.cellLabel.text = "backgroundGradient";
		}
		data.push(item);
	}

	section.setItems(data);

	var listView = Ti.UI.createListView({
		defaultItemTemplate : 'myTemp',
		templates : {
			myTemp : myTemplate1
		},
		backgroundColor : "white",
		sections : [section]
	});

	var win = Ti.UI.createWindow({
		title : 'Custom Backgrounds'
	});
	win.add(listView);
	return win;

}

function iOS_custom_backgrounds() {
	var win = Ti.UI.createWindow({
		title:'Custom Backgrounds',
		layout:'vertical',
	});
	
	var button = Ti.UI.createButton({
		left:20,
		right:20,
		title:'Toggle ListView'
	});
	win.add(button);
	
	var data = [
	{properties:{title:'bgColor red, selectionStyle BLUE', backgroundColor:'red', selectionStyle:Ti.UI.iPhone.ListViewCellSelectionStyle.BLUE}},
	{properties:{title:'bgColor green, selectionStyle GRAY', backgroundColor:'green', selectionStyle:Ti.UI.iPhone.ListViewCellSelectionStyle.GRAY}},
	{properties:{title:'bgColor cyan, selectionStyle NONE', backgroundColor:'cyan', selectionStyle:Ti.UI.iPhone.ListViewCellSelectionStyle.NONE}},
	{properties:{title:'bgColor white, selectedBgColor green', backgroundColor:'white', selectedBackgroundColor:'green'}},
	{properties:{title:'bgImage corkboard, selectionStyle BLUE', backgroundImage:'/images/corkboard.jpg', selectionStyle:Ti.UI.iPhone.ListViewCellSelectionStyle.BLUE}},
	{properties:{title:'bgImage corkboard, selectedBgImage orangeBar', backgroundImage:'/images/corkboard.jpg', selectedBackgroundImage:'/images/slider_orangebar.png'}},
	];
	
	var actualData = [];
	var i;
	for (i=0; i<100; i++) {
		actualData.push(data[i%6]);
	}
	
	var section1 = Ti.UI.createListSection();
	section1.setItems(actualData);
	
	var listView1 = Ti.UI.createListView({top:10});
	listView1.setSections([section1]);

	var section2 = Ti.UI.createListSection();
	section2.setItems(actualData);
	
	var listView2 = Ti.UI.createListView({style:Ti.UI.iPhone.ListViewStyle.GROUPED, top:10});
	listView2.setSections([section2]);

	win.add(listView1);
	
	var isGrouped = false;
	
	button.addEventListener('click',function(){
		if(isGrouped == false) {
			win.remove(listView1);
			win.add(listView2);
		} else {
			win.remove(listView2);
			win.add(listView1);
		}
		isGrouped = !isGrouped;
	});
	
	return win;
}

module.exports = list_v2_custom_backgrounds;	