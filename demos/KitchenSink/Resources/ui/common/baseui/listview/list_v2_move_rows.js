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

	var section1 = Ti.UI.createListSection({ headerTitle: 'Section 1'});
	
	var data1 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE}, info:{text:'canMove = Undefined'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canMove:false}, info:{text:'canMove = false'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canMove:true}, info:{text:'canMove = true'}},
	];
	
	section1.setItems(data1);
	
	var section2 = Ti.UI.createListSection({ headerTitle: 'Section 2'});
	
	var data2 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE}, info:{text:'canMove = Undefined'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canMove:false}, info:{text:'canMove = false'}},
	];
	
	section2.setItems(data2);
	
	
	var section3 = Ti.UI.createListSection({ headerTitle: 'Section 3'});
	
	var data3 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canMove:true}, info:{text:'canMove = true'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canMove:true}, info:{text:'canMove = true'}},
	];
	
	section3.setItems(data3);
	
	
	var section4 = Ti.UI.createListSection({ headerTitle: 'Section 4'});
	
	var data4 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE}, info:{text:'canMove = Undefined'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canMove:true}, info:{text:'canMove = true'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canMove:false}, info:{text:'canMove = false'}},
	];
	
	section4.setItems(data4);
	
	var section5 = Ti.UI.createListSection({ headerTitle: 'Section 5'});
	
	var data5 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE}, info:{text:'canMove = Undefined'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canMove:false}, info:{text:'canMove = false'}},
	];
	
	section5.setItems(data5);
	
	
	var section6 = Ti.UI.createListSection({ headerTitle: 'Section 6'});
	
	var data6 = [
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canMove:true}, info:{text:'canMove = true'}},
	    {properties: {accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE, canMove:true}, info:{text:'canMove = true'}},
	];

	section6.setItems(data6);


	var listView = Ti.UI.createListView({
    	templates: { 'myCell': myTemplate },
    	defaultItemTemplate:'myCell',
    	sections:[section1,section2,section3,section4,section5,section6],
    	height:'80%',
    	pruneSectionsOnEdit:false
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

	listView.addEventListener('move',function(e){
    	status.text = 'move (section,item) from ('+ e.sectionIndex+','+e.itemIndex+ ') to ('+e.targetSectionIndex+','+e.targetItemIndex+')';
	})
	
}

function list_v2_move_rows(_args) {
	var win = Ti.UI.createWindow({
		title:'Reorder Rows',
		layout:'vertical'
	});
	
	var scrollView = Ti.UI.createScrollView({layout:'vertical'});
	
	var desc = Ti.UI.createLabel({
		text:'This test shows the reorder support in ListView. Reordering is supported by the canMove property of the listItem (default is false).\n\n'+
		'The move event fires when a row is moved. The itemIndex and sectionIndex in this event correspond to the old data set. The event also has targetSectionIndex and targetItemIndex specifying where the item was moved.\n\n'+
		'The ListView property pruneSectionsOnEdit (default false) controls if empty sections are kept around while reordering. This property only effects the section being edited. In this example pruneSectionsOnEdit is false.\n\n'+
		'The ListView must be put in editing mode by setting the editing property of the ListView to true for reordering support.\n\n'+
		'Click the buttons to ensure that events fired from child templates have the right itemIndex and sectionIndex after move.\n\n'
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


module.exports = list_v2_move_rows;