function genData (){
	var data = [];
	var baseUrl = 'http://placehold.it/';
	var imageUrl;
	for (i=30;i<=60;i++){
		for (j=30;j<=60;j++){
			imageUrl = baseUrl+i+'x'+j;
			data.push({avatar:{image:imageUrl},info:{text:'Loading Url\n'+imageUrl}})
		}
	}
	
	return data;
}

function setupTest(win){
	var myTemplate = {
		properties: {height:60, backgroundColor:'black'},
		childTemplates: [
		{
			type: 'Ti.UI.ImageView',
			bindId: 'avatar',
			properties: {
				left: 10,
				width: 50, height: 50
			},
		},
		{
			type: 'Ti.UI.Label',
			bindId: 'info',
			properties: {
				color: 'white',
				font: { fontFamily:'Arial', fontSize: 13, fontWeight:'bold' },
				left: 70, top: 5, bottom:5, wordWrap:true, ellipsize:true,
				width: Ti.UI.FILL, height: 50
			},
		}
		]
	};	
	
	var section = Ti.UI.createListSection({headerTitle:'A bunch of remote images'});
	section.setItems(genData());
	var listView = Ti.UI.createListView({
		sections: [section],
		templates: { 'template': myTemplate },
		defaultItemTemplate: 'template',
		backgroundColor: 'black',
	});
	
	win.add(listView);	
}

function list_performance_remote(_args) {
	var win = Ti.UI.createWindow({
		title:'Remote Image Test',
		orientationModes:[Ti.UI.PORTRAIT],
		layout:'vertical'
	});

	var desc = Ti.UI.createLabel({
		text:'This is a list View that uses a custom template that holds an imageView and a label.\n'+
		'The imageView loads remote images. Thank you placehold.it\n'+
		'Expected performance is a smooth scroll experience.\n'+
		'On scrolling back and forth in the list view, the right image must be loaded.(since we are reusing views)\n\n'
	})
	
	var button = Ti.UI.createButton({title:'Show Me',top:10});
	
	win.add(desc);
	win.add(button);
	
	button.addEventListener('click',function(){
		win.remove(desc);
		win.remove(button);
		setupTest(win);
	})
	
	return win;
}

module.exports = list_performance_remote;