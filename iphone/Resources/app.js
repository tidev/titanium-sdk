/**
 * This file is used to validate iOS test-cases. It is ran using the Xcode
 * project in titanium_mobile/iphone/iphone/Titanium.xcodeproj.
 *
 * Change the below code to fit your use-case. By default, it included a button
 * to trigger a log that is displayed in the Xcode console.
 */

 Ti.Media.requestPhotoGalleryPermissions(function (e) {

 });
/*
var win = Ti.UI.createWindow({
    backgroundColor: '#fff'
});

var btn = Ti.UI.createButton({
    title: 'Trigger'
});

var view = Ti.UI.createView({
	width: 200,
	height: 300,
	backgroundColor: 'red'
});
btn.addEventListener('click', function() {
    Ti.API.info(L('hello_world'));

    Ti.Media.openPhotoGallery({
		success: function(e) {
			//photo = e.media;

            if (e.images != null && e.images[0].mediaType == Ti.Media.MEDIA_TYPE_PHOTO) {
	            var childWindow = Ti.UI.createWindow();
				childWindow.add(Ti.UI.createImageView(
				{
					image: e.images[0].media,
					width: Ti.UI.FILL,
					height: Ti.UI.FILL,
				}));
				childWindow.open();

            } else if (e.livePhotos != null && e.livePhotos[0].mediaType == Ti.Media.MEDIA_TYPE_LIVEPHOTO){
            	var childWindow = Ti.UI.createWindow();
                var livePhotoView = Ti.UI.iOS.createLivePhotoView({
                    livePhoto: e.livePhotos[0].livePhoto,
                    muted: true,
                    width: 300
                });

                livePhotoView.addEventListener("start", function(e) {
                    Ti.API.warn("-- Start playback --");
                    Ti.API.warn(e);
                });

                livePhotoView.addEventListener("stop", function(e) {
                    Ti.API.warn("-- Stop playback --");
                    Ti.API.warn(e);
                });
              childWindow.add(livePhotoView);
              childWindow.open();
            } else {
            	Ti.API.info('video perhaps');
				var childWindow = Ti.UI.createWindow();
				childWindow.add(Ti.Media.createVideoPlayer(
				{
					url: e.media.nativePath,
					autoplay: true,
					mediaControlStyle: Ti.Media.VIDEO_CONTROL_DEFAULT,
					scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FIT,
					width: Ti.UI.FILL,
					height: Ti.UI.FILL,
				}));
				childWindow.open();
			}
		},
	//	allowTranscoding: true,
	//	allowEditing: true,
	//	popoverView: view,
		mediaTypes: [ Ti.Media.MEDIA_TYPE_LIVEPHOTO, Ti.Media.MEDIA_TYPE_PHOTO]//, Ti.Media.MEDIA_TYPE_VIDEO]
	})
});

win.add(btn);
win.open();
*/
// ios 14 features
/* no
var switchS =  Ti.UI.createSwitch({
	top: 120
});
win.add(switchS);

win.open();
*/

/*
var win = Ti.UI.createWindow({
    backgroundColor: '#fff',
    title: 'Title'
});

var win2 = Ti.UI.createWindow({
    backgroundColor: '#fff',
    backButtonTitle: ""
});

var btn = Ti.UI.createButton({
    title: 'Trigger'
});

var view = Ti.UI.createView({
	width: 200,
	height: 300,
	backgroundColor: 'red'
});
btn.addEventListener('click', function() {
    Ti.API.info(L('hello_world'));
    navWindow.openWindow(win2);
});

win.add(btn);

var navWindow = Ti.UI.createNavigationWindow({
	window: win
});

navWindow.open();
*/

/*
Ti.UI.backgroundColor = 'white';
var win = Ti.UI.createWindow({
  exitOnClose: true,
  layout: 'vertical'
});

var picker = Ti.UI.createPicker({
  type:Ti.UI.PICKER_TYPE_DATE_AND_TIME,
  minDate:new Date(2009,0,1),
  maxDate:new Date(2014,11,31),
  value:new Date(2014,3,12),
  top:50
});

win.add(picker);
win.open();

picker.addEventListener('change',function(e){
  Ti.API.info("User selected date: " + e.value.toLocaleString());
});
*/

var window = Ti.UI.createWindow();

