var win1 = Ti.UI.createWindow({
    backgroundColor: 'blue',
    title: 'Blue'
});
win1.add(Ti.UI.createLabel({text: 'I am a blue window.'}));

var win2 = Ti.UI.createWindow({
    backgroundColor: 'red',
    title: 'Red'
});
win2.add(Ti.UI.createLabel({text: 'I am a red window.'}));

var tab1 = Ti.UI.createTab({
    window: win1,
    title: 'Blue'
}),
tab2 = Ti.UI.createTab({
    window: win2,
    title: 'Red'
}),
tabGroup = Ti.UI.createTabGroup({
    tabs: [tab1, tab2]
});

tabGroup.addEventListener("focus", function(e){
 Ti.API.info("Index "+ e.index);
});
tabGroup.open();
