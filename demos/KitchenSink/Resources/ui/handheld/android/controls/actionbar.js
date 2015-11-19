function actionbar_demo(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	win.backgroundColor = 'black';
	
	var getTitleView = function(theTitle){
		var title = Ti.UI.createLabel({
			text:theTitle,
			left:'5dp',
			top:'10dp',
			color:'white',
			font:{fontSize:'20dp',fontWeight:'bold'}
		});
		return title;
	};
	
	var getButtonView = function(theTitle){
		var btn = Ti.UI.createButton({
			title:theTitle,
			top:'10dp'
		});
		return btn;
	};

	var sv = Ti.UI.createScrollView({
		layout:'vertical'
	});
	var theActionBar = null;
	
	var title1 = getTitleView('APPEARANCE OPTIONS');
	var b1 = getButtonView('Toggle show/hide');
	var b2 = getButtonView('Toggle title');
	var b3 = getButtonView('Toggle Icon');
	var b4 = getButtonView('Toggle displayHomeAsUp');
	var title2 = getTitleView('MENU OPTIONS');
	var b5 = getButtonView('SHOW_AS_ACTION_ALWAYS');
	var b6 = getButtonView('SHOW_AS_ACTION_IF_ROOM');
	var b7 = getButtonView('SHOW_AS_ACTION_NEVER');
	
	var clickUpdate = Ti.UI.createLabel({
		text:' ',
		color:'white',
		font:{fontSize:'14dp',fontWeight:'normal'},
		top:'10dp'
	});
	
	var barHidden = false;
	b1.addEventListener('click',function(){
		if (theActionBar != undefined) {
			if (barHidden == true) {
				theActionBar.show();
			}
			else {
				theActionBar.hide();
			}
			barHidden = !barHidden;
		}
		else {
			alert('NO ACTION BAR');
		}
	});
	
	var barTitle = '';
	var switched = false;
	b2.addEventListener('click',function(){
		if (theActionBar != undefined) {
			if (switched == false) {
				barTitle = theActionBar.getTitle();
				theActionBar.setTitle('Title Changed');
			}
			else {
				theActionBar.setTitle(barTitle);
			}
			switched = !switched;
		}
		else {
			alert('NO ACTION BAR');
		}
	});
	
	var iconSet = false;
	b3.addEventListener('click',function(){
		if (theActionBar != undefined) {
			if (Ti.version >= "3.3.0" || Ti.Platform.Android.API_LEVEL > 13) {
				if (iconSet == false) {
					theActionBar.setIcon('images/camera.png');	
				}
				else {
					theActionBar.setIcon('appicon.png');
				}
				iconSet = !iconSet;
			} else {
				alert('FEATURE REQUIRES API LEVEL >= 14 or SDK 3.3.0+');
			}
		}
		else {
			alert('NO ACTION BAR');
		}
	});
	
	var homeEnabled = true;
	b4.addEventListener('click',function(){
		if (theActionBar != undefined) {
			homeEnabled = !homeEnabled;
			theActionBar.setDisplayHomeAsUp(homeEnabled);
		}
		else {
			alert('NO ACTION BAR');
		}
	});
	
	var theAction = Ti.Android.SHOW_AS_ACTION_NEVER;
	b5.addEventListener('click',function(){
		theAction = Ti.Android.SHOW_AS_ACTION_ALWAYS;
		win.activity.invalidateOptionsMenu();
	});
	b6.addEventListener('click',function(){
		theAction = Ti.Android.SHOW_AS_ACTION_IF_ROOM;
		win.activity.invalidateOptionsMenu();
	});
	b7.addEventListener('click',function(){
		theAction = Ti.Android.SHOW_AS_ACTION_NEVER;
		win.activity.invalidateOptionsMenu();
	});
	
	sv.add(title1);
	sv.add(b1);
	sv.add(b2);
	sv.add(b3);
	sv.add(b4);
	sv.add(title2);
	sv.add(clickUpdate);
	sv.add(b5);
	sv.add(b6);
	sv.add(b7);
	
	win.add(sv);
	win.addEventListener("open", function(evt) { 
		theActionBar = win.activity.actionBar; 
		if (theActionBar != undefined) {
			theActionBar.displayHomeAsUp = true;
			theActionBar.onHomeIconItemSelected = function() { 
				clickUpdate.text = 'Home Clicked';
			}; 
		}
		
		win.activity.onCreateOptionsMenu = function(e) { 
			var menu = e.menu; 
			for (i=1; i<6; i++) {
				var menuItem = menu.add({ 
					title : "Item "+i, 
					showAsAction : theAction
				}); 
				menuItem.addEventListener("click", function(e) { 
					clickUpdate.text =  e.source.title + ' Clicked';
				}); 
			}
		};
	});
	
	return win;
}
module.exports = actionbar_demo;