/**
 * This file is used to validate iOS test-cases. It is ran using the Xcode
 * project in titanium_mobile/iphone/iphone/Titanium.xcodeproj.
 *
 * Change the below code to fit your use-case. By default, it included a button
 * to trigger a log that is displayed in the Xcode console.
 */

var win = Ti.UI.createWindow({backgroundColor: 'white'});

var editing = Titanium.UI.createButton({
    title: 'toggle editing',
    style: Titanium.UI.iOS.SystemButtonStyle.DONE,
});

editing.addEventListener('click',function(){
    
    listView.editing=!listView.editing;
});
var multipleSelection = Titanium.UI.createButton({
      title: 'toggle multipleSelection',
    style: Titanium.UI.iOS.SystemButtonStyle.DONE,
});
multipleSelection.addEventListener('click',function(){
    listView.allowsMultipleSelectionDuringEditing=!listView.allowsMultipleSelectionDuringEditing;
});

var printSelectedRows = Titanium.UI.createButton({
     title: 'get Selected Rows',
    style: Titanium.UI.iOS.SystemButtonStyle.DONE,
});
printSelectedRows.addEventListener('click',function(){
    
   Ti.API.info('********** SelectedRows',listView.getSelectedRows());
});

var flexSpace = Titanium.UI.createButton({
    systemButton:Titanium.UI.iOS.SystemButton.FLEXIBLE_SPACE
});

var toolbar = Titanium.UI.iOS.createToolbar({
    items:[editing, flexSpace, multipleSelection, flexSpace, printSelectedRows],
    bottom:0,
    borderTop:true,
    borderBottom:false
}); 
win.add(toolbar);


var listView = Ti.UI.createListView({top:20,height:Ti.UI.SIZE});
var sections = [];




var fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits'});
var fruitDataSet = [
                    {properties: { title: 'Apple',canEdit:true}},
                    {properties: { title: 'Banana',canEdit:true}},
                    ];
fruitSection.setItems(fruitDataSet);
sections.push(fruitSection);

var vegSection = Ti.UI.createListSection({ headerTitle: 'Vegetables'});
var vegDataSet = [
                  {properties: { title: 'Carrots',canEdit:true}},
                  {properties: { title: 'Potatoes',canEdit:true}},
                  ];
vegSection.setItems(vegDataSet);
sections.push(vegSection);

listView.sections = sections;
win.add(listView);
win.open();

var fishSection = Ti.UI.createListSection({ headerTitle: 'Fish'});
var fishDataSet = [
                   {properties: { title: 'Cod',canEdit:true}},
                   {properties: { title: 'Haddock',canEdit:true}},
                   ];
fishSection.setItems(fishDataSet);
listView.appendSection(fishSection);
