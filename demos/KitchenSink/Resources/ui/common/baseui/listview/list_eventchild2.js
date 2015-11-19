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
  		properties: {height: 60},
	  	childTemplates: [
  		{
    		type: 'Ti.UI.Button',
    		bindId:'ZERO',
	  		events:{
	  			click:clickHandler
	  		},
    		properties: {
      			title: 'Button 0',
      			left:5
    		}
  		},
  		{
    		type: 'Ti.UI.Label',
	  		events:{
	  			click:clickHandler
	  		},
    		properties: {
      			text: 'Label 1',
      			right:5,
      			backgroundColor:'red',
      			color:'white'
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
	
	listView.addEventListener('itemclick',clickHandler);
	win.add(listView);
}

function list_eventchild(_args) {
	var win = Ti.UI.createWindow({
		title:'EVENT INTERACTION',
		layout:'vertical'
	});
	
	var desc = Ti.UI.createLabel({
		text:'This is a modified version of the child event test. The events are added to the child template.'+
		'ListView is also listening for the itemclick event.\n'+
		'We are using a label and not a button which makes a difference on iOS.\n'+
		'The template defines two children. Button 0 has bindId(ZERO), Label 1 has no bindId.\n'+
		'The first row in each section has no itemId, the second row does (ROW 1).\n'+
		'WE MAY NOT HAVE PARITY(LABELS) HERE DUE TO UNDERLYING OS',
		wordWrap:true
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

module.exports = list_eventchild;
