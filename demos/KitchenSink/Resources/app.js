var win = Ti.UI.createWindow({
                             backgroundColor: "#fff"
                             });
var btn = Ti.UI.createButton({
                             title: "Schedule local notification!"
                             });

btn.addEventListener("click", scheduleLocalNotification);

function scheduleLocalNotification() {
    
    var acceptAction = Ti.App.iOS.createUserNotificationAction({
                                                               identifier: "ACCEPT_IDENTIFIER",
                                                               title: "Reply",
                                                               activationMode: Ti.App.iOS.USER_NOTIFICATION_ACTIVATION_MODE_FOREGROUND,
                                                               destructive: false,
                                                               behaviour: Ti.App.iOS.USER_NOTIFICATION_BEHAVIOUR_TEXTINPUT,
                                                               authenticationRequired: true
                                                               });
    
    var invitationCategory = Ti.App.iOS.createUserNotificationCategory({
                                                                       identifier: "TEST_CATEGORY",
                                                                       actionsForDefaultContext: [acceptAction],
                                                                       actionsForMinimalContext: [acceptAction]
                                                                       });
    
    Ti.App.iOS.registerUserNotificationSettings({
                                                types: [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE],
                                                categories: [invitationCategory]
                                                });
    
    Ti.App.iOS.scheduleLocalNotification({
                                         date: new Date(new Date().getTime() + 3000),
                                         alertBody: "New message from Hans! Reply?",
                                         badge: 1,
                                         category: "TEST_CATEGORY"
                                         });
};

Ti.App.iOS.addEventListener('localnotificationaction', function(e) {
                            Ti.API.info(JSON.stringify(e));
                            
                            if (e.typedText && e.typedText.length > 0) {
                            alert(e.typedText);
                            }
                            });

win.add(btn);
win.open();