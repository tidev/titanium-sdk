var self = Ti.UI.createWindow({
    backgroundColor:'white'
});

var item = Titanium.UI.createDashboardItem({
    image : '/images/dashboard/bouton_on.png',
    width: 186,
    height: 196,
    badge: 12
});
        
var dashboard = Titanium.UI.createDashboardView({
    data: [item],
    top: 200,
    height : 360,
});

self.add(dashboard);
self.open();
