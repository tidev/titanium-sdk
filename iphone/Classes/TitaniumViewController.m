/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumViewController.h"
#import "TitaniumAppDelegate.h"
#import "TitaniumHost.h"
#import "Webcolor.h"
#import "TweakedNavController.h"

#import "TitaniumTableViewController.h"
#import "TitaniumWebViewController.h"
#import "UiModule.h"
#import "NativeControlProxy.h"
#import "NotificationModule.h"

NSDictionary * tabBarItemFromObjectDict = nil;

UITabBarSystemItem tabBarItemFromObject(id inputObject){
	if ([inputObject isKindOfClass:[NSString class]]){
		if (tabBarItemFromObjectDict == nil) {
			tabBarItemFromObjectDict = [[NSDictionary alloc] initWithObjectsAndKeys:
									   [NSNumber numberWithInt:UITabBarSystemItemMore],@"more",
									   [NSNumber numberWithInt:UITabBarSystemItemFavorites],@"favorites",
									   [NSNumber numberWithInt:UITabBarSystemItemFeatured],@"featured",
									   [NSNumber numberWithInt:UITabBarSystemItemTopRated],@"top rated",
									   [NSNumber numberWithInt:UITabBarSystemItemRecents],@"recents",
									   [NSNumber numberWithInt:UITabBarSystemItemContacts],@"contacts",
									   [NSNumber numberWithInt:UITabBarSystemItemHistory],@"history",
									   [NSNumber numberWithInt:UITabBarSystemItemBookmarks],@"bookmarks",
									   [NSNumber numberWithInt:UITabBarSystemItemSearch],@"search",
									   [NSNumber numberWithInt:UITabBarSystemItemDownloads],@"downloads",
									   [NSNumber numberWithInt:UITabBarSystemItemMostRecent],@"most recent",
									   [NSNumber numberWithInt:UITabBarSystemItemMostViewed],@"most viewed",
				nil];
		}
		NSNumber * result = [tabBarItemFromObjectDict objectForKey:[inputObject lowercaseString]];
		if (result != nil) return [result intValue];
	}
	if ([inputObject respondsToSelector:@selector(intValue)]) return [inputObject intValue];
	
	return 0;
}

UIStatusBarStyle statusBarStyleFromObject(id inputObject){
	if ([inputObject isKindOfClass:[NSString class]]){
		inputObject = [inputObject lowercaseString];
		if ([inputObject isEqualToString:@"grey"] || [inputObject isEqualToString:@"gray"] || [inputObject isEqualToString:@"default"]) return UIStatusBarStyleDefault;
		if ([inputObject isEqualToString:@"opaque_black"]) return UIStatusBarStyleBlackOpaque;
		if ([inputObject isEqualToString:@"translucent_black"]) return UIStatusBarStyleBlackTranslucent;
	}
	if ([inputObject respondsToSelector:@selector(intValue)]) return [inputObject intValue];

	return 0;
}

TitaniumViewControllerOrientationsAllowed orientationsFromObject(id inputObject){

	if ([inputObject isKindOfClass:[NSString class]]){
		inputObject = [inputObject lowercaseString];
		if ([inputObject isEqualToString:@"portrait"]) return TitaniumViewControllerPortrait;
		if ([inputObject isEqualToString:@"landscape"]) return TitaniumViewControllerLandscape;
		if ([inputObject isEqualToString:@"either"]) return TitaniumViewControllerLandscapeOrPortrait;
	}
	if ([inputObject respondsToSelector:@selector(intValue)]) return [inputObject intValue];
	
	return TitaniumViewControllerDefaultOrientation;
}

int nextWindowToken = 0;

@implementation TitaniumViewController
@synthesize primaryToken, contentView, nameString;
@synthesize navBarTint, titleViewImagePath, cancelOpening;
@synthesize backgroundColor, backgroundImage;
@synthesize hidesNavBar, fullscreen, statusBarStyle, toolbarItems;
@synthesize selectedContentIndex, contentViewControllers;
@synthesize animationOptionsDict;

#pragma mark Class Methods

+ (TitaniumViewController *) viewControllerForState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	TitaniumViewController * result=[[self alloc] init];
		//[[self alloc] initWithNibName:@"TitaniumView" bundle:nil];
	NSString * token = [[NSString alloc] initWithFormat:@"WIN%d",nextWindowToken++];
	[result setPrimaryToken:token];
	[[TitaniumHost sharedHost] registerViewController:result forKey:token];
	[result readState:inputState relativeToUrl:baseUrl];
	[token release];

	return [result autorelease];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning]; // Releases the view if it doesn't have a superview
    // Release anything that's not essential, such as cached data
	if(focusedContentController == nil){
		[contentView release];
		contentView = nil;
		[toolBar removeFromSuperview];
		[toolBar release];
		toolBar = nil;
	}
	
	[contentViewLock lock];	
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		if(thisVC != focusedContentController){
			[thisVC didReceiveMemoryWarning];
		}
	}
	
	[contentViewLock unlock];
}

