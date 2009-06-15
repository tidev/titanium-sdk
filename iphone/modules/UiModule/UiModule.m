/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_UI

#import "UiModule.h"


NSDictionary * barButtonSystemItemForStringDict = nil;

#define UIBarButtonSystemItemNone	-1
#define UIBarButtonSystemItemSpinner	-2

UIBarButtonSystemItem barButtonSystemItemForString(NSString * inputString){
	if (barButtonSystemItemForStringDict == nil) {
		barButtonSystemItemForStringDict = [[NSDictionary alloc] initWithObjectsAndKeys:
				[NSNumber numberWithInt:UIBarButtonSystemItemAction],@"action",
				[NSNumber numberWithInt:UIBarButtonSystemItemBookmarks],@"bookmarks",
				[NSNumber numberWithInt:UIBarButtonSystemItemCamera],@"camera",
				[NSNumber numberWithInt:UIBarButtonSystemItemCompose],@"compose",
				[NSNumber numberWithInt:UIBarButtonSystemItemDone],@"done",
				[NSNumber numberWithInt:UIBarButtonSystemItemCancel],@"cancel",
				[NSNumber numberWithInt:UIBarButtonSystemItemEdit],@"edit",
				[NSNumber numberWithInt:UIBarButtonSystemItemSave],@"save",
				[NSNumber numberWithInt:UIBarButtonSystemItemAdd],@"add",
				[NSNumber numberWithInt:UIBarButtonSystemItemFlexibleSpace],@"flexiblespace",
				[NSNumber numberWithInt:UIBarButtonSystemItemFixedSpace],@"fixedspace",
				[NSNumber numberWithInt:UIBarButtonSystemItemReply],@"reply",
				[NSNumber numberWithInt:UIBarButtonSystemItemOrganize],@"organize",
				[NSNumber numberWithInt:UIBarButtonSystemItemSearch],@"search",
				[NSNumber numberWithInt:UIBarButtonSystemItemRefresh],@"refresh",
				[NSNumber numberWithInt:UIBarButtonSystemItemStop],@"stop",
				[NSNumber numberWithInt:UIBarButtonSystemItemTrash],@"trash",
				[NSNumber numberWithInt:UIBarButtonSystemItemPlay],@"play",
				[NSNumber numberWithInt:UIBarButtonSystemItemPause],@"pause",
				[NSNumber numberWithInt:UIBarButtonSystemItemRewind],@"rewind",
				[NSNumber numberWithInt:UIBarButtonSystemItemFastForward],@"fastforward",
				[NSNumber numberWithInt:UIBarButtonSystemItemSpinner],@"activity",
				nil];
	}
	NSNumber * result = [barButtonSystemItemForStringDict objectForKey:[inputString lowercaseString]];
	if (result != nil) return [result intValue];
	return UIBarButtonSystemItemNone;
}

@interface UIButtonProxy : TitaniumProxyObject
{
//Properties that are stored until the time is right
	NSString * titleString;
	NSString * iconPath;
	
	UIBarButtonSystemItem templateValue;
	UIBarButtonItemStyle buttonStyle;
	
	CGFloat buttonWidth;
//Connections to the native side
	UIBarButtonItem * nativeButton;

}

@property(nonatomic,readwrite,retain)	NSString * titleString;
@property(nonatomic,readwrite,retain)	NSString * iconPath;
@property(nonatomic,readwrite,assign)	UIBarButtonSystemItem templateValue;
@property(nonatomic,readwrite,assign)	UIBarButtonItemStyle buttonStyle;

@property(nonatomic,readwrite,retain)	UIBarButtonItem * nativeButton;
@property(nonatomic,readwrite,assign)	CGFloat buttonWidth;

- (IBAction) onClick: (id) sender;
- (void) setPropertyDict: (NSDictionary *) newDict;

@end

@implementation UIButtonProxy
@synthesize nativeButton;
@synthesize titleString, iconPath, templateValue, buttonStyle, buttonWidth;

- (id) init;
{
	if ((self = [super init])){
		templateValue = UIBarButtonSystemItemNone;
	}
	return self;
}

