var win = Titanium.UI.currentWindow;

var buttonData = [
	{title:'Button 1'},
	{title:'Button 2'},
	{title:'Button 3'}

];

var buttonSection = Titanium.UI.iPhone.createGroupedSection({
	footer:'Button Footer',
	header:'Button Header',
	type:'button',
	data:buttonData
});

var groupedView = Titanium.UI.iPhone.createGroupedView();
groupedView.addSection(buttonSection);

win.add(groupedView);