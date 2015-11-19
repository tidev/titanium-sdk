function Bug3298(){
    var Test3298 = {};


    Test3298.masterView = Ti.UI.createWindow({backgroundColor:'white'});

    Test3298.table = Ti.UI.createTableView({
        data: [{
            title: 'close'
        }]
    });

    Test3298.masterView.add(Test3298.table);

    Test3298.detailView = Ti.UI.createWindow({
        title: 'test',
        backgroundColor:'black'
    });

    Test3298.nav = Ti.UI.iPhone.createNavigationGroup({
        window: Test3298.detailView
    });

    Test3298.container = Ti.UI.createWindow();
    Test3298.container.add(Test3298.nav);

    Test3298.splitWindow = Titanium.UI.iPad.createSplitWindow({
        masterView: Test3298.masterView,
        detailView: Test3298.container
    });

    Test3298.masterView.addEventListener('click', function () {
        Test3298.splitWindow.close();
    });

    Test3298.splitWindow.addEventListener('visible', function(e) {

        if (e.view == 'detail') {
            e.button.title = 'Menu';
            Test3298.detailView.leftNavButton = e.button;
        }
        else if (e.view == 'master') {
            Test3298.detailView.leftNavButton = null;
        }

    });    
    
    Test3298.open = function() {
        Test3298.splitWindow.open();
    }

    return Test3298    
}

module.exports = Bug3298;