- (void) setPropertyDict: (NSDictionary *) newDict;
{
	BOOL dirtyBit = NO;
	
	id newTitle = [newDict objectForKey:@"title"];
	if ([newTitle isKindOfClass:[NSString class]] && ![titleString isEqualToString:newTitle]) {
		[self setTitleString:newTitle];
		dirtyBit = YES;
	}

	id newImage = [newDict objectForKey:@"image"];
	if ([newImage isKindOfClass:[NSString class]] && ![iconPath isEqualToString:newImage]) {
		[self setIconPath:newImage];
		dirtyBit = YES;
	}

	id newStyle = [newDict objectForKey:@"style"];
	if ([newStyle respondsToSelector:@selector(intValue)]) {
		[self setButtonStyle:[newStyle intValue]];
		dirtyBit = YES;
	}

	id newWidth = [newDict objectForKey:@"width"];
	if ([newWidth respondsToSelector:@selector(floatValue)]) {
		[self setButtonWidth: [newWidth floatValue]];
		dirtyBit = YES;
	}
	
	id newTemplate = [newDict objectForKey:@"systemButton"];
	if ([newTemplate isKindOfClass:[NSString class]]) {
		[self setTemplateValue:barButtonSystemItemForString(newTemplate)];
		dirtyBit = YES;
	} else if ([newTemplate isKindOfClass:[NSNumber class]]) {
		[self setTemplateValue:[newTemplate intValue]];
		dirtyBit = YES;
	}
	
	
	
	if (dirtyBit) [self setNativeButton:nil];
}

- (void) generateNewNativeButton;
{
	UIBarButtonItem * result = nil;
	SEL onClickSel = @selector(onClick:);
	
	if (templateValue == UIBarButtonSystemItemSpinner){
		UIActivityIndicatorView * spinny = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhite];
		result = [[UIBarButtonItem alloc] initWithCustomView:spinny];
		[result setStyle:buttonStyle];
		[spinny startAnimating];
		[spinny release];

	} else if (templateValue != UIBarButtonSystemItemNone){
		result = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:templateValue target:self action:onClickSel];

	} else if (iconPath != nil) {
		UIImage * iconImage = [[TitaniumHost sharedHost] imageForResource:iconPath];
		if (iconImage != nil) {
			result = [[UIBarButtonItem alloc] initWithImage:iconImage style:buttonStyle target:self action:onClickSel];
		}
	} //Because a possibly wrong url, we break the ifelse chain.
	
	if (result == nil) { //Still failed? Use the title.
		result = [[UIBarButtonItem alloc] initWithTitle:titleString style:buttonStyle target:self action:onClickSel];
	}
	
	[result setWidth:buttonWidth];
	[nativeButton autorelease];
	nativeButton = result;
}

- (UIBarButtonItem *) nativeButton;
{
	if (nativeButton == nil) {
		[self generateNewNativeButton];
	}
	return nativeButton;
}

- (IBAction) onClick: (id) sender;
{
	NSString * handleClickCommand = [NSString stringWithFormat:@"(function(){Titanium.UI._BTN.%@.onClick({type:'click'});}).call(Titanium.UI._BTN.%@);",token,token];
	[[TitaniumHost sharedHost] sendJavascript:handleClickCommand toPageWithToken:parentPageToken];
}



- (void) dealloc
{
	[titleString release];
	[iconPath release];
	[nativeButton release];
	[super dealloc];
}


@end

@interface ModalProxy : NSObject<UIActionSheetDelegate,UIAlertViewDelegate>
{
	UIActionSheet * actionSheet;
	UIAlertView * alertView;
	UIView * parentView;
	NSString * tokenString;
	NSString * contextString;
}
@property(nonatomic,copy,readwrite)	NSString * tokenString;
@property(nonatomic,copy,readwrite)	NSString * contextString;
@property(nonatomic,retain,readwrite)	UIView * parentView;

- (void) showActionSheetWithDict: (NSDictionary *) inputDict;
- (void) showAlertViewWithDict: (NSDictionary *) inputDict;

@end

@implementation ModalProxy
@synthesize tokenString,contextString,parentView;

- (BOOL) takeToken: (NSDictionary *) inputDict;
{
	NSString * tokenStringObject = [inputDict objectForKey:@"_TOKEN"];
	if (![tokenStringObject isKindOfClass:[NSString class]])return NO;
	[self setTokenString:tokenStringObject];
	
	TitaniumHost * theTH = [TitaniumHost sharedHost];
	[self setContextString:[[theTH currentThread] magicToken]];
	[self setParentView:[[theTH titaniumViewControllerForToken:contextString] view]];
	
	return YES;
}

