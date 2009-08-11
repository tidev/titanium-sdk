/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumWebViewController.h"
#import "TitaniumHost.h"
#import "UiModule.h"

TitaniumWebViewController * mostRecentController = nil;

@implementation TitaniumWebViewController
@synthesize webView, currentContentURL, scrollView;

#pragma mark Class Methods
+ (TitaniumContentViewController *) mostRecentController;
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
		
		NSNumber * doPreload = [inputState objectForKey:@"preload"];
		if([doPreload respondsToSelector:@selector(boolValue)] && [doPreload boolValue])[self webView]; //That's enough to get the ball rolling.
		
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
	[webView setDelegate:nil];
//	[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentWindow.doEvent({type:'close'})"];
	[webView release];
	webView = nil;

	[currentContentURL release];	//Used as a base url.

	TitaniumHost * theHost = [TitaniumHost sharedHost];
	for(NSString * thisToken in magicTokenDict){
		[theHost unregisterContentViewControllerForKey:thisToken];
	}
	[magicTokenDict release];

    [super dealloc];
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	
	// Release any cached data, images, etc that aren't in use.
}

#pragma mark Accessors

- (NSDictionary *) stateValue;
{
	NSMutableDictionary * result = [[super stateValue] mutableCopy];
	[result setObject:[currentContentURL absoluteString] forKey:@"url"];
	
	return [result autorelease];
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
		if([[scrollView subviews] count]<1)[self setScrollView:nil];
	}
}

- (void) setScrollView: (UIScrollView *) newView;
{
	if(newView == scrollView)return;
	[newView retain];[scrollView release];scrollView=newView;
	if(scrollView == nil) [self setWebView:nil];
}

//- (void) setContentView: (UIView *) newContentView;
//{
//	if (newContentView == contentView) return;
//	if (contentView == nil){
//		contentView = [newContentView retain];
//		return;
//	}
//	
//	if (newContentView == nil){
//		[self setWebView:nil];
//		if((webView == nil) || ([[contentView subviews] count] <= 1)){ //Okay, clear on out!
//			[contentView removeFromSuperview];
//			[contentView release];
//			contentView = nil;
//		}
//		return;
//	}
//	
//	[[newContentView superview] insertSubview:contentView belowSubview:newContentView];
//	[contentView setFrame:[newContentView frame]];
//	[newContentView removeFromSuperview];
//}
- (UIScrollView *) scrollView;
{
	if (scrollView == nil){
		scrollView = [[UIScrollView alloc] init];
	}
	return scrollView;
}

- (UIWebView *) webView;
{
	if(webView == nil){
		webView = [[UIWebView alloc] init];
		[webView setDelegate:self];
		[webView setBackgroundColor:[UIColor clearColor]];
		[webView setOpaque:NO];
		[scrollView setAlpha:0.0];
		[self reloadWebView];
	}
	return webView;
}

- (void) setWebView: (UIWebView *) newWebView;
{
	if (newWebView == webView) return;
	if (webView == nil){ //Setting up for the first time.
		webView = [newWebView retain];
		[webView setBackgroundColor:[UIColor redColor]];  //TODO: What color should this be?
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
	NSLog(@"Should no longer happen. Two web views go in! NewWebView %@ has %@ as a superview",newWebView,[newWebView superview]);
	
	[[newWebView superview] insertSubview:webView belowSubview:newWebView];
	[webView setFrame:[newWebView frame]];
	[newWebView removeFromSuperview];
	[[webView superview] setAlpha:1.0];
	NSLog(@"One comes out! webView %@ has %@ as a superview",webView,[webView superview]);
}


#pragma mark viewController methods

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)loadView{
	CGRect quikframe = CGRectMake(0, 0, preferredViewSize.width, preferredViewSize.height);
	UIViewAutoresizing stretchy = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
	UIView * ourRootView = [[UIView alloc] initWithFrame:quikframe];
	[ourRootView setAutoresizingMask:stretchy];

	[[self scrollView] setFrame:quikframe];
	[scrollView setAutoresizingMask:stretchy];
	[ourRootView addSubview:scrollView];
	
	if([[self webView] superview] != scrollView){
		[webView setAutoresizingMask:stretchy];
		[webView setFrame:quikframe];
		[scrollView insertSubview:webView atIndex:0];
	}
	
	[self setView:ourRootView];
	[ourRootView release];

	mostRecentController = self;
}

