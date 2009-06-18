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

#import "TitaniumTableViewController.h"
#import "TitaniumWebViewController.h"

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
		if ([inputObject isEqualToString:@"grey"]) return UIStatusBarStyleDefault;
		if ([inputObject isEqualToString:@"default"]) return UIStatusBarStyleDefault;
		if ([inputObject isEqualToString:@"opaque_black"]) return UIStatusBarStyleBlackOpaque;
		if ([inputObject isEqualToString:@"translucent_black"]) return UIStatusBarStyleBlackTranslucent;
	}
	if ([inputObject respondsToSelector:@selector(intValue)]) return [inputObject intValue];

	return 0;
}

TitaniumViewControllerOrientationsAllowed orientationsFromObject(id inputObject){

//	NSLog(@"Portrait: %x, upsidedown: %x, llLeft: %x, llRight: %x, LL: %x, LPort: %x,",
//	TitaniumViewControllerPortrait,TitaniumViewControllerPortraitUpsideDown,TitaniumViewControllerLandscapeLeft,
//	TitaniumViewControllerLandscapeRight,TitaniumViewControllerLandscape,TitaniumViewControllerLandscapeOrPortrait
//	
//	);
	


	if ([inputObject isKindOfClass:[NSString class]]){
		inputObject = [inputObject lowercaseString];
		if ([inputObject isEqualToString:@"portrait"]) return TitaniumViewControllerPortrait;
		if ([inputObject isEqualToString:@"landscape"]) return TitaniumViewControllerLandscape;
		if ([inputObject isEqualToString:@"either"]) return TitaniumViewControllerLandscapeOrPortrait;
	}
	if ([inputObject respondsToSelector:@selector(intValue)]) return [inputObject intValue];
	
	return TitaniumViewControllerDefaultOrientation;
}


NSString * const ControllerString = @"Controller";

TitaniumViewController * mostRecentController = nil;

@implementation TitaniumViewController
@synthesize currentContentURL, viewProperties;
@synthesize webView;
@synthesize navBarTint, titleViewImagePath, cancelOpening;
@synthesize backgroundColor, backgroundImage;
@synthesize hidesNavBar, fullscreen, statusBarStyle, toolbarItems;

#pragma mark Class Methods
+ (TitaniumViewController *) mostRecentController;
{
	return mostRecentController;
}

+ (TitaniumViewController *) viewController
{
	NSString * ourClassNibName = NSStringFromClass([self class]);
	if ([ourClassNibName hasSuffix:ControllerString]){
		ourClassNibName = [ourClassNibName substringToIndex:[ourClassNibName length]-[ControllerString length]];
	}
	NSString * nibPath = [[NSBundle mainBundle] pathForResource:ourClassNibName ofType:@"nib"];

	//We don't actually use the path, we just want to make sure it exists.
	TitaniumViewController * result= nil;
	if (nibPath != nil) {
		result = [[self alloc] initWithNibName:ourClassNibName bundle:nil];
	} else {
		result = [[self alloc] initWithNibName:@"TitaniumView" bundle:nil];
	}
	
	return [result autorelease];
}

+ (TitaniumViewController *) viewControllerForState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	//NOTE: ViewControllerFactory here.
	Class dictionaryClass = [NSDictionary class];
	TitaniumViewController * result=nil;

	if ([inputState isKindOfClass:dictionaryClass]){
		id dataObject = [(NSDictionary *)inputState objectForKey:@"data"];
		BOOL validTableView = [dataObject isKindOfClass:dictionaryClass];
		if (validTableView){
			result = [TitaniumTableViewController viewController];
		}
	}
	if (result == nil){
		result = [TitaniumWebViewController viewController];
	}
	[result readState:inputState relativeToUrl:baseUrl];
	return result;	
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning]; // Releases the view if it doesn't have a superview
    // Release anything that's not essential, such as cached data
}

#pragma mark Init and Dealloc

- (void)dealloc {
//	[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentWindow.doEvent({type:'close'})"];

	[webView release];
	webView = nil;
	[currentContentURL release];	//Used as a base url.
	[viewProperties release];
	[magicTokenDict release];
    [super dealloc];
}

#pragma mark Accessors