- (void) showActionSheetWithDict: (NSDictionary *) inputDict;
{
	if (![self takeToken:inputDict])return;

	Class NSStringClass = [NSString class];

	[actionSheet release];
	actionSheet = [[UIActionSheet alloc] init];
	[actionSheet setDelegate:self];
	
	id titleString = [inputDict objectForKey:@"title"];
	if ([titleString respondsToSelector:@selector(stringValue)])titleString = [titleString stringValue];
	if ([titleString isKindOfClass:NSStringClass]) [actionSheet setTitle:titleString];

	BOOL needsCancel = YES;
	NSArray * optionObjectArray = [inputDict objectForKey:@"options"];
	if ([optionObjectArray isKindOfClass:[NSArray class]]){
		for (id buttonTitle in optionObjectArray){
			if([buttonTitle respondsToSelector:@selector(stringValue)])buttonTitle = [buttonTitle stringValue];
			if([buttonTitle isKindOfClass:NSStringClass]){
				[actionSheet addButtonWithTitle:buttonTitle];
				needsCancel = NO;
			} else {
				//Error?
			}
		}
	}

	id destructiveObject = [inputDict objectForKey:@"destructive"];
	if ([destructiveObject respondsToSelector:@selector(intValue)]){
		[actionSheet setDestructiveButtonIndex:[destructiveObject intValue]];
	}

	if (needsCancel) {
		[actionSheet setCancelButtonIndex:[actionSheet addButtonWithTitle:@"OK"]];
	} else {
		id cancelObject = [inputDict objectForKey:@"cancel"];
		if ([cancelObject respondsToSelector:@selector(intValue)]){
			[actionSheet setCancelButtonIndex:[cancelObject intValue]];
		}
	}
	
	UIView * doomedView = [[[TitaniumAppDelegate sharedDelegate] viewController] view];
	[actionSheet performSelectorOnMainThread:@selector(showInView:) withObject:doomedView waitUntilDone:NO];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:YES];
	[self retain];
}

- (void) showAlertViewWithDict: (NSDictionary *) inputDict;
{
	if (![self takeToken:inputDict])return;

	Class NSStringClass = [NSString class];
	
	[alertView release];
	alertView = [[UIAlertView alloc] init];
	[alertView setDelegate:self];
	
	id titleString = [inputDict objectForKey:@"title"];
	if ([titleString respondsToSelector:@selector(stringValue)])titleString = [titleString stringValue];
	if ([titleString isKindOfClass:NSStringClass]) [alertView setTitle:titleString];

	id messageString = [inputDict objectForKey:@"message"];
	if ([messageString respondsToSelector:@selector(stringValue)])messageString = [messageString stringValue];
	if ([messageString isKindOfClass:NSStringClass]) [alertView setMessage:messageString];
	
	BOOL needsCancel = YES;
	NSArray * optionObjectArray = [inputDict objectForKey:@"options"];
	if ([optionObjectArray isKindOfClass:[NSArray class]]){
		for (id buttonTitle in optionObjectArray){
			if([buttonTitle respondsToSelector:@selector(stringValue)])buttonTitle = [buttonTitle stringValue];
			if([buttonTitle isKindOfClass:NSStringClass]){
				[alertView addButtonWithTitle:buttonTitle];
				needsCancel = NO;
			} else {
				//Error?
			}
		}
	}
	
	if (needsCancel) {
		[alertView setCancelButtonIndex:[alertView addButtonWithTitle:@"OK"]];
	} else {
		id cancelObject = [inputDict objectForKey:@"cancel"];
		if ([cancelObject respondsToSelector:@selector(intValue)]){
			[alertView setCancelButtonIndex:[cancelObject intValue]];
		}
	}
	
	[alertView performSelectorOnMainThread:@selector(show) withObject:nil waitUntilDone:NO];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:YES];
	[self retain];
}

- (void)actionSheet:(UIActionSheet *)anActionSheet clickedButtonAtIndex:(NSInteger)buttonIndex;
{
	NSString * result = [NSString stringWithFormat:@"Ti.UI._MODAL.%@.onClick("
			"{type:'click',index:%d,cancel:%d,destructive:%d})",tokenString,buttonIndex,
			[anActionSheet cancelButtonIndex],[anActionSheet destructiveButtonIndex]];
	
	[[TitaniumHost sharedHost] sendJavascript:result toPageWithToken:contextString];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:NO];
	[self autorelease];
}

- (void)alertView:(UIAlertView *)anAlertView clickedButtonAtIndex:(NSInteger)buttonIndex;
{
	NSString * result = [NSString stringWithFormat:@"Ti.UI._MODAL.%@.onClick("
			"{type:'click',index:%d,cancel:%d})",tokenString,buttonIndex,[anAlertView cancelButtonIndex]];

	[[TitaniumHost sharedHost] sendJavascript:result toPageWithToken:contextString];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:NO];
	[self autorelease];
}

- (void) dealloc
{
	[actionSheet release];
	[alertView release];
	[parentView release];
	[tokenString release];
	[contextString release];
	[super dealloc];
}


@end





@implementation UiModule
#pragma mark Utility methods
- (TitaniumViewController *) titaniumViewControllerForToken: (NSString *) tokenString;
{
	if (![tokenString isKindOfClass:[NSString class]]) return nil;
	TitaniumViewController * ourVC = [virtualWindowsDict objectForKey:tokenString];
	if(ourVC == nil) {
		ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	}
	return ourVC;
}

