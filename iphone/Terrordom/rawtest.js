var win = Titanium.UI.currentWindow;
win.backgroundColor = '#fff';

var view1 = Ti.UI.createView({
	backgroundColor:'transparent'
});

var b1 = Titanium.UI.createButton({
	backgroundImage:'ktswbutton.png',
	top:10,
    left:25,
    width:75,
    height:75
});

var b2 = Titanium.UI.createButton({
	backgroundImage:'campusmapbutton.png',
	top:10,
    left:120,
    width:75,
    height:75
});

var b3 = Titanium.UI.createButton({
	backgroundImage:'directorybutton.png',
	top:10,
    left:215,
    width:75,
    height:75
});

var b4 = Titanium.UI.createButton({
	backgroundImage:'newsbutton.png',
	top:105,
    left:25,
    width:75,
    height:75
});

var b5 = Titanium.UI.createButton({
    backgroundImage:'sportsbutton.png',
    top:105,
    left:120,
    width:75,
    height:75
});

view1.add(b1);
view1.add(b2);
view1.add(b3);
view1.add(b4);
view1.add(b5);

var view2 = Ti.UI.createView({
	backgroundColor:'transparent'
});

var b10 = Titanium.UI.createButton({
	backgroundImage:'dininghallsbutton.png',
	top:10,
    left:25,
    width:75,
    height:75
});

var b11 = Titanium.UI.createButton({
	backgroundImage:'bobcattubebutton.png',
	top:10,
    left:120,
    width:75,
    height:75
});

var b12 = Titanium.UI.createButton({
	backgroundImage:'audiobutton.png',
	top:10,
    left:215,
    width:75,
    height:75
});

view2.add(b10);
view2.add(b11);
view2.add(b12);

var scrollView = Titanium.UI.createScrollableView({
	views:[view1,view2],
	showPagingControl:true,
	pagingControlHeight:30,
    pagingControlColor:'#660000'
});

win.add(scrollView);

b1.addEventListener('click', function()
{
    var win2 = Titanium.UI.createWindow({
        url:'ktsw.js',
        barColor:'#660000',
        title:'KTSW 89.9 FM'
    });
    Titanium.UI.currentTab.open(win2,{animated:true});
});