- (void)refreshTitleView;
{
	UIImage * newTitleViewImage = [[TitaniumHost sharedHost] imageForResource:titleViewImagePath];
	UIImageView * newTitleView = nil;
	
	if (newTitleViewImage != nil) newTitleView = [[UIImageView alloc] initWithImage:newTitleViewImage];
	
	[[self navigationItem] setTitleView:newTitleView];
	[newTitleView release];
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
	if (newColor != nil) {
		[backgroundView setBackgroundColor:backgroundColor];
	} else {
		[backgroundView setBackgroundColor:[UIColor grayColor]];
	}
}

- (void)setBackgroundImage: (UIImage *) newImage;
{
	if(newImage == backgroundImage)
	[newImage retain];[backgroundImage release];backgroundImage=newImage;
	
	[backgroundView setImage:backgroundImage];
}


- (void)reloadWebView;
{
	if (webView == nil) return;
	if (currentContentURL == nil) return;
	
	NSMutableURLRequest * urlRequest = [NSMutableURLRequest requestWithURL:currentContentURL];
	NSLog(@"Url request: %@",[urlRequest allHTTPHeaderFields]);
	
	[webView loadRequest:urlRequest];
}

- (void)setCurrentContentURL: (NSURL*) newContentUrl;
{
	if (newContentUrl != currentContentURL){
		if ([newContentUrl isKindOfClass:[NSString class]]){
			if(currentContentURL != nil){
				newContentUrl = [[NSURL alloc] initWithString:[newContentUrl absoluteString] relativeToURL:currentContentURL];
			} else {
				newContentUrl = [[NSURL alloc] initWithString:[newContentUrl absoluteString] relativeToURL:[[TitaniumHost sharedHost] appBaseUrl]];
			}
		} else if ([newContentUrl isKindOfClass:[NSURL class]]){
			[newContentUrl retain];
		} else {
			newContentUrl = nil;
		}
		
		[currentContentURL release];
		currentContentURL = newContentUrl;
	}
	[self reloadWebView];
}

- (void) setView: (UIView *) newView;
{
	[super setView:newView];
	if (newView == nil) {
		[self setWebView:nil];
	}
}

- (void) setWebView: (UIWebView *) newWebView;
{
	if (newWebView == webView) return;
	if (webView == nil){ //Setting up for the first time.
		webView = [newWebView retain];
		return;
	}
	
	if (newWebView == nil) { //Possibly deallocation.
		if (1) { //This should be a javascript check.
			[webView removeFromSuperview];
			[webView release];
			webView = nil;
		}
		return;
	}

	//Now if we have an old view and new view, the old view has to kill the new one. There can be only one!
	//But we're not fully set yet? Let's find out.
	NSLog(@"Two web views go in, one comes out! NewWebView has %@ as a superview",[newWebView superview]);

	[[newWebView superview] insertSubview:webView aboveSubview:newWebView];
	[webView setFrame:[newWebView frame]];
	[newWebView removeFromSuperview];
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

- (BOOL) hidesBottomBarWhenPushed;
{
	if (fullscreen) return YES;
	return [super hidesBottomBarWhenPushed];
}

- (void) setFullscreen: (BOOL) newSetting;
{
	if (newSetting == fullscreen) return;
	fullscreen = newSetting;
//	if (fullscreen) [self setHidesBottomBarWhenPushed:YES];
	[self needsUpdate:TitaniumViewControllerRefreshIsAnimated];
}

- (void) setToolbarItems: (NSArray *) newItems;
{
	if (newItems == toolbarItems) return;
	[newItems retain];
	[toolbarItems release];
	toolbarItems = newItems;
	[self needsUpdate:TitaniumViewControllerRefreshIsAnimated];
}

#pragma mark UIViewController methods

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad {
    [super viewDidLoad];
	[[webView layer] setBackgroundColor:[UIColor clearColor]];  //TODO: What color should this be?
	if ([webView request] == nil){
		[self reloadWebView];
	}
	[self refreshTitleView];
	[backgroundView setBackgroundColor:backgroundColor];
	[backgroundView setImage:backgroundImage];
	mostRecentController = self;
}

- (BOOL)needsUpdate: (TitaniumViewControllerDirtyFlags) newFlags;
{
	if ((dirtyFlags == TitaniumViewControllerIsClean) && ([[TitaniumHost sharedHost] currentTitaniumViewController] == self)){
		[self performSelector:@selector(doUpdateLayout) withObject:nil afterDelay:0];
	}
	dirtyFlags |= TitaniumViewControllerNeedsRefresh | newFlags;
	//FIXME: blain, what should this return?
	return TRUE;
}

//-(void) _clearBecomeFirstResponderWhenCapable;
//{
//	NSLog(@"The what?");
//	
//}

- (void)doUpdateLayout;
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	if (dirtyFlags && ([[TitaniumHost sharedHost] currentTitaniumViewController] == self)){
		[self updateLayout:dirtyFlags & TitaniumViewControllerRefreshIsAnimated];
	}
	[pool release];
}