#pragma mark Init and Dealloc

- (id) init
{
	self = [super init];
	if (self != nil) {
		contentViewLock = [[NSRecursiveLock alloc] init];
	}
	return self;
}

- (void)release;
{
	[TitaniumHostWindowLock lock];
	if([self retainCount]<2){
		[[TitaniumHost sharedHost] unregisterViewControllerForKey:primaryToken];
	}
	[super release];
	[TitaniumHostWindowLock unlock];
}


- (void)dealloc {
	[primaryToken release];
	[nameString release];
	[contentViewLock release];
	[contentViewControllers release];
	[navBarTint release];
	
    [super dealloc];
}

#pragma mark Reading state

#define HANDLESTRING(key,command,nullCommand)	\
	object=[inputState objectForKey:key];	\
	if(object == nullObject){nullCommand;}		\
	else if([object isKindOfClass:stringClass]){command;}


- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	if (![inputState isKindOfClass:[NSDictionary class]])return;
	
	TitaniumHost * theTiHost = [TitaniumHost sharedHost];
	Class stringClass = [NSString class]; //Because this might be from the web where you could have nsnulls and nsnumbers,
	NSNull * nullObject = [NSNull null];
	id object;
	//We can't assume that the inputState is 

	HANDLESTRING(@"title",[self setTitle:object],[self setTitle:nil]);
	HANDLESTRING(@"titleImage",[self setTitleViewImagePath:object],[self setTitleViewImagePath:nil]);
	HANDLESTRING(@"id",[self setNameString:object],[self setNameString:nil]);
	HANDLESTRING(@"name",[self setNameString:object],[self setNameString:nil]);

	id newTitleProxy = [inputState objectForKey:@"titleControl"];
	if (newTitleProxy != nil) {
		UiModule * theUiModule = (UiModule *)[[TitaniumHost sharedHost] moduleNamed:@"UiModule"];
		NativeControlProxy * thisInputProxy = [theUiModule proxyForObject:newTitleProxy scan:YES recurse:YES];
		[self setTitleViewProxy:thisInputProxy];
	}
	
	UIBarButtonItem * backButton = nil;
	UIImage * backTitleImage = [theTiHost imageForResource:[inputState objectForKey:@"backButtonTitleImage"]];
	if (backTitleImage != nil){
		backButton = [[[UIBarButtonItem alloc] initWithImage:backTitleImage style:UIBarButtonItemStyleBordered target:nil action:nil] autorelease];
	} else {
		id backTitleString = [inputState objectForKey:@"backButtonTitle"];
		if ([backTitleString isKindOfClass:stringClass]) backButton = [[[UIBarButtonItem alloc] initWithTitle:backTitleString style:UIBarButtonItemStyleBordered target:nil action:nil] autorelease];
		else if ([backTitleString respondsToSelector:@selector(stringValue)]) backButton = [[[UIBarButtonItem alloc] initWithTitle:[backTitleString stringValue] style:UIBarButtonItemStyleBordered target:nil action:nil] autorelease];
	}
	
	
	[[self navigationItem] setBackBarButtonItem:backButton];
	
	UITabBarItem * newTabBarItem = nil;
	NSString * tabIconName = [inputState objectForKey:@"icon"];
	if (tabIconName != nil) {
		// comes in as ti://<name> or ti:<name> or path or app://path
		if ([tabIconName hasPrefix:@"ti:"])
		{
			// this is a built-in system image
			NSString *tabTemplate = [tabIconName substringFromIndex:3];
			if ([tabTemplate characterAtIndex:0]=='/') tabTemplate = [tabTemplate substringFromIndex:1];
			if ([tabTemplate characterAtIndex:0]=='/') tabTemplate = [tabTemplate substringFromIndex:1];
			newTabBarItem = [[UITabBarItem alloc] initWithTabBarSystemItem:tabBarItemFromObject(tabTemplate) tag:0];
		}
		else
		{
			UIImage * tabImage = [theTiHost imageForResource:tabIconName];
			if (tabImage != nil) {
				newTabBarItem = [[UITabBarItem alloc] initWithTitle:[self title] image:tabImage tag:0];
			}
		}
	}
	
	NSString * navTintName = [inputState objectForKey:@"barColor"];
	[self setNavBarTint:UIColorWebColorNamed(navTintName)];
	
	NSString * backgroundColorName = [inputState objectForKey:@"backgroundColor"];
	if ([backgroundColorName isKindOfClass:stringClass]){
		[self setBackgroundColor:UIColorWebColorNamed(backgroundColorName)];
	}
	
	NSString * backgroundImageName = [inputState objectForKey:@"backgroundImage"];
	if ([backgroundImageName isKindOfClass:stringClass]){
		[self setBackgroundImage:[theTiHost imageForResource:backgroundImageName]];
	}

	
	id orientationObject = [inputState objectForKey:@"orientation"];
	if (orientationObject != nil) {
		allowedOrientations = orientationsFromObject(orientationObject);
	}
	
	id hidesNavBarObject = [inputState objectForKey:@"hideNavBar"];
	if (hidesNavBarObject == nil) hidesNavBarObject = [inputState objectForKey:@"_hideNavBar"];
	if ([hidesNavBarObject respondsToSelector:@selector(boolValue)]) {
		[self setHidesNavBar:[hidesNavBarObject boolValue]];
	}
	
	id hidesTabBarObject = [inputState objectForKey:@"hideTabBar"];
	if (hidesTabBarObject == nil) hidesTabBarObject = [inputState objectForKey:@"_hideTabBar"];
	if ([hidesTabBarObject respondsToSelector:@selector(boolValue)]) {
		[self setHidesBottomBarWhenPushed:[hidesTabBarObject boolValue]];
	}
	
	id fullScreenObject = [inputState objectForKey:@"fullscreen"];
	if ([fullScreenObject respondsToSelector:@selector(boolValue)]) {
		[self setFullscreen:[fullScreenObject boolValue]];
	}

	id hidesBackObject = [inputState objectForKey:@"isPrimary"];
	if ([hidesBackObject respondsToSelector:@selector(boolValue)]) {
		[[self navigationItem] setHidesBackButton:[hidesBackObject boolValue]];
	}
	
	[self setStatusBarStyleObject:[inputState objectForKey:@"statusBarStyle"]];
	
	
	if (newTabBarItem != nil) {
		[self setTabBarItem:newTabBarItem];
		[newTabBarItem release];
	}
	
	if(contentViewControllers == nil){
		NSArray * viewsArrayObject = [inputState objectForKey:@"views"];
		NSString * callingToken = [[[TitaniumHost sharedHost] currentThread] magicToken];
		if([viewsArrayObject isKindOfClass:[NSArray class]]){
			contentViewControllers = [[NSMutableArray alloc] initWithCapacity:[viewsArrayObject count]];

			for(NSDictionary * thisViewObject in viewsArrayObject){
				TitaniumContentViewController * ourNewVC = [TitaniumContentViewController viewControllerForState:thisViewObject relativeToUrl:baseUrl];
				if(ourNewVC != nil){
					[ourNewVC setTitaniumWindowToken:primaryToken];
					[ourNewVC addListeningWebContextToken:callingToken];
					[contentViewControllers addObject:ourNewVC];
				}
			}
		} else {
			NSMutableDictionary * reducedInputState = [inputState mutableCopy];
			[reducedInputState removeObjectForKey:@"_TOKEN"];
			TitaniumContentViewController * ourNewVC = [TitaniumContentViewController viewControllerForState:reducedInputState relativeToUrl:baseUrl];
			[ourNewVC setTitaniumWindowToken:primaryToken];
			[ourNewVC addListeningWebContextToken:callingToken];
			if(ourNewVC != nil) contentViewControllers = [[NSMutableArray alloc] initWithObjects:ourNewVC,nil];
			[reducedInputState release];
		}
	}
	
	
}

