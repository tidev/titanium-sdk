// create table view
var tableview = Titanium.UI.createTableView();

Ti.App.fireEvent("show_indicator");

// create table view event listener
tableview.addEventListener('click', function(e)
{
	// event data
	var index = e.index;
	var section = e.section;
	var row = e.row;
	var rowdata = e.rowData;
	Titanium.UI.createAlertDialog({title:'Table View',message:'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata}).show();
});

var navActInd = Titanium.UI.createActivityIndicator();
navActInd.show();
Titanium.UI.currentWindow.setRightNavButton(navActInd);

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

Titanium.Yahoo.yql('select * from flickr.photos.search where text="Cat" limit 10',function(e)
{
	var images = [];
	var data = e.data;
	for (var c=0;c<data.photo.length;c++)
	{
		var photo = data.photo[c];
		// form the flickr url
		var url = 'http://farm' + photo.farm + '.static.flickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_m.jpg';
		Ti.API.info("flickr url = "+url);
		var row = Ti.UI.createTableViewRow({height:60});
		var title = Ti.UI.createLabel({
			left:70,
			right:10,
			textAlign:'left',
			height:50,
			text:photo.title ? photo.title : "Untitled",
			font:{fontWeight:'bold',fontSize:18}
		});
		var image = Ti.UI.createImageView({
			image : url,
			height:50,
			width:50,
			left:10,
			defaultImage:'../modules/ui/images/photoDefault.png'
		});
		row.add(image);
		row.add(title);
		images[c] = row;
	}
	tableview.setData(images);
	navActInd.hide();
	Ti.App.fireEvent("hide_indicator");
});
				
