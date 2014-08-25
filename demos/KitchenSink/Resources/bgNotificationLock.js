var notification = Ti.App.iOS.scheduleLocalNotification({
    alertBody: "You received a junk mail",
    userInfo: {
        content: "trashed junk"
    },
    sound: "pop.caf",
    category: "BACKGROUND_LOCK_CATEGORY",
    date: new Date(new Date().getTime() + 5e3)
});