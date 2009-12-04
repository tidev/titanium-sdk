/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumWebViewController.h"
#import "TitaniumHost.h"
#import "UiModule.h"
#import "NativeControlProxy.h"
#import "Logging.h"
#import "TweakedScrollView.h"
#import "TweakedWebView.h"

@implementation TitaniumWebViewController
@synthesize webView, currentContentURL, scrollView;

#pragma mark Class Methods

#pragma mark init and dealloc and allocations



- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{	
	loading = YES;
	showActivity = YES;
	
	Class NSStringClass = [NSString class]; //Because this might be from the web where you could have nsnulls and nsnumbers,
	//We can't assume that the inputState is 
	
	NSString * newUrlString = nil;
	NSURL * newUrl = nil;
	BOOL preload = NO;
	
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
		if([doPreload respondsToSelector:@selector(boolValue)])
		{
			preload = [doPreload boolValue];
		}

		NSNumber * doActivity = [inputState objectForKey:@"activityIndicator"];
		if([doActivity respondsToSelector:@selector(boolValue)] && ![doActivity boolValue])
		{
			showActivity = NO;
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
		NSLog(@"[WARN] WebView %@ was not given an URL relative to %@ for %@",self,baseUrl,inputState);
	}
	
	if (preload)
	{
		[[OperationQueue sharedQueue] queue:@selector(noop) target:self arg:nil after:@selector(preload) on:self ui:YES];
	}
}

-(void)noop
{
	//THIS IS IMPORTANT.. just serves as empty method for op queue
}

-(void)preload
{
	showActivity = NO;
	preloaded = YES;
	[self webView]; 
	[self reloadWebView];
}

- (void)dealloc {
	[webView setDelegate:nil];
	[webView release];
	webView = nil;
	[[NSNotificationCenter defaultCenter] removeObserver:self];
	[nativeOnscreenProxies release];
	
	[spinner release];
	[parentView release];

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
	if([scrollView superview]==nil)[self setView:nil];
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
	if (newView == nil) {
		if([[scrollView subviews] count]<1)[self setScrollView:nil];
	}
}

- (void) setScrollView: (UIScrollView *) newView;
{
	if(newView == scrollView)return;
	[newView retain];[scrollView release];scrollView=newView;
	if(scrollView == nil) 
	{
		[self setWebView:nil];
		[spinner release];
		spinner=nil;
		[parentView release];
		parentView = nil;
	}
}

- (UIView *) view;
{
	if (spinner==nil && showActivity)
	{
		spinner = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
		[spinner setHidesWhenStopped:YES];
		spinner.autoresizingMask = UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin | UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
	}
	CGRect rect = CGRectMake(0, 0, preferredViewSize.width, preferredViewSize.height);
	
	if (parentView==nil)
	{
		parentView = [[UIView alloc] initWithFrame:rect];
		[parentView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
		if (showActivity)
		{
			[parentView addSubview:spinner];
			[spinner sizeToFit];
			[spinner startAnimating];
			spinner.center = parentView.center;
		}
	}
	
	//Ensuring webview is non-nil is unnecessary, as it's set at the end of scrollView.
	//Furthermore, webview has to be made after scrollview, in order for webview's side
	//effect of setting scrollview's alpha to 0.
	if (scrollView == nil)
	{
		UIViewAutoresizing stretchy = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
		
		scrollView = [[TweakedScrollView alloc] init];
		[scrollView setDelaysContentTouches:NO];
		[scrollView setFrame:rect];
		[scrollView setAutoresizingMask:stretchy];
		[scrollView setDelegate:self];
		
		[parentView addSubview:scrollView];

		if([[self webView] superview] != scrollView){
			[scrollView insertSubview:webView atIndex:0];
			if (preloaded==NO) [self reloadWebView];
		}
		
	}
	return parentView;
}

- (TweakedWebView *) webView;
{
	if(webView == nil){
		webView = [[TweakedWebView alloc] init];
		if([webView respondsToSelector:@selector(setDetectsPhoneNumbers:)])[(id)webView setDetectsPhoneNumbers:NO];
		if([webView respondsToSelector:@selector(setDataDetectorTypes:)])[(id)webView setDataDetectorTypes:0];
		[webView setDelegate:self];
		[webView setMultipleTouchEnabled:YES];
		[webView setBackgroundColor:[UIColor clearColor]];
		[webView setOpaque:NO];
		if (showActivity) 
		{
			webView.hidden = YES;
		}
		if (scrollView!=nil)[scrollView setAlpha:0.0];
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(tabChange:) name:TitaniumTabChangeNotification object:nil];
	}
	return webView;
}

