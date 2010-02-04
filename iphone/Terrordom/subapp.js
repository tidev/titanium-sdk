var data = [
       {title:'Tab Groups', hasChild:true}
]

var tableView = Ti.UI.createTableView({data:data})

tableView.addEventListener('click', function(e)
{
	Ti.API.debug("clicked table row = "+e.index);
	
       switch (e.index)
       {
               case 0:
               {
                       var tabgroupWin = Ti.UI.createWindow({
                               url:'tabgroup.js',
                               title:'Tab Groups',
                       });
                       tabgroupWin.open();
                       break;
               }
       }
});

Ti.UI.currentWindow.add(tableView);
Ti.API.debug("tab group window in subapp = "+Ti.UI.currentWindow.tabGroup);
Ti.API.debug("tab group in subapp = "+Ti.UI.currentTabGroup);
Ti.API.debug("tab in subapp = "+Ti.UI.currentTab);