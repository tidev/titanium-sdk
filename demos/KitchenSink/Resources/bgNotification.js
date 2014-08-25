var notification = Ti.App.iOS.scheduleLocalNotification({
    alertBody: "You received an invitation",
    userInfo: {
        content: "invitation"
    },
    sound: "pop.caf",
    category: "BACKGROUND_CATEGORY",
    date: new Date(new Date().getTime() + 5e3)
});