- (void) setWebView: (TweakedWebView *) newWebView;
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
			[webView setDelegate:nil];
			[webView release];
			webView = nil;
			[[NSNotificationCenter defaultCenter] removeObserver:self name:TitaniumTabChangeNotification object:nil];
		}
		return;
	}
	
	//Now if we have an old view and new view, the old view has to kill the new one. There can be only one!
	//But we're not fully set yet? Let's find out.
	NSLog(@"[WARN] Should no longer happen. Two web views go in! NewWebView %@ has %@ as a superview",newWebView,[newWebView superview]);
	
	[[newWebView superview] insertSubview:webView belowSubview:newWebView];
	[webView setFrame:[newWebView frame]];
	[newWebView removeFromSuperview];
	[[webView superview] setAlpha:1.0];
	VERBOSE_LOG(@"[DEBUG] One comes out! webView %@ has %@ as a superview",webView,[webView superview]);
}


#pragma mark viewController methods

- (void)setFocused:(BOOL)isFocused;
{
	if(isFocused){
		[self updateTitle];
		[webView stringByEvaluatingJavaScriptFromString:@"Ti._ONEVT.call(Ti.UI.currentView,'focused',{type:'focused'})"];
	} else {
		[webView stringByEvaluatingJavaScriptFromString:@"Ti._ONEVT.call(Ti.UI.currentView,'unfocused',{type:'unfocused'})"];
	}
}


- (void)setWindowFocused:(BOOL)isFocused;
{
	if(isFocused){
		[webView stringByEvaluatingJavaScriptFromString:@"Ti._ONEVT.call(Ti.UI.currentWindow,'focused',{type:'focused'})"];
	} else {
		[webView stringByEvaluatingJavaScriptFromString:@"Ti._ONEVT.call(Ti.UI.currentWindow,'unfocused',{type:'unfocused'})"];
	}
}


