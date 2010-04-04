(function()
{
	var r = Titanium.Filesystem.getFile("apidoc","toc.json").read();
	var toc = JSON.parse(r.text);
	
	var leftTableData = [];
	
	for (var c=0;c<toc.length;c++)
	{
		var props = {};
		if (c==0)
		{
			props.header = "APIs";
		}
		var row = Ti.UI.createTableViewRow(props);
		var label = Ti.UI.createLabel({
			text:toc[c],
			font:{fontSize:15, fontFamily:"arial", fontWeight:"bold"},
			textAlign:'left',
			width:'auto',
			left:10
		});
		row.api = toc[c];
		row.add(label);
		leftTableData[c] = row;
		
	}
	
	var rightTableData = getTestDataForSection('windows');

	var apiObject = createMasterDetail("Kitchen Sink for iPad",leftTableData,null);
	apiWin.add(apiObject.navBar);
	apiObject.leftTable.addEventListener('click',function(e)
	{
		var api = e.rowData.api;
		var f = Ti.Filesystem.getFile("apidoc",api+".html");
		apiObject.rightTable.data = f;
		//apiObject.rightTable.setUrl(f.nativePath);
	});
	apiObject.leftTable.selectRow(0);
})();

