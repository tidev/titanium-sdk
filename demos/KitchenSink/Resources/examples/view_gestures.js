var win = Titanium.UI.currentWindow;
win.backgroundColor = 'blue';
win.name = "window";

var view = Ti.UI.createView({
  backgroundColor:"red"
});

win.add(view);

view.addEventListener('pinch', function(e){
  Ti.API.info('pinch:' + JSON.stringify(e));
});

view.addEventListener('longpress', function(e){
  Ti.API.info('longpress:' + JSON.stringify(e));
});