-(void) _clearBecomeFirstResponderWhenCapable;
{
	if ([super respondsToSelector:@selector(_clearBecomeFirstResponderWhenCapable)]){
		[(id)super _clearBecomeFirstResponderWhenCapable];
	} else {
		NSLog(@"[WARN] Should not happen. This is because 2.2.1 fails if we give a viewController -[becomeFirstResponder]");
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

- (void)tabChange: (NSNotification *) notification;
{
	NSString * jsonString = [[notification userInfo] objectForKey:TitaniumJsonKey];
	NSString * commandString = [NSString stringWithFormat:@"Ti._ONEVT.call(Ti.UI,'tabchange',{%@});",jsonString];
	[webView stringByEvaluatingJavaScriptFromString:commandString];
}

#pragma mark ScrollViewDelegate methods
- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView;                              // called on start of dragging (may require some time and or distance to move)
{
	[webView setUserInteractionEnabled:NO];
}
- (void)scrollViewWillBeginDecelerating:(UIScrollView *)scrollView;   // called on finger up as we are moving
{
	[webView setUserInteractionEnabled:NO];
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate; // called on finger up if user dragged. decelerate is true if it will continue moving afterwards
{
	if(!decelerate)[webView setUserInteractionEnabled:YES];
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView;      // called when scroll view grinds to a halt
{
	[webView setUserInteractionEnabled:YES];
}

- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView; // called when setContentOffset/scrollRectVisible:animated: finishes. not called if not animating
{
	[webView setUserInteractionEnabled:YES];
}


#pragma mark WebViewDelegate methods
#pragma mark UIWebViewDelegate methods

- (BOOL)webView:(UIWebView *)inputWebView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType;
{
	NSURL * requestURL = [request URL];
	
	if ([[TitaniumAppDelegate sharedDelegate] shouldTakeCareOfUrl:requestURL useSystemBrowser:NO prompt:YES]) return NO;
	CLOCKSTAMP("Should load request %@ for %@",requestURL,self);

	[currentContentURL release];
	currentContentURL = [requestURL copy];
	isNonTitaniumPage = ![[currentContentURL scheme] isEqualToString:@"app"];

	[webView setScalesPageToFit:isNonTitaniumPage];
	if(!isNonTitaniumPage)[webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"window._WINTKN='%@'",[self primaryToken]]];
	return YES;
}

- (void)webViewDidStartLoad:(UIWebView *)inputWebView;
{
	CLOCKSTAMP("Started load request for %@",self);
	
	if (loading==NO)
	{
		loading = YES;
		if (showActivity)
		{
			[spinner startAnimating];
		}
	}
	// if this is a non-local page, make sure we show activity indicator during page load
	if (isNonTitaniumPage)
	{
		[[TitaniumHost sharedHost] incrementActivityIndicator];
	}

	TitaniumHost * theHost = [TitaniumHost sharedHost];
	NSString * pathString = [self javaScriptPath];
	NSString * commandString = [NSString stringWithFormat:@"%@.doEvent('preload',{type:'preload',url:'%@'});",pathString,currentContentURL];	
	[theHost sendJavascript:commandString toPagesWithTokens:listeningWebContextTokens update:YES];
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
	VERBOSE_LOG(@"[DEBUG] Dict is now: %@",magicTokenDict);
}

- (void)webViewDidFinishLoad:(UIWebView *)inputWebView;
{
	CLOCKSTAMP("Finished load request for %@",self);
	
	TitaniumContentViewController * visibleVC = [[TitaniumHost sharedHost] visibleTitaniumContentViewController];
	BOOL isVisible = [visibleVC isShowingView:self];

	if(isVisible)[self updateTitle];	

	VERBOSE_LOG(@"[DEBUG] isNonTitaniumPage is %d because %@ has scheme %@",isNonTitaniumPage,currentContentURL,[currentContentURL scheme]);

	if(!isNonTitaniumPage)
	{
		NSMutableString *js = [[NSMutableString alloc] init];
		
		[js appendString:@"(function(){ if (typeof(Titanium) != 'undefined') {"];

		[js appendFormat:@"Ti._ONEVT.call(Ti.UI.currentWindow,'load',{type:'load',url:'%@'});",currentContentURL];
		[js appendFormat:@"Ti._ONEVT.call(Ti.UI.currentView,'load',{type:'load',url:'%@'});",currentContentURL];
		
		if ([titaniumWindowToken isEqualToString:[visibleVC titaniumWindowToken]])
		{
			[js appendString:@"Ti._ONEVT.call(Ti.UI.currentWindow,'focused',{type:'focused'});"];
			if(isVisible)
			{
				[js appendString:@"Ti._ONEVT.call(Ti.UI.currentView,'focused',{type:'focused'});"];
			}
		}
		[js appendString:@"return window.Titanium._TOKEN; } else { return '0'; } })()"];
		id result = [webView stringByEvaluatingJavaScriptFromString:js];
		[js release];
		if ([result isEqualToString:@"0"])
		{
			[self investigateTitaniumCrashSite];
		}
		else 
		{
			[self acceptToken:result forContext:@"window"];
		}
	}
	
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	NSString * pathString = [self javaScriptPath];
	NSString * commandString = [NSString stringWithFormat:@"%@.doEvent('load',{type:'load',url:'%@'});",pathString,currentContentURL];	

	[theHost sendJavascript:commandString toPagesWithTokens:listeningWebContextTokens update:YES];
	
	loading = NO;
	if (showActivity)
	{
		[spinner stopAnimating];
	}

	if (preloaded==NO)
	{
		[UIView beginAnimations:@"webView" context:nil];
		[UIView setAnimationDuration:0.1];
		[self updateLayout:NO];
		webView.hidden = NO;
		[scrollView setAlpha:1.0];
		[UIView commitAnimations];
	}	
	
	[[TitaniumAppDelegate sharedDelegate] hideLoadingView];

	if (isNonTitaniumPage)
	{
		[[TitaniumHost sharedHost] decrementActivityIndicator];
	}
}

- (void)webView:(UIWebView *)inputWebView didFailLoadWithError:(NSError *)error;
{
	NSLog(@"[ERROR] web view failed to load: %@",[error description]);
	loading=NO;
	if (showActivity)
	{
		[spinner stopAnimating];	
	}
}

- (BOOL)touchesShouldCancelInContentView:(UIView *)view;
{
	if(isNonTitaniumPage)return NO;
	NSString * noCancel = [webView stringByEvaluatingJavaScriptFromString:@"Ti._DOTOUCH"];
	BOOL wasTouched = [noCancel boolValue];
//	[webView stringByEvaluatingJavaScriptFromString:@"Ti._DOTOUCH=false;"];
	return !wasTouched;
}

#pragma mark Updating things

- (void)updateTitle;
{
	NSString * newTitle = [webView stringByEvaluatingJavaScriptFromString:@"document.title"];
	TitaniumViewController * parentVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:titaniumWindowToken];
	if([newTitle length]>0)[parentVC setTitle:newTitle];	
}

- (void)updateLayout: (BOOL)animated;
{
	if ([scrollView superview]==nil) return;
	
	CGRect webFrame;
	if(isNonTitaniumPage){
		VERBOSE_LOG(@"[DEBUG] Was not titanium page!");
		CGRect webFrame;
		webFrame.origin = CGPointZero;
		webFrame.size = [[self view] frame].size;
		[scrollView setFrame:webFrame];
		[scrollView setContentSize:webFrame.size];
		[webView setFrame:webFrame];
		return;
	}
	
	webFrame.origin = CGPointZero;
	webFrame.size = [[self view] frame].size;
	[webView stringByEvaluatingJavaScriptFromString:@"Ti.UI._ISRESIZING=true;"];
	[webView setFrame:webFrame];

	UIView * firstResponder=nil;
	
	NSString * docHeightString = [webView stringByEvaluatingJavaScriptFromString:@"document.height"];
	CGFloat docHeight = [docHeightString floatValue];

	NSString * docWidthString = [webView stringByEvaluatingJavaScriptFromString:@"document.width"];
	CGFloat docWidth = [docWidthString floatValue];

	for(NativeControlProxy * thisProxy in nativeOnscreenProxies){
		[thisProxy refreshPositionWithWebView:webView animated:animated];
		UIView * thisView = [thisProxy view];

		CGRect thisFrame = [thisView frame];
		CGFloat bottom = thisFrame.size.height + thisFrame.origin.y;
		CGFloat right = thisFrame.size.width + thisFrame.origin.x;

		if ([thisProxy isFirstResponder]){
			firstResponder = thisView;
		}
		
		if (bottom > docHeight) docHeight = bottom;
		if (right > docWidth) docWidth = right;
	}



	BOOL allowsVertScrolling = (webFrame.size.height < docHeight);
	if(allowsVertScrolling){
		webFrame.size.height = docHeight;
	}
	
	VERBOSE_LOG(@"[INFO] Resizing web view. Docwidth %f > webFrame width %f?",docWidth,webFrame.size.width);
	
#ifdef USEHORIZSCROLLING
	BOOL allowsHorizScrolling = (webFrame.size.width < docWidth);
	if(allowsHorizScrolling){
		webFrame.size.width = docWidth;
	}
#else
	BOOL allowsHorizScrolling = NO;
#endif	
	[scrollView setContentSize:webFrame.size];
	[webView setFrame:webFrame];
	[webView setScalesPageToFit:NO];
	[scrollView setScrollEnabled:YES];
	[scrollView setBounces:YES];
	[scrollView setShowsVerticalScrollIndicator:allowsVertScrolling];
	[scrollView setShowsHorizontalScrollIndicator:allowsHorizScrolling];

	if(firstResponder != nil){
		[scrollView scrollRectToVisible:[firstResponder frame] animated:animated];
	}

	VERBOSE_LOG(@"webview %@ update layout = %f x %f ==> %f x %f",currentContentURL, webFrame.size.width, webFrame.size.height,webView.frame.size.width,webView.frame.size.height);
	
	if (preloaded)
	{
		[webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"Ti.UI._ISRESIZING=false;document.body.style.minWidth='%fpx';",webFrame.size.width-10]];
	}
	else 
	{
		[webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"Ti.UI._ISRESIZING=false;"]];
	}
}

