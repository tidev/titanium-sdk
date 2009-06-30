/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumWebViewController.h"
#import "TitaniumHost.h"
#import "UiModule.h"

TitaniumViewController * mostRecentController = nil;

@implementation TitaniumWebViewController

#pragma mark Class Methods
+ (TitaniumViewController *) mostRecentController;
{
	return mostRecentController;
}

#pragma mark init and dealloc and allocations
/*
 // The designated initializer.  Override if you create the controller programmatically and want to perform customization that is not appropriate for viewDidLoad.
 - (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
 if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
 // Custom initialization
 }
 return self;
 }
 */

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	[super readState:inputState relativeToUrl:baseUrl];
	
	Class NSStringClass = [NSString class]; //Because this might be from the web where you could have nsnulls and nsnumbers,
	//We can't assume that the inputState is 
	
	NSString * newUrlString = nil;
	NSURL * newUrl = nil;
	
	if ([inputState isKindOfClass:NSStringClass]){
		newUrlString = inputState;
	} else if ([inputState isKindOfClass:[NSURL class]]){
		newUrl = inputState;
	} else if ([inputState isKindOfClass:[NSDictionary class]]) {
		
		NSString * newUrlElement = [inputState objectForKey:@"url"];
		if (newUrlElement != nil) {
			newUrlString = newUrlElement;
		}	
	}
	
	if([newUrlString isKindOfClass:NSStringClass]){
		if (baseUrl != nil){
			newUrl = [NSURL URLWithString:newUrlString relativeToURL:baseUrl];
		} else if (currentContentURL != nil){
			newUrl = [NSURL URLWithString:newUrlString relativeToURL:currentContentURL];
		} else {
			newUrl = [NSURL URLWithString:newUrlString relativeToURL:[[TitaniumHost sharedHost] appBaseUrl]];
		}
	}
	
	if(newUrl != nil){
		[self setCurrentContentURL:newUrl];
	} else {
		//Now what, doctor?
	}
}

- (void)dealloc {
    [super dealloc];
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	
	// Release any cached data, images, etc that aren't in use.
}

#pragma mark Accessors

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
		[self setContentView:nil];
		[self setWebView:nil];
	}
}

//- (void) setContentView: (UIView *) newContentView;
//{
//	[super setContentView:newContentView];
//}


- (void) setWebView: (UIWebView *) newWebView;
{
	if (newWebView == webView) return;
	if (webView == nil){ //Setting up for the first time.
		webView = [newWebView retain];
		[webView setBackgroundColor:[UIColor clearColor]];  //TODO: What color should this be?
		return;
	}
	
	if (newWebView == nil) { //Possibly deallocation.
		if (0) { //This should be a javascript check.
			[webView removeFromSuperview];
			[webView release];
			webView = nil;
		}
		return;
	}
	
	//Now if we have an old view and new view, the old view has to kill the new one. There can be only one!
	//But we're not fully set yet? Let's find out.
	NSLog(@"Two web views go in! NewWebView %@ has %@ as a superview",newWebView,[newWebView superview]);
	
	[[newWebView superview] insertSubview:webView belowSubview:newWebView];
	[webView setFrame:[newWebView frame]];
	[newWebView removeFromSuperview];
	[[webView superview] setAlpha:1.0];
	NSLog(@"One comes out! webView %@ has %@ as a superview",webView,[webView superview]);
}


#pragma mark viewController methods

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)loadView{
	BOOL needsLoad = (webView == nil);
    [super loadView];
	mostRecentController = self;
	if (needsLoad){
		[self reloadWebView];
	}
}


- (void)viewWillAppear:(BOOL)animated;
{
	[super viewWillAppear:animated];
	[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentWindow.doEvent({type:'focused'})"];
	[self updateLayout:animated];
}

-(void) _clearBecomeFirstResponderWhenCapable;
{
	if ([super respondsToSelector:@selector(_clearBecomeFirstResponderWhenCapable)]){
		[(id)super _clearBecomeFirstResponderWhenCapable];
	} else {
		NSLog(@"This is because 2.2.1 fails if we give a viewController -[becomeFirstResponder]");
	}
}

- (void)viewWillDisappear:(BOOL)animated;
{
	[super viewWillDisappear:animated];
#if MODULE_TI_GESTURE
#ifdef __IPHONE_3_0
	[self resignFirstResponder];
#endif
#endif
	[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentWindow.doEvent({type:'unfocused'})"];
}

#ifdef __IPHONE_3_0
- (void)viewDidAppear:(BOOL)animated;
{
	[super viewDidAppear:animated];
	[self becomeFirstResponder];
}

- (BOOL)canBecomeFirstResponder {
	return YES;
}
#endif

#pragma mark WebViewDelegate methods
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
	[UIView beginAnimations:@"webView" context:nil];
	[self updateScrollBounds];
	
	if ([[self title] length] == 0){
		NSString * newTitle = [webView stringByEvaluatingJavaScriptFromString:@"document.title"];
		[self setTitle:newTitle];
	}
	[contentView setAlpha:1.0];
	[[TitaniumAppDelegate sharedDelegate] hideLoadingView];
	[UIView commitAnimations];
	[self probeWebViewForTokenInContext:@"window"];
}

- (void)webView:(UIWebView *)inputWebView didFailLoadWithError:(NSError *)error;
{
	
}



#pragma mark Updating things

- (void)updateScrollBounds;
{
	if ([self view]==nil) return;
	CGRect webFrame;
	webFrame.origin = CGPointZero;
	webFrame.size = [contentView frame].size;
	[webView setFrame:webFrame];
	
	NSString * docHeightString = [webView stringByEvaluatingJavaScriptFromString:@"document.height"];
	CGFloat docHeight = [docHeightString floatValue];
	
	for(UIView * thisView in [[self contentView] subviews]){
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
	[super updateLayout:animated];
	[self updateScrollBounds];
}

- (void)reloadWebView;
{
	if (webView == nil) return;
	if (currentContentURL == nil) return;
	
	NSMutableURLRequest * urlRequest = [NSMutableURLRequest requestWithURL:currentContentURL];
	NSLog(@"Url request: %@",[urlRequest allHTTPHeaderFields]);
	
	[webView loadRequest:urlRequest];
}












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


#pragma mark Interpage communication

- (BOOL) hasToken: (NSString *) tokenString;
{
	if ([super hasToken:tokenString]) return YES;
	return ([magicTokenDict objectForKey:tokenString] != nil);
}

- (NSString *) performJavascript: (NSString *) inputString onPageWithToken: (NSString *) token;
{
	NSString * contextString = [magicTokenDict objectForKey:token];
	if (contextString == nil) return nil;
	
	NSString * javascriptString = [NSString stringWithFormat:@"(function(){%@}).call(%@)",inputString,contextString];
	
	return [webView stringByEvaluatingJavaScriptFromString:javascriptString];
}

- (void) addNativeViewProxy: (UIButtonProxy *) proxyObject;
{
	[contentView addSubview:[proxyObject nativeView]];
}

- (void) addNativeView: (UIView *) newView;
{
	[contentView addSubview:newView];
}

@end
