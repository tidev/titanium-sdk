function areSame(var1, var2){
	if (var1 == undefined) {
		var1 = '';
	}
	return var1 === var2;
}

function handleKBUpdate(e){
	try {
		var item = e.section.getItemAt(e.itemIndex);
		if(areSame(item.bindField.value,e.value) == false) {
			item.bindField.value = e.value;
			item.taskLabel.text = 'Got '+e.value;
			e.section.updateItemAt(e.itemIndex,item);
		}
	} catch (err) {
		Ti.API.error('Error in handleKBUpdate. Window closing ? '+err.message);
	}
}

function handleSwitchChangeEvent(e){
	var newVal = e.value;
	var item = e.section.getItemAt(e.itemIndex);
	
	if (item == undefined) {
		Ti.API.warn('1 GOT change event from switch before list view was ready. Probably from initialization');
		return;
	} else if (item.taskSwitch == undefined) {
		Ti.API.warn('2 GOT change event from switch before list view was ready. Probably from initialization');
		return;
	}
	
	if(item.taskSwitch.value !== newVal)
	{
		item.taskSwitch.value = newVal;
		if (newVal == true) {
			item.taskLabel.color = '#00cc00';
			item.taskLabel.text = 'Event '+e.itemIndex+' is GO';
		} else {
			item.taskLabel.color = '#ff0000';
			item.taskLabel.text = 'Event '+e.itemIndex+' is NOGO';
		}
		e.section.updateItemAt(e.itemIndex,item);
	}
}

function handleSliderUpdate(e){
	var item = e.section.getItemAt(e.itemIndex);
	if (e.value > 0.99) {
		e.section.updateItemAt(e.itemIndex,{properties:{title:item.taskLabel.text+' is done', color:'#00cc00',accessoryType:Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK}});
	} else {
		item.taskTrack.value = e.value;
		if(e.value < 0.33){
			item.taskLabel.color = '#ff0000';
		} else if (e.value < 0.66) {
			item.taskLabel.color = '#ffcc00';
		} else {
			item.taskLabel.color = '#00cc00';
		}
		e.section.updateItemAt(e.itemIndex,item);
	}
}

function setupTest(win){
	
	var data0 = [
	{template:'myCell1',taskLabel:{text:'Name'},bindField:{keyboardType:Ti.UI.KEYBOARD_DEFAULT}},
	{template:'myCell1',taskLabel:{text:'Phone'},bindField:{keyboardType:Ti.UI.KEYBOARD_NAMEPHONE_PAD}},
	];
		
	var data1 = [
	{properties:{title:'Mark Me Done',height:50,itemId:'0',font:{fontWeight:'normal'}}},
	{properties:{title:'Mark Me Critical',height:50,itemId:'1',font:{fontWeight:'normal'}}},
	];

	var data2 = [
	{template:'myCell',taskLabel:{text:'Task 1',color:'#ff0000'},taskTrack:{value:0.2}},
	{template:'myCell',taskLabel:{text:'Task 2',color:'#ffcc00'},taskTrack:{value:0.5}},
	{template:'myCell',taskLabel:{text:'Task 3',color:'#00cc00'},taskTrack:{value:0.8}},
	];

	var data3 = [
	{template:'myCell2',taskLabel:{text:'Event 0 is NOGO',color:'#ff0000'},taskSwitch:{value:false}},
	{template:'myCell2',taskLabel:{text:'Event 1 is GO',color:'#00cc00'},taskSwitch:{value:true}},
	];

	var myTemplate = {
		properties: {height: 50},
		childTemplates:[
		{
			type:'Ti.UI.Label',
			bindId:'taskLabel',
			properties:{ left:0,width:'45%'}
		},
		{
			type:'Ti.UI.Slider',
			bindId:'taskTrack',
			properties:{left:'45%',width:'45%',min:0,max:1},
			events:{
				'stop':handleSliderUpdate//For iOS and Android. (TIMOB-13109)
			}
		}
		]
	};
	
	var myTemplate2 = {
		properties: {height: 50},
		childTemplates:[
		{
			type:'Ti.UI.Label',
			bindId:'taskLabel',
			properties:{ left:0,width:'60%'}
		},
		{
			type:'Ti.UI.Switch',
			bindId:'taskSwitch',
			properties:{right:10},
			events:{
				'change':handleSwitchChangeEvent
			}
		}
		]
	};

	var myTemplate1 = {
		properties: {height: 50},
		childTemplates:[
		{
			type:'Ti.UI.Label',
			bindId:'taskLabel',
			properties:{ left:0,width:'50%'}
		},
		{
			type:'Ti.UI.TextField',
			bindId:'bindField',
			properties:{ right:0, width:'50%', borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED, color:'black', backgroundColor:'lightgray',value:''},
			events:{
				'blur':handleKBUpdate,
				'return':handleKBUpdate
			}
		}
		]
	};

	var section0 = Ti.UI.createListSection({headerTitle:'DATA ENTRY'});
	section0.setItems(data0);

	var section1 = Ti.UI.createListSection({headerTitle:'TO DO LIST'});
	section1.setItems(data1);
	
	var section2 = Ti.UI.createListSection({headerTitle:'TASK PROGRESS'});
	section2.setItems(data2);
	
	//Switch is not working well right now. Will add when fixed.
	var section3 = Ti.UI.createListSection({headerTitle:'GO / NOGO'});
	section3.setItems(data3);

	var listView = Ti.UI.createListView({
		templates:{'myCell':myTemplate, 'myCell1':myTemplate1, 'myCell2':myTemplate2},
		sections:[section0,section1,section2,section3]
	});
	
	listView.addEventListener('itemclick',function(e){
		if(e.itemId == '0'){
			var item = e.section.getItemAt(e.itemIndex);
			item.properties.color = '#00cc00';
			item.properties.accessoryType = Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK;
			e.section.updateItemAt(e.itemIndex,item);
		} else if (e.itemId == '1'){
			var item = e.section.getItemAt(e.itemIndex);
			item.properties.color = '#ff0000';
			item.properties.font = {fontWeight:'bold'};
			e.section.updateItemAt(e.itemIndex,item);
		}
	});
	
	win.add(listView);
}

function list_updateitems(_args) {
	var softInput = 'none';
	if (Titanium.Platform.osname == 'android') {
		softInput = Ti.UI.Android.SOFT_INPUT_ADJUST_PAN;
	}
	var win = Ti.UI.createWindow({
		title:'Update Items',
		windowSoftInputMode:softInput
	});
	
	setupTest(win);
	
	return win;
}

module.exports = list_updateitems;