#pragma mark button

- (TitaniumJSCode *) makeButton: (id) property;
{
	//The nativeside object is mostly a shell to know the proxy context (IE, token, etc) and the 
	//The Javascript side has most of the logic, in that addEventListener and onClick stores all the functions
	//To manage. 'click' is the the event.
	
	//TODO: There's a lot of ways to improve this, especially in making this a factory.
	UIButtonProxy * newProxy = [[UIButtonProxy alloc] init];
	if ([property isKindOfClass:[NSString class]]){
		UIBarButtonSystemItem possibleSystemItem=barButtonSystemItemForString(property);
		if (possibleSystemItem == UIBarButtonSystemItemNone) {
			[newProxy setTitleString:property];
		} else {
			[newProxy setTemplateValue:possibleSystemItem];
		}
	}
	
	if ([property isKindOfClass:[NSDictionary class]]){
		[newProxy setPropertyDict:property];
	}
	
	NSString * buttonToken = [NSString stringWithFormat:@"BTN%X",nextButtonToken++];
		
	[newProxy setToken:buttonToken];
	[buttonContexts setObject:newProxy forKey:buttonToken];
	[newProxy release];
	
	NSString * result = [NSString stringWithFormat:@"Titanium.UI._BTNGEN('%@')",buttonToken];
	return [TitaniumJSCode codeWithString:result];
}

#pragma mark Window actions

