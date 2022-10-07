/**
 * Create a new tab group.
 * @see https://titaniumsdk.com/api/titanium/ui/tabgroup.html
 */
const tabGroup = Ti.UI.createTabGroup();

/**
 * Add the two created tabs to the tabGroup object.
 */
tabGroup.addTab(createTab('Tab 1', 'I am Window 1', 'assets/images/tab1.png'));
tabGroup.addTab(createTab('Tab 2', 'I am Window 2', 'assets/images/tab2.png'));

/**
 * Open the tab group
 */
tabGroup.open();

/**
 * Creates a new tab and configures it
 *
 * @param  {String} title The title used in the `Ti.UI.Tab` and it's included `Ti.UI.Window`
 * @param  {String} message The title displayed in the `Ti.UI.Label`
 * @return {String} icon The icon used in the `Ti.UI.Tab`
 */
function createTab(title, message, icon) {
    const window = Ti.UI.createWindow({
        backgroundColor: 'backgroundColor', // This is a semantic color defined in the "semantic.colors.json"
        title: title
    });

    const label = Ti.UI.createLabel({
        text: message,
        color: 'textColor' // This is a semantic color defined in the "semantic.colors.json"
    });

    window.add(label);

    return Ti.UI.createTab({
        title,
        icon,
        window
    });
}
