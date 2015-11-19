function getData(){
    var data = [];
 	var subtitleStr = '';

    for(i=0;i<40;i++) {
        var acType = Ti.UI.LIST_ACCESSORY_TYPE_NONE;
        if(i == 1) {
        	subtitleStr = 'I have checkmark accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK;
        } else if(i == 2) {
        	subtitleStr = 'I have detail accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_DETAIL;
        } else if (i == 3) {
        	subtitleStr = 'I have disclosure accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_DISCLOSURE;
        } else {
        	subtitleStr = 'I have no accessory ';
        }
        var item = {
            template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT,
            properties: {title:subtitleStr, accessoryType:acType, itemId:'Item '+i+' '+acType}
        }
        data.push(item)
    }
    return data;
}


function list_selection(_args) {
	var win = Ti.UI.createWindow({
		title:'Allows Selection',
		layout:'vertical'
	});
	
	var button1 = Ti.UI.createButton({
		title:'Toggle Scroll To Top',
		width:Ti.UI.FILL,
		left:5
	})

	var button2 = Ti.UI.createButton({
		title:'Toggle Allows Selection',
		width:Ti.UI.FILL,
		left:5
	})
	
	var status = Ti.UI.createLabel({
		text:'Allows Selection is true.\nClick a row or accessory and itemclick must fire'
	})
	
	var myTemplate = {
  		properties: {height: 60},
	  	childTemplates: [
  		{
    		type: 'Ti.UI.Button',
    		bindId:'cellButton',
    		properties: {
      			title: 'CLICK ME!',
    		},
			events: {
				'click': function(e) {
					alert('BUTTON CLICK EVENT FIRED')						
				}
			}  		
		}
  	]}

	var section = Ti.UI.createListSection();
	var data = [{template:'myCell'}].concat(getData());
	section.setItems(data);
	var listView = Ti.UI.createListView({
		top:10,
  		sections: [ section ],
  		templates:{'myCell':myTemplate},
  		backgroundColor:'gray',
	});
	

	win.add(button1);
	win.add(button2);
	win.add(status);
	win.add(listView);
	
	var allowsSelection = true;
	button2.addEventListener('click',function(){
		allowsSelection = !allowsSelection;
		if(allowsSelection == true){
			status.text = 'Allows Selection is true.\nClick a row or accessory and itemclick must fire';
		} else {
			status.text = 'Allows Selection is FALSE.\nClick a row or accessory and itemclick must --NOT-- fire. (Except for detail accessory). Button clicks should still fire.';
		}
		listView.allowsSelection = allowsSelection;
	})
	
	var scrollstotop = true;
	button1.addEventListener('click',function(){
		scrollstotop = !scrollstotop;
		listView.willScrollOnStatusTap = scrollstotop;
	})

	listView.addEventListener('itemclick',function(e){
		alert('GOT ITEM CLICK')
	});
	
	return win;
};

module.exports = list_selection;
