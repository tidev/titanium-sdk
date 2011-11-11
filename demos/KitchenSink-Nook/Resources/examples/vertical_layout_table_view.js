var win = Ti.UI.currentWindow;

var tv = Ti.UI.createTableView({minRowHeight:50});

var text1 = 'I am a short sentence repeated only a few times.\nI am a short sentence repeated only a few times.';
var text2 = 'I am a medium sentence repeated slightly more than the short sentence.\nI am a medium sentence repeated slightly more than the short sentence.\nI am a medium sentence repeated slightly more than the short sentence.\nI am a medium sentence repeated slightly more than the short sentence.\n';
var text3 = 'I am a long sentence that is repeated the most in order to take up the most amount of room in a table view row.\nI am a long sentence that is repeated the most in order to take up the most amount of room in a table view row.\nI am a long sentence that is repeated the most in order to take up the most amount of room in a table view row.\nI am a long sentence that is repeated the most in order to take up the most amount of room in a table view row.\nI am a long sentence that is repeated the most in order to take up the most amount of room in a table view row.\nI am a long sentence that is repeated the most in order to take up the most amount of room in a table view row.\nI am a long sentence that is repeated the most in order to take up the most amount of room in a table view row.\n';

var data = [];

for (var i=0;i<50;i++)
{
	var row = Ti.UI.createTableViewRow({height:'auto',className:"row"});
	
	var textView = Ti.UI.createView({
		height:'auto',
		layout:'vertical',
		left:70,
		top:10,
		bottom:10,
		right:10
	});
	
	var l1 = Ti.UI.createLabel({
		text:text1,
		height:'auto'
		
	});
	textView.add(l1);

	var l2 = Ti.UI.createLabel({
		text:text2,
		top:10,
		height:'auto'
	});
	textView.add(l2);

	var l3 = Ti.UI.createLabel({
		text:text3,
		top:10,
		height:'auto'
	});
	textView.add(l3);
	
	row.add(textView);
	
	var imageView = Ti.UI.createImageView({
		image:'../images/custom_tableview/user.png',
		left:10,
		top:10,
		height:50,
		width:50
	});
	
	row.add(imageView);
	
	data.push(row);
}
tv.setData(data);

win.add(tv);