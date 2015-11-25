var window = Ti.UI.createWindow({
  title: "iOS 9.1 Live Photos",
  backgroundColor: "#fff"
});

var view = null;

var nav = Ti.UI.iOS.createNavigationWindow({
  window: window
});

var btn1 = Ti.UI.createButton({
  systemButton: Ti.UI.iPhone.SystemButton.ADD,
  top:30
});

btn1.addEventListener("click", openGallery);

var btn2 = Ti.UI.createButton({
  systemButton: Ti.UI.iPhone.SystemButton.TRASH,
  top:10
});

btn2.addEventListener("click", resetImageView);

var btn3 = Ti.UI.createButton({
  title: "Start livePhoto",
  visible: false,
  bottom:10
});

btn3.addEventListener("click", startLivePhoto);

window.setRightNavButton(btn1);
window.setLeftNavButton(btn2);
window.add(btn3);

nav.open();

function openGallery() {
  Ti.Media.openPhotoGallery({
    mediaTypes: [Titanium.Media.MEDIA_TYPE_PHOTO, Titanium.Media.MEDIA_TYPE_LIVE_PHOTO],
    success: function(e) {
      var photo = e.media; // Static photo without motion of type Ti.Blob
      var livePhoto = e.livePhoto // Live photo of type Ti.UI.iOS.LivePhoto

      if(livePhoto) {
        // Live photo supported and returned
        view = Ti.UI.iOS.createLivePhotoView({
          livePhoto: livePhoto,
          muted: true,
          width: 300
        });

        view.addEventListener("start", function(e) {
            Ti.API.warn("Start playback");
            Ti.API.warn(e);
        });

        view.addEventListener("stop", function(e) {
            Ti.API.warn("Stop playback");
            Ti.API.warn(e);
        });

      } else if(photo) {
        // Default photo for iOS < 9.1
        view = Ti.UI.createImageView({
          image: photo
        });
      } else {
        Ti.API.error("Fallback: Most probably tried to select a video (not part of this example).");
      }

      btn3.setVisible(livePhoto != null);

      window.add(view);
    }
  });
}

function resetImageView() {
    if(!view) {
        return;
    }

    window.remove(view);
}

function startLivePhoto() {
    if(!view) {
        return;
    }

    view.startPlaybackWithStyle(Ti.UI.iOS.LIVEPHOTO_PLAYBACK_STYLE_FULL);

    view.setMuted(false);
    setTimeout(function() {
        view.stopPlayback();
    }, 1000);
}
