var win = Ti.UI.currentWindow;
win.backgroundColor = '#fff';
win.layout = 'vertical';

var l = Ti.UI.createLabel({
	top:10,
	left:10,
	height: 60,
	font:{fontSize:20},
	color:'black',
	height:50,
	width:300
});

Ti.UI.currentWindow.add(l);

var ta1 = Ti.UI.createTextArea({
	color:'#336699',
	height:130,
	focusable: true,
	fontSize: 14,
	top:5,
	left:10,
	height:100,
	width:300,
	isvisible: true,
	borderStyle:Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
	borderWidth:2,
    borderColor:'#bbb',
    borderRadius:5
});

Ti.UI.currentWindow.add(ta1);

ta1.addEventListener('return', function(e){
	l.text = 'return key pressed. Changing field value';
	(ta1.value)?ta1.value += 'line added by API':ta1.value = 'line added by API';	
});
ta1.addEventListener('focus', function(e){
	l.text = 'Textarea got focus';
});
ta1.addEventListener('blur', function(e){
	l.text = 'Textarea lost focus';
});
ta1.addEventListener('change', function(e){
	l.text = 'Textarea was changed, val = ' + ta1.value;	
});

var focus = Ti.UI.createButton({
	title:'Focus',
	height:40,
	top:5,
	left:10,
	width:300,
	font:{fontSize:20}
});
var blur = Ti.UI.createButton({
	title:'Blur',
	height:40,
	top:5,
	left:10,
	width:300,
	font:{fontSize:20}
});

var showHide = Ti.UI.createButton({
	title:'Click to Hide/Show',
	height:40,
	top:5,
	left:10,
	width:300,
	font:{fontSize:20}
});

var format = Ti.UI.createButton({
	title:'Autocapitalization. Click me',
	height:40,
	top:5,
	left:10,
	width:300,
	font:{fontSize:20}
});

var close = Ti.UI.createButton({
	title:'Close',
	height:40,
	top:5,
	left:10,
	width:300,
	font:{fontSize:20}
});
Ti.UI.currentWindow.add(focus);
Ti.UI.currentWindow.add(blur);
Ti.UI.currentWindow.add(showHide);
Ti.UI.currentWindow.add(format);
Ti.UI.currentWindow.add(close);
	
focus.addEventListener('click', function(){
	ta1.focus();
});

blur.addEventListener('click', function(){
	ta1.blur();
});

close.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});

showHide.addEventListener('click', function(){
	if (ta1.isvisible){
		ta1.hide();
		ta1.isvisible = false;
	}else{
		ta1.show();
		ta1.isvisible = true;
	} 
})	

var state = 0;
format.addEventListener('click', function(){
	switch(state){
		case 0:{
			ta1.autocapitalization = Ti.UI.TEXT_AUTOCAPITALIZATION_WORDS;
			format.title = 'Click to change font';
			state ++;
			break;
		
		}
		case 1:{
			format.title = 'Click to disable edit';
			ta1.font = {
				fontSize:20,
				fontStyle:'italic',
				fontWeight:'bold'
			};
			
			state++;
			break;
		}
		case 2:{
			format.title = 'Reset';
			ta1.editable = false;
			state++;
			break;
		}
		case 3:{
			format.title = 'Autocapitalization. Click me',
			ta1.autocapitalization = Ti.UI.TEXT_AUTOCAPITALIZATION_NONE;
			ta1.font = {
				fontSize:14,
				fontStyle:'',
				fontWeight:'normal'
			};
			ta1.editable = true;
			ta1.paddingLeft = 0;
			ta1.paddingRight = 0;
			state = 0;
			break;
		}
	}
});
