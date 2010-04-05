(function()
{
	var rightTableData = getTestDataForSection('windows');

	var leftTableData = [
		{title:"Windows",header:"Categories"},
		{title:"Views"},
		{title:"Controls"},
		{title:"Platform"},
		{title:"Device"}
	];

	var demoObject = createMasterDetail("Kitchen Sink for iPad",leftTableData,rightTableData);
	demoWin.add(demoObject.navBar);
	demoObject.leftTable.addEventListener('click',function(e)
	{
		var section = e.rowData.title.toLowerCase();
		demoObject.rightTable.data = getTestDataForSection(section);
	});
	demoObject.leftTable.selectRow(0);
	
	
})();