- (void)setFocused:(BOOL)isFocused;
{
	if(isFocused){
		[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentView.doEvent({type:'focused'})"];
	} else {
		[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentView.doEvent({type:'unfocused'})"];
	}
}


- (void)setWindowFocused:(BOOL)isFocused;
{
	if(isFocused){
		[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentWindow.doEvent({type:'focused'})"];
	} else {
		[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentWindow.doEvent({type:'unfocused'})"];
	}
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
	[self resignFirstResponder];
}

- (void)viewDidAppear:(BOOL)animated;
{
	[super viewDidAppear:animated];
	[self becomeFirstResponder];
}

- (BOOL)canBecomeFirstResponder {
	return YES;
}

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
	[[TitaniumHost sharedHost] registerContentViewController:self forKey:tokenString];
}

- (void)probeWebViewForTokenInContext: (NSString *) contextString;
{
	if (contextString == nil) return;
	NSString * tokenQuery = [contextString stringByAppendingString:@".Titanium._TOKEN"];
	[self acceptToken:[webView stringByEvaluatingJavaScriptFromString:tokenQuery] forContext:contextString];
	if(VERBOSE_DEBUG)NSLog(@"Dict is now: %@",magicTokenDict);
}

- (void)webViewDidFinishLoad:(UIWebView *)inputWebView;
{
	[UIView beginAnimations:@"webView" context:nil];
	[self updateLayout:NO];
	
	NSString * newTitle = [webView stringByEvaluatingJavaScriptFromString:@"document.title"];
	TitaniumViewController * parentVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:titaniumWindowToken];
	if([newTitle length]>0)[parentVC setTitle:newTitle];

	[scrollView setAlpha:1.0];
	[[TitaniumAppDelegate sharedDelegate] hideLoadingView];
	[UIView commitAnimations];
	[self probeWebViewForTokenInContext:@"window"];
	
	if(![[currentContentURL scheme] isEqualToString:@"app"])return;
	if([[webView stringByEvaluatingJavaScriptFromString:@"typeof(Titanium)"] isEqualToString:@"undefined"])[self investigateTitaniumCrashSite];
	
	[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentView.doEvent({type:'load'});"];
	if ([[TitaniumHost sharedHost] currentTitaniumViewController] == parentVC){
		[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentWindow.doEvent({type:'focused'});"];
		if([[parentVC contentViewControllers] objectAtIndex:[parentVC selectedContentIndex]]){
			[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI.currentView.doEvent({type:'focused'});"];
		}
	}

	
}

- (void)webView:(UIWebView *)inputWebView didFailLoadWithError:(NSError *)error;
{
	
}



#pragma mark Updating things

- (void)updateLayout: (BOOL)animated;
{
	if ([scrollView superview]==nil) return;
	CGRect webFrame;
	webFrame.origin = CGPointZero;
	webFrame.size = [[self view] frame].size;
	[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI._ISRESIZING=true;"];
	[webView setFrame:webFrame];

	UIView * firstResponder=nil;
	
	NSString * docHeightString = [webView stringByEvaluatingJavaScriptFromString:@"document.height"];
	CGFloat docHeight = [docHeightString floatValue];
	
	for(UIView * thisView in [scrollView subviews]){
		if (thisView == webView) continue;
		CGRect thisFrame = [thisView frame];
		CGFloat bottom = thisFrame.size.height + thisFrame.origin.y;
		
		if ([thisView isFirstResponder]){
			firstResponder = thisView;
		}
		for (UIView * thisSubView in [thisView subviews]){
			if ([thisSubView isFirstResponder]){
				firstResponder = thisView;
			}			
		}
		
		if (bottom > docHeight) docHeight = bottom;
	}
	
	BOOL allowsScrolling = (webFrame.size.height < docHeight);
	if(allowsScrolling){
		webFrame.size.height = docHeight;
	}
	[scrollView setContentSize:webFrame.size];
	[webView setFrame:webFrame];
	[scrollView setScrollEnabled:YES];
	[scrollView setBounces:YES];
	[scrollView setShowsVerticalScrollIndicator:allowsScrolling];
	[scrollView setShowsHorizontalScrollIndicator:allowsScrolling];

	if(firstResponder != nil){
		[scrollView scrollRectToVisible:[firstResponder frame] animated:animated];
	}
	[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI._ISRESIZING=false;"];
}

- (void)reloadWebView;
{
	if ((webView == nil) || (currentContentURL == nil)) return;
	
	NSMutableURLRequest * urlRequest = [NSMutableURLRequest requestWithURL:currentContentURL];
	if(VERBOSE_DEBUG)NSLog(@"Url request: %@",[urlRequest allHTTPHeaderFields]);

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
	if ([[TitaniumHost sharedHost] currentTitaniumContentViewController] != self) return;
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
//- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
//	
//	TitaniumViewControllerOrientationsAllowed newOrientation = (1 << interfaceOrientation);
//	
//	BOOL result = (allowedOrientations & newOrientation);
//	
//	if (allowedOrientations == TitaniumViewControllerDefaultOrientation){
//		result = (interfaceOrientation == UIInterfaceOrientationPortrait);
//	}
//	
//	if (result && (self != [[TitaniumHost sharedHost] currentTitaniumViewController])){
//		NSString * eventString = [NSString stringWithFormat:@"Ti.Gesture.doEvent({type:'orientationchange',"
//								  "to:%d,from:%d,animated:false,duration:0})",
//								  newOrientation,lastOrientation];
//		[webView stringByEvaluatingJavaScriptFromString:eventString];
//		lastOrientation = newOrientation;
//	}
//	
//	return result;
//}

- (void)setInterfaceOrientation:(TitaniumViewControllerOrientationsAllowed)interfaceOrientation duration:(NSTimeInterval)duration;
{
	if (lastOrientation == interfaceOrientation) return;
	NSString * animatedString = (duration>0)?@"true":@"false";
	
	NSString * eventString = [NSString stringWithFormat:@"Ti.Gesture.doEvent({type:'orientationchange',"
							  "to:%d,from:%d,animated:%@,duration:%d})",
							  interfaceOrientation,lastOrientation,animatedString,(int)(duration * 1000)];
	[webView stringByEvaluatingJavaScriptFromString:eventString];
	lastOrientation = interfaceOrientation;
}

//- (void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation;
//{
//	[self updateLayout:YES];
//}

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
	[scrollView addSubview:[proxyObject nativeView]];
}

- (void) addNativeView: (UIView *) newView;
{
	[scrollView addSubview:newView];
}

#pragma mark Extreme Debugging. EXTREEEEEEEEEEEEEME!

- (void) investigateTitaniumCrashSite;
{
	NSString * extremeDebugString = [[TitaniumHost sharedHost] javaScriptForResource:currentContentURL hash:[self primaryToken] extremeDebug:YES];
	NSLog(@"****** BEGIN TITANIUM FAILURE RECREATION FOR VIEW %@ ******",self);
	NSLog(@"%@",extremeDebugString);
	NSLog(@"****** END TITANIUM FAILURE RECREATION ******");
	
	NSLog(@"****** BEGIN TITANIUM FAILURE SCAN ******");

	NSArray * commandLineArray=[extremeDebugString componentsSeparatedByString:@"</script>"];
	for(NSString * thisCommand in commandLineArray){
		if([thisCommand hasPrefix:@"\n"])thisCommand = [thisCommand substringFromIndex:1];
		if([thisCommand hasPrefix:@"<script>"])thisCommand = [thisCommand substringFromIndex:8];
		NSString * escapedCommand=[NSString stringWithFormat:@"(function(){try{%@}catch(E){return 'FAIL'+E;}return 'SUCC';})();",thisCommand];
		NSString * result = [webView stringByEvaluatingJavaScriptFromString:escapedCommand];
		if([result isEqualToString:@"SUCC"])continue;

		NSString * errorTypeString;
		if([result hasPrefix:@"FAIL"])errorTypeString = [result substringFromIndex:4];
		else errorTypeString = @"Webview could not parse javascript";
		
		NSLog(@"****** FAILURE, %@ for (%@)",errorTypeString,thisCommand);
	}

	NSLog(@"****** END TITANIUM FAILURE SCAN ******");
	
}








@end
