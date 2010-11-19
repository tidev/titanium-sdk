// get tab group object
var tabGroup = Titanium.UI.currentTabGroup;

// get current tab object
var tab = Titanium.UI.currentTab;

// get current win object
var win = Titanium.UI.currentWindow;

//
// TOGGLE TAB TITLE
//
var changeTitleButton = Titanium.UI.createButton({
	title:'Toggle Tab Title',
	top:10,
	height:40,
	width:200
});

//
// CURRENT TAB 
//
var label = Titanium.UI.createLabel({
	text:'Tab title is ' + tab.title,
	color:'#777',
	font:{
		fontFamily:'Helvetica Neue',
		fontSize:15
	},
	textAlign:'center',
	top:260,
	width:300,
	height:'auto'
});

changeTitleButton.addEventListener('click', function(e)
{
	if (tab.title == 'Base UI')
	{
		tab.setTitle('It worked!');
		label.text = 'Tab title is ' + tab.title;
	}
	else
	{
		tab.title = 'Base UI';		
		label.text = 'Tab title is ' + tab.title;
	}
});

//
// TOGGLE TAB BADGE
//
var tabBadgeButton = Titanium.UI.createButton({
	title:'Toggle Tab Badge',
	top:60,
	height:40,
	width:200
});

tabBadgeButton.addEventListener('click', function(e)
{
	if (tab.badge == null)
	{
		tab.badge = 10;		
	}
	else
	{
		tab.badge = null;		
	}
});


//
// TOGGLE TAB ICON
//
var changeIconButton = Titanium.UI.createButton({
	title:'Toggle Tab Icon',
	top:110,
	height:40,
	width:200
});

changeIconButton.addEventListener('click', function(e)
{
	if (tab.icon.indexOf('KS_nav_views.png') != -1)
	{
		tab.icon = '../images/tabs/KS_nav_mashup.png';		
	}
	else
	{
		tab.icon = '../images/tabs/KS_nav_views.png';
	}
});

//
// SET ACTIVE TAB 
// 
var setActiveTabButton = Titanium.UI.createButton({
	title:'Set Active Tab',
	top:160,
	height:40,
	width:200
});

setActiveTabButton.addEventListener('click', function(e)
{
	tabGroup.tabs[1].active = true;
});

//
// CHANGE TAB ICONS (USING SYSTEM) 
// 
// the following are supported for iphone
// Titanium.UI.iPhone.SystemIcon.BOOKMARKS
// Titanium.UI.iPhone.SystemIcon.CONTACTS
// Titanium.UI.iPhone.SystemIcon.DOWNLOADS
// Titanium.UI.iPhone.SystemIcon.FAVORITES
// Titanium.UI.iPhone.SystemIcon.HISTORY
// Titanium.UI.iPhone.SystemIcon.FEATURED
// Titanium.UI.iPhone.SystemIcon.MORE
// Titanium.UI.iPhone.SystemIcon.MOST_RECENT
// Titanium.UI.iPhone.SystemIcon.MOST_VIEWED
// Titanium.UI.iPhone.SystemIcon.RECENTS
// Titanium.UI.iPhone.SystemIcon.SEARCH
// Titanium.UI.iPhone.SystemIcon.TOP_RATED
//
var systemTabIconsButton = Titanium.UI.createButton({
	title:'Use System Tab Icons',
	top:210,
	height:40,
	width:200
});

var systemIcon = false;
systemTabIconsButton.addEventListener('click', function(e)
{
	if (!systemIcon)
	{
		tabGroup.tabs[0].icon = Titanium.UI.iPhone.SystemIcon.BOOKMARKS;
		tabGroup.tabs[1].icon = Titanium.UI.iPhone.SystemIcon.CONTACTS;
		tabGroup.tabs[2].icon = Titanium.UI.iPhone.SystemIcon.DOWNLOADS;
		tabGroup.tabs[3].icon = Titanium.UI.iPhone.SystemIcon.FAVORITES;
		tabGroup.tabs[4].icon = Titanium.UI.iPhone.SystemIcon.HISTORY;
		systemIcon=true;
	}
	else
	{
		tabGroup.tabs[0].icon = '../images/tabs/KS_nav_views.png';
		tabGroup.tabs[1].icon = '../images/tabs/KS_nav_ui.png';
		tabGroup.tabs[2].icon = '../images/tabs/KS_nav_phone.png';
		tabGroup.tabs[3].icon = '../images/tabs/KS_nav_platform.png';
		tabGroup.tabs[4].icon = '../images/tabs/KS_nav_mashup.png';
		systemIcon=false;
	}
});



// add views based on platform
if (Titanium.Platform.osname == 'iphone' || Titanium.Platform.osname == 'ipad')
{
	win.add(tabBadgeButton);
	win.add(systemTabIconsButton);
}

win.add(changeTitleButton);
win.add(changeIconButton);
win.add(setActiveTabButton);
win.add(label);
