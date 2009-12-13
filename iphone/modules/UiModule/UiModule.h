/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_UI

#import <Foundation/Foundation.h>
#import "TitaniumModule.h"

@interface UiModule : NSObject<TitaniumModule> {
}

- (void) setWindow:(NSString *)tokenString URL:(NSString *)newURLString baseURL:(NSString *)baseURLString;
- (void) setWindow:(NSString *)tokenString navSide:(id) isLeftObject button: (NSDictionary *) buttonObject options: (NSDictionary *) optionsObject;
- (void) setWindow:(NSString *)tokenString toolbar: (id) barObject options: (id) optionsObject;

- (NativeControlProxy *) proxyForObject: (id) proxyObject scan: (BOOL) scanning recurse: (BOOL) recursion;

@end

/****** UI functions
 * @tiapi(method=True,name=UI.setAppBadge,version=0.4) Sets the application's badge value
 * @tiarg(for=UI.setAppBadge,type=int,name=badge) badge value
 * @tiapi(method=True,name=UI.setTabBadge,version=0.4) Sets the tab bar's badge value, must be on the root of the nav controller
 * @tiarg(for=UI.setTabBadge,type=string,name=badge) badge value

 * @tiapi(method=True,name=UI.createButton,version=0.4) Creates a UI.Button button object for use in UI.Window's setLeftNavButton, setRightNavButton, or setToolbar methods
 * @tiarg(for=UI.createButton,type=mixed,optional=True,name=properties) If object, the UI.Button properties to copy over on initialization.
 * @tiresult(for=UI.createButton,type=UI.Button) the resulting button
 
 * @tiapi(method=True,name=UI.createOptionDialog,version=0.4) Creates an UI.optionDialog object
 * @tiarg(for=UI.createOptionDialog,type=mixed,optional=True,name=properties) UI.optionDialog properties to copy over on initialization
 * @tiresult(for=UI.createOptionDialog,type=object) the resulting UI.optionDialog object

 * @tiapi(method=True,name=UI.createAlertDialog,version=0.4) Creates an UI.alertDialog object
 * @tiarg(for=UI.createAlertDialog,type=mixed,optional=True,name=properties) UI.alertDialog properties to copy over on initialization
 * @tiresult(for=UI.createAlertDialog,type=object) the resulting UI.alertDialog object
 
 * @tiapi(method=True,name=UI.createWindow,since=0.4) Creates a new window as a child of the current window
 * @tiarg(for=UI.createWindow,name=options,type=mixed,optional=True) a string containing a url of the new window's content or an object containing properties for the new window
 * @tiresult(for=UI.createWindow,type=object) a UserWindow object
 
 * @tiapi(method=true,since=0.5,name=UI.createSlider) Create a new slider 
 * @tiarg[object,properties] Properties to apply to the new slider on creation
 * @tiresult[UI.Slider] the new slider.
 
 * @tiapi(method=true,since=0.5,name=UI.createSwitch) Create a new switch 
 * @tiarg[object,properties] Properties to apply to the new switch on creation
 * @tiresult[UI.Switch] the new switch.
 
 * @tiapi(method=true,since=0.5,name=UI.createTextField) Create a new single-line text field 
 * @tiarg[object,properties] Properties to apply to the new text field on creation
 * @tiresult[UI.TextField] the new text field.
 
 * @tiapi(method=true,since=0.5,name=UI.createTextArea) Create a new multi-line text area 
 * @tiarg[object,properties] Properties to apply to the new text area on creation
 * @tiresult[UI.TextArea] the new text area.
 
 * @tiapi(method=true,since=0.5,name=UI.createButtonBar) Create a new segmented control that acts as a nonmodal group of buttons. Pressing an element causes a momentary selection
 * @tiarg[object,properties] Properties to apply to the new button bar on creation
 * @tiresult[UI.ButtonBar] the button bar field.
 
 * @tiapi(method=true,since=0.5,name=UI.createTabbedBar) Create a new segmented control that acts as a modal tab bar. Pressing an element causes a the selection to change which lasts until a different element is touched
 * @tiarg[object,properties] Properties to apply to the new tab bar on creation
 * @tiresult[UI.TabBar] the new tab bar.
 
 
 * @tiapi(method=true,since=0.5,name=UI.createTableView) Create a new table view.
 * @tiarg[object,properties] Properties to apply to the table view on creation
 * @tiarg[function,callback] Function to invoke when a row is selected
 * @tiresult[UI.TableView] the table view. This has similar properties and methods as UI.UserWindow.
 
 * @tiapi(method=true,since=0.5,name=UI.createGroupedView) Create a new grouped view.
 * @tiarg[object,properties] Properties to apply to the grouped view on creation
 * @tiarg[function,callback] Function to invoke when a row is selected
 * @tiresult[UI.GroupedView] the grouped view. This has similar properties and methods as UI.TableView and UI.UserWindow.
 
 * @tiapi(method=true,since=0.5,name=UI.createGroupedSection) Create a grouped section to add to a grouped view.
 * @tiarg[object,properties] Properties to apply to the table view on creation
 * @tiarg[function,callback] Function to invoke when a row is selected
 * @tiresult[UI.GroupedSection] 
 
   
 ******* UI properties

 * @tiapi(property=True,name=UI.currentWindow,version=0.4,type=object) the CurrentWindow object representing the window of the calling javascript. CurrentWindow currently has some slight differences from a created UI.UserWindow
 * @tiapi(property=True,name=UI.PORTRAIT,since=0.4,type=int) integer that represents portrait orientation - this is the same as Gesture.PORTRAIT
 * @tiapi(property=True,name=UI.LANDSCAPE,since=0.4,type=int) integer that represents both landscape left or landscape right orientation - this is the same as Gesture.LANDSCAPE
 * @tiapi(property=True,name=UI.PORTRAIT_AND_LANDSCAPE,since=0.4,type=int) integer that represents portrait or landscape (But not upside-down portrait) orientation
 
 * @tiapi(property=true,since=0.5,name=UI.RETURNKEY_GO) A possible value for UI.TextView.returnKeyType or UI.TextField.returnKeyType; indicates the lower right keyboard button will be labelled "Go"
 * @tiapi(property=true,since=0.5,name=UI.RETURNKEY_GOOGLE) A possible value for UI.TextView.returnKeyType or UI.TextField.returnKeyType; indicates the lower right keyboard button will be labelled "Google"
 * @tiapi(property=true,since=0.5,name=UI.RETURNKEY_JOIN) A possible value for UI.TextView.returnKeyType or UI.TextField.returnKeyType; indicates the lower right keyboard button will be labelled "Join"
 * @tiapi(property=true,since=0.5,name=UI.RETURNKEY_NEXT) A possible value for UI.TextView.returnKeyType or UI.TextField.returnKeyType; indicates the lower right keyboard button will be labelled "Next"
 * @tiapi(property=true,since=0.5,name=UI.RETURNKEY_SEARCH) A possible value for UI.TextView.returnKeyType or UI.TextField.returnKeyType; indicates the lower right keyboard button will be labelled "Search"
 * @tiapi(property=true,since=0.5,name=UI.RETURNKEY_SEND) A possible value for UI.TextView.returnKeyType or UI.TextField.returnKeyType; indicates the lower right keyboard button will be labelled "Send"
 * @tiapi(property=true,since=0.5,name=UI.RETURNKEY_DONE) A possible value for UI.TextView.returnKeyType or UI.TextField.returnKeyType; indicates the lower right keyboard button will be labelled "Done"
 * @tiapi(property=true,since=0.5,name=UI.RETURNKEY_DEFAULT) A possible value for UI.TextView.returnKeyType or UI.TextField.returnKeyType; indicates the lower right keyboard button will be labelled "Return"
 * @tiapi(property=true,since=0.5,name=UI.RETURNKEY_ROUTE) A possible value for UI.TextView.returnKeyType or UI.TextField.returnKeyType; indicates the lower right keyboard button will be labelled "Route"
 * @tiapi(property=true,since=0.5,name=UI.RETURNKEY_YAHOO) A possible value for UI.TextView.returnKeyType or UI.TextField.returnKeyType; indicates the lower right keyboard button will be labelled "Yahoo"
 * @tiapi(property=true,since=0.5,name=UI.RETURNKEY_EMERGENCY_CALL) A possible value for UI.TextView.returnKeyType or UI.TextField.returnKeyType; indicates the lower right keyboard button will be labelled "Emergency Call"
 
 
 * @tiapi(property=true,since=0.5,name=UI.KEYBOARD_ASCII) A possible value for UI.TextView.keyboardType or UI.TextField.keyboardType; indicates the keyboard will be standard QWERTY keyboard
 * @tiapi(property=true,since=0.5,name=UI.KEYBOARD_URL) A possible value for UI.TextView.keyboardType or UI.TextField.keyboardType; indicates the keyboard will be the standard QWERTY keyboard, but with the space bar replaced with .,/, and .com keys
 * @tiapi(property=true,since=0.5,name=UI.KEYBOARD_PHONE_PAD) A possible value for UI.TextView.keyboardType or UI.TextField.keyboardType; indicates the keyboard will be a 12-key keypad, with +*# to the left of the 0 key, and delete to the right
 * @tiapi(property=true,since=0.5,name=UI.KEYBOARD_NUMBERS_PUNCTUATION) A possible value for UI.TextView.keyboardType or UI.TextField.keyboardType; indicates the keyboard will be the standard QUERTY keyboard, but displaying numbers and punctuation by default
 * @tiapi(property=true,since=0.5,name=UI.KEYBOARD_NUMBER_PAD) A possible value for UI.TextView.keyboardType or UI.TextField.keyboardType; indicates the keyboard will be a 12-key keypad, with a blank key to the left of the 0, and delete to the right
 * @tiapi(property=true,since=0.5,name=UI.KEYBOARD_EMAIL_ADDRESS) A possible value for UI.TextView.keyboardType or UI.TextField.keyboardType; indicates the keyboard will be the standard QWERTY keyboard, but with @ and period keys next to the space key
 * @tiapi(property=true,since=0.5,name=UI.KEYBOARD_DEFAULT) A possible value for UI.TextView.keyboardType or UI.TextField.keyboardType; indicates the keyboard will be whatever the user has chosen as the default (in the case of foriegn character support)
 
 * @tiapi(property=true,since=0.5,name=UI.INPUT_BUTTONMODE_NEVER) A possible value for UI.TextField.clearButtonMode, UI.TextField.leftButtonMode, or UI.TextField.rightButtonMode; indicates that the control or button will never appear
 * @tiapi(property=true,since=0.5,name=UI.INPUT_BUTTONMODE_ALWAYS) A possible value for UI.TextField.clearButtonMode, UI.TextField.leftButtonMode, or UI.TextField.rightButtonMode; indicates that the control or button will always appear
 * @tiapi(property=true,since=0.5,name=UI.INPUT_BUTTONMODE_ONFOCUS) A possible value for UI.TextField.clearButtonMode, UI.TextField.leftButtonMode, or UI.TextField.rightButtonMode; indicates that the control or button will appear only when the text is being edited
 * @tiapi(property=true,since=0.5,name=UI.INPUT_BUTTONMODE_ONBLUR) A possible value for UI.TextField.clearButtonMode, UI.TextField.leftButtonMode, or UI.TextField.rightButtonMode; indicates that the control or button will appear only when the text is not being edited
 
 * @tiapi(property=true,since=0.5,name=UI.INPUT_BORDERSTYLE_NONE) A possible value for UI.TextField.borderStyle; indicates no outline will be used.
 * @tiapi(property=true,since=0.5,name=UI.INPUT_BORDERSTYLE_LINE) A possible value for UI.TextField.borderStyle; indicates a simple line will be used.
 * @tiapi(property=true,since=0.5,name=UI.INPUT_BORDERSTYLE_BEZEL) A possible value for UI.TextField.borderStyle; indicates a shaded rectangular bezel will be used.
 * @tiapi(property=true,since=0.5,name=UI.INPUT_BORDERSTYLE_ROUNDED) A possible value for UI.TextField.borderStyle; indicates a round-rectangle-shaped bezel will be used.
 
 ******* UI.iPhone.* properties
 
 * Should be refactored? UI.iPhone.setStatusBarStyle

 * @tiapi(property=True,name=UI.iPhone,version=0.4,type=object) object containing iPhone constants
 * @tiapi(property=True,name=UI.iPhone.SystemButtonStyle,version=0.4,type=object) object containing iPhone button style constants
 * @tiapi(property=True,name=UI.iPhone.SystemButtonStyle.PLAIN,version=0.4,type=int) constant representing the plain button style. On the nav bar, this is the same as bordered. On the tool bar, this lacks a border. When a button is covering a div, this hides the default rounded rectangle background
 * @tiapi(property=True,name=UI.iPhone.SystemButtonStyle.BORDERED,version=0.4,type=int) constant representing the bordered button style. The button will appear slightly darker background than the bar, in a recessed rounded rectangle shape.
 * @tiapi(property=True,name=UI.iPhone.SystemButtonStyle.DONE,version=0.4,type=int) constant representing the done button style. The button will appear with a blue background, in a recessed rounded rectangle shape.

 * @tiapi(property=True,name=UI.iPhone.SystemButton,version=0.4,type=object) object containing iPhone system-provided button constants. Refer to http://developer.apple.com/iphone/library/documentation/UserExperience/Conceptual/MobileHIG/SystemProvided/SystemProvided.html
 * @tiapi(property=True,name=UI.iPhone.SystemButton.ACTION,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Action" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.ACTIVITY,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to have an activity spinner in the button's place
 * @tiapi(property=True,name=UI.iPhone.SystemButton.ADD,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Add" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.BOOKMARKS,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Bookmarks" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.CAMERA,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Camera" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.CANCEL,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Cancel" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.COMPOSE,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Compose" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.DONE,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Done" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.EDIT,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Edit" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.FAST_FORWARD,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "FastForward" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.FIXED_SPACE,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to have a space of a fixed size to place between tool bar buttons
 * @tiapi(property=True,name=UI.iPhone.SystemButton.FLEXIBLE_SPACE,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to have a spacer to place between tool bar buttons to seperate them as much as possible
 * @tiapi(property=True,name=UI.iPhone.SystemButton.ORGANIZE,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Organize" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.PAUSE,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Pause" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.PLAY,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Play" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.REFRESH,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Refresh" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.REPLY,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Reply" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.REWIND,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Rewind" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.SAVE,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Save" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.SEARCH,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Search" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.STOP,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Stop" button when in the toolbar or nav bar
 * @tiapi(property=True,name=UI.iPhone.SystemButton.TRASH,version=0.4,type=string) Set a UI.Button's "systemButton" property to this in order to get the system-provided "Trash" button when in the toolbar or nav bar
 
 * @tiapi(property=True,name=UI.iPhone.SystemButton.INFO_LIGHT,version=0.5,type=string) Set a UI.Button's "systemButton" property to this in order to get a white system-provided "info" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.INFO_DARK,version=0.5,type=string) Set a UI.Button's "systemButton" property to this in order to get a dark system-provided "info" button

 * @tiapi(property=True,name=UI.iPhone.StatusBar,version=0.4,type=object) object containing iPhone status bar style constants
 * @tiapi(property=True,name=UI.iPhone.StatusBar.DEFAULT,version=0.4,type=int) constant representing the default status bar style. The status bar appears opaque and gray. This is the same as gray
 * @tiapi(property=True,name=UI.iPhone.StatusBar.GRAY,version=0.4,type=int) constant representing the default status bar style. The status bar appears opaque and gray. This is the same as default
 * @tiapi(property=True,name=UI.iPhone.StatusBar.GREY,version=0.6,type=int) constant representing the default status bar style. The status bar appears opaque and gray. This is the same as default
 * @tiapi(property=True,name=UI.iPhone.StatusBar.OPAQUE_BLACK,version=0.4,type=int) constant representing the opaque black status bar style. The status bar appears opaque and black.
 * @tiapi(property=True,name=UI.iPhone.StatusBar.TRANSLUCENT_BLACK,version=0.4,type=int) constant representing the translucent black status bar style. The status bar appears translucent and black.
 
 ********* CurrentWindow object methods

 * @tiapi(method=True,name=UI.currentWindow.setFullScreen,since=0.4) Makes a window fullscreen, including hiding the nav bar and tab bar if the window is not open
 * @tiarg(for=UI.currentWindow.setFullScreen,name=fullscreen,type=boolean) set to true for fullscreen, false if otherwise
 
 * @tiapi(method=True,name=UI.currentWindow.close,since=0.4) Closes a window - pops it from the navigation and returns to the parent window
 * @tiarg(for=UI.currentWindow.close,name=options,type=object) set to {animated:false} to disable the navigation animation
 
 * @tiapi(method=True,name=UI.currentWindow.setTitle,since=0.4) Sets the title of a window, visible in the middle of the window's nav bar and as the back button in the child window's nav bar
 * @tiarg(for=UI.currentWindow.setTitle,type=string,name=title) the title of the window
 * @tiapi(method=True,name=UI.currentWindow.setURL,since=0.4) Sets the url for a window
 * @tiarg(for=UI.currentWindow.setURL,type=string,name=url) the url for the window
 
 * @tiapi(method=True,name=UI.currentWindow.setTitleImage,since=0.4) Sets the window title image, visible in the middle of the window's bav bar
 * @tiarg(for=UI.currentWindow.setTitleImage,type=string,name=url) the relative url for the image. Must be local.
 
 * @tiapi(method=True,name=UI.currentWindow.setBarColor,since=0.4) Sets the tint and style of the nav bar and tool bar. If foreground, this is animated.
 * @tiarg(for=UI.currentWindow.setBarColor,type=string,name=color) a web color. Null causes the default style. 'transparent' causes the translucent black style, and stretches the web page to reach to underneath the nav bar and tool bar. Any other color for an opaque tinted bar of that color.
 
 * @tiapi(method=True,name=UI.currentWindow.showNavBar,since=0.4) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.currentWindow.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.
 
 * @tiapi(method=True,name=UI.currentWindow.hideNavBar,since=0.4) Makes the nav bar invisible, resizing the web page if necessary.
 * @tiarg(for=UI.currentWindow.hideNavBar,name=options,type=object) set to {animated:true} to enable animation of hiding the nav bar if the window is foreground.
 * @tiapi(method=True,name=UI.currentWindow.showNavBar,since=0.4) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.currentWindow.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.
 
 * @tiapi(method=True,name=UI.currentWindow.setLeftNavButton,since=0.4) replaces the button or item on the left side of the nav bar with an UI.Button.
 * @tiarg(for=UI.currentWindow.setLeftNavButton,name=button,type=UI.Button) the UI.Button object. Use null to indicate no button
 * @tiarg(for=UI.currentWindow.setLeftNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.
 
 * @tiapi(method=True,name=UI.currentWindow.setRightNavButton,since=0.4) replaces the button or item on the right side of the nav bar with an UI.Button.
 * @tiarg(for=UI.currentWindow.setRightNavButton,name=button,type=UI.Button) the UI.Button object. Use null to indicate no button
 * @tiarg(for=UI.currentWindow.setRightNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.
 
 * @tiapi(method=True,name=UI.currentWindow.setToolbar,since=0.4) replaces the contents of the tool bar with an array of UI.Buttons, UI.Sliders, UI.ButtonBar, or UI.TabbedBar.
 * @tiarg(for=UI.currentWindow.setToolbar,name=buttons,type=object) the array of objects, including fixed and variables spaces. Use an empty array to hide the tool bar.
 * @tiarg(for=UI.currentWindow.setToolbar,name=options,type=object) set to {animated:true} to enable animation of changing the tool bar.
 
 * @tiapi(method=True,name=UI.currentWindow.addEventListener,since=0.4) add an event listener to be called for a focus event and returns the function to use when removing
 * @tiarg(for=UI.currentWindow.addEventListener,type=string,name=type) the type of gesture event to listen for.  May be either 'focused' or 'unfocused'
 * @tiarg(for=UI.currentWindow.addEventListener,type=method,name=listener) listener method
 * @tiresult(for=UI.currentWindow.addEventListener,type=function) return the listener to be used as an id
 *
 * @tiapi(method=True,name=UI.currentWindow.removeEventListener,since=0.4) removes an event listener from focused or unfocused events
 * @tiarg(for=UI.currentWindow.removeEventListener,type=string,name=type) the type of event to be removed from addEventListener. May be either 'focused' or 'unfocused'
 * @tiarg(for=UI.currentWindow.removeEventListener,type=function,name=id) the function to be removed from addEventListener
 * @tiresult(for=UI.currentWindow.removeEventListener,type=boolean) return true if removed
 
 * @tiapi(method=true,since=0.5,name=UI.currentWindow.setTitleControl) Replaces the title area of the nav bar with a UI.Button 
 * @tiarg[UI.Button,titleControl] Control to place. Pass in null to remove the current UI.Button and reveal the title image or title. 

 
 ********* userWindow object methods
  
 * @tiapi(method=True,name=UI.UserWindow.setFullScreen,since=0.4) Makes a window fullscreen, including hiding the nav bar and tab bar if the window is not open
 * @tiarg(for=UI.UserWindow.setFullScreen,name=fullscreen,type=boolean) set to true for fullscreen, false if otherwise

 * @tiapi(method=True,name=UI.UserWindow.open,since=0.4) Opens a window if wasn't previously opened - pushes it to the navigation and hides the parent window. Properties that were set are applied now.
 * @tiarg(for=UI.UserWindow.open,name=options,type=object) set to {animated:false} to disable the navigation animation

 * @tiapi(method=True,name=UI.UserWindow.close,since=0.4) Closes a window - pops it from the navigation and returns to the parent window
 * @tiarg(for=UI.UserWindow.close,name=options,type=object) set to {animated:false} to disable the navigation animation

 * @tiapi(method=True,name=UI.UserWindow.setTitle,since=0.4) Sets the title of a window, visible in the middle of the window's nav bar and as the back button in the child window's nav bar
 * @tiarg(for=UI.UserWindow.setTitle,type=string,name=title) the title of the window
 * @tiapi(method=True,name=UI.UserWindow.setURL,since=0.4) Sets the url for a window
 * @tiarg(for=UI.UserWindow.setURL,type=string,name=url) the url for the window

 * @tiapi(method=True,name=UI.UserWindow.setTitleImage,since=0.4) Sets the window title image, visible in the middle of the window's bav bar
 * @tiarg(for=UI.UserWindow.setTitleImage,type=string,name=url) the relative url for the image. Must be local.

 * @tiapi(method=True,name=UI.UserWindow.setBarColor,since=0.4) Sets the tint and style of the nav bar and tool bar. If foreground, this is animated.
 * @tiarg(for=UI.UserWindow.setBarColor,type=string,name=color) a web color. Null causes the default style. 'transparent' causes the translucent black style, and stretches the web page to reach to underneath the nav bar and tool bar. Any other color for an opaque tinted bar of that color.
 
 * @tiapi(method=True,name=UI.UserWindow.showNavBar,since=0.4) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.UserWindow.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.

 * @tiapi(method=True,name=UI.UserWindow.hideNavBar,since=0.4) Makes the nav bar invisible, resizing the web page if necessary.
 * @tiarg(for=UI.UserWindow.hideNavBar,name=options,type=object) set to {animated:true} to enable animation of hiding the nav bar if the window is foreground.
 * @tiapi(method=True,name=UI.UserWindow.showNavBar,since=0.4) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.UserWindow.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.

 * @tiapi(method=True,name=UI.UserWindow.setLeftNavButton,since=0.4) replaces the button or item on the left side of the nav bar with an UI.Button.
 * @tiarg(for=UI.UserWindow.setLeftNavButton,name=button,type=UI.Button) the UI.Button object. Use null to indicate no button
 * @tiarg(for=UI.UserWindow.setLeftNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.

 * @tiapi(method=True,name=UI.UserWindow.setRightNavButton,since=0.4) replaces the button or item on the right side of the nav bar with an UI.Button.
 * @tiarg(for=UI.UserWindow.setRightNavButton,name=button,type=UI.Button) the UI.Button object. Use null to indicate no button
 * @tiarg(for=UI.UserWindow.setRightNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.
 
 * @tiapi(method=True,name=UI.UserWindow.setToolbar,since=0.4) replaces the contents of the tool bar with an array of UI.Buttons, UI.Sliders, UI.ButtonBar, or UI.TabbedBar.
 * @tiarg(for=UI.UserWindow.setToolbar,name=buttons,type=array) the array of objects, including fixed and variables spaces. Use an empty array to hide the tool bar.
 * @tiarg(for=UI.UserWindow.setToolbar,name=options,type=object) set to {animated:true} to enable animation of changing the tool bar.
 
 * @tiapi(method=true,since=0.5,name=UI.UserWindow.setTitleControl) Replaces the title area of the nav bar with a UI.Button 
 * @tiarg[UI.Button,titleControl] Control to place. Pass in null to remove the current UI.Button and reveal the title image or title.

 ********* TableView Object methods (Copypasta from UserWindow)
 
 * @tiapi(method=True,name=UI.TableView.setFullScreen,since=0.5) Makes a window fullscreen, including hiding the nav bar and tab bar if the window is not open
 * @tiarg(for=UI.TableView.setFullScreen,name=fullscreen,type=boolean) set to true for fullscreen, false if otherwise
 
 * @tiapi(method=True,name=UI.TableView.open,since=0.5) Opens a window if wasn't previously opened - pushes it to the navigation and hides the parent window. Properties that were set are applied now.
 * @tiarg(for=UI.TableView.open,name=options,type=object) set to {animated:false} to disable the navigation animation
 
 * @tiapi(method=True,name=UI.TableView.close,since=0.5) Closes a window - pops it from the navigation and returns to the parent window
 * @tiarg(for=UI.TableView.close,name=options,type=object) set to {animated:false} to disable the navigation animation
 
 * @tiapi(method=True,name=UI.TableView.setTitle,since=0.5) Sets the title of a window, visible in the middle of the window's nav bar and as the back button in the child window's nav bar
 * @tiarg(for=UI.TableView.setTitle,type=string,name=title) the title of the window
 
 * @tiapi(method=True,name=UI.TableView.setTitleImage,since=0.5) Sets the window title image, visible in the middle of the window's bav bar
 * @tiarg(for=UI.TableView.setTitleImage,type=string,name=url) the relative url for the image. Must be local.
 
 * @tiapi(method=True,name=UI.TableView.setBarColor,since=0.5) Sets the tint and style of the nav bar and tool bar. If foreground, this is animated.
 * @tiarg(for=UI.TableView.setBarColor,type=string,name=color) a web color. Null causes the default style. 'transparent' causes the translucent black style, and stretches the web page to reach to underneath the nav bar and tool bar. Any other color for an opaque tinted bar of that color.
 
 * @tiapi(method=True,name=UI.TableView.showNavBar,since=0.5) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.TableView.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.
 
 * @tiapi(method=True,name=UI.TableView.hideNavBar,since=0.5) Makes the nav bar invisible, resizing the web page if necessary.
 * @tiarg(for=UI.TableView.hideNavBar,name=options,type=object) set to {animated:true} to enable animation of hiding the nav bar if the window is foreground.
 * @tiapi(method=True,name=UI.TableView.showNavBar,since=0.5) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.TableView.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.
 
 * @tiapi(method=True,name=UI.TableView.setLeftNavButton,since=0.5) replaces the button or item on the left side of the nav bar with an UI.Button.
 * @tiarg(for=UI.TableView.setLeftNavButton,name=button,type=UI.Button) the UI.Button object. Use null to indicate no button
 * @tiarg(for=UI.TableView.setLeftNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.
 
 * @tiapi(method=True,name=UI.TableView.setRightNavButton,since=0.5) replaces the button or item on the right side of the nav bar with an UI.Button.
 * @tiarg(for=UI.TableView.setRightNavButton,name=button,type=UI.Button) the UI.Button object. Use null to indicate no button
 * @tiarg(for=UI.TableView.setRightNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.
 
 * @tiapi(method=True,name=UI.TableView.setToolbar,since=0.5) replaces the contents of the tool bar with an array of UI.Buttons, UI.Sliders, UI.ButtonBar, or UI.TabbedBar.
 * @tiarg(for=UI.TableView.setToolbar,name=buttons,type=array) the array of objects, including fixed and variables spaces. Use an empty array to hide the tool bar.
 * @tiarg(for=UI.TableView.setToolbar,name=options,type=object) set to {animated:true} to enable animation of changing the tool bar.
 
 * @tiapi(method=true,since=0.5,name=UI.TableView.setTitleControl) Replaces the title area of the nav bar with a UI.Button 
 * @tiarg[UI.Button,titleControl] Control to place. Pass in null to remove the current UI.Button and reveal the title image or title.
 
 * @tiapi(property=True,name=UI.TableView.data,version=0.5,type=object) Array of objects specifying table rows
 
 ********* GroupedView Object methods (Copypasta from TableView)
 
 * @tiapi(method=True,name=UI.GroupedView.setFullScreen,since=0.5) Makes a window fullscreen, including hiding the nav bar and tab bar if the window is not open
 * @tiarg(for=UI.GroupedView.setFullScreen,name=fullscreen,type=boolean) set to true for fullscreen, false if otherwise
 
 * @tiapi(method=True,name=UI.GroupedView.open,since=0.5) Opens a window if wasn't previously opened - pushes it to the navigation and hides the parent window. Properties that were set are applied now.
 * @tiarg(for=UI.GroupedView.open,name=options,type=object) set to {animated:false} to disable the navigation animation
 
 * @tiapi(method=True,name=UI.GroupedView.close,since=0.5) Closes a window - pops it from the navigation and returns to the parent window
 * @tiarg(for=UI.GroupedView.close,name=options,type=object) set to {animated:false} to disable the navigation animation
 
 * @tiapi(method=True,name=UI.GroupedView.setTitle,since=0.5) Sets the title of a window, visible in the middle of the window's nav bar and as the back button in the child window's nav bar
 * @tiarg(for=UI.GroupedView.setTitle,type=string,name=title) the title of the window
 
 * @tiapi(method=True,name=UI.GroupedView.setTitleImage,since=0.5) Sets the window title image, visible in the middle of the window's bav bar
 * @tiarg(for=UI.GroupedView.setTitleImage,type=string,name=url) the relative url for the image. Must be local.
 
 * @tiapi(method=True,name=UI.GroupedView.setBarColor,since=0.5) Sets the tint and style of the nav bar and tool bar. If foreground, this is animated.
 * @tiarg(for=UI.GroupedView.setBarColor,type=string,name=color) a web color. Null causes the default style. 'transparent' causes the translucent black style, and stretches the web page to reach to underneath the nav bar and tool bar. Any other color for an opaque tinted bar of that color.
 
 * @tiapi(method=True,name=UI.GroupedView.showNavBar,since=0.5) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.GroupedView.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.
 
 * @tiapi(method=True,name=UI.GroupedView.hideNavBar,since=0.5) Makes the nav bar invisible, resizing the web page if necessary.
 * @tiarg(for=UI.GroupedView.hideNavBar,name=options,type=object) set to {animated:true} to enable animation of hiding the nav bar if the window is foreground.
 * @tiapi(method=True,name=UI.GroupedView.showNavBar,since=0.5) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.GroupedView.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.
 
 * @tiapi(method=True,name=UI.GroupedView.setLeftNavButton,since=0.5) replaces the button or item on the left side of the nav bar with an UI.Button.
 * @tiarg(for=UI.GroupedView.setLeftNavButton,name=button,type=UI.Button) the UI.Button object. Use null to indicate no button
 * @tiarg(for=UI.GroupedView.setLeftNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.
 
 * @tiapi(method=True,name=UI.GroupedView.setRightNavButton,since=0.5) replaces the button or item on the right side of the nav bar with an UI.Button.
 * @tiarg(for=UI.GroupedView.setRightNavButton,name=button,type=UI.Button) the UI.Button object. Use null to indicate no button
 * @tiarg(for=UI.GroupedView.setRightNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.
 
 * @tiapi(method=True,name=UI.GroupedView.setToolbar,since=0.5) replaces the contents of the tool bar with an array of UI.Buttons, UI.Sliders, UI.ButtonBar, or UI.TabbedBar.
 * @tiarg(for=UI.GroupedView.setToolbar,name=buttons,type=array) the array of objects, including fixed and variables spaces. Use an empty array to hide the tool bar.
 * @tiarg(for=UI.GroupedView.setToolbar,name=options,type=object) set to {animated:true} to enable animation of changing the tool bar.
 
 * @tiapi(method=true,since=0.5,name=UI.GroupedView.setTitleControl) Replaces the title area of the nav bar with a UI.Button 
 * @tiarg[UI.Button,titleControl] Control to place. Pass in null to remove the current UI.Button and reveal the title image or title.
  
 * @tiapi(method=true,since=0.5,name=UI.GroupedView.addSection) Add a UI.GroupedSection to a UI.GroupedView. UI changes only take effect upon UI.GroupedView.open()
 * @tiarg[UI.GroupedSection,section] Section to add

 ********* GroupedSection object methods

 * @tiapi(method=True,name=UI.createGroupedSection.addEventListener,since=0.5) add an event listener to be called for a click event and returns the function to use when removing
 * @tiarg[string,type] the type of event to listen for.  Must be 'click'
 * @tiarg[method,listener] listener method to call back
 * @tiresult[function] return the listener to be used as an id
 
 * @tiapi(method=True,name=UI.createGroupedSection.removeEventListener,since=0.5) removes an event listener from click events
 * @tiarg[string,type] the type of event to be removed from addEventListener. Must be 'click'
 * @tiarg[function,id] the function to be removed from addEventListener
 * @tiresult[boolean] return true if removed
 
 
 ********* optionDialog object methods
 
 * @tiapi(method=True,name=UI.OptionDialog.show,since=0.4) Display the optionDialog to the user. Properties are applied at this point. If no options are listed, 'OK' is used.

 * @tiapi(method=True,name=UI.OptionDialog.setTitle,since=0.4) Convenience method to set the title property
 * @tiarg(for=UI.OptionDialog.setTitle,type=string,name=title) the new title
 * @tiapi(method=True,name=UI.OptionDialog.setOptions,since=0.4) Convenience method to set the options property
 * @tiarg(for=UI.OptionDialog.setOptions,type=object,name=options) the new options array

 * @tiapi(method=True,name=UI.OptionDialog.setDestructive,since=0.4) Convenience method to set the destructive index property
 * @tiarg(for=UI.OptionDialog.setDestructive,type=int,name=destructive) the new destructive index
 * @tiapi(method=True,name=UI.OptionDialog.setCancel,since=0.4) Convenience method to set the cancel index property
 * @tiarg(for=UI.OptionDialog.setCancel,type=int,name=cancel) the new cancel index

 * @tiapi(method=True,name=UI.OptionDialog.addEventListener,since=0.4) add an event listener to be called for a click event and returns the function to use when removing
 * @tiarg(for=UI.OptionDialog.addEventListener,type=string,name=type) the type of gesture event to listen for.  Must be 'click'
 * @tiarg(for=UI.OptionDialog.addEventListener,type=method,name=listener) listener method
 * @tiresult(for=UI.OptionDialog.addEventListener,type=function) return the listener to be used as an id

 * @tiapi(method=True,name=UI.OptionDialog.removeEventListener,since=0.4) removes an event listener from click events
 * @tiarg(for=UI.OptionDialog.removeEventListener,type=string,name=type) the type of event to be removed from addEventListener. Must be 'click'
 * @tiarg(for=UI.OptionDialog.removeEventListener,type=function,name=id) the function to be removed from addEventListener
 * @tiresult(for=UI.OptionDialog.removeEventListener,type=boolean) return true if removed

 * @tiapi(property=True,name=UI.OptionDialog.options,version=0.4,type=object) Array of strings that represent the buttons that the user can choose from
 * @tiapi(property=True,name=UI.OptionDialog.title,version=0.4,type=string) Title that will appear at the top of the option dialog
 * @tiapi(property=True,name=UI.OptionDialog.destructive,version=0.4,type=int) Index of the destructive option. This button will have a red background. Default is -1, to indicate none
 * @tiapi(property=True,name=UI.OptionDialog.cancel,version=0.4,type=int) Index of the cancel option. This button will have a black background. Default is -1, to indicate none

 ********* alertDialog object methods

 * @tiapi(method=True,name=UI.AlertDialog.show,since=0.4) Display the alertDialog to the user. Properties are applied at this point. If no options are listed, 'OK' is used.
 
 * @tiapi(method=True,name=UI.AlertDialog.setTitle,since=0.4) Convenience method to set the title property
 * @tiarg(for=UI.AlertDialog.setTitle,type=string,name=title) the new title
 * @tiapi(method=True,name=UI.AlertDialog.setButtonNames,since=0.4) Sets the button names
 * @tiarg(for=UI.AlertDialog.setButtonNames,type=object,name=buttonNames) Array of strings that represent the buttons that the user can choose from

 * @tiapi(method=True,name=UI.AlertDialog.setMessage,since=0.4) Convenience method to set the message property
 * @tiarg(for=UI.AlertDialog.setMessage,type=string,name=title) the new message
 
 * @tiapi(method=True,name=UI.AlertDialog.addEventListener,since=0.4) add an event listener to be called for a click event and returns the function to use when removing
 * @tiarg(for=UI.AlertDialog.addEventListener,type=string,name=type) the type of gesture event to listen for.  Must be 'click'
 * @tiarg(for=UI.AlertDialog.addEventListener,type=method,name=listener) listener method
 * @tiresult(for=UI.AlertDialog.addEventListener,type=function) return the listener to be used as an id
 
 * @tiapi(method=True,name=UI.AlertDialog.removeEventListener,since=0.4) removes an event listener from click events
 * @tiarg(for=UI.AlertDialog.removeEventListener,type=string,name=type) the type of event to be removed from addEventListener. Must be 'click'
 * @tiarg(for=UI.AlertDialog.removeEventListener,type=function,name=id) the function to be removed from addEventListener
 * @tiresult(for=UI.AlertDialog.removeEventListener,type=boolean) return true if removed
 
 * @tiapi(property=True,name=UI.AlertDialog.title,version=0.4,type=string) Title that will appear at the top of the option dialog
 * @tiapi(property=True,name=UI.AlertDialog.message,version=0.4,type=string) Message that will appear between the title and the buttons
  
 ******** button object methods

 * @tiapi(method=True,name=UI.Button.addEventListener,since=0.4) add an event listener to be called for an event and returns the function to use when removing
 * @tiarg[string,type] the type of event to listen for.  Must be 'click'
 * @tiarg[method,listener] listener method to call back
 * @tiresult[function] return the listener to be used as an id
 
 * @tiapi(method=True,name=UI.Button.removeEventListener,since=0.4) removes an event listener from events
 * @tiarg[string,type] the type of event to be removed from addEventListener. Must be 'click'
 * @tiarg[function,id] the function to be removed from addEventListener
 * @tiresult[boolean] return true if removed

 * @tiapi(method=True,name=UI.Button.setId,since=0.5) embeds the UI.Button onto the web page, taking the location and size of the div specified on the page, if those properties have not already been defined.
 * @tiarg[string,div] the name of the div element in the current window to take the position of. Note that this position is not updated if the div is moved.

 ******** slider object methods
 * @tiapi(method=True,name=UI.Slider.addEventListener,since=0.5) add an event listener to be called for an event and returns the function to use when removing
 * @tiarg[string,type] the type of event to listen for.  Must be 'change'
 * @tiarg[method,listener] listener method to call back
 * @tiresult[function] return the listener to be used as an id
 
 * @tiapi(method=True,name=UI.Slider.removeEventListener,since=0.5) removes an event listener from events
 * @tiarg[string,type] the type of event to be removed from addEventListener. Must be 'change'
 * @tiarg[function,id] the function to be removed from addEventListener
 * @tiresult[boolean] return true if removed
 
 * @tiapi(method=True,name=UI.Slider.setId,since=0.5) embeds the UI.Slider onto the web page, taking the location and width of the div specified on the page, if those properties have not already been defined.
 * @tiarg[string,div] the name of the div element in the current window to take the position of. Note that this position is not updated if the div is moved.

 ******** switch object methods
 * @tiapi(method=True,name=UI.Switch.addEventListener,since=0.5) add an event listener to be called for an event and returns the function to use when removing
 * @tiarg[string,type] the type of event to listen for.  Must be 'change'
 * @tiarg[method,listener] listener method to call back
 * @tiresult[function] return the listener to be used as an id
 
 * @tiapi(method=True,name=UI.Switch.removeEventListener,since=0.5) removes an event listener from events
 * @tiarg[string,type] the type of event to be removed from addEventListener. Must be 'change'
 * @tiarg[function,id] the function to be removed from addEventListener
 * @tiresult[boolean] return true if removed
 
 * @tiapi(method=True,name=UI.Switch.setId,since=0.5) embeds the UI.Switch onto the web page, taking the location and size of the div specified on the page, if those properties have not already been defined.
 * @tiarg[string,div] the name of the div element in the current window to take the position of. Note that this position is not updated if the div is moved.

 ******** TextField object methods
 * @tiapi(method=True,name=UI.TextField.addEventListener,since=0.4) add an event listener to be called for an event and returns the function to use when removing
 * @tiarg[string,type] the type of event to listen for.  May be 'focus', 'change', 'return', or 'blur'
 * @tiarg[method,listener] listener method to call back
 * @tiresult[function] return the listener to be used as an id
 
 * @tiapi(method=True,name=UI.TextField.removeEventListener,since=0.4) removes an event listener from events
 * @tiarg[string,type] the type of event to be removed from addEventListener. May be 'focus', 'change', 'return', or 'blur'
 * @tiarg[function,id] the function to be removed from addEventListener
 * @tiresult[boolean] return true if removed
 
 * @tiapi(method=True,name=UI.TextField.focus,since=0.5) captures the user's focus, bringing up the keyboard.
 * @tiapi(method=True,name=UI.TextField.blur,since=0.5) if the TextField has the user's focus, it releases it, hiding the keyboard.

 * @tiapi(method=True,name=UI.TextField.setId,since=0.5) embeds the UI.TextField onto the web page, taking the location and size of the div specified on the page, if those properties have not already been defined.
 * @tiarg[string,div] the name of the div element in the current window to take the position of. Note that this position is not updated if the div is moved.

 ******** TextArea object methods
 * @tiapi(method=True,name=UI.TextArea.addEventListener,since=0.4) add an event listener to be called for an event and returns the function to use when removing
 * @tiarg[string,type] the type of event to listen for.  May be 'focus', 'change', 'return', or 'blur'
 * @tiarg[method,listener] listener method to call back
 * @tiresult[function] return the listener to be used as an id
 
 * @tiapi(method=True,name=UI.TextArea.removeEventListener,since=0.4) removes an event listener from events
 * @tiarg[string,type] the type of event to be removed from addEventListener. May be 'focus', 'change', 'return', or 'blur'
 * @tiarg[function,id] the function to be removed from addEventListener
 * @tiresult[boolean] return true if removed
 
 * @tiapi(method=True,name=UI.TextArea.focus,since=0.5) captures the user's focus, bringing up the keyboard.
 * @tiapi(method=True,name=UI.TextArea.blur,since=0.5) if the TextArea has the user's focus, it releases it, hiding the keyboard.

 * @tiapi(method=True,name=UI.TextArea.setId,since=0.5) embeds the UI.TextArea onto the web page, taking the location and size of the div specified on the page, if those properties have not already been defined.
 * @tiarg[string,div] the name of the div element in the current window to take the position of. Note that this position is not updated if the div is moved.

 ******** buttonBar object methods
 * @tiapi(method=True,name=UI.ButtonBar.addEventListener,since=0.5) add an event listener to be called for a click event and returns the function to use when removing
 * @tiarg[string,type] the type of event to listen for.  Must be 'click'
 * @tiarg[method,listener] listener method to call back
 * @tiresult[function] return the listener to be used as an id
 
 * @tiapi(method=True,name=UI.ButtonBar.removeEventListener,since=0.5) removes an event listener from click events
 * @tiarg[string,type] the type of event to be removed from addEventListener. Must be 'click'
 * @tiarg[function,id] the function to be removed from addEventListener
 * @tiresult[boolean] return true if removed
 
 * @tiapi(method=True,name=UI.ButtonBar.setId,since=0.5) embeds the UI.ButtonBar onto the web page, taking the location and size of the div specified on the page, if those properties have not already been defined.
 * @tiarg[string,div] the name of the div element in the current window to take the position of. Note that this position is not updated if the div is moved.

 ******** tabbedBar object methods
 * @tiapi(method=True,name=UI.TabbedBar.addEventListener,since=0.5) add an event listener to be called for a click event and returns the function to use when removing
 * @tiarg[string,type] the type of event to listen for.  Must be 'click'
 * @tiarg[method,listener] listener method to call back
 * @tiresult[function] return the listener to be used as an id
 
 * @tiapi(method=True,name=UI.TabbedBar.removeEventListener,since=0.5) removes an event listener from click events
 * @tiarg[string,type] the type of event to be removed from addEventListener. Must be 'click'
 * @tiarg[function,id] the function to be removed from addEventListener
 * @tiresult[boolean] return true if removed
 
 * @tiapi(method=True,name=UI.TabbedBar.setId,since=0.5) embeds the UI.TabbedBar onto the web page, taking the location and size of the div specified on the page, if those properties have not already been defined.
 * @tiarg[string,div] the name of the div element in the current window to take the position of. Note that this position is not updated if the div is moved.
 
 ******** button object properties

 * @tiapi(property=True,name=UI.Button.title,version=0.4,type=string) Title that will appear if systemButton and image are not used
 * @tiapi(property=True,name=UI.Button.image,version=0.4,type=string) relative or app: path to the image that will appear if systemButton is not used
 * @tiapi(property=True,name=UI.Button.systemButton,version=0.4,type=string) one of the UI.iPhone.SystemButton constants to use a system-supplied button
 * @tiapi(property=True,name=UI.Button.style,version=0.4,type=int) one of the UI.iPhone.SystemButtonStyle constants to choose a button style

 * @tiapi(property=True,name=UI.Button.backgroundImage,version=0.5,type=string) relative or app: path to the image that will appear as the stretchable background if the button is not in the toolbar or navbar.
 * @tiapi(property=True,name=UI.Button.backgroundDisabledImage,version=0.5,type=string) relative or app: path to the image that will appear as the stretchable background if the button is not in the toolbar or navbar and is disabled.
 * @tiapi(property=True,name=UI.Button.backgroundSelectedImage,version=0.5,type=string) relative or app: path to the image that will appear as the stretchable background if the button is not in the toolbar or navbar and is selected.

 * @tiapi(property=True,name=UI.Button.color,version=0.5,type=string) a web color that the label text should have, if the button is in the content area.
 * @tiapi(property=True,name=UI.Button.borderColor,version=0.5,type=string) a web color of the corners behind the button. Default is transparent.
 
 * @tiapi(property=True,name=UI.Button.width,version=0.5,type=float) the width of the button to make
 * @tiapi(property=True,name=UI.Button.height,version=0.5,type=float) the height of the button to make, if the button is in the content area.
 * @tiapi(property=True,name=UI.Button.x,version=0.5,type=float) the horizontal position of the button to make, if the button is in the content area.
 * @tiapi(property=True,name=UI.Button.y,version=0.5,type=float) the vertical position of the button to make, if the button is in the content area.
 
 ******** slider object properties

 * @tiapi(property=True,name=UI.Slider.min,version=0.5,type=float) the minimum value allowed for the UI.Slider
 * @tiapi(property=True,name=UI.Slider.max,version=0.5,type=float) the minimum value allowed for the UI.Slider
 * @tiapi(property=True,name=UI.Slider.value,version=0.5,type=float) the starting value for the UI.Slider
 
 * @tiapi(property=True,name=UI.Slider.borderColor,version=0.5,type=string) a web color of the rectangle behind the slider. Default is transparent.

 * @tiapi(property=True,name=UI.Slider.width,version=0.5,type=float) the width of the slider to make
 * @tiapi(property=True,name=UI.Slider.x,version=0.5,type=float) the horizontal position of the slider to make, if the slider is in the content area.
 * @tiapi(property=True,name=UI.Slider.y,version=0.5,type=float) the vertical position of the slider to make, if the slider is in the content area.
 
 ******** switch object properties
 
 * @tiapi(property=True,name=UI.Switch.value,version=0.5,type=bool) the starting value for the UI.Switch
 * @tiapi(property=True,name=UI.Switch.borderColor,version=0.5,type=string) a web color of the rectangle behind the switch. Default is transparent.
 
 * @tiapi(property=True,name=UI.Switch.x,version=0.5,type=float) the horizontal position of the switch to make, if the switch is in the content area.
 * @tiapi(property=True,name=UI.Switch.y,version=0.5,type=float) the vertical position of the switch to make, if the switch is in the content area.

 ******** TextField object properties
 
 * @tiapi(property=True,name=UI.TextField.noReturnCharacter,version=0.5,type=boolean) if true, pressing the return key will not insert a return character into the textfield value. The return event will still be triggered.
 * @tiapi(property=True,name=UI.TextField.hintText,version=0.5,type=string) the light gray text that appears when the TextField is empty to indicate what should be entered
 * @tiapi(property=True,name=UI.TextField.borderStyle,version=0.5,type=int) the style of border used by the TextField. If unset, UI.INPUT_BORDERSTYLE_NONE is used.
 * @tiapi(property=True,name=UI.TextField.clearOnEdit,version=0.5,type=boolean) if true, starting to edit a text
 * @tiapi(property=True,name=UI.TextField.passwordMask,version=0.5,type=boolean) if true, the contents of the textField will be obscured after entering

 * @tiapi(property=True,name=UI.TextField.clearButtonMode,version=0.5,type=int) Indicates when the TextField clear button is shown when the TextField is not empty. When the TextField is empty, the clearButton is always hidden.
 * @tiapi(property=True,name=UI.TextField.leftButtonMode,version=0.5,type=int) Indicates when the TextField leftButton is shown
 * @tiapi(property=True,name=UI.TextField.rightButtonMode,version=0.5,type=int) Indicates when the TextField rightButton is shown
 * @tiapi(property=True,name=UI.TextField.leftButton,version=0.5,type=UI.Button) UI.Button placed in the left edge of the TextField
 * @tiapi(property=True,name=UI.TextField.rightButton,version=0.5,type=UI.Button) UI.Button placed in the right edge of the TextField. Replaces the clearButton
 
 * @tiapi(property=True,name=UI.TextField.backgroundImage,version=0.5,type=string) relative or app: path to the image that will appear as the stretchable background
 * @tiapi(property=True,name=UI.TextField.backgroundDisabledImage,version=0.5,type=string) relative or app: path to the image that will appear as the stretchable background
 
 * @tiapi(property=True,name=UI.TextField.color,version=0.5,type=string) a web color that the text should have
 * @tiapi(property=True,name=UI.TextField.backgroundColor,version=0.5,type=string) a web color that indicates the background area, if backgroundImage nor INPUT_BORDERSTYLE_ROUNDED is used
 * @tiapi(property=True,name=UI.TextField.borderColor,version=0.5,type=string) a web color of corners behind the text field if INPUT_BORDERSTYLE_ROUNDED is used. Default is transparent

 * @tiapi(property=True,name=UI.TextField.value,version=0.5,type=string) the starting text for the UI.TextField

 * @/tiapi(property=True,name=UI.TextField.autocapitalize,version=0.5,type=int) the autocapitalization pattern to follow
 * @tiapi(property=True,name=UI.TextField.returnKeyType,version=0.5,type=int) the text of the lower right key on the software keyboard. If unset, UI.RETURNKEY_DEFAULT is used.
 * @tiapi(property=True,name=UI.TextField.keyboardType,version=0.5,type=int) the style of software keyboard used for entry. If unset, UI.KEYBOARD_DEFAULT is used.
 * @tiapi(property=True,name=UI.TextField.enableReturnKey,version=0.5,type=boolean) if true, will have the return key enabled if and only if there field is not empty 
 
 * @tiapi(property=True,name=UI.TextField.width,version=0.5,type=float) the width of the text field to make
 * @tiapi(property=True,name=UI.TextField.height,version=0.5,type=float) the height of the text field to make, if it is in the content area.
 * @tiapi(property=True,name=UI.TextField.x,version=0.5,type=float) the horizontal position of the text field to make, if it is in the content area.
 * @tiapi(property=True,name=UI.TextField.y,version=0.5,type=float) the vertical position of the text field to make, if it is in the content area.
 
 * @tiapi(property=True,name=UI.TextField.autocorrect,version=0.5,type=boolean) the autocorrection behavior of TextField. If the default is to be used, provide null instead
 * @tiapi(property=True,name=UI.TextField.textAlign,version=0.5,type=string) the alignment of the text inside the TextField. May be either 'left', 'center', or 'right'
 

 ******** TextArea object properties

 * @tiapi(property=True,name=UI.TextArea.color,version=0.5,type=string) a web color that the text should have
 * @tiapi(property=True,name=UI.TextArea.backgroundColor,version=0.5,type=string) a web color that indicates the background area

 * @tiapi(property=True,name=UI.TextArea.value,version=0.5,type=string) the starting text for the UI.TextArea

 * @/tiapi(property=True,name=UI.TextArea.autocapitalize,version=0.5,type=int) the autocapitalization pattern to follow
 * @tiapi(property=True,name=UI.TextArea.returnKeyType,version=0.5,type=int) the text of the lower right key on the software keyboard. If unset, UI.RETURNKEY_DEFAULT is used.
 * @tiapi(property=True,name=UI.TextArea.keyboardType,version=0.5,type=int) the style of software keyboard used for entry. If unset, UI.KEYBOARD_DEFAULT is used.
 * @tiapi(property=True,name=UI.TextArea.enableReturnKey,version=0.5,type=boolean) if true, will have the return key enabled if and only if there field is not empty 

 * @tiapi(property=True,name=UI.TextArea.width,version=0.5,type=float) the width of the text area to make
 * @tiapi(property=True,name=UI.TextArea.height,version=0.5,type=float) the height of the text area to make, if it is in the content area.
 * @tiapi(property=True,name=UI.TextArea.x,version=0.5,type=float) the horizontal position of the text area to make, if it is in the content area.
 * @tiapi(property=True,name=UI.TextArea.y,version=0.5,type=float) the vertical position of the text area to make, if it is in the content area.
 
 * @tiapi(property=True,name=UI.TextArea.autocorrect,version=0.5,type=boolean) the autocorrection behavior. If the default is to be used, provide null instead
 * @tiapi(property=True,name=UI.TextArea.textAlign,version=0.5,type=string) the alignment of the text. May be either 'left', 'center', or 'right'

 ******** buttonBar object properties

 * @tiapi(property=True,name=UI.ButtonBar.images,version=0.5,type=arrray) An array of strings specifying images to use in the segments. If the corresponding label should be used instead, use 'null' 
 * @tiapi(property=True,name=UI.ButtonBar.labels,version=0.5,type=array) An array of strings specifying labels to use in the segments.
 
 * @tiapi(property=True,name=UI.ButtonBar.color,version=0.5,type=string) a web color that the label text should have, if the button is in the content area.
 * @tiapi(property=True,name=UI.ButtonBar.backgroundColor,version=0.5,type=string) a web color that indicates the tint, if the button bar is in the tool bar.
 * @/tiapi(property=True,name=UI.ButtonBar.borderColor,version=0.5,type=string) a web color of the rectangle behind the slider. Default is transparent.
 
 * @tiapi(property=True,name=UI.ButtonBar.width,version=0.5,type=float) the width of the button bar to make
 * @tiapi(property=True,name=UI.ButtonBar.x,version=0.5,type=float) the horizontal position of the button bar to make, if it is in the content area.
 * @tiapi(property=True,name=UI.ButtonBar.y,version=0.5,type=float) the vertical position of the button bar to make, if it is in the content area.
 
 ******** tabbedBar object properties

 * @tiapi(property=True,name=UI.TabbedBar.index,version=0.5,type=int) the index of the section that should be selected when tabbedBar is placed
 * @tiapi(property=True,name=UI.TabbedBar.images,version=0.5,type=arrray) An array of strings specifying images to use in the segments. If the corresponding label should be used instead, use 'null' 
 * @tiapi(property=True,name=UI.TabbedBar.labels,version=0.5,type=array) An array of strings specifying labels to use in the segments.
 
 * @tiapi(property=True,name=UI.TabbedBar.color,version=0.5,type=string) a web color that the label text should have, if the tabbed bar is in the content area.
 * @tiapi(property=True,name=UI.TabbedBar.backgroundColor,version=0.5,type=string) a web color that indicates the tint, if the tabbed bar is in the tool bar.
 * @tiapi(property=True,name=UI.TabbedBar.borderColor,version=0.5,type=string) a web color of the rectangle behind the tabbed bar. Default is transparent.
 
 * @tiapi(property=True,name=UI.TabbedBar.width,version=0.5,type=float) the width of the tabbed bar to make
 * @tiapi(property=True,name=UI.TabbedBar.x,version=0.5,type=float) the horizontal position of the tabbed bar to make, if it is in the content area.
 * @tiapi(property=True,name=UI.TabbedBar.y,version=0.5,type=float) the vertical position of the tabbed bar to make, if it is in the content area.
 
 
 @tiapi(method=true,name=UI.EmailDialog.addAttachment,since=0.6) Adds 'attachment' to the attachments property for the resulting email
 @tiarg(for=UI.EmailDialog.addAttachment,name=attachment,type=object) A Media.Image object (which are handed to success callbacks by Media.showCamera and Media.openPhotoGallery)
 
 @tiapi(method=true,name=UI.EmailDialog.open,since=0.6) Displays the email dialog, prompting the user to edit the email before sending or canceling
 @tiapi Note that in the event that the email dialog can't be used, a mailto: url will be created and launched, terminating your app
 @tiarg(for=UI.EmailDialog.open,name=options,type=object) object with an animated property set to false to surpress the animation of opening
 
 @tiapi(method=true,name=UI.EmailDialog.setBccRecipients,since=0.6) sets the bccRecipients property
 @tiarg(for=UI.EmailDialog.setBccRecipients,name=newBccRecipients,type=object) array of strings, each an email address that will appear in the BCC field
 
 @tiapi(method=true,name=UI.EmailDialog.setCcRecipients,since=0.6) sets the ccRecipients property
 @tiarg(for=UI.EmailDialog.setCcRecipients,name=newCcRecipients,type=object) array of strings, each an email address that will appear in the CC field
 
 @tiapi(method=true,name=UI.EmailDialog.setMessageBody,since=0.6) sets the messageBody property
 @tiarg(for=UI.EmailDialog.setMessageBody,name=newMessageBody,type=string) the replacement messageBody value
 
 @tiapi(method=true,name=UI.EmailDialog.setSubject,since=0.6) sets the subject property
 @tiarg(for=UI.EmailDialog.setSubject,name=newSubject,type=string) the replacement subject value
 
 @tiapi(method=true,name=UI.EmailDialog.setToRecipients,since=0.6) sets the toRecipients property
 @tiarg(for=UI.EmailDialog.setToRecipients,name=newToRecipients,type=object) array of strings, each an email address that will appear in the To field
 
   
 @tiapi(method=true,name=UI.TableView.deleteRow,since=0.6) deletes a row from the table view
 @tiapi Keep in mind that after this is called, all rows afterward are renumbered appropriately.
 @tiarg(for=UI.TableView.deleteRow,name=rowIndex,type=int) The index of the row to delete. Valid values are 0 to (number of rows - 1)
 @tiarg(for=UI.TableView.deleteRow,name=options,type=object,optional=true) If the table view is visible, the animationStyle property may be one of UI.iPhone.RowAnimationStyle to specify how the transition is animated
 
 @tiapi(method=true,name=UI.TableView.getIndexByName,since=0.6) returns the index of the first row whose name property is the value provided
 @tiarg(for=UI.TableView.getIndexByName,name=name,type=string) The name to search for
 @tiresult(for=UI.TableView.getIndexByName,type=int) the index of the row found. -1 if no row was found
 
 @tiapi(method=true,name=UI.TableView.insertRowAfter,since=0.6) inserts a row from the table view
 @tiapi Keep in mind that after this is called, all rows afterward are renumbered appropriately.
 @tiarg(for=UI.TableView.insertRowAfter,name=rowIndex,type=int) The index of the row to insert after. Valid values are 0 to (number of rows - 1)
 @tiarg(for=UI.TableView.insertRowAfter,name=row,type=object) The data representing the row to be inserted
 @tiarg(for=UI.TableView.insertRowAfter,name=options,type=object,optional=true) If the table view is visible, the animationStyle property may be one of UI.iPhone.RowAnimationStyle to specify how the transition is animated
 
 @tiapi(method=true,name=UI.TableView.insertRowBefore,since=0.6) inserts a row from the table view
 @tiapi Keep in mind that after this is called, all rows afterward are renumbered appropriately.
 @tiarg(for=UI.TableView.insertRowBefore,name=rowIndex,type=int) The index of the row to insert before. Valid values are 0 to (number of rows)
 @tiarg(for=UI.TableView.insertRowBefore,name=row,type=object) The data representing the row to be inserted
 @tiarg(for=UI.TableView.insertRowBefore,name=options,type=object,optional=true) If the table view is visible, the animationStyle property may be one of UI.iPhone.RowAnimationStyle to specify how the transition is animated
 
 @tiapi(method=true,name=UI.TableView.setData,since=0.6) removes replaces all previous rows and replaces them with the supplied data
 @tiarg(for=UI.TableView.setData,name=newData,type=array) An array of data objects representing the new rows
 @tiarg(for=UI.TableView.setData,name=options,type=object,optional=true) If the table view is visible, the animationStyle property may be one of UI.iPhone.RowAnimationStyle to specify how the transition is animated
 
 @tiapi(method=true,name=UI.TableView.updateRow,since=0.6) replaces a row from the table view
 @tiarg(for=UI.TableView.updateRow,name=row,type=object) the data representing the new data for the row
 @tiarg(for=UI.TableView.updateRow,name=options,type=object,optional=true) If the table view is visible, the animationStyle property may be one of UI.iPhone.RowAnimationStyle to specify how the transition is animated
 
 @tiapi(method=true,name=UI.createActivityIndicator,since=0.6) Creates an UI.ActivityIndicator object
 @tiapi Also known as a 'spinner'.
 @tiarg(for=UI.createActivityIndicator,name=properties,type=object) the properties to copy to the new UI.ActivityIndicator object during creation
 @tiresult(for=UI.createActivityIndicator,type=object) the created UI.ActivityIndicator object
 
 @tiapi(method=true,name=UI.createEmailDialog,since=0.6) Creates an UI.EmailDialog object
 @tiapi Allows the user to send off a pre-made email
 @tiarg(for=UI.createEmailDialog,name=properties,type=object) the properties to copy to the new UI.EmailDialog object during creation
 @tiresult(for=UI.createEmailDialog,type=object) the created UI.EmailDialog object
 
 @tiapi(method=true,name=UI.createProgressBar,since=0.6) Creates an UI.ProgressBar object
 @tiarg(for=UI.createProgressBar,name=properties,type=object) the properties to copy to the new UI.ProgressBar object during creation
 @tiresult(for=UI.createProgressBar,type=object) the created UI.ProgressBar object
 
 @tiapi(method=true,name=UI.createWebView,since=0.6) Creates an UI.WebView object
 @tiarg(for=UI.createWebView,name=properties,type=object) the properties to copy to the new UI.WebView object during creation
 @tiresult(for=UI.createWebView,type=object) the created UI.WebView object
 
 @tiapi(property=true,name=UI.currentView,since=0.6,type=UI.WebView) Object that represents the current webView. Can be used like a UI.WebView
 
 @tiapi(method=true,name=UI.currentView.addEventListener,since=0.6) adds an event listener to be called for a load, focused, or unfocused event
 @tiarg(for=UI.currentView.addEventListener,name=type,type=string) the type of event to listen for.  Must be load, focused, or unfocused
 @tiarg(for=UI.currentView.addEventListener,name=callback,type=function) the function that will be called when the event occurs. A single object event is passed as an argument
 @tiresult(for=UI.currentView.addEventListener,type=method) the callback function, for use in removeEventListener
 
 @tiapi(method=true,name=UI.currentView.removeEventListener,since=0.6) removes an event listener from undefined, undefined, or undefined events
 @tiarg(for=UI.currentView.removeEventListener,name=type,type=string) the type of event to remove the listener from.  Must be undefined, undefined, or undefined
 @tiarg(for=UI.currentView.removeEventListener,name=callback,type=function) the function to be removed
 @tiresult(for=UI.currentView.removeEventListener,type=boolean) returns true if successfully removed
 
 @tiapi(method=true,name=UI.currentView.setURL,since=0.6) Replaces the contents of this view with a new page
 @tiarg(for=UI.currentView.setURL,name=newURL,type=string) a relative url
 
 @tiapi(method=true,name=UI.currentWindow.addView,since=0.6) Adds a view to the current window, but does not change the visible view
 @tiarg(for=UI.currentWindow.addView,name=newView,type=object) a UI.WebView, UI.TableView, or UI.GroupedView object to be added.
 
 @tiapi(method=true,name=UI.currentWindow.getViewByName,since=0.6) finds the first view that has its name property set to the specified value
 @tiarg(for=UI.currentWindow.getViewByName,name=searchedName,type=string) the name value to search for amongst the window's views
 @tiresult(for=UI.currentWindow.getViewByName,type=object) the UI.WebView, UI.TableView, or UI.GroupedView that matches, or null if none was found
 
 @tiapi(method=true,name=UI.currentWindow.getViews,since=0.6) lists the window's views at that current moment
 @tiresult(for=UI.currentWindow.getViews,type=object) an array of UI.WebView, UI.TableView, and/or UI.GroupedViews that are owned by the window
 
 @tiapi(method=true,name=UI.currentWindow.setTitleControl,since=0.6) sets the titleControl property
 @tiapi Replaces the window's title and title image while not set to null
 @tiarg(for=UI.currentWindow.setTitleControl,name=newTitleControl) the replacement titleControl value
 
 @tiapi(method=true,name=UI.currentWindow.showView,since=0.6) Changes the view that the current window is showing
 
 @tiapi(property=true,name=UI.iPhone.ActivityIndicatorStyle,since=0.6,type=object) Possible styles for UI.ActivityIndicator
 
 @tiapi(property=true,name=UI.iPhone.ActivityIndicatorStyle.BIG,since=0.6,type=int) constant representing a large (37 pixels wide) white activity indicator
 
 @tiapi(property=true,name=UI.iPhone.ActivityIndicatorStyle.DARK,since=0.6,type=int) constant representing a small (20 pixels wide) gray activity indicator
 
 @tiapi(property=true,name=UI.iPhone.ActivityIndicatorStyle.PLAIN,since=0.6,type=int) constant representing a small (20 pixels wide) white activity indicator
 
 @tiapi(property=true,name=UI.iPhone.AnimationStyle,since=0.6,type=object) Animation styles possible when changing views
 
 @tiapi(property=true,name=UI.iPhone.AnimationStyle.CURL_DOWN,since=0.6,type=int) constant used to describe an animation where the new view curls down, covering the current view
 @tiapi UI.iPhone.AnimationStyle.CURL_DOWN is used by UI.currentWindow.showView and UI.UserWindow.showView
 
 @tiapi(property=true,name=UI.iPhone.AnimationStyle.CURL_UP,since=0.6,type=int) constant used to describe an animation where the current view curls up, revealing the new view
 @tiapi UI.iPhone.AnimationStyle.CURL_UP is used by UI.currentWindow.showView and UI.UserWindow.showView
 
 @tiapi(property=true,name=UI.iPhone.AnimationStyle.FLIP_FROM_LEFT,since=0.6,type=int) constant used to describe an animation where the current view flips over with the new view on the opposite side. The leftmost edge is foreground
 @tiapi UI.iPhone.AnimationStyle.FLIP_FROM_LEFT is used by UI.currentWindow.showView and UI.UserWindow.showView
 
 @tiapi(property=true,name=UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT,since=0.6,type=int) constant used to describe an animation where the current view flips over with the new view on the opposite side. The leftmost edge is foreground
 @tiapi UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT is used by UI.currentWindow.showView and UI.UserWindow.showView
 
 @tiapi(property=true,name=UI.iPhone.ProgressBarStyle,since=0.6,type=object) Possible styles for UI.ProgressBar
 
 @tiapi(property=true,name=UI.iPhone.ProgressBarStyle.BAR,since=0.6,type=int) constant representing the silver and black style often seen when a progress bar is in a toolbar
 
 @tiapi(property=true,name=UI.iPhone.ProgressBarStyle.PLAIN,since=0.6,type=int) constant representing the blue and white style often seen when a progress bar is not in the toolbar
 
 @tiapi(property=true,name=UI.iPhone.RowAnimationStyle,since=0.6,type=object) Possible transition styles for rows and sections
 
 @tiapi(property=true,name=UI.iPhone.RowAnimationStyle.BOTTOM,since=0.6,type=int) constant used to describe a row animation where the inserted row or rows slides in from the bottom; the deleted row or rows slides out toward the bottom.
 
 @tiapi(property=true,name=UI.iPhone.RowAnimationStyle.FADE,since=0.6,type=int) constant used to describe a row animation where the inserted or deleted row or rows fades into or out of the table view.
 
 @tiapi(property=true,name=UI.iPhone.RowAnimationStyle.LEFT,since=0.6,type=int) constant used to describe a row animation where the nserted row or rows slides in from the left; the deleted row or rows slides out to the left.
 
 @tiapi(property=true,name=UI.iPhone.RowAnimationStyle.NONE,since=0.6,type=int) constant used to describe a row replacement where the new cell value appears as if the cell had just been reloaded.. In iPhone OS 2.2.1, this is a fade instead.
 
 @tiapi(property=true,name=UI.iPhone.RowAnimationStyle.RIGHT,since=0.6,type=int) constant used to describe a row animation where the inserted row or rows slides in from the right; the deleted row or rows slides out to the right.
 
 @tiapi(property=true,name=UI.iPhone.RowAnimationStyle.TOP,since=0.6,type=int) constant used to describe a row animation where the inserted row or rows slides in from the top; the deleted row or rows slides out toward the top.
 
 @tiapi(property=true,name=UI.iPhone.SystemButtonStyle.BAR,since=0.6,type=int) constant representing the toolbar style for both UI.ButtonBar and UI.TabbedBar. The native element will be shorter in hieght and will honor the tinting color, even when not in the toolbar
 
 
 
 
 
 @tiapi(property=true,name=UI.TableView.marginTop,since=0.8,type=Number) (dimension)
 @tiapi  The size of the space placed above the UI.TableView.
 @tiapi(property=true,name=UI.TableView.marginLeft,since=0.8,type=Number) (dimension)
 @tiapi  The size of the space placed to the left of the UI.TableView.
 @tiapi(property=true,name=UI.TableView.marginRight,since=0.8,type=Number) (dimension)
 @tiapi  The size of the space placed to the right of the UI.TableView.
 @tiapi(property=true,name=UI.TableView.marginBottom,since=0.8,type=Number) (dimension)
 @tiapi  The size of the space placed below the UI.TableView.
 @tiapi(property=true,name=UI.TableView.search,since=0.8,type=Object) (UI.SearchBar)
 @tiapi  The UI.SearchBar placed above the first row of the UI.TableView to enable searching.
 @tiapi(property=true,name=UI.TableView.filterAttribute,since=0.8,type=String) (string)
 @tiapi  The key of the UI.TableDataCell containing the values that the search will use in filtering.
 @tiapi(property=true,name=UI.TableView.template,since=0.8,type=Object) (UI.TableDataCell)
 @tiapi  When set, UI.TableDataCells will defer to this when a requested property is undefined, but not null.
 @tiapi(property=true,name=UI.TableView.borderColor,since=0.8,type=String) (webColor)
 @tiapi  Specifies the color of the lines between rows.
 
 @tiapi(method=true,name=UI.createSearchBar,since=0.8)
 @tiapi has a side effect that if the id property is set in this manner, the setId side effect happens.
 @tiarg[args,Object,optional=true] (optional object)
 @tiarg  can contain various properties that will be copied into the new object on initialization.
 @tiresult[Object] The created UI.SearchBar.
 @tiapi(property=true,name=UI.SearchBar.value,since=0.8,type=String) (string)
 @tiapi  The contents of the SearchBar text area. Default is "".
 @tiapi(property=true,name=UI.SearchBar.barColor,since=0.8,type=String) (webColor)
 @tiapi  The tint of the gradient behind the SearchBar text area. Use null to indicate the default blue, 'transparent' for the translucent black gradient. Otherwise, provide a color. Default is null.
 @tiapi(property=true,name=UI.SearchBar.showCancel,since=0.8,type=Boolean) (boolean)
 @tiapi  If true, a cancel button will be displayed to the right of the SearchBar text area. Default is false.
 @tiapi(property=true,name=UI.SearchBar.id,since=0.8,type=String) (string)
 @tiapi  the name of the element to bind the button to in a web view.
 @tiapi(method=true,name=UI.SearchBar.setId,since=0.8)
 @tiapi saves the UI.SearchBar.id property
 @tiarg[String,newId] The new string.
 @tiapi(property=true,name=UI.SearchBar.x,since=0.8,type=Number) (dimension)
 @tiapi  Used only when embedded in a web view. As a float, the horizontal position of the Switch. Overrides the Id's x property.
 @tiapi(property=true,name=UI.SearchBar.y,since=0.8,type=Number) (dimension)
 @tiapi  Used only when embedded in a web view. As a float, the vertical position of the Switch. Overrides the Id's y property.
 @tiapi(property=true,name=UI.SearchBar.width,since=0.8,type=Number) (dimension)
 @tiapi  As a float, the width in pixels of the slider's rectangle. Overrides the Id's width property.
 @tiapi(method=true,name=UI.SearchBar.hide,since=0.8)
 @tiarg[options,Object,optional=true] (optional animation object.)
 @tiapi(method=true,name=UI.SearchBar.show,since=0.8)
 @tiarg[options,Object,optional=true] (optional animation object.)
 @tiapi(method=true,name=UI.SearchBar.focus,since=0.8)
 @tiapi(method=true,name=UI.SearchBar.blur,since=0.8)
 
 
 
 */

#endif