#pragma mark Set Accessors

//- (void)setView: (UIView *) newView;
//{
//	[super setView:newView];
//	if(newView == nil){
//		
//	}
//}


- (void)setTitleViewProxy: (NativeControlProxy *) newProxy;
{
	[newProxy retain];
	[titleViewProxy release];
	titleViewProxy = newProxy;
	
	[self refreshTitleView];
}

- (void)setTitleViewImagePath: (NSString *) newPath;
{
	if ([titleViewImagePath isEqualToString:newPath]) return;
	[newPath retain];
	[titleViewImagePath autorelease];
	titleViewImagePath = newPath;
	
	[self refreshTitleView];
}

- (void)setNavBarTint: (UIColor *) newColor;
{
	if(newColor==nil){
		[navBarTint release];
		navBarTint = nil;
		navBarStyle = UIBarStyleDefault;
	} else if ([newColor isEqual:[UIColor clearColor]]){
		[navBarTint release];
		navBarTint = nil;
		navBarStyle = UIBarStyleBlackTranslucent;
//	} else if ([newColor isEqual:[UIColor blackColor]]){
//		[navBarTint release];
//		navBarTint = nil;
//		navBarStyle = UIBarStyleBlackOpaque;
	} else {
		[newColor retain];
		[navBarTint release];
		navBarTint = newColor;
	} //Hideous hack: swap between the styles in hopes to elude the colored back bug.

	UINavigationController * theNC = [self navigationController];
	if([theNC topViewController] == self)[self needsUpdate:TitaniumViewControllerRefreshIsAnimated];
}