- (void)updateScrollBounds;
{
	if ([self view]==nil) return;
	CGRect webFrame;
	webFrame.origin = CGPointZero;
	webFrame.size = [contentView frame].size;
	[webView setFrame:webFrame];
	
	NSString * docHeightString = [webView stringByEvaluatingJavaScriptFromString:@"document.height"];
	CGFloat docHeight = [docHeightString floatValue];
	
	for(UIView * thisView in [[self view] subviews]){
		if (thisView == webView) continue;
		CGRect thisFrame = [thisView frame];
		CGFloat bottom = thisFrame.size.height + thisFrame.origin.y;
		if (bottom > docHeight) docHeight = bottom;
	}
	
	BOOL allowsScrolling = (webFrame.size.height < docHeight);
	if(allowsScrolling){
		webFrame.size.height = docHeight;
	}
	[(UIScrollView *)contentView setContentSize:webFrame.size];
	[webView setFrame:webFrame];
	[(UIScrollView *)contentView setScrollEnabled:YES];
	[(UIScrollView *)contentView setBounces:allowsScrolling];
	[(UIScrollView *)contentView setShowsVerticalScrollIndicator:allowsScrolling];
	[(UIScrollView *)contentView setShowsHorizontalScrollIndicator:allowsScrolling];
}

- (void)updateLayout: (BOOL)animated;
{
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
	
	if (shouldShowToolBar){ //Update the list, and show it if needed.
		UIView * ourView = [self view];
		CGRect toolBarFrame;
		CGRect viewBounds = [ourView bounds];
		if (toolBar == nil){
			toolBar = [[UIToolbar alloc] init];
			[toolBar setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin];
			toolBarFrame.size.width = viewBounds.size.width;
			toolBarFrame.origin.x = viewBounds.origin.x;
			toolBarFrame.size.height = 44;
			toolBarFrame.origin.y = viewBounds.size.height - toolBarFrame.size.height;
			[toolBar setFrame:toolBarFrame];
			[toolBar setHidden:YES];
			[ourView addSubview:toolBar];
		} else {
			toolBarFrame = [toolBar frame];
		}
		if (animated){
//			[UIView beginAnimations:@"Toolbar" context:nil];
		}
		CGRect scrollViewFrame;
		if(navBarStyle == UIBarStyleBlackTranslucent){
			scrollViewFrame = viewBounds;
		} else {
			scrollViewFrame = [contentView frame];
			scrollViewFrame.size.height = toolBarFrame.origin.y - scrollViewFrame.origin.y;
		}
		[contentView setFrame:scrollViewFrame];
		[toolBar setTintColor:[theNB tintColor]];
		[toolBar setBarStyle:navBarStyle];
		[toolBar setHidden:NO];
		
		if (animated) {
//			[UIView commitAnimations];
		}
		
		[toolBar setItems:toolbarItems animated:animated];
	} else if (isShowingToolBar){ //Hide the toolbar.
		if (animated){
//			[UIView beginAnimations:@"Toolbar" context:nil];
		}
		[toolBar setHidden:YES];
		[contentView setFrame:[[self view] bounds]];
		if (animated) {
//			[UIView commitAnimations];
		}
	}
	[self updateScrollBounds];

	dirtyFlags = TitaniumViewControllerIsClean;	
}


