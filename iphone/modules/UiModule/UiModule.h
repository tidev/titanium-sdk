/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_UI

#import <Foundation/Foundation.h>
#import "TitaniumModule.h"

@interface UIButtonProxy : TitaniumProxyObject
{
	//Properties that are stored until the time is right
	BOOL needsRefreshing;
	
	NSString * titleString;
	NSString * iconPath;
	CGRect	frame;
	int templateValue;
	
	//For Bar buttons
	UIBarButtonItemStyle barButtonStyle;
	
	//For activity spinners
	UIActivityIndicatorViewStyle spinnerStyle;
	
	
	
	//Connections to the native side
	UILabel * labelView;
	UIProgressView * progressView;
	UIView * nativeView;
	UIBarButtonItem * nativeBarButton;
	
	//Note: For some elements (Textview, activityIndicator, statusIndicator)
}

@property(nonatomic,readwrite,retain)	NSString * titleString;
@property(nonatomic,readwrite,retain)	NSString * iconPath;
@property(nonatomic,readwrite,assign)	int templateValue;
@property(nonatomic,readwrite,assign)	UIBarButtonItemStyle barButtonStyle;

@property(nonatomic,readwrite,retain)	UILabel * labelView;
@property(nonatomic,readwrite,retain)	UIProgressView * progressView;
@property(nonatomic,readwrite,retain)	UIView * nativeView;
@property(nonatomic,readwrite,retain)	UIBarButtonItem * nativeBarButton;

- (IBAction) onClick: (id) sender;
- (void) setPropertyDict: (NSDictionary *) newDict;

@end


@interface UiModule : NSObject<TitaniumModule> {
	NSUInteger nextButtonToken;
	NSUInteger nextWindowToken;

	NSMutableDictionary * buttonContexts;
	NSMutableDictionary * virtualWindowsDict;
}

- (void) setWindow:(NSString *)tokenString URL:(NSString *)newURLString baseURL:(NSString *)baseURLString;
- (void) setWindow:(NSString *)tokenString navSide:(id) isLeftObject button: (NSDictionary *) buttonObject options: (NSDictionary *) optionsObject;
- (void) setWindow:(NSString *)tokenString toolbar: (id) barObject options: (id) optionsObject;

- (UIButtonProxy *) proxyForToken: (NSString *) tokenString;

@end

