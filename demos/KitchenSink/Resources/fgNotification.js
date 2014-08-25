var notification = Ti.App.iOS.scheduleLocalNotification({
    alertBody: "You received a lovely email",
    userInfo: {
        content: "replying email"
    },
    sound: "pop.caf",
    category: "FOREGROUND_CATEGORY",
    date: new Date(new Date().getTime() + 5e3)
});