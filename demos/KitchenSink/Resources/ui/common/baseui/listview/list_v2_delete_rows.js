function isValidVar(check){
    if (check !== undefined && check !== null){
        return true;
    }
    return false;
}

function clickHandler(e){
    var message = 'Type:'+e.type+'\nSection title:'+e.section.headerTitle+'\nsectionIndex:'+e.sectionIndex+'\nitemIndex:'+e.itemIndex;
    if(isValidVar(e.bindId)){
        message += '\nbindId:'+e.bindId;
    }
    if(isValidVar(e.itemId)){
        message += '\nitemId:'+e.itemId;
    }
    alert(message);
}

function genTest(win){
	var myTemplate = {
	    properties: {height:60},
	    childTemplates: [
	    {
	        type: 'Ti.UI.Button',
	        bindId: 'clicker',
	        properties: {
	            left: 10,
	            width: 150, height: 50,
	            title:'CLICK ME!'
	        },
	        events:{
	            click:clickHandler
	        },
	    },
	    {
	        type: 'Ti.UI.Label',
	        bindId: 'info',
	        properties: {
	            font: { fontFamily:'Arial', fontSize: 13, fontWeight:'bold' },
	            left: 170, top: 5, bottom:5, wordWrap:true, ellipsize:true,
	            width: Ti.UI.FILL, height: 50
	        },
	    }
	    ]
	};

	var section1 = Ti.UI.createListSection({ headerTitle: 'Mixed Edit'});
	
	var data1 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE}, info:{text:'canEdit = Undefined'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canEdit:false}, info:{text:'canEdit = false'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canEdit:true}, info:{text:'canEdit = true'}},
	];
	
	section1.setItems(data1);
	
	var section2 = Ti.UI.createListSection({ headerTitle: 'No Editing'});
	
	var data2 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE}, info:{text:'canEdit = Undefined'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canEdit:false}, info:{text:'canEdit = false'}},
	];
	
	section2.setItems(data2);
	
	
	var section3 = Ti.UI.createListSection({ headerTitle: 'Edit All'});
	
	var data3 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canEdit:true}, info:{text:'canEdit = true'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canEdit:true}, info:{text:'canEdit = true'}},
	];
	
	section3.setItems(data3);
	
	
	var section4 = Ti.UI.createListSection({ headerTitle: 'Mixed Edit'});
	
	var data4 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE}, info:{text:'canEdit = Undefined'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canEdit:true}, info:{text:'canEdit = true'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canEdit:false}, info:{text:'canEdit = false'}},
	];
	
	section4.setItems(data4);
	
	var section5 = Ti.UI.createListSection({ headerTitle: 'No Editing'});
	
	var data5 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE}, info:{text:'canEdit = Undefined'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canEdit:false}, info:{text:'canEdit = false'}},
	];
	
	section5.setItems(data5);
	
	
	var section6 = Ti.UI.createListSection({ headerTitle: 'Edit All'});
	
	var data6 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canEdit:true}, info:{text:'canEdit = true'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canEdit:true}, info:{text:'canEdit = true'}},
	];

	section6.setItems(data6);


	var listView = Ti.UI.createListView({
    	templates: { 'myCell': myTemplate },
    	defaultItemTemplate:'myCell',
    	sections:[section1,section2,section3,section4,section5,section6],
    	height:'80%',
    	pruneSectionsOnEdit:true
	});

	var container = Ti.UI.createView({
		height:'20%',
		layout:'horizontal',
		backgroundColor:'#ccc'
	})
	
	var btn = Ti.UI.createButton({
	    title:'Toggle Editing'
	})
	
	var status = Ti.UI.createLabel({height:Ti.UI.FILL});

	win.add(listView);
	win.add(container);
	container.add(btn);
	container.add(status);

	var isEditing = false;

	btn.addEventListener('click',function(){
    	if(listView.editing !== undefined) {
        	isEditing = listView.editing;
        	status.text = 'listView.editing is '+isEditing+'. Setting to '+!isEditing;
    	} else {
        	status.text='listView.editing is undefined. ASSUME false. Setting to true';
        	isEditing = false;
    	}

	    isEditing = !isEditing;

    	listView.setEditing(isEditing);
	})

	listView.addEventListener('itemclick',clickHandler)

	listView.addEventListener('delete',function(e){
    	status.text = 'delete event sectionIndex='+ e.sectionIndex+', itemIndex='+e.itemIndex;
	})
	
}

function list_v2_delete_rows(_args) {
	var win = Ti.UI.createWindow({
		title:'Delete Rows',
		layout:'vertical'
	});
	
	var scrollView = Ti.UI.createScrollView({layout:'vertical'});
	
	var desc = Ti.UI.createLabel({
		text:'This test shows the delete support in ListView. This is separate from the delete programming API and is user initiated.\n\n'+
		'Deletion is supported by the canEdit property of the listItem (default is false).\n\n'+
		'The delete event fires when a row is deleted. The itemIndex and sectionIndex in this event correspond to the old data set. By the time the event is fired the dataset is already updated.\n\n'+
		'The ListView property pruneSectionsOnEdit (default false) controls if empty sections are kept around while editing.This property only effects the section being edited. In this example pruneSectionsOnEdit is true.\n\n'+
		'The ListView can be put in editing mode either by swiping accross a row that has canEdit true or by manually setting the editing property of the ListView.\n\n'+
		'Click the buttons to ensure that events fired from child templates have the right itemIndex and sectionIndex after delete.\n\n'
	})
	
	scrollView.add(desc);
	
	var button = Ti.UI.createButton({
		top:10,
		title:'I understand'
	})
	
	scrollView.add(button);
	
	button.addEventListener('click',function(){
		win.remove(scrollView);
		genTest(win);
	})
	
	win.add(scrollView);
	
	return win;
}


module.exports = list_v2_delete_rows;