var win = Titanium.UI.currentWindow;
win.backgroundColor = 'white';

var l1 = Ti.UI.createLabel({
  text: 'When the phone is near you, the background of this view will be red',
  top: 10,
  left: 10
});
win.add(l1);

if(!Ti.Proximity.available) {
  alert("Proximity events are not available on your device");
}

Ti.Proximity.addEventListener('change', function(e) {
  if(e.close) {
    win.backgroundColor = 'red';
  } else {
    win.backgroundColor = 'white';
  }
});