- (void)viewWillAppear:(BOOL)animated;
{
	[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentWindow.doEvent({type:'focused'})"];
	[self updateLayout:animated];
}

- (void)viewWillDisappear:(BOOL)animated;
{
//	[[[self navigationController] navigationBar] setTintColor:nil];
//	[self resignFirstResponder];
	[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentWindow.doEvent({type:'unfocused'})"];
}

- (void)viewDidAppear:(BOOL)animated;
{
//	[self becomeFirstResponder];
}

//- (BOOL)canBecomeFirstResponder {
//	return YES;
//}

#ifdef MODULE_TI_GESTURE

#pragma mark Gestures

#ifdef __IPHONE_3_0
//- (void)motionBegan:(UIEventSubtype)motion withEvent:(UIEvent *)event
//{
//	NSLog(@"Began!");
//}

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
	if ([[TitaniumHost sharedHost] currentTitaniumViewController] != self) return;
	if (motion == UIEventSubtypeMotionShake){
		NSString * eventString = [NSString stringWithFormat:@"Ti.Gesture.doEvent({type:'shake'})"];
		[webView stringByEvaluatingJavaScriptFromString:eventString];
	}
	
	NSLog(@"Ended!");
}

//- (void)motionCancelled:(UIEventSubtype)motion withEvent:(UIEvent *)event
//{
//	NSLog(@"Cancelled!");
//}

#endif



// Override to allow orientations other than the default portrait orientation.
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
	
	TitaniumViewControllerOrientationsAllowed newOrientation = (1 << interfaceOrientation);

	BOOL result = (allowedOrientations & newOrientation);
	
	if (allowedOrientations == TitaniumViewControllerDefaultOrientation){
		result = (interfaceOrientation == UIInterfaceOrientationPortrait);
	}
	
	if (result && (self != [[TitaniumHost sharedHost] currentTitaniumViewController])){
		NSString * eventString = [NSString stringWithFormat:@"Ti.Gesture.doEvent({type:'orientationchange',"
								  "to:%d,from:%d,animated:false,duration:0})",
								  newOrientation,lastOrientation];
		[webView stringByEvaluatingJavaScriptFromString:eventString];
		lastOrientation = newOrientation;
	}
	
	return result;
}

