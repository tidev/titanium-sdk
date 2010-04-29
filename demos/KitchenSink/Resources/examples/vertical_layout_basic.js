var win = Ti.UI.currentWindow;
win.layout = 'vertical';

// HEADER
var header = Ti.UI.createView({height:50,borderWidth:1,borderColor:'#999',backgroundColor:'white'});
var headerLabel = Ti.UI.createLabel({color:'#777', top:10,textAlign:'center', height:'auto', text:'Header'});
header.add(headerLabel);

win.add(header);

// BODY
var body = Ti.UI.createView({height:'auto', layout:'vertical', backgroundColor:'#fff'});

var bodyView1 = Ti.UI.createView({backgroundColor:'#336699', height:100, left:10, right:10});
var bodyView2 = Ti.UI.createView({backgroundColor:'#ff0000', height:50, left:10, right:10, top:10});
var bodyView3 = Ti.UI.createView({backgroundColor:'orange', height:50, left:10, right:10, top:10});
body.add(bodyView1);
body.add(bodyView2);
body.add(bodyView3);

win.add(body);

// FOOTER
var footer = Ti.UI.createView({height:50,borderWidth:1,borderColor:'#999',backgroundColor:'white'});
var footerLabel = Ti.UI.createLabel({color:'#777', textAlign:'center', height:'auto', text:'Footer'});
footer.add(footerLabel);

win.add(footer);