/****** UI functions
 * @tiapi(method=True,name=UI.setAppBadge,version=0.4) Sets the application's badge value
 * @tiarg(for=UI.setAppBadge,type=int,name=badge) badge value
 * @tiapi(method=True,name=UI.setTabBadge,version=0.4) Sets the tab bar's badge value, must be on the root of the nav controller
 * @tiarg(for=UI.setTabBadge,type=string,name=badge) badge value

 * @tiapi(method=True,name=UI.createButton,version=0.4) Creates an UI.button object for use in UI.Window's setLeftNavButton, setRightNavButton, or setToolbar methods
 * @tiarg(for=UI.createButton,type=mixed,optional=True,name=properties) If object, the UI.button properties to copy over on initialization. If a string, the title or template to use
 * @tiresult(for=UI.createButton,type=object) the resulting UI.button
 
 * @tiapi(method=True,name=UI.createOptionDialog,version=0.4) Creates an UI.optionDialog object
 * @tiarg(for=UI.createOptionDialog,type=mixed,optional=True,name=properties) UI.optionDialog properties to copy over on initialization
 * @tiresult(for=UI.createOptionDialog,type=object) the resulting UI.optionDialog object

 * @tiapi(method=True,name=UI.createAlertDialog,version=0.4) Creates an UI.alertDialog object
 * @tiarg(for=UI.createAlertDialog,type=mixed,optional=True,name=properties) UI.alertDialog properties to copy over on initialization
 * @tiresult(for=UI.createAlertDialog,type=object) the resulting UI.alertDialog object
 
 * @tiapi(method=True,name=UI.createWindow,since=0.4) Creates a new window as a child of the current window
 * @tiarg(for=UI.createWindow,name=options,type=mixed,optional=True) a string containing a url of the new window's content or an object containing properties for the new window
 * @tiresult(for=UI.createWindow,type=object) a UserWindow object
 
 ******* UI properties

 * @tiapi(property=True,name=UI.currentWindow,version=0.4,type=object) the CurrentWindow object representing the window of the calling javascript. CurrentWindow currently has some slight differences from a created UserWindow
 * @tiapi(property=True,name=UI.PORTRAIT,since=0.4,type=int) integer that represents portrait orientation - this is the same as Gesture.PORTRAIT
 * @tiapi(property=True,name=UI.LANDSCAPE,since=0.4,type=int) integer that represents both landscape left or landscape right orientation - this is the same as Gesture.LANDSCAPE
 * @tiapi(property=True,name=UI.PORTRAIT_AND_LANDSCAPE,since=0.4,type=int) integer that represents portrait or landscape (But not upside-down portrait) orientation

 ******* UI.iPhone.* properties
 
 * Should be refactored? UI.iPhone.setStatusBarStyle

 * @tiapi(property=True,name=UI.iPhone,version=0.4,type=object) object containing iPhone constants
 * @tiapi(property=True,name=UI.iPhone.SystemButtonStyle,version=0.4,type=object) object containing iPhone button style constants
 * @tiapi(property=True,name=UI.iPhone.SystemButtonStyle.PLAIN,version=0.4,type=int) constant representing the plain button style. On the nav bar, this is the same as bordered. On the tool bar, this lacks a border.
 * @tiapi(property=True,name=UI.iPhone.SystemButtonStyle.BORDERED,version=0.4,type=int) constant representing the bordered button style. The button will appear slightly darker background than the bar, in a recessed rounded rectangle shape.
 * @tiapi(property=True,name=UI.iPhone.SystemButtonStyle.DONE,version=0.4,type=int) constant representing the done button style. The button will appear with a blue background, in a recessed rounded rectangle shape.

 * @tiapi(property=True,name=UI.iPhone.SystemButton,version=0.4,type=object) object containing iPhone system-provided button constants. Refer to http://developer.apple.com/iphone/library/documentation/UserExperience/Conceptual/MobileHIG/SystemProvided/SystemProvided.html
 * @tiapi(property=True,name=UI.iPhone.SystemButton.ACTION,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Action" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.ACTIVITY,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to have an activity spinner in the button's place
 * @tiapi(property=True,name=UI.iPhone.SystemButton.CAMERA,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Camera" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.COMPOSE,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Compose" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.BOOKMARKS,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Bookmarks" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.SEARCH,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Search" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.ADD,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Add" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.TRASH,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Trash" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.ORGANIZE,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Organize" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.REPLY,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Reply" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.STOP,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Stop" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.REFRESH,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Refresh" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.PLAY,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Play" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.FAST_FORWARD,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "FastForward" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.PAUSE,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Pause" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.REWIND,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Rewind" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.EDIT,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Edit" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.CANCEL,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Cancel" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.SAVE,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Save" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.DONE,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to get the system-provided "Done" button
 * @tiapi(property=True,name=UI.iPhone.SystemButton.FLEXIBLE_SPACE,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to have a spacer to place between tool bar buttons to seperate them as much as possible
 * @tiapi(property=True,name=UI.iPhone.SystemButton.FIXED_SPACE,version=0.4,type=string) Set a UI.button's "systemButton" property to this in order to have a space of a fixed size to place between tool bar buttons

 * @/tiapi(property=True,name=UI.iPhone.SystemIcon,version=0.4,type=object) object containing iPhone tab template constants. Refer to http://developer.apple.com/iphone/library/documentation/UserExperience/Conceptual/MobileHIG/SystemProvided/SystemProvided.html
 * @/tiapi(property=True,name=UI.iPhone.SystemIcon.BOOKMARKS,version=0.4,type=string) Set a UI.userWindow's "systemButton" property to this in order to get the system-provided "Action" button
There's no way to use anything of UI.iPhone.SystemIcon, since tab bar properties are set in tiapp.xml, long before any web rendering.
 NSString * systemIconString = @"{BOOKMARKS:'bookmarks',CONTACTS:'contacts',DOWNLOADS:'downloads',"
 "FAVORITES:'favorites',DOWNLOADS:'downloads',FEATURED:'featured',MORE:'more',MOST_RECENT:'most_recent',"
 "MOST_VIEWED:'most_viewed',RECENTS:'recents',SEARCH:'search',TOP_RATED:'top_rated'}";

 * @tiapi(property=True,name=UI.iPhone.StatusBar,version=0.4,type=object) object containing iPhone status bar style constants
 * @tiapi(property=True,name=UI.iPhone.StatusBar.DEFAULT,version=0.4,type=int) constant representing the default status bar style. The status bar appears opaque and grey. This is the same as grey
 * @tiapi(property=True,name=UI.iPhone.StatusBar.GREY,version=0.4,type=int) constant representing the default status bar style. The status bar appears opaque and grey. This is the same as default
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
 * @tiarg(for=UI.currentWindow.setBarColor,type=string,name=color) a web color. Null causes the default style. 'clear' causes the translucent black style, and stretches the web page to reach to underneath the nav bar and tool bar. Any other color for an opaque tinted bar of that color.
 
 * @tiapi(method=True,name=UI.currentWindow.showNavBar,since=0.4) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.currentWindow.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.
 
 * @tiapi(method=True,name=UI.currentWindow.hideNavBar,since=0.4) Makes the nav bar invisible, resizing the web page if necessary.
 * @tiarg(for=UI.currentWindow.hideNavBar,name=options,type=object) set to {animated:true} to enable animation of hiding the nav bar if the window is foreground.
 * @tiapi(method=True,name=UI.currentWindow.showNavBar,since=0.4) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.currentWindow.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.
 
 * @tiapi(method=True,name=UI.currentWindow.setLeftNavButton,since=0.4) replaces the button or item on the left side of the nav bar with an UI.button.
 * @tiarg(for=UI.currentWindow.setLeftNavButton,name=button,type=object) the UI.button object. Use null to indicate no button
 * @tiarg(for=UI.currentWindow.setLeftNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.
 
 * @tiapi(method=True,name=UI.currentWindow.setRightNavButton,since=0.4) replaces the button or item on the right side of the nav bar with an UI.button.
 * @tiarg(for=UI.currentWindow.setRightNavButton,name=button,type=object) the UI.button object. Use null to indicate no button
 * @tiarg(for=UI.currentWindow.setRightNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.
 
 * @tiapi(method=True,name=UI.currentWindow.setToolbar,since=0.4) replaces the contents of the tool bar with an array of UI.buttons.
 * @tiarg(for=UI.currentWindow.setToolbar,name=buttons,type=object) the array of UI.button objects, including fixed and variables spaces. Use an empty array to hide the tool bar.
 * @tiarg(for=UI.currentWindow.setToolbar,name=options,type=object) set to {animated:true} to enable animation of changing the tool bar.
 
 * @tiapi(method=True,returns=integer,name=UI.currentWindow.addEventListener,since=0.4) add an event listener to be called for a focus event and returns the function to use when removing
 * @tiarg(for=UI.currentWindow.addEventListener,type=string,name=type) the type of gesture event to listen for.  May be either 'focused' or 'unfocused'
 * @tiarg(for=UI.currentWindow.addEventListener,type=method,name=listener) listener method
 * @tiresult(for=UI.currentWindow.addEventListener,type=function) return the listener to be used as an id
 *
 * @tiapi(method=True,name=UI.currentWindow.removeEventListener,since=0.4) removes an event listener from focused or unfocused events
 * @tiarg(for=UI.currentWindow.removeEventListener,type=string,name=type) the type of event to be removed from addEventListener. May be either 'focused' or 'unfocused'
 * @tiarg(for=UI.currentWindow.removeEventListener,type=function,name=id) the function to be removed from addEventListener
 * @tiresult(for=UI.currentWindow.removeEventListener,type=boolean) return true if removed
 
 
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
 * @tiarg(for=UI.UserWindow.setBarColor,type=string,name=color) a web color. Null causes the default style. 'clear' causes the translucent black style, and stretches the web page to reach to underneath the nav bar and tool bar. Any other color for an opaque tinted bar of that color.
 
 * @tiapi(method=True,name=UI.UserWindow.showNavBar,since=0.4) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.UserWindow.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.

 * @tiapi(method=True,name=UI.UserWindow.hideNavBar,since=0.4) Makes the nav bar invisible, resizing the web page if necessary.
 * @tiarg(for=UI.UserWindow.hideNavBar,name=options,type=object) set to {animated:true} to enable animation of hiding the nav bar if the window is foreground.
 * @tiapi(method=True,name=UI.UserWindow.showNavBar,since=0.4) Makes the nav bar visible, resizing the web page if necessary.
 * @tiarg(for=UI.UserWindow.showNavBar,name=options,type=object) set to {animated:true} to enable animation of showing the nav bar if the window is foreground.

 * @tiapi(method=True,name=UI.UserWindow.setLeftNavButton,since=0.4) replaces the button or item on the left side of the nav bar with an UI.button.
 * @tiarg(for=UI.UserWindow.setLeftNavButton,name=button,type=object) the UI.button object. Use null to indicate no button
 * @tiarg(for=UI.UserWindow.setLeftNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.

 * @tiapi(method=True,name=UI.UserWindow.setRightNavButton,since=0.4) replaces the button or item on the right side of the nav bar with an UI.button.
 * @tiarg(for=UI.UserWindow.setRightNavButton,name=button,type=object) the UI.button object. Use null to indicate no button
 * @tiarg(for=UI.UserWindow.setRightNavButton,name=options,type=object) set to {animated:true} to enable animation of changing the nav button.
 
 * @tiapi(method=True,name=UI.UserWindow.setToolbar,since=0.4) replaces the contents of the tool bar with an array of UI.buttons.
 * @tiarg(for=UI.UserWindow.setToolbar,name=buttons,type=object) the array of UI.button objects, including fixed and variables spaces. Use an empty array to hide the tool bar.
 * @tiarg(for=UI.UserWindow.setToolbar,name=options,type=object) set to {animated:true} to enable animation of changing the tool bar.
 
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

 * @tiapi(method=True,returns=integer,name=UI.OptionDialog.addEventListener,since=0.4) add an event listener to be called for a click event and returns the function to use when removing
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
 
 * @tiapi(method=True,returns=integer,name=UI.AlertDialog.addEventListener,since=0.4) add an event listener to be called for a click event and returns the function to use when removing
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

 * @tiapi(method=True,returns=integer,name=UI.button.addEventListener,since=0.4) add an event listener to be called for a click event and returns the function to use when removing
 * @tiarg(for=UI.button.addEventListener,type=string,name=type) the type of gesture event to listen for.  Must be 'click'
 * @tiarg(for=UI.button.addEventListener,type=method,name=listener) listener method
 * @tiresult(for=UI.button.addEventListener,type=function) return the listener to be used as an id
 
 * @tiapi(method=True,name=UI.button.removeEventListener,since=0.4) removes an event listener from click events
 * @tiarg(for=UI.button.removeEventListener,type=string,name=type) the type of event to be removed from addEventListener. Must be 'click'
 * @tiarg(for=UI.button.removeEventListener,type=function,name=id) the function to be removed from addEventListener
 * @tiresult(for=UI.button.removeEventListener,type=boolean) return true if removed
 
 ******** button object properties

 * @tiapi(property=True,name=UI.button.title,version=0.4,type=string) Title that will appear if systemButton and image are not used
 * @tiapi(property=True,name=UI.button.image,version=0.4,type=string) relative or app: path to the image that will appear if systemButton is not used
 * @tiapi(property=True,name=UI.button.systemButton,version=0.4,type=string) one of the UI.iPhone.SystemButton constants to use a system-supplied button
 * @tiapi(property=True,name=UI.button.style,version=0.4,type=int) one of the UI.iPhone.SystemButtonStyle constants to choose a button style

 */

#endif