function isValidVar(check){
	if (check !== undefined && check !== null){
		return true;
	}
	return false;
}

function clickHandler(e){
	var message = 'Section title:'+e.section.headerTitle+'\nsectionIndex:'+e.sectionIndex+'\nitemIndex:'+e.itemIndex;
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
  		properties: {height: 60},
  		events:{
  			click:clickHandler
  		},
	  	childTemplates: [
  		{
    		type: 'Ti.UI.Button',
    		bindId:'ZERO',
    		properties: {
      			title: 'Button 0',
      			left:5
    		}
  		},
  		{
    		type: 'Ti.UI.Button',
    		properties: {
      			title: 'Button 1',
      			right:5
    		}
  		}
  	]}
  	
  	var section0 = Ti.UI.createListSection({headerTitle:'Section 0'});
  	var data0 = [{},{properties:{itemId:'ROW 1'}}];
  	section0.setItems(data0);

  	var section1 = Ti.UI.createListSection({headerTitle:'Section 1'});
  	var data1 = [{},{properties:{itemId:'ROW 1'}}];
  	section1.setItems(data1);
  	
  	var listView = Ti.UI.createListView({
  		templates: { 'myCell': myTemplate },
  		defaultItemTemplate:'myCell',
  		sections: [ section0,section1 ]
	});
	win.add(listView);
}

function list_eventbubble(_args) {
	var win = Ti.UI.createWindow({
		title:'Event Bubbling',
		layout:'vertical'
	});
	
	var desc = Ti.UI.createLabel({
		text:'Check for Bubbling to listItem. The events are added to the custom template.\n'+
		'The template defines two buttons. Button 0 has bindId(ZERO), Button 1 has no bindId.\n'+
		'The first row in each section has no itemId, the second row does (ROW 1).\n'+
		'Expected event bubbles, gets right section, sectionIndex, itemIndex, itemId (if availabe) and bindId(if available)\n'+
		'ENSURE PARITY'
	})
	
	win.add(desc);
	
	var button = Ti.UI.createButton({
		top:10,
		title:'I understand'
	})
	
	win.add(button);
	
	button.addEventListener('click',function(){
		//win.removeAllChildren();//Does not work on Android on HW windows.
		win.remove(desc);
		win.remove(button);
		genTest(win);
	})
	

	return win;
}

module.exports = list_eventbubble;