- (void)reloadWebView;
{
	if ((webView == nil) || (currentContentURL == nil)) return;
	
	// this is special support for loading a pure JS file into titanium instead of starting with an HTML page and then loading one
	if ([[[currentContentURL absoluteString] pathExtension] isEqualToString:@"js"])
	{
		NSString *tijs = [[TitaniumHost sharedHost] javaScriptForResource:currentContentURL];
		NSString *jscode = [NSString stringWithContentsOfURL:currentContentURL encoding:NSUTF8StringEncoding error:nil];
		NSString *code = [NSString stringWithFormat:@"<html>%@<script>%@</script></html>",tijs,jscode];
		[webView loadHTMLString:code baseURL:currentContentURL];
	}
	else
	{
		NSMutableURLRequest * urlRequest = [NSMutableURLRequest requestWithURL:currentContentURL];
		VERBOSE_LOG(@"[DEBUG] Url request: %@",[urlRequest allHTTPHeaderFields]);
		[webView loadRequest:urlRequest];
	}
}

#ifdef MODULE_TI_GESTURE

#pragma mark Gestures

#if __IPHONE_OS_VERSION_MIN_REQUIRED < 30000
typedef int UIEventSubtype;
#define UIEventSubtypeMotionShake	1
#endif

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
	TitaniumContentViewController * currentVC = [[TitaniumHost sharedHost] currentTitaniumContentViewController];
	if (![currentVC isShowingView:self]) return;
	if (motion == UIEventSubtypeMotionShake){
		NSString * eventString = [NSString stringWithFormat:@"Ti._ONEVT.call(Ti.Gesture,'shake',{type:'shake'})"];
		[webView stringByEvaluatingJavaScriptFromString:eventString];
	}
}


