var win = Ti.UI.createWindow();

var iv = Ti.UI.createImageView({ left : 0, top : "50px", right : 0, bottom : 0, backgroundColor : 'blue'});

var url1 = Ti.UI.createButton({
	title : 'Geese',
	left : 5, top : 5, height : "40px", width : "70px"
});
url1.addEventListener('click', function(e) {
	iv.url = 'media/geese.jpg';
});

var remote = Ti.UI.createButton({
	title : 'Remote',
	left : 80, top : 5, height : "40px", width : "90px"
});
remote.addEventListener('click', function(e){
	iv.url = "http://www.appcelerator.com/wp-content/themes/appcelerator/img/HERO_iPh_UI1.png";
});

var scale = Ti.UI.createButton({
	title : 'Scale',
	left : 175, top : 5, height : "40px", width : "90px"
});
scale.addEventListener('click', function(e) {
	if (iv.canScale) {
		iv.canScale = false;
		scale.title = 'Scale';
	} else {
		iv.canScale = true;
		scale.title = 'NoScale';
	}
});

win.add(iv);
win.add(remote);
win.add(scale);
win.add(url1);
win.open();