- (void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration;
{
	TitaniumViewControllerOrientationsAllowed newOrientation = (1 << toInterfaceOrientation);
	
	NSString * eventString = [NSString stringWithFormat:@"Ti.Gesture.doEvent({type:'orientationchange',"
							  "to:%d,from:%d,animated:true,duration:%d})",
							  newOrientation,lastOrientation,(int)(duration * 1000)];
	[webView stringByEvaluatingJavaScriptFromString:eventString];
	lastOrientation = newOrientation;
	
	[super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
}

- (void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation;
{
	[self updateScrollBounds];
}

#endif		//END OF TI_MODULE_GESTURE

#pragma mark UIWebViewDelegate methods

- (BOOL)webView:(UIWebView *)inputWebView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType;
{
	mostRecentController = self;
	NSURL * requestURL = [request URL];
	if ([[TitaniumAppDelegate sharedDelegate] shouldTakeCareOfUrl:requestURL useSystemBrowser:NO]) return NO;
	[currentContentURL release];
	currentContentURL = [requestURL copy];
	return YES;
}

- (void)webViewDidStartLoad:(UIWebView *)inputWebView;
{


}

- (NSString *) contextForToken: (NSString *) tokenString;
{
	return [magicTokenDict objectForKey:tokenString];
}

- (void)acceptToken:(NSString *)tokenString forContext:(NSString *) contextString;
{
	if (magicTokenDict == nil){
		magicTokenDict = [[NSMutableDictionary alloc] init];
	}
	
	[magicTokenDict setObject:contextString forKey:tokenString];
}

- (void)probeWebViewForTokenInContext: (NSString *) contextString;
{
	if (contextString == nil) return;
	NSString * tokenQuery = [contextString stringByAppendingString:@".Titanium._TOKEN"];
	[self acceptToken:[webView stringByEvaluatingJavaScriptFromString:tokenQuery] forContext:contextString];
	NSLog(@"Dict is now: %@",magicTokenDict);
}

- (void)webViewDidFinishLoad:(UIWebView *)inputWebView;
{
//	[UIView beginAnimations:@"webView" context:nil];
	[self updateScrollBounds];
	
	if ([[self title] length] == 0){
		NSString * newTitle = [webView stringByEvaluatingJavaScriptFromString:@"document.title"];
		[self setTitle:newTitle];
	}
	[contentView setAlpha:1.0];
	[[TitaniumAppDelegate sharedDelegate] hideLoadingView];
//	[UIView commitAnimations];
	[self probeWebViewForTokenInContext:@"window"];
}

- (void)webView:(UIWebView *)inputWebView didFailLoadWithError:(NSError *)error;
{
	
}

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	if (![inputState isKindOfClass:[NSDictionary class]])return;

	TitaniumHost * theTiHost = [TitaniumHost sharedHost];
	Class NSStringClass = [NSString class]; //Because this might be from the web where you could have nsnulls and nsnumbers,
	//We can't assume that the inputState is 

	BOOL animatedOrYes = YES;
	BOOL animatedOrNo = NO;
	id animatedObject = [inputState objectForKey:@"animated"];
	if ([animatedObject respondsToSelector:@selector(boolValue)]){
		animatedOrYes = [animatedObject boolValue];
		animatedOrNo = animatedOrYes;
	}

	NSString * newTitle = [inputState objectForKey:@"title"];
	if (newTitle != nil) {
		[self setTitle:newTitle];
	}

	NSString * newTitleImagePath = [inputState objectForKey:@"titleImage"];
	if (newTitleImagePath != nil) {
		[self setTitleViewImagePath:newTitleImagePath];
	}

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
	if ([backgroundColorName isKindOfClass:NSStringClass]){
		[self setBackgroundColor:UIColorWebColorNamed(backgroundColorName)];
	}
	
	NSString * backgroundImageName = [inputState objectForKey:@"backgroundImage"];
	if ([backgroundImageName isKindOfClass:NSStringClass]){
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
	
	[self setStatusBarStyleObject:[inputState objectForKey:@"statusBarStyle"]];
	
	
	if (newTabBarItem != nil) {
		[self setTabBarItem:newTabBarItem];
		[newTabBarItem release];
	}
}

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



- (NSString *) performJavascript: (NSString *) inputString onPageWithToken: (NSString *) token;
{
	NSString * contextString = [magicTokenDict objectForKey:token];
	if (contextString == nil) return nil;
	
	NSString * javascriptString = [NSString stringWithFormat:@"(function(){%@}).call(%@)",inputString,contextString];
	
	return [webView stringByEvaluatingJavaScriptFromString:javascriptString];
}

- (void) pushViewController: (TitaniumViewController *) newVC animated: (BOOL) animated;
{
	if([newVC cancelOpening]) return;
	if ([newVC backgroundColor]==nil)[newVC setBackgroundColor:backgroundColor];
	if ([newVC backgroundImage]==nil)[newVC setBackgroundImage:backgroundImage];
	
	[[self navigationController] pushViewController:newVC animated:animated];
	
}

- (void) pushViewControllerAnimated: (TitaniumViewController *) newVC;
{
	[self pushViewController:newVC animated:YES];
}

- (void) pushViewControllerNonAnimated: (TitaniumViewController *) newVC;
{
	[self pushViewController:newVC animated:NO];
}

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

- (void) close: (id) animatedObject;
{
	BOOL animated = YES;
	if ([animatedObject isKindOfClass:[NSDictionary class]]) animatedObject = [animatedObject objectForKey:@"animated"];
	if ([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];
	
	UINavigationController * theNC = [self navigationController];

	if(self==[theNC modalViewController]){ //TODO: what if we want to have a modal navcontroller? much later.
		[theNC dismissModalViewControllerAnimated:animated];
		return;
	}
	
	if(self==[theNC topViewController]){
		[theNC popViewControllerAnimated:animated];
		return;
	}
	
	NSArray * theVCArray = [theNC viewControllers];
	
	NSInteger thisIndex = [theVCArray indexOfObject:self];
	if (thisIndex > 0) { //TODO: if the index is 0, we're root. We can't close, can we?
		UIViewController * parentVC = [theVCArray objectAtIndex:thisIndex-1];
		[theNC popToViewController:parentVC animated:animated];
	}

	//TODO: if thisIndex is 0, and we've got tabs, remove the tab? That doesn't sound like a good idea.
}

- (void) addNativeView: (UIView *) newView;
{
	[contentView addSubview:newView];
}

@end
