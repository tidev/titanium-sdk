function contacts_add(_args) {

	var isTizen = (Ti.Platform.osname === 'tizen');

	var win = Ti.UI.createWindow({
		title:_args.title
	});

	var scrollview = Ti.UI.createScrollView({
		contentWidth:Ti.UI.FILL,
		contentHeight:Ti.UI.FILL,
		top:0,
		showVerticalScrollIndicator:true,
		showHorizontalScrollIndicator:false
	});
	var v1 = Ti.UI.createView({
		top:10,
		left:10,
		width:300,
		height:30
	});
	var l1 = Ti.UI.createLabel({
		text:'First:',
		top:0,
		left:0
	});
	var f1 = Ti.UI.createTextField({
		text:'',
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
		top:0,
		right:0,
		width:200
	});

	// fixed the view for Tizen
	isTizen && (f1.right = 5);

	v1.add(l1);
	v1.add(f1);
	
	var v2 = Ti.UI.createView({
		top:50,
		left:10,
		width:300,
		height:30
	});
	var l2 = Ti.UI.createLabel({
		text:'Last:',
		top:0,
		left:0
	});
	var f2 = Ti.UI.createTextField({
		text:'',
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
		top:0,
		right:0,
		width:200
	});

	isTizen && (f2.right = 5);

	v2.add(l2);
	v2.add(f2);
	
	var v3 = Ti.UI.createView({
		top:90,
		left:10,
		width:300,
		height:30
	});
	var l3 = Ti.UI.createLabel({
		text:'Street:',
		top:0,
		left:0
	});
	var f3 = Ti.UI.createTextField({
		text:'',
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
		top:0,
		right:0,
		width:200
	});

	isTizen && (f3.right = 5);

	v3.add(l3);
	v3.add(f3);
	
	var v4 = Ti.UI.createView({
		top:130,
		left:10,
		width:300,
		height:30
	});
	var l4 = Ti.UI.createLabel({
		text:'City:',
		top:0,
		left:0
	});
	var f4 = Ti.UI.createTextField({
		text:'',
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
		top:0,
		right:0,
		width:200
	});

	isTizen && (f4.right = 5);

	v4.add(l4);
	v4.add(f4);
	
	var v5 = Ti.UI.createView({
		top:170,
		left:10,
		width:300,
		height:30
	});
	var l5 = Ti.UI.createLabel({
		text:'State:',
		top:0,
		left:0
	});
	var f5 = Ti.UI.createTextField({
		text:'',
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
		top:0,
		right:0,
		width:200
	});

	isTizen && (f5.right = 5);

	v5.add(l5);
	v5.add(f5);
	
	var v6 = Ti.UI.createView({
		top:210,
		left:10,
		width:300,
		height:30
	});
	var l6 = Ti.UI.createLabel({
		text:'ZIP:',
		top:0,
		left:0
	});
	var f6 = Ti.UI.createTextField({
		text:'',
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
		top:0,
		right:0,
		width:200
	});

	isTizen && (f6.right = 5);

	v6.add(l6);
	v6.add(f6);
	var v7 = Ti.UI.createView({
		top:250,
		left:10,
		width:300,
		height:30
	});
	var l7 = Ti.UI.createLabel({
		text:'URL:',
		top:0,
		left:0
	});
	var f7 = Ti.UI.createTextField({
		text:'',
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
		top:0,
		right:0,
		width:200
	});

	isTizen && (f7.right = 5);

	v7.add(l7);
	v7.add(f7);
	var b1 = Ti.UI.createButton({
		title:'Add contact',
		width:100,
		height:40,
		bottom:20
	});

	isTizen && (b1.top = 300);

	b1.addEventListener('click', function() {
		var address = {};
		address.Street = f3.value;
		address.City = f4.value;
		address.State = f5.value;
		address.ZIP = f6.value;
		
		var weburl = {};
		weburl = f7.value;
		
		var contact = Titanium.Contacts.createPerson({
			firstName:f1.value,
			lastName:f2.value,
			address:{"home":[address]},
			url:{"home":[weburl]}
		});
		alert('Contact Added!');
	});
	
	scrollview.add(v1);
	scrollview.add(v2);
	scrollview.add(v3);
	scrollview.add(v4);
	scrollview.add(v5);
	scrollview.add(v6);
	scrollview.add(v7);
	scrollview.add(b1);
	win.add(scrollview);
	
	return win;
};

module.exports = contacts_add;