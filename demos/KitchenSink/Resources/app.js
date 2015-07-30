if (Ti.Calendar.eventsAuthorization == Ti.Calendar.AUTHORIZATION_AUTHORIZED) {
    showCalendars();
} else {
    Ti.Calendar.requestEventsAuthorization(function(e) {
                                           if (e.success) {
                                           showCalendars();
                                           } else {
                                           alert('Access to calendar is not allowed');
                                           }
                                           });
}

function showCalendars() {
    if (Ti.Calendar.eventsAuthorization == Ti.Calendar.AUTHORIZATION_AUTHORIZED) {
        var selectableCalendars = Ti.Calendar.allCalendars;
        Ti.API.info('Calendar length: ' + selectableCalendars.length);
        for (var i = 0,
             ilen = selectableCalendars.length; i < ilen; i++) {
            if (selectableCalendars[i].name == 'Calendar') {
                selectedCalendarName = selectableCalendars[i].name;
                selectedid = selectableCalendars[i].id;
                Ti.API.info(selectableCalendars[i].apiName + ' -> ' + selectedid + ' -> ' + selectedCalendarName);
                var calendar = Ti.Calendar.getCalendarById(selectedid);
                //Getting only 27th July 2015 events
                var events = calendar.getEventsInDate(2015, 07, 27);
                Ti.API.info('First Event: ' + events.length);
                for (var j = 0; j < events.length; j++) {
                    var eventObj = events[j];
                    Ti.API.info('\n' + j + ':' + eventObj.begin + ' : ' + eventObj.title + ' eventObj.recurenceRules: ' + eventObj.recurenceRules);
                    if (eventObj.title == 'recursive-event') {
                        //This Event obj points to repeated event. But eventObj.recurenceRules is still undefined
                        alert('Begin: ' + eventObj.begin + '\t' + eventObj.recurenceRules + '\t' + eventObj.end);
                    }
                }
                //break;
            }
        }
    } else {
        alert('No permission to access calendar');
    }
}

var win = Ti.UI.createWindow();
var button = Titanium.UI.createButton({
                                      title : 'Show Calendars',
                                      height : 40,
                                      width : 200,
                                      top : 230
                                      });
win.add(button);
button.addEventListener('click', function() {
                        showCalendars();
                        });
win.open();