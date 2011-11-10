var w = Ti.UI.currentWindow;

var images = [
	'http://t2.gstatic.com/images?q=tbn:BjUSCfLZ6aMORM:http://mariusbardan.files.wordpress.com/2009/10/carbonapple_mono1024.jpg',
	'http://t0.gstatic.com/images?q=tbn:HhYIr-Oz_5sLkM:http://blog.volgyiattila.hu/wp-content/uploads/2009/01/apple-logo1.jpg',
	'http://t3.gstatic.com/images?q=tbn:u18bgKxb_hjznM:http://www.applephone.hu/wp-content/gallery/miki315/apple-marbles.jpg',
	'http://t1.gstatic.com/images?q=tbn:GzVd4vgzFJCrdM:http://muzzak.freeblog.hu/files/apple.jpg',
	'http://t2.gstatic.com/images?q=tbn:-iOGlc8ww3Zx8M:http://www.arukereso.hu/akciostippek/wp-content/uploads/2009/06/apple-iphone.jpg',
	'http://t3.gstatic.com/images?q=tbn:T2pHhXb3a80U1M:http://hirkep.wapzona.hu/2008/07/28/apple_touch.jpg',
	'http://t3.gstatic.com/images?q=tbn:2IfDq8oqmRRJEM:http://mobilisztan.blog.hu/media/image/apple-iphone.jpg',
	'http://t0.gstatic.com/images?q=tbn:CN-Abkg3DWfM4M:http://kepzavar.info/wp-content/uploads/2009/12/apple-iphone.jpg',
	'http://t3.gstatic.com/images?q=tbn:NRHT1TtifhKitM:http://fenyoter.sopron.hu/html/pic/fresh-apple.jpg'
];

var table = Ti.UI.createTableView({});
w.add(table);

var idx = 1;

for (var i in images) {
	var row = Ti.UI.createTableViewRow({
		height: 150,
		className: 'image'
	});

	var imgView = Ti.UI.createImageView({
		image: images[i],
		width: 128,
		height: 100,
		row: idx++
	});
	row.add(imgView);
	
	table.appendRow(row);
}
