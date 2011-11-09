var win = Titanium.UI.currentWindow;
win.backgroundColor = '#13386c';
win.name = "window";

var a = Ti.UI.createView({borderColor:'#133899',borderWidth:6,borderRadius:2,backgroundColor:'orange',width:100,height:100,top:10,name:"view a"});
var b = Ti.UI.createView({borderColor:'#133899',borderWidth:6,borderRadius:2,backgroundColor:'purple',width:100,height:100,top:115,right:40,name:"view b"});
var c = Ti.UI.createView({borderColor:'#133899',borderWidth:6,borderRadius:2,backgroundColor:'red',width:100,height:100,top:115,left:40,name:"view c"});
var d = Ti.UI.createView({borderColor:'#133899',borderWidth:6,borderRadius:2,backgroundColor:'cyan',width:100,height:100,top:220,name:"view d"});

a.add(Ti.UI.createLabel({name:"label a",color:'white',text:'A',height:'auto',width:'auto',font:{fontSize:48,fontWeight:'bold',fontFamily:'Helvetica Neue'}}));
b.add(Ti.UI.createLabel({name:"label b",color:'white',text:'B',height:'auto',width:'auto',font:{fontSize:48,fontWeight:'bold',fontFamily:'Helvetica Neue'}}));
c.add(Ti.UI.createLabel({name:"label c",color:'white',text:'C',height:'auto',width:'auto',font:{fontSize:48,fontWeight:'bold',fontFamily:'Helvetica Neue'}}));
d.add(Ti.UI.createLabel({name:"label d",color:'white',text:'D',height:'auto',width:'auto',font:{fontSize:48,fontWeight:'bold',fontFamily:'Helvetica Neue'}}));

var l = Ti.UI.createLabel({
	color:'white',
	font:{fontSize:24,fontWeight:'bold',fontFamily:'Helvetica Neue'},
	bottom:5,
	textAlign:'center',
	text:'click anywhere',
	height:'auto',
	width:'auto'
});

var l2 = Ti.UI.createLabel({
	color:'white',
	font:{fontSize:24,fontFamily:'Helvetica Neue'},
	bottom:35,
	textAlign:'center',
	text:'',
	height:'auto',
	width:'auto'
});

win.add(a);
win.add(b);
win.add(c);
win.add(d);
win.add(l);
win.add(l2);

function clear(o)
{
	var t  = o.text;
	setTimeout(function()
	{
		if (o.text == t)
		{
			o.text = "";
		}
	},1000);
}

win.addEventListener('click',function(ev)
{
	l2.text = "window: You clicked on " +ev.source.name;
	clear(l2);
});

a.addEventListener('click',function(ev)
{
	l.text = "view: You clicked on " +ev.source.name;
	clear(l);
});

b.addEventListener('click',function(ev)
{
	l.text = "view: You clicked on " +ev.source.name;
	clear(l);
});

c.addEventListener('click',function(ev)
{
	l.text = "view: You clicked on " +ev.source.name;
	clear(l);
});

d.addEventListener('click',function(ev)
{
	l.text = "view: You clicked on " +ev.source.name;
	clear(l);
});