var navWindow = Ti.UI.createNavigationWindow({window: window});
var tableView = Ti.UI.createTableView(
{
	width: Ti.UI.FILL,
	height: Ti.UI.FILL,
});
window.add(tableView);
var addButton = Ti.UI.createButton(
{
	title: "Add",
	left: "10dp",
	bottom: "10dp",
});
addButton.addEventListener("click", function(e) {
	var dialog = Ti.UI.createAlertDialog(
	{
		message: "Which media type do you want to open?",
		buttonNames: ["Photo", "Live Photo", "Video", "All"],
	});
	dialog.addEventListener("click", function(e) {
		var mediaTypes;
		if (e.index === 0) {
			mediaTypes = [Ti.Media.MEDIA_TYPE_PHOTO];
		} else if (e.index === 1) {
			mediaTypes = [Ti.Media.MEDIA_TYPE_LIVEPHOTO];
		} else if (e.index === 2) {
			mediaTypes = [Ti.Media.MEDIA_TYPE_VIDEO];
		} else if (e.index === 3) {
			mediaTypes = [Ti.Media.MEDIA_TYPE_PHOTO, Ti.Media.MEDIA_TYPE_LIVEPHOTO, Ti.Media.MEDIA_TYPE_VIDEO];
		} else {
			Ti.API.info("@@@ Alert was canceled.");
			return;
		}
		dialog.hide();
		Ti.Media.openPhotoGallery(
		{
		    allowMultiple: true,
		    selectionLimit: 10,
			autohide: true,
			mediaTypes: mediaTypes,
			success: function(e) {
				Ti.API.info("@@@ success() e: " + JSON.stringify(e));
				var createRowFrom = function(selectionEvent) {

					var fileName = null;

					if (!fileName) {
						if (selectionEvent.mediaType === Ti.Media.MEDIA_TYPE_PHOTO) {
							fileName = "Image";
						} else if (selectionEvent.mediaType === Ti.Media.MEDIA_TYPE_VIDEO) {
							fileName = "Video";
						} else {
							fileName = "Live Photo";
						}
					}
					var row = Ti.UI.createTableViewRow({ title: fileName });
					row.addEventListener("click", function(e) {
						switch (selectionEvent.mediaType) {
							case Ti.Media.MEDIA_TYPE_PHOTO:
								var childWindow = Ti.UI.createWindow({backgroundColor: 'white'});
								childWindow.add(Ti.UI.createImageView(
								{
									image: selectionEvent.media,
									width: Ti.UI.FILL,
									height: Ti.UI.FILL,
								}));
								navWindow.openWindow(childWindow);
								break;
							case Ti.Media.MEDIA_TYPE_LIVEPHOTO:
								var childWindow = Ti.UI.createWindow({backgroundColor: 'white'});
								var livePhotoView = Ti.UI.iOS.createLivePhotoView({
									livePhoto: selectionEvent.livePhoto,
									muted: true,
									width: 300
								});

								livePhotoView.addEventListener("start", function(e) {
									Ti.API.warn("-- Start playback --");
									Ti.API.warn(e);
								});

								livePhotoView.addEventListener("stop", function(e) {
									Ti.API.warn("-- Stop playback --");
									Ti.API.warn(e);
								});
								childWindow.add(livePhotoView);
								navWindow.openWindow(childWindow);
								break;
							case Ti.Media.MEDIA_TYPE_VIDEO:
								var childWindow = Ti.UI.createWindow({backgroundColor: 'white'});
								childWindow.add(Ti.Media.createVideoPlayer(
								{
									url: selectionEvent.media.nativePath,
									autoplay: true,
									mediaControlStyle: Ti.Media.VIDEO_CONTROL_DEFAULT,
									scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FIT,
									width: Ti.UI.FILL,
									height: Ti.UI.FILL,
								}));
								navWindow.openWindow(childWindow);
								break;
							default:
								alert("Unknown media type selected.");
								break;
						}
					});
					return row;
				};
				if (e.images) {
					for (var index = 0; index < e.images.length; index++) {
						tableView.appendRow(createRowFrom(e.images[index]));
					}
				}
				if (e.livePhotos) {
					for (var index = 0; index < e.livePhotos.length; index++) {
						tableView.appendRow(createRowFrom(e.livePhotos[index]));
					}
				}
				if (e.videos) {
					for (var index = 0; index < e.videos.length; index++) {
						tableView.appendRow(createRowFrom(e.videos[index]));
					}
				}
			},
			cancel: function() {
				Ti.API.info("@@@ Photo gallery selection canceled.");
			},
			error: function() {
				Ti.API.info("@@@ Photo gallery selection error.");
			},
		});
	});
	dialog.show();
});
window.add(addButton);
var clearButton = Ti.UI.createButton(
{
	title: "Clear",
	right: "10dp",
	bottom: "10dp",
});
clearButton.addEventListener("click", function(e) {
	tableView.data = [];
});
window.add(clearButton);
navWindow.open();