- (void)setInterfaceOrientation:(TitaniumViewControllerOrientationsAllowed)interfaceOrientation duration:(NSTimeInterval)duration;
{
	if (lastOrientation == interfaceOrientation) return;

	switch (interfaceOrientation) {
		case TitaniumViewControllerPortrait:
			[webView stringByEvaluatingJavaScriptFromString:@"window.__defineGetter__('orientation',function(){return 0;});window.onorientationchange();"];
			break;
		case TitaniumViewControllerLandscapeLeft:
			[webView stringByEvaluatingJavaScriptFromString:@"window.__defineGetter__('orientation',function(){return 90;});window.onorientationchange();"];
			break;
		case TitaniumViewControllerLandscapeRight:
			[webView stringByEvaluatingJavaScriptFromString:@"window.__defineGetter__('orientation',function(){return -90;});window.onorientationchange();"];
			break;
		default:
			break;
	}
	
	NSString * animatedString = (duration>0)?@"true":@"false";
	
	NSString * eventString = [NSString stringWithFormat:@"Ti._ONEVT.call(Ti.Gesture,'orientationchange',{type:'orientationchange',"
			"to:%d,from:%d,animated:%@,duration:%d})",
			interfaceOrientation,lastOrientation,animatedString,(int)(duration * 1000)];
	[webView stringByEvaluatingJavaScriptFromString:eventString];
	lastOrientation = interfaceOrientation;
}


