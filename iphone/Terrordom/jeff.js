// create table view data
var data = [  
    {title:'Tab Groups', hasChild:true}
]

// create table view
var tableView = Ti.UI.createTableView({data:data})

// create table view listener
tableView.addEventListener('click', function(e)  
{
    switch (e.index)
    {
        case 0:
        {
            var tabgroupWin = Ti.UI.createWindow({
                url:'tabgroup.js',
                title:'Tab Groups'
            });
            tabgroupWin.open({animated:true});
            break;
        }
    }
});

// add table view to window
Ti.UI.currentWindow.add(tableView);