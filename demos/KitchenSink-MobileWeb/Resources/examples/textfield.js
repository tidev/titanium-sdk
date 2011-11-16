var win = Ti.UI.currentWindow;
win.backgroundColor = '#fff';
win.layout = 'vertical';

var l = Ti.UI.createLabel({
	top:10,
	left:10,
	font:{fontSize:20},
	color:'black',
	height:50,
	width:300
});

Ti.UI.currentWindow.add(l);

var tf1 = Ti.UI.createTextField({
	color:'#336699',
	focusable: true,
	fontSize: 14,
	height:35,
	top:5,
	left:10,
	width:300,
	isvisible: true,
	hintText:'This is the hint text. Please focus.',
	borderStyle:Ti.UI.INPUT_BORDERSTYLE_ROUNDED
});

Ti.UI.currentWindow.add(tf1);

tf1.addEventListener('return', function(e){
	l.text = 'return key pressed. Replacing field value';
	tf1.value = 'value changed by API';	
});
tf1.addEventListener('focus', function(e){
	l.text = 'Field got focus';
});
tf1.addEventListener('blur', function(e){
	l.text = 'Field lost focus';
});
tf1.addEventListener('change', function(e){
	l.text = 'Field was changed, val = ' + tf1.value;	
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
Ti.UI.currentWindow.add(format);
Ti.UI.currentWindow.add(showHide);
Ti.UI.currentWindow.add(focus);
Ti.UI.currentWindow.add(blur);
Ti.UI.currentWindow.add(close);

showHide.addEventListener('click', function(){
	if (tf1.isvisible){
		tf1.hide();
		tf1.isvisible = false;
	}else{
		tf1.show();
		tf1.isvisible = true;
	} 
})	
	
focus.addEventListener('click', function(){
	tf1.focus();
});

blur.addEventListener('click', function(){
	tf1.blur();
});
var state =0;
format.addEventListener('click', function(){
	switch(state){
		case 0:{
			tf1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_WORDS;
			format.title = 'Click to change font';
			state ++;
			break;
		
		}
		case 1:{
			format.title = 'Click to change padding'
			tf1.fontSize = 20;
			tf1.fontStyle = 'italic';
			tf1.fontWeight = 'bold';
			state++;
			break;
		}
		case 2:{
			format.title = 'Reset'
			tf1.paddingLeft = 30;
			tf1.paddingRight = 30;
			state++;
			break;
		}
		case 3:{
			format.title = 'Autocapitalization. Click me',
			tf1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE;
			tf1.fontSize = 14;
			tf1.paddingLeft = 0;
			tf1.paddingRight = 0;
			tf1.fontStyle = '';
			tf1.fontWeight = '';
			state = 0;
			break;
		}
	}
});

close.addEventListener('click', function(){
	Ti.UI.currentWindow.close();
});