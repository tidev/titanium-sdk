var win = Ti.UI.currentWindow;
win.backgroundColor = '#EEE';

var closeButton = Ti.UI.createButton({
	title: 'Close',
	top: 10,
	left: 10,
	width: 300,
	height: 40
});

var imageView = Ti.UI.createImageView({
	left: 98,
	top: 55,
	width: 125,
	height: 125,
	backgroundColor: '#888',
	defaultImage: '/images/titanium_desk.png'
});

var images = [{title:'0.jpg'},
		 	{title:'1.jpg'},
		 	{title:'2.jpg'},
		 	{title:'3.jpg'},
		 	{title:'4.jpg'}];

var imageTable = Ti.UI.createTableView({
	top: 190,
	left:10,
	width: 300,
	height:150,
	data: images
});

win.add(closeButton);
win.add(imageView);
win.add(imageTable);

imageTable.addEventListener('click', function(e){
			rowData = e.rowData;
			imageView.image = '/images/imageview/' + rowData.title;
});


closeButton.addEventListener('click', function(){
	
	Titanium.UI.currentWindow.close();
});
