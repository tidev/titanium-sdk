
Titanium.API.debug("from inside current dialog = "+Ti.UI.currentDialog);

var t = Ti.UI.createLabel({text:'Modeless Window Example',color:'white',top:10,textAlignment:'center',font:{ fontFamily:'helvetica neue', fontSize:'18px', fontWeight: 'bold'}});
Ti.UI.currentDialog.add(t);