#endif		//END OF TI_MODULE_GESTURE


#pragma mark Interpage communication

- (BOOL) hasToken: (NSString *) tokenString;
{
	if ([super hasToken:tokenString]) return YES;
	return ([magicTokenDict objectForKey:tokenString] != nil);
}

- (BOOL) sendJavascript: (NSString *) inputString;
{
	[webView stringByEvaluatingJavaScriptFromString:inputString];
	return YES;
}

-(void) sendJavascriptAndGetResult:(NSMutableDictionary*)dict
{
	if (webView==nil)
	{
		NSLog(@"[WARN] sendJavascriptAndGetResult but webView is nil");
	}
	id result = [webView stringByEvaluatingJavaScriptFromString:[dict objectForKey:@"code"]];
	[dict setObject:result forKey:@"result"];
}

- (NSString *) performJavascript: (NSString *) inputString onPageWithToken: (NSString *) token;
{
	NSString * contextString = [magicTokenDict objectForKey:token];
	if (contextString == nil) return nil;
	
	NSString * javascriptString = [NSString stringWithFormat:@"(function(){%@}).call(%@)",inputString,contextString];
	
	return [webView stringByEvaluatingJavaScriptFromString:javascriptString];
}

- (void) addNativeViewProxy: (NativeControlProxy *) proxyObject;
{
	if(nativeOnscreenProxies == nil){
		nativeOnscreenProxies = [[NSMutableSet alloc] initWithObjects:proxyObject,nil];
	} else {
		[nativeOnscreenProxies addObject:proxyObject];
	}
	[scrollView addSubview:[proxyObject view]];
}

- (void) scrollRelative: (NSValue *) positionValue;
{
	CGPoint position = [positionValue CGPointValue];
	if (isNonTitaniumPage) {
		[webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"window.scrollBy(%f,%f);",position.x,position.y]];
	} else {
		CGPoint oldPosition = [scrollView contentOffset];
		position.x += oldPosition.x;
		position.y += oldPosition.y;
		[scrollView setContentOffset:position];
	}
}

- (void) scrollAbsolute: (NSValue *) positionValue;
{
	CGPoint position = [positionValue CGPointValue];
	if (isNonTitaniumPage) {
		[webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"window.scrollTo(%f,%f);",position.x,position.y]];
	} else {
		[scrollView setContentOffset:position];
	}
}
	

#pragma mark Extreme Debugging. EXTREEEEEEEEEEEEEME!

- (void) investigateTitaniumCrashSite;
{
	NSString * extremeDebugString = [[TitaniumHost sharedHost] javaScriptForResource:currentContentURL hash:[self primaryToken] extremeDebug:YES];
	NSLog(@"[ERROR] ****** BEGIN TITANIUM FAILURE SCAN FOR VIEW %@ ******",self);

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
		
		NSLog(@"[ERROR] ****** FAILURE, %@ for (%@)",errorTypeString,thisCommand);
	}

	NSLog(@"[ERROR] ****** END TITANIUM FAILURE SCAN ******");
	
}

- (void) trackingSanityCheck;
{
	//This happens when there's been two fingers in the web view and it's canceled, the web view is still tracking.
	if(isNonTitaniumPage||[scrollView isTracking] || [scrollView isDragging] || [scrollView isDecelerating])return;
	
	NSLog(@"[WARN] Suspected that webView is locked in tracking. Resetting its connection to the view tree...");
	[webView removeFromSuperview];
	[scrollView insertSubview:webView atIndex:0];
}

@end