- (NSString *) openWindow: (id)windowObject animated: (id) animatedObject; //Defaults to true.
{
	if (![windowObject isKindOfClass:[NSDictionary class]]){
		return nil;
	}
	NSString * token = [windowObject objectForKey:@"token"];
	if ([token isKindOfClass:[NSString class]]) return token; //So that it doesn't drop its token.
	
	token = [NSString stringWithFormat:@"VWIN%d",nextWindowToken++];
	
	TitaniumViewController * thisVC = [[TitaniumHost sharedHost] currentTitaniumViewController];
	TitaniumViewController * resultVC = [TitaniumViewController viewController];
	[resultVC readState:windowObject relativeToUrl:[thisVC currentContentURL]];
	
	[virtualWindowsDict setObject:resultVC forKey:token];
	id leftNavButton=[windowObject objectForKey:@"lNavBtn"];
	if (leftNavButton != nil){
		[self setWindow:token navSide:[NSNumber numberWithBool:YES] button:leftNavButton options:nil];
	}

	id rightNavButton=[windowObject objectForKey:@"rNavBtn"];
	if (rightNavButton != nil){
		[self setWindow:token navSide:[NSNumber numberWithBool:NO] button:rightNavButton options:nil];
	}
	
	id toolbarObject = [windowObject objectForKey:@"toolbar"];
	if (toolbarObject != nil){
		[self setWindow:token toolbar:toolbarObject options:nil];
	}
	
	BOOL animated = YES;

	if ([animatedObject isKindOfClass:[NSDictionary class]]) animatedObject = [animatedObject objectForKey:@"animated"];
	if ([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];

	SEL action = animated ? @selector(pushViewControllerAnimated:) : @selector(pushViewControllerNonAnimated:);

	[thisVC performSelectorOnMainThread:action withObject:resultVC waitUntilDone:NO];
	return token;
}

- (void) closeWindow: (NSString *) tokenString animated: (id) animatedObject; //Defaults to true.
{
	TitaniumViewController * doomedVC = [self titaniumViewControllerForToken:tokenString];
	[doomedVC setCancelOpening:YES]; //Just in case of race conditions.
	[doomedVC performSelectorOnMainThread:@selector(close:) withObject:animatedObject waitUntilDone:NO];
}

#pragma mark Window Accessors

- (void) setWindow:(NSString *)tokenString URL:(NSString *)newURLString baseURL:(NSString *)baseURLString;
{
	if (![newURLString isKindOfClass:[NSString class]]) return;
	TitaniumViewController * ourVC = [self titaniumViewControllerForToken:tokenString];

	NSURL * baseURL = nil;
	if ([newURLString isKindOfClass:[NSString class]] && ([newURLString length]>0)){
		baseURL = [NSURL URLWithString:newURLString];
	}

	NSURL * newURL;
	if (baseURL != nil) {
		newURL = [NSURL URLWithString:newURLString relativeToURL:baseURL];
	} else {
		newURL = [NSURL URLWithString:newURLString];
	}

	[ourVC performSelectorOnMainThread:@selector(currentContentURL:) withObject:newURL waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString fullscreen:(id) fullscreenObject;
{
	TitaniumViewController * ourVC = [self titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(setFullscreenObject:) withObject:fullscreenObject waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString title: (NSString *) newTitle;
{
	if (![newTitle isKindOfClass:[NSString class]]){
		if([newTitle respondsToSelector:@selector(stringValue)]) newTitle = [(id)newTitle stringValue];
		else newTitle = nil;
	}

	TitaniumViewController * ourVC = [self titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(setTitle:) withObject:newTitle waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString titleImage: (id) newTitleImagePath;
{
	if (![newTitleImagePath isKindOfClass:[NSString class]]){
		newTitleImagePath = nil;
	}

	TitaniumViewController * ourVC = [self titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(setTitleViewImagePath:) withObject:newTitleImagePath waitUntilDone:NO];	
}

- (void) setWindow:(NSString *)tokenString showNavBar: (id) animatedObject;
{
	TitaniumViewController * ourVC = [self titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(showNavBarWithAnimation:) withObject:animatedObject waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString hideNavBar: (id) animatedObject;
{
	TitaniumViewController * ourVC = [self titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(hideNavBarWithAnimation:) withObject:animatedObject waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString barColor: (NSString *) newColorName;
{
	UIColor * newColor = UIColorWebColorNamed(newColorName);
	TitaniumViewController * ourVC = [self titaniumViewControllerForToken:tokenString];
	
	[ourVC performSelectorOnMainThread:@selector(setNavBarTint:) withObject:newColor waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString navSide:(id) isLeftObject button: (NSDictionary *) buttonObject options: (NSDictionary *) optionsObject;
{	
	TitaniumViewController * ourVC = [self titaniumViewControllerForToken:tokenString];
	if ((ourVC == nil) || (![isLeftObject respondsToSelector:@selector(boolValue)])) return;
	
	UIButtonProxy * ourButton = nil;
	if ([buttonObject isKindOfClass:[NSDictionary class]]){
		NSString * buttonToken = [buttonObject objectForKey:@"_TOKEN"];
		if (![buttonToken isKindOfClass:[NSString class]]) return;
		
		UIButtonProxy * ourButton = [buttonContexts objectForKey:buttonToken];
		if (ourButton == nil) return;
		[ourButton setPropertyDict:buttonObject];
	} else if ((buttonObject != nil) && (buttonObject != (id)[NSNull null])) {
		return;
	}
	
	BOOL animated = NO;	
	if([optionsObject isKindOfClass:[NSDictionary class]]){
		id animatedObject = [optionsObject objectForKey:@"animated"];
		if ([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];
	}

	SEL actionSelector;
	if([isLeftObject boolValue]){
		actionSelector = animated ? @selector(setLeftNavButtonAnimated:)
				: @selector(setLeftNavButtonNonAnimated:);
	} else {
		actionSelector = animated ? @selector(setRightNavButtonAnimated:)
				: @selector(setRightNavButtonNonAnimated:);
	}
//TODO: Edge cases with the button being applied to a different window?
	[ourVC performSelectorOnMainThread:actionSelector withObject:[ourButton nativeButton] waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString toolbar: (id) barObject options: (id) optionsObject;
{
	//OptionsObject is ignored for now.
	//	BOOL animated=NO;
	//	if ([optionsObject isKindOfClass:[NSDictionary class]]){
	//		id animatedObject = [optionsObject objectForKey:@"animated"];
	//		if ([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];
	//	}
	TitaniumViewController * ourVC = [self titaniumViewControllerForToken:tokenString];
	if (ourVC == nil) return;
	
	if ([barObject isKindOfClass:[NSArray class]]){
		NSMutableArray *result = [NSMutableArray arrayWithCapacity:[barObject count]];
		for (NSDictionary * thisButtonDict in barObject){
			if (![thisButtonDict isKindOfClass:[NSDictionary class]]) return;
			NSString * buttonToken = [thisButtonDict objectForKey:@"_TOKEN"];
			UIButtonProxy * thisButtonProxy = [buttonContexts objectForKey:buttonToken];
			[thisButtonProxy setPropertyDict:thisButtonDict];
			UIBarButtonItem * thisButton = [thisButtonProxy nativeButton];
			if (thisButton == nil) return;
			[result addObject:thisButton];
		}
		
		[ourVC performSelectorOnMainThread:@selector(setToolbarItems:) withObject:result waitUntilDone:NO];
	} else if ((barObject == nil) || (barObject == [NSNull null])) {
		[ourVC performSelectorOnMainThread:@selector(setToolbarItems:) withObject:nil waitUntilDone:NO];
	}
}

#pragma mark Current Window actions

- (void) setTabBadge: (id) newBadge;
{
	NSString * result = nil;
	
	if ([newBadge isKindOfClass:[NSDictionary class]])newBadge=[newBadge objectForKey:@"badge"];
	
	if ([newBadge isKindOfClass:[NSString class]])result=newBadge;
	if ([newBadge respondsToSelector:@selector(stringValue)])result=[newBadge stringValue];
	
	TitaniumViewController * currentViewController = [[TitaniumHost sharedHost] currentTitaniumViewController];
	[[currentViewController tabBarItem] performSelectorOnMainThread:@selector(setBadgeValue:) withObject:result waitUntilDone:NO];
}

- (void) setStatusBarStyle: (id) newValue;
{
	TitaniumViewController * currentViewController = [[TitaniumHost sharedHost] currentTitaniumViewController];
	[currentViewController performSelectorOnMainThread:@selector(setStatusBarStyleObject:) withObject:newValue waitUntilDone:NO];
}

- (void) setbarStyle: (id) newValue;
{
	TitaniumViewController * currentViewController = [[TitaniumHost sharedHost] currentTitaniumViewController];
	[currentViewController performSelectorOnMainThread:@selector(setNavBarStyleObject:) withObject:newValue waitUntilDone:NO];
}

#pragma mark App-wide actions

- (void) setAppBadge: (id) newBadge;
{
	NSInteger newNumber = 0;
	if([newBadge respondsToSelector:@selector(intValue)]) newNumber=[newBadge intValue];

	[[UIApplication sharedApplication] setApplicationIconBadgeNumber:newNumber];
}

#pragma mark Modal things (alert and options)

- (void) showModal: (NSDictionary *) modalObject isAlert: (id) isAlertObject;
{
	if ((![isAlertObject respondsToSelector:@selector(boolValue)]) || (![modalObject isKindOfClass:[NSDictionary class]])) return;
	ModalProxy * result = [[ModalProxy alloc] init];
	if ([isAlertObject boolValue]){
		[result showAlertViewWithDict:modalObject];
	} else {
		[result showActionSheetWithDict:modalObject];
	}
	
	[result release];
}


#pragma mark startModule

- (BOOL) startModule;
{
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
	[(UiModule *)invocGen setWindow:nil title:nil];
	NSInvocation * setTitleInvoc = [invocGen invocation];

	[(UiModule *)invocGen setWindow:nil titleImage:nil];
	NSInvocation * setTitleImageInvoc = [invocGen invocation];

	[(UiModule *)invocGen openWindow:nil animated:nil];
	NSInvocation * openWinInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen closeWindow:nil animated:nil];
	NSInvocation * closeWinInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil URL:nil baseURL:nil];
	NSInvocation * changeWinUrlInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil fullscreen:nil];
	NSInvocation * changeWinFullScreenInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil barColor:nil];
	NSInvocation * changeWinNavColorInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil showNavBar:nil];
	NSInvocation * showNavBarInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil hideNavBar:nil];
	NSInvocation * hideNavBarInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil navSide:nil button:nil options:nil];
	NSInvocation * setNavButtonInvoc = [invocGen invocation];

	[(UiModule *)invocGen makeButton:nil];
	NSInvocation * makeButtonInvoc = [invocGen invocation];

	[(UiModule *)invocGen setAppBadge:nil];
	NSInvocation * appBadgeInvoc = [invocGen invocation];

	[(UiModule *)invocGen setTabBadge:nil];
	NSInvocation * tabBadgeInvoc = [invocGen invocation];

	[(UiModule *)invocGen setStatusBarStyle:nil];
	NSInvocation * statusBarStyleInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil toolbar:nil options:nil];
	NSInvocation * updateToolbarInvoc = [invocGen invocation];

	[(UiModule *)invocGen showModal:nil isAlert:nil];
	NSInvocation * showModalInvoc = [invocGen invocation];
	
	buttonContexts = [[NSMutableDictionary alloc] init];
	virtualWindowsDict = [[NSMutableDictionary alloc] init];
	
//	TitaniumAccessorTuple * addressAccessor = [[TitaniumAccessorTuple alloc] init];
//	[addressAccessor setGetterTarget:self];
//	[addressAccessor setGetterSelector:@selector(networkAddy)];

	//NOTE: createWindow doesn't actually create a native-side window. Instead, it simply sets up the dict.
	//The actual actions are performed at open time.
	//NOTE: currentWindow doesn't actually 
	
	NSString * currentWindowString = @"{"
			"toolbar:{},_EVT:{close:[],unfocused:[],focused:[]},doEvent:Ti._ONEVT,"
			"addEventListener:Ti._ADDEVT,removeEventListener:Ti._REMEVT,"
			"close:function(args){Ti.UI._CLS(Ti._TOKEN,args);},"
			"setTitle:function(args){Ti.UI._WTITLE(Ti._TOKEN,args);},"
			"setBarColor:function(args){Ti.UI._WNAVTNT(Ti._TOKEN,args);},"
			"setURL:function(newUrl){Ti.UI._WURL(Ti._TOKEN,newUrl,document.location);},"
			"setFullscreen:function(newBool){Ti.UI._WFSCN(Ti._TOKEN,newBool);},"
			"setTitle:function(args){Ti.UI._WTITLE(Ti._TOKEN,args);},"
			"showNavBar:function(args){Ti.UI._WSHNAV(Ti._TOKEN,args);},"
			"hideNavBar:function(args){Ti.UI._WHDNAV(Ti._TOKEN,args);},"
			"setTitleImage:function(args){Ti.UI._WTITLEIMG(Ti._TOKEN,args);},"
			"setLeftNavButton:function(btn,args){Ti.UI._WNAVBTN(Ti._TOKEN,true,btn,args);},"
			"setRightNavButton:function(btn,args){Ti.UI._WNAVBTN(Ti._TOKEN,false,btn,args);},"
			"setToolbar:function(bar,args){"
				"Ti.UI._WTOOL(Ti._TOKEN,bar,args);}"
			"}";

	NSString * createWindowString = @"function(args){var res={};"
			"for(property in args){res[property]=args[property];res['_'+property]=args[property];};"
			"res._TOKEN=null;"
			"res.setURL=function(newUrl){this.url=newUrl;if(this._TOKEN){Ti.UI._WURL(this._TOKEN,newUrl,document.location);};};"
			"res.setFullscreen=function(newBool){this.fullscreen=newBool;if(this._TOKEN){Ti.UI._WFSCN(this._TOKEN,newBool);};};"
			"res.setTitle=function(args){this.title=args;if(this._TOKEN){Ti.UI._WTITLE(this._TOKEN,args);};};"
			"res.showNavBar=function(args){this._hideNavBar=false;if(this._TOKEN){Ti.UI._WSHNAV(this._TOKEN,args);};};"
			"res.hideNavBar=function(args){this._hideNavBar=true;if(this._TOKEN){Ti.UI._WHDNAV(this._TOKEN,args);};};"
			"res.setTitleImage=function(args){this.titleImage=args;if(this._TOKEN){Ti.UI._WTITLEIMG(this._TOKEN,args);};};"
			"res.setBarColor=function(args){this.barColor=args;if(this._TOKEN){Ti.UI._WNAVTNT(this._TOKEN,args);};};"
			"res.setLeftNavButton=function(btn,args){this.lNavBtn=btn;if(this._TOKEN){Ti.UI._WNAVBTN(this._TOKEN,true,btn,args);};};"
			"res.setRightNavButton=function(btn,args){this.rNavBtn=btn;if(this._TOKEN){Ti.UI._WNAVBTN(this._TOKEN,false,btn,args);};};"
			"res.close=function(args){Ti.UI._CLS(this._TOKEN,args);};"
			"res.open=Ti.UI._WINOPNF;"
			"res.setToolbar=function(bar,args){"
				"this.toolbar=bar;"
				"if(this._TOKEN){"
					"Ti.UI._WTOOL(this._TOKEN,bar,args);}};"
			"return res;}";
			
	
	NSString * openWindowString = @"function(args){var res=Ti.UI._OPN(this,args);this._TOKEN=res;if(typeof(this.toolbar)=='object'){this.toolbar._TOKEN=this._TOKEN;}}";
	
	NSString * systemButtonStyleString = [NSString stringWithFormat:@"{PLAIN:%d,BORDERED:%d,DONE:%d}",
										  UIBarButtonItemStylePlain,UIBarButtonItemStyleBordered,UIBarButtonItemStyleDone];
	NSString * systemIconString = @"{BOOKMARKS:'ti:bookmarks',CONTACTS:'ti:contacts',DOWNLOADS:'ti:downloads',"
			"FAVORITES:'ti:favorites',DOWNLOADS:'ti:downloads',FEATURED:'ti:featured',MORE:'ti:more',MOST_RECENT:'ti:most_recent',"
			"MOST_VIEWED:'ti:most_viewed',RECENTS:'ti:recents',SEARCH:'ti:search',TOP_RATED:'ti:top_rated'}";
	NSString * systemButtonString = @"{ACTION:'action',ACTIVITY:'activity',CAMERA:'camera',COMPOSE:'compose',BOOKMARKS:'bookmarks',"
			"SEARCH:'search',ADD:'add',TRASH:'trash',ORGANIZE:'organize',REPLY:'reply',STOP:'stop',REFRESH:'refresh',"
			"PLAY:'play',FAST_FORWARD:'fastforward',PAUSE:'pause',REWIND:'rewind',EDIT:'edit',CANCEL:'cancel',"
			"SAVE:'save',DONE:'done',FLEXIBLE_SPACE:'flexiblespace',FIXED_SPACE:'fixedspace'}";
	NSString * statusBarString = [NSString stringWithFormat:@"{GREY:%d,DEFAULT:%d,OPAQUE_BLACK:%d,TRANSLUCENT_BLACK:%d}",
								  UIStatusBarStyleDefault,UIStatusBarStyleDefault,UIStatusBarStyleBlackOpaque,UIStatusBarStyleBlackTranslucent];
	

	NSString * createOptionDialogString = @"function(args){var res={};for(prop in args){res[prop]=args[prop];};"
			"res._TOKEN='MDL'+(Ti.UI._NEXTMODAL++);Ti.UI._MODAL[res._TOKEN]=res;res.onClick=Ti._ONEVT;"
			"res._EVT={click:[]};res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res.setOptions=function(args){this.options=args;};"
			"res.setTitle=function(args){this.title=args;};"
			"res.setDestructive=function(args){this.destructive=args;};"
			"res.setCancel=function(args){this.cancel=args;};"
			"res.show=function(){Ti.UI._MSHOW(this,false)};"
			"return res;}";
	TitaniumJSCode * createAlertCode = [TitaniumJSCode codeWithString:
			@"function(args){var res={};for(prop in args){res[prop]=args[prop];};"
			"res._TOKEN='MDL'+(Ti.UI._NEXTMODAL++);Ti.UI._MODAL[res._TOKEN]=res;res.onClick=Ti._ONEVT;"
			"res._EVT={click:[]};res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res.setButtonNames=function(args){this.options=args;};"
			"res.setTitle=function(args){this.title=args;};"
			"res.setMessage=function(args){this.message=args;};"
			"res.show=function(){Ti.UI._MSHOW(this,true)};"
			"return res;}"];
	[createAlertCode setEpilogueCode:@"window.alert=function(args){Ti.API.log('alert',args);};"];
	
	NSDictionary * uiDict = [NSDictionary dictionaryWithObjectsAndKeys:
			closeWinInvoc,@"_CLS",
			openWinInvoc,@"_OPN",
			changeWinUrlInvoc,@"_WURL",
			changeWinFullScreenInvoc,@"_WFSCN",
			showNavBarInvoc,@"_WSHNAV",
			hideNavBarInvoc,@"_WHDNAV",
			setTitleInvoc,@"_WTITLE",
			setTitleImageInvoc,@"_WTITLEIMG",
			changeWinNavColorInvoc,@"_WNAVTNT",
			setNavButtonInvoc,@"_WNAVBTN",
			updateToolbarInvoc,@"_WTOOL",
			
			buttonContexts, @"_BTN",
			[TitaniumJSCode codeWithString:iPhoneBarButtonGeneratorFunction],@"_BTNGEN",
			makeButtonInvoc,@"createButton",


			[TitaniumJSCode codeWithString:@"{}"],@"_MODAL",
			[NSNumber numberWithInt:1],@"_NEXTMODAL",
			showModalInvoc,@"_MSHOW",
			[TitaniumJSCode codeWithString:createOptionDialogString],@"createOptionDialog",
			createAlertCode,@"createAlertDialog",
			
			appBadgeInvoc,@"setAppBadge",
			tabBadgeInvoc,@"setTabBadge",					 

			[TitaniumJSCode codeWithString:currentWindowString],@"currentWindow",
			[TitaniumJSCode codeWithString:createWindowString],@"createWindow",
			[TitaniumJSCode codeWithString:openWindowString],@"_WINOPNF",
			[NSNumber numberWithInt:TitaniumViewControllerPortrait],@"PORTRAIT",
			[NSNumber numberWithInt:TitaniumViewControllerLandscape],@"LANDSCAPE",
			[NSNumber numberWithInt:TitaniumViewControllerLandscapeOrPortrait],@"PORTRAIT_AND_LANDSCAPE",


			[NSDictionary dictionaryWithObjectsAndKeys:
					statusBarStyleInvoc,@"setStatusBarStyle",
					[TitaniumJSCode codeWithString:systemButtonStyleString],@"SystemButtonStyle",
					[TitaniumJSCode codeWithString:systemButtonString],@"SystemButton",
					[TitaniumJSCode codeWithString:systemIconString],@"SystemIcon",
					[TitaniumJSCode codeWithString:statusBarString],@"StatusBar",
					nil],@"iPhone",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:uiDict forKey:@"UI"];
	
	return YES;
}

- (void) dealloc
{
	[virtualWindowsDict release];
	[buttonContexts release];
	[super dealloc];
}


@end

#endif