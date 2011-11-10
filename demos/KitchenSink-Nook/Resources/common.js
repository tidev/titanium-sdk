NookKS = {};

(function() {
	NookKS.formatTableView = function(data) {
		for (var i = 0; i < data.length; i++) {
			data[i].hasChild = true;
			data[i].height = 70;
			data[i].font = {fontSize:24, fontWeight:'bold'};
			data[i].left = 20,
			data[i].classname = 'nav_row'
		}	
	};
	
	NookKS.createNavigationTableView = function(data) {
		NookKS.formatTableView(data);
		
		var tableview = Titanium.UI.createTableView({ data:data });
		tableview.addEventListener('click', function(e)
		{
			if (e.rowData.test)
			{
				var win = Titanium.UI.createWindow({
					url:e.rowData.test,
					title:e.rowData.title
				});
				Titanium.UI.currentTab.open(win,{animated:true});
			}
		});	
		
		return tableview;
	}
})();