- (void)setBackgroundColor: (UIColor *) newColor;
{
	if(newColor == backgroundColor) return;
	[backgroundColor release]; backgroundColor = newColor; [newColor retain];
	[self refreshBackground];
}

- (void)setBackgroundImage: (UIImage *) newImage;
{
	if(newImage == backgroundImage)
	[newImage retain];[backgroundImage release];backgroundImage=newImage;
	
	[self refreshBackground];
}

- (void) setStatusBarStyle: (UIStatusBarStyle) newStyle;
{
	statusBarStyle = newStyle;
	[self needsUpdate:TitaniumViewControllerRefreshIsAnimated];
//	if ([[TitaniumHost sharedHost] currentTitaniumViewController] == self){
//
//		[[UIApplication sharedApplication] setStatusBarStyle:statusBarStyle animated:YES];
//	}
}

- (void) setFullscreen: (BOOL) newSetting;
{
	if (newSetting == fullscreen) return;
	fullscreen = newSetting;
	//	if (fullscreen) [self setHidesBottomBarWhenPushed:YES];
	[self needsUpdate:TitaniumViewControllerRefreshIsAnimated];
}

- (void) setToolbarProxies: (NSArray *) newProxies;
{
	[self setToolbarItems:[newProxies valueForKey:@"nativeBarButton"]];
}

- (void) setToolbarItems: (NSArray *) newItems;
{
	if (newItems == toolbarItems) return;
	[newItems retain];
	[toolbarItems release];
	toolbarItems = newItems;
	[self needsUpdate:TitaniumViewControllerRefreshIsAnimated];
}

#pragma mark Get Accessors

- (BOOL) hidesBottomBarWhenPushed;
{
	if (fullscreen) return YES;
	return [super hidesBottomBarWhenPushed];
}

- (TitaniumContentViewController *) viewControllerForIndex: (int)index;
{
	TitaniumContentViewController * result;
	[contentViewLock lock];
	if((index < 0) || (index >= [contentViewControllers count]))result = nil;
	else result = [contentViewControllers objectAtIndex:index];
	
	[contentViewLock unlock];
	return result;
}


#pragma mark Token shuffles
- (BOOL) hasToken: (NSString *) tokenString;
{
	for (TitaniumContentViewController * thisVC in contentViewControllers){
		if ([thisVC hasToken:tokenString]) return YES;
	}
	return ([primaryToken isEqualToString:tokenString]);
}


#pragma mark UIViewController methods

-(void) _clearBecomeFirstResponderWhenCapable;
{
	if ([super respondsToSelector:@selector(_clearBecomeFirstResponderWhenCapable)]){
		[(id)super _clearBecomeFirstResponderWhenCapable];
	} else {
		NSLog(@"This is because 2.2.1 fails if we give a viewController -[becomeFirstResponder]");
	}
}

- (BOOL)canBecomeFirstResponder {
	return YES;
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void) loadView;
{
	UIView * ourRootView = [[UIView alloc] init];
	[ourRootView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
	[self setView:ourRootView];
	[ourRootView release];
}


- (void)viewWillAppear: (BOOL) animated;
{
    [super viewWillAppear:animated];
	isVisible = YES;
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		if([thisVC respondsToSelector:@selector(setWindowFocused:)]){
			[thisVC setWindowFocused:YES];
		}
	}
	
	[self refreshTitleView];
	[self refreshBackground];
	if (animated) dirtyFlags |= TitaniumViewControllerRefreshIsAnimated;
	[self updateLayout:dirtyFlags]; //This is what will notify the focused contentController.
}

- (void)viewDidAppear:(BOOL)animated;
{
	[super viewDidAppear:animated];
	if(![[[UIDevice currentDevice] systemVersion] hasPrefix:@"2."]) [self becomeFirstResponder];

	UINavigationController * theNC = [self navigationController];
	[[TitaniumHost sharedHost] navigationController:theNC didShowViewController:self animated:animated];

}

- (void)viewWillDisappear: (BOOL) animated;
{
	[super viewWillDisappear:animated];
	if(![[[UIDevice currentDevice] systemVersion] hasPrefix:@"2."]) [self resignFirstResponder];
	if(hidesNavBar && ![[[self navigationController] visibleViewController] isKindOfClass:[TitaniumViewController class]]){
		[[self navigationController] setNavigationBarHidden:NO animated:animated];
	}
}

- (void)viewDidDisappear: (BOOL) animated;
{
	[super viewDidDisappear:animated];
	if([focusedContentController respondsToSelector:@selector(setFocused:)]){
		[focusedContentController setFocused:NO];
	}
	[focusedContentController autorelease];
	focusedContentController = nil;
	
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		if([thisVC respondsToSelector:@selector(setWindowFocused:)]){
			[thisVC setWindowFocused:NO];
		}
	}
	isVisible = NO;
}

#ifndef __IPHONE_3_0
typedef int UIEventSubtype;
const UIEventSubtype UIEventSubtypeMotionShake=1;
#endif

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
	TitaniumContentViewController * ourVC = [self viewControllerForIndex:selectedContentIndex];
	if([ourVC respondsToSelector:@selector(motionEnded:withEvent:)]){
		[(id)ourVC motionEnded:motion withEvent:event];
	}
}

- (BOOL)needsUpdate: (TitaniumViewControllerDirtyFlags) newFlags;
{
	if ((dirtyFlags == TitaniumViewControllerIsClean) && isVisible){
		[self performSelector:@selector(doUpdateLayout) withObject:nil afterDelay:0];
	}
	dirtyFlags |= TitaniumViewControllerNeedsRefresh | newFlags;
	//FIXME: blain, what should this return?
	return TRUE;
}

- (void)doUpdateLayout;
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	if (dirtyFlags && isVisible){
		[self updateLayout:dirtyFlags & TitaniumViewControllerRefreshIsAnimated];
	}
	[pool release];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
	
	TitaniumViewControllerOrientationsAllowed newOrientation = (1 << interfaceOrientation);
	
	BOOL result = (allowedOrientations & newOrientation);
	
	if (allowedOrientations == TitaniumViewControllerDefaultOrientation){
		result = (interfaceOrientation == UIInterfaceOrientationPortrait);
	}

	if (result){
		currentOrientation = newOrientation;
	}
		
	return result;
}

- (void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration;
{
	TitaniumContentViewController * ourVC = [self viewControllerForIndex:selectedContentIndex];
	if ([ourVC respondsToSelector:@selector(setInterfaceOrientation:duration:)]){
		[(TitaniumContentViewController<TitaniumWindowDelegate> *)ourVC setInterfaceOrientation:currentOrientation duration:duration];
	}
}

- (void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation;
{
	TitaniumContentViewController * ourVC = [self viewControllerForIndex:selectedContentIndex];
	[ourVC updateLayout:YES];
}

#pragma mark Refreshments

- (void)refreshTitleView;
{
	UIImageView * newTitleView = nil;
	
	if (titleViewProxy != nil) newTitleView = [[titleViewProxy nativeBarView] retain];
	else {
		UIImage * newTitleViewImage = [[TitaniumHost sharedHost] imageForResource:titleViewImagePath];
		if (newTitleViewImage != nil) newTitleView = [[UIImageView alloc] initWithImage:newTitleViewImage];
	}
	
	[[self navigationItem] setTitleView:newTitleView];
	[newTitleView release];
}

- (void)refreshBackground;
{
	if(!isVisible)return;
	UIView * ourRootView = [self view];
	
	[ourRootView setBackgroundColor:(backgroundColor != nil)?backgroundColor:[UIColor whiteColor]];
	
	if(backgroundImage != nil){
		if(backgroundView==nil){
			backgroundView = [[UIImageView alloc] initWithImage:backgroundImage];
			[backgroundView setFrame:[ourRootView bounds]];
			[backgroundView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
			[backgroundView setContentMode:UIViewContentModeCenter];
			[ourRootView insertSubview:backgroundView atIndex:0];
		} else {
			[backgroundView setImage:backgroundImage];
			
			if([backgroundView superview]==nil){
				[backgroundView setFrame:[ourRootView bounds]];
				[ourRootView insertSubview:backgroundView atIndex:0];
			}
		}
	} else {
		[backgroundView removeFromSuperview];
		[backgroundView setImage:nil];
	}
	
}

- (void)updateLayout: (BOOL)animated;
{
	if(!isVisible)return;

	UIApplication * theApp = [UIApplication sharedApplication];
	UINavigationController * theNC = [self navigationController];

	[theApp setStatusBarStyle:statusBarStyle animated:animated];
	[theApp setStatusBarHidden:fullscreen animated:animated];
	[theNC setNavigationBarHidden:(hidesNavBar || fullscreen) animated:animated];
	
	UINavigationBar * theNB = [theNC navigationBar];
	
//	NSLog(@"View %@ is updating tint to %@. Foreground View is: %@",self,navBarTint,[[TitaniumHost sharedHost] currentTitaniumViewController]);
	[theNB setTintColor:navBarTint];
	if (navBarTint != nil){
		navBarStyle = ([[[self navigationController] navigationBar] barStyle]==UIBarStyleBlackOpaque) ?
			UIBarStyleDefault : UIBarStyleBlackOpaque;
	}
	
	[theNB setBarStyle:navBarStyle];
	[theNB setOpaque:(navBarStyle != UIBarStyleBlackTranslucent)];

	BOOL shouldShowToolBar = [toolbarItems count] > 0;
	BOOL isShowingToolBar = (toolBar != nil) && (![toolBar isHidden]);
	
	UIView * ourView = [self view];
	CGRect contentViewBounds = [ourView bounds];

	CGFloat contentViewHeight = contentViewBounds.size.height;

	if (shouldShowToolBar){ //Update the list, and show it if needed.
		CGRect toolBarFrame;
		if (toolBar == nil){
			toolBar = [[UIToolbar alloc] init];
			[toolBar setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin];
			toolBarFrame.size.width = contentViewBounds.size.width;
			toolBarFrame.origin.x = contentViewBounds.origin.x;
			toolBarFrame.size.height = 44;
			toolBarFrame.origin.y = contentViewBounds.size.height - toolBarFrame.size.height;
			[toolBar setFrame:toolBarFrame];
			[toolBar setHidden:YES];
			[ourView addSubview:toolBar];
		} else {
			if([toolBar superview]!=ourView){
				[ourView addSubview:toolBar];
				
			}
			toolBarFrame = [toolBar frame];
		}
		
		contentViewHeight -= toolBarFrame.size.height;
		
		if(navBarStyle != UIBarStyleBlackTranslucent){
			contentViewBounds.size.height = contentViewHeight;
		}
		
		[toolBar setTintColor:[theNB tintColor]];
		[toolBar setBarStyle:navBarStyle];
		[toolBar setHidden:NO];
		
		[toolBar setItems:toolbarItems animated:animated];
	} else if (isShowingToolBar){ //Hide the toolbar.
		[toolBar setHidden:YES];
	}

	
	if([notificationsArray count]>0){
		CGRect notificationBounds=contentViewBounds;
		notificationBounds.size.height = contentViewHeight;
		for(NotificationProxy * thisNotification in notificationsArray){
			notificationBounds.size.height -= [thisNotification placeInView:ourView inRect:notificationBounds];
		}
	}
	
	CGFloat floatingUITop = [[TitaniumHost sharedHost] keyboardTop];
	if(floatingUITop > 1.0){ //Toolbar style or not, the keyboard trumps all!
		CGPoint bottomPoint = [ourView convertPoint:CGPointMake(0,floatingUITop) fromView:[[[TitaniumAppDelegate sharedDelegate] viewController] view]];
		contentViewBounds.size.height = MIN(contentViewBounds.size.height,(bottomPoint.y - contentViewBounds.origin.y));
	}
	
	TitaniumContentViewController * newContentViewController = [self viewControllerForIndex:selectedContentIndex];
	if([newContentViewController respondsToSelector:@selector(willUpdateLayout:)])[newContentViewController willUpdateLayout:animated];
	[newContentViewController setPreferredViewSize:contentViewBounds.size];
	UIView * newContentView = [newContentViewController view];

	if(contentView == nil){
		contentView = [[UIView alloc] initWithFrame:contentViewBounds];
		[contentView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[ourView insertSubview:contentView atIndex:(backgroundImage!=nil)?1:0];
	} else {
		[contentView setFrame:contentViewBounds];
		if([contentView superview] != ourView){
			[ourView insertSubview:contentView atIndex:(backgroundImage!=nil)?1:0];
		}
	}
	
	if (TitaniumPrepareAnimationsForView(animationOptionsDict,contentView)){
		animated = YES;
	} else if(animated){
		[UIView beginAnimations:@"Toolbar" context:nil];
	}
	
	if(newContentViewController!=focusedContentController){
		if([focusedContentController respondsToSelector:@selector(setFocused:)]){
			[focusedContentController setFocused:NO];
		}
		[focusedContentController autorelease];
		focusedContentController=[newContentViewController retain];
		if([focusedContentController respondsToSelector:@selector(setFocused:)]){
			[focusedContentController setFocused:YES];
		}
	}
	
	if(newContentViewController != nil) {
		if ([newContentView superview] != contentView){
			for(UIView * thisView in [contentView subviews]){
				[thisView removeFromSuperview];
			}
			[newContentView setFrame:[contentView bounds]];
			[contentView addSubview:newContentView];
		} else {
			[newContentView setFrame:[contentView bounds]];
		}
		if ([newContentViewController respondsToSelector:@selector(setInterfaceOrientation:duration:)]){
			[(TitaniumContentViewController<TitaniumWindowDelegate> *)newContentViewController setInterfaceOrientation:currentOrientation duration:0];
		}
		[newContentViewController updateLayout:animated];
	}
	
	if (animated) {
		[UIView commitAnimations];
	}
	dirtyFlags = TitaniumViewControllerIsClean;
	[self setAnimationOptionsDict:nil];
}

#pragma mark Methods called by the UIModule
- (void) setStatusBarStyleObject: (id) object;
{
	if (object != nil) {
		[self setStatusBarStyle:statusBarStyleFromObject(object)];
	}
}

- (void) setFullscreenObject: (id) object;
{
	if (![object respondsToSelector:@selector(boolValue)]) return;
	[self setFullscreen:[object boolValue]];
}

#pragma mark Setting Nav buttons

- (void) setLeftNavButtonAnimated: (UIBarButtonItem *)newButton;
{
	[[self navigationItem] setLeftBarButtonItem:newButton animated:YES];
}

- (void) setLeftNavButtonNonAnimated: (UIBarButtonItem *)newButton;
{
	[[self navigationItem] setLeftBarButtonItem:newButton animated:NO];
}

- (void) setRightNavButtonNonAnimated: (UIBarButtonItem *)newButton;
{
	[[self navigationItem] setRightBarButtonItem:newButton animated:NO];
}

- (void) setRightNavButtonAnimated: (UIBarButtonItem *)newButton;
{
	[[self navigationItem] setRightBarButtonItem:newButton animated:YES];
}

#pragma mark Showing and hiding the nav bar

- (void) hideNavBarWithAnimation: (id) animatedObject;
{
	hidesNavBar = YES;
	BOOL animated = NO;
	if ([animatedObject isKindOfClass:[NSDictionary class]]) animatedObject = [animatedObject objectForKey:@"animated"];
	if([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];
	UINavigationController * theNC = [self navigationController];
	if ([theNC topViewController] == self) [theNC setNavigationBarHidden:YES animated:animated];
}

- (void) showNavBarWithAnimation: (id) animatedObject;
{
	hidesNavBar = NO;
	BOOL animated = NO;
	if ([animatedObject isKindOfClass:[NSDictionary class]]) animatedObject = [animatedObject objectForKey:@"animated"];
	if([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];
	UINavigationController * theNC = [self navigationController];
	if ([theNC topViewController] == self) [theNC setNavigationBarHidden:NO animated:animated];
}

#pragma mark Pushing and popping views

- (void) pushViewController: (TitaniumViewController *) newVC modal:(BOOL)isModal animated: (BOOL) isAnimated;
{
	if([newVC cancelOpening]) return;
	if ([newVC backgroundColor]==nil)[newVC setBackgroundColor:backgroundColor];
	if ([newVC backgroundImage]==nil)[newVC setBackgroundImage:backgroundImage];
	
	UINavigationController * ourNavCon = [self navigationController];
	UIViewController * modalController = [ourNavCon visibleViewController];
	
	while ([modalController isKindOfClass:[UINavigationController class]]){
		ourNavCon = (UINavigationController *)modalController;
		modalController = [ourNavCon visibleViewController];
	}
	
	if(isModal){
		UINavigationController * newNavVC = [[TweakedNavController alloc] initWithRootViewController:newVC];	
		[ourNavCon presentModalViewController:newNavVC animated:isAnimated];
		[newNavVC release];
	} else {
		[ourNavCon pushViewController:newVC animated:isAnimated];
	}
}

- (void) presentViewControllerAnimated: (TitaniumViewController *) newVC;
{
	[self pushViewController:newVC modal:YES animated:YES];
}

- (void) presentViewControllerNonAnimated: (TitaniumViewController *) newVC;
{
	[self pushViewController:newVC modal:YES animated:NO];
}

- (void) pushViewControllerAnimated: (TitaniumViewController *) newVC;
{
	[self pushViewController:newVC modal:NO animated:YES];
}

- (void) pushViewControllerNonAnimated: (TitaniumViewController *) newVC;
{
	[self pushViewController:newVC modal:NO animated:NO];
}

- (void) close: (id) animatedObject;
{
	BOOL animated = YES;
	if ([animatedObject isKindOfClass:[NSDictionary class]]) animatedObject = [animatedObject objectForKey:@"animated"];
	if ([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];
	
	UINavigationController * theNC = [self navigationController];
	NSArray * theVCArray = [theNC viewControllers];
	NSInteger thisIndex = [theVCArray indexOfObject:self];

	if(thisIndex == 0){
		UIViewController * parentNC = [theNC parentViewController];
		if(theNC==[parentNC modalViewController]){ //TODO: what if we want to have a modal navcontroller? much later.
			[parentNC dismissModalViewControllerAnimated:animated];
			return;
		}			
	}
		
	if(self==[theNC topViewController]){
		[theNC popViewControllerAnimated:animated];
		return;
	}

	if ((thisIndex > 0) && (thisIndex != NSNotFound)) { //TODO: if the index is 0, we're root. We can't close, can we?
		UIViewController * parentVC = [theVCArray objectAtIndex:thisIndex-1];
		[theNC popToViewController:parentVC animated:animated];
	}

	//TODO: if thisIndex is 0, and we've got tabs, remove the tab? That doesn't sound like a good idea.
}

- (void) updateContentViewArray: (NSArray *) messagePacket;
{
	[contentViewLock lock];
	NSArray * viewsProxyArray = [messagePacket objectAtIndex:0];
	BOOL replaceViews = [[messagePacket objectAtIndex:1] boolValue];
	if(replaceViews){
		[contentViewControllers autorelease];
		contentViewControllers = [[NSMutableArray alloc] initWithCapacity:[viewsProxyArray count]];
	}
	
	Class dictClass = [NSDictionary class];
	
	NSURL * baseUrl = [messagePacket objectAtIndex:2];

	NSString * callingToken = [[[TitaniumHost sharedHost] currentThread] magicToken];
	
	for(NSDictionary * thisProxyObject in viewsProxyArray){
		if (![thisProxyObject isKindOfClass:dictClass]) continue;
		
		TitaniumContentViewController * thisVC = [TitaniumContentViewController viewControllerForState:thisProxyObject relativeToUrl:baseUrl];
		[thisVC setTitaniumWindowToken:primaryToken];
		[thisVC addListeningWebContextToken:callingToken];
		if(thisVC != nil) [contentViewControllers addObject:thisVC];
	}
	
	[self setAnimationOptionsDict:[messagePacket objectAtIndex:3]];
	[self performSelectorOnMainThread:@selector(needsUpdate:) withObject:nil waitUntilDone:NO];
	[contentViewLock unlock];
}

- (void) updateSelectedContentView: (NSArray *) messagePacket;
{
	[contentViewLock lock];
	NSNumber * newSelectedIndex = [messagePacket objectAtIndex:0];
	selectedContentIndex = [newSelectedIndex intValue];
	[self setAnimationOptionsDict:[messagePacket objectAtIndex:1]];
	[self performSelectorOnMainThread:@selector(needsUpdate:) withObject:nil waitUntilDone:NO];
	[contentViewLock unlock];
}

- (void) needsUpdateAnimated;
{
	[self needsUpdate:TitaniumViewControllerRefreshIsAnimated];
}

- (NSDictionary *) propertiesDict;
{
	NSDictionary * result = [NSDictionary dictionaryWithObjectsAndKeys:primaryToken,@"_TOKEN",nil]; //TODO: Add more properties
	return result;
}

- (NSDictionary *) tabPropertiesDict;
{
	NSDictionary * result = [NSDictionary dictionaryWithObjectsAndKeys:primaryToken,@"_TOKEN",nil]; //TODO: Add more properties
	return result;
}

- (void) addNotification:(NotificationProxy *)notification;
{
	if(notificationsArray==nil){
		notificationsArray = [[NSMutableArray alloc] initWithObjects:notification,nil];
	} else {
		[notificationsArray insertObject:notification atIndex:0];
	}
	[self performSelectorOnMainThread:@selector(needsUpdate:) withObject:nil waitUntilDone:NO];
}

- (void) removeNotification:(NotificationProxy *)notification;
{
	[notificationsArray removeObject:notification];
	[self performSelectorOnMainThread:@selector(needsUpdate:) withObject:nil waitUntilDone:NO];
}	


@end
