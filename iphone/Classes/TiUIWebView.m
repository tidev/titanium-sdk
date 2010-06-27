/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import "TiUIWebView.h"
#import "TiUIWebViewProxy.h"

#import "TiUtils.h"
#import "TiProxy.h"
#import "SBJSON.h"
#import "TiHost.h"
#import "Webcolor.h"
#import "TiBlob.h"
#import "TiFile.h"
#import "Mimetypes.h"
#import "Base64Transcoder.h"

extern NSString * const TI_APPLICATION_ID;
NSString * const kTitaniumJavascript = @"Ti.App={};Ti.API={};Ti.App._listeners={};Ti.App._listener_id=1;Ti.App.id=Ti.appId;Ti.App._xhr=XMLHttpRequest;"
		"Ti._broker=function(module,method,data){try{var url='app://'+Ti.appId+'/_TiA0_'+Ti.pageToken+'/'+module+'/'+method+'?'+Ti.App._JSON(data,1);"
			"var xhr=new Ti.App._xhr();xhr.open('GET',url,false);xhr.send()}catch(X){}};"
		"Ti._hexish=function(a){var r='';var e=a.length;var c=0;var h;while(c<e){h=a.charCodeAt(c++).toString(16);r+='\\\\u';var l=4-h.length;while(l-->0){r+='0'};r+=h}return r};"
		"Ti._bridgeEnc=function(o){return'<'+Ti._hexish(o)+'>'};"
		"Ti.App._JSON=function(object,bridge){var type=typeof object;switch(type){case'undefined':case'function':case'unknown':return undefined;case'number':case'boolean':return object;"
			"case'string':if(bridge===1)return Ti._bridgeEnc(object);return'\"'+object.replace(/\"/g,'\\\\\"').replace(/\\n/g,'\\\\n').replace(/\\r/g,'\\\\r')+'\"'}"
			"if((object===null)||(object.nodeType==1))return'null';if(object.constructor.toString().indexOf('Date')!=-1){return'new Date('+object.getTime()+')'}"
			"if(object.constructor.toString().indexOf('Array')!=-1){var res='[';var pre='';var len=object.length;for(var i=0;i<len;i++){var value=object[i];"
			"if(value!==undefined)value=Ti.App._JSON(value,bridge);if(value!==undefined){res+=pre+value;pre=', '}}return res+']'}var objects=[];"
			"for(var prop in object){var value=object[prop];if(value!==undefined){value=Ti.App._JSON(value,bridge)}"
			"if(value!==undefined){objects.push(Ti.App._JSON(prop,bridge)+': '+value)}}return'{'+objects.join(',')+'}'};"
		"Ti.App._dispatchEvent=function(type,evtid,evt){var listeners=Ti.App._listeners[type];if(listeners){for(var c=0;c<listeners.length;c++){var entry=listeners[c];if(entry.id==evtid){entry.callback.call(entry.callback,evt)}}}};Ti.App.fireEvent=function(name,evt){Ti._broker('App','fireEvent',{name:name,event:evt})};Ti.API.log=function(a,b){Ti._broker('API','log',{level:a,message:b})};Ti.API.debug=function(e){Ti._broker('API','log',{level:'debug',message:e})};Ti.API.error=function(e){Ti._broker('API','log',{level:'error',message:e})};Ti.API.info=function(e){Ti._broker('API','log',{level:'info',message:e})};Ti.API.fatal=function(e){Ti._broker('API','log',{level:'fatal',message:e})};Ti.API.warn=function(e){Ti._broker('API','log',{level:'warn',message:e})};Ti.App.addEventListener=function(name,fn){var listeners=Ti.App._listeners[name];if(typeof(listeners)=='undefined'){listeners=[];Ti.App._listeners[name]=listeners}var newid=Ti.pageToken+Ti.App._listener_id++;listeners.push({callback:fn,id:newid});Ti._broker('App','addEventListener',{name:name,id:newid})};Ti.App.removeEventListener=function(name,fn){var listeners=Ti.App._listeners[name];if(listeners){for(var c=0;c<listeners.length;c++){var entry=listeners[c];if(entry.callback==fn){listeners.splice(c,1);Ti._broker('App','removeEventListener',{name:name,id:entry.id});break}}}};";

 
@implementation TiUIWebView

-(void)unregister
{
	if (pageToken!=nil)
	{
		[[self.proxy _host] unregisterContext:self forToken:pageToken];
		RELEASE_TO_NIL(pageToken);
	}
}

-(void)dealloc
{
	if (webview!=nil)
	{
		webview.delegate = nil;
		
		// per doc, must stop webview load before releasing
		if (webview.loading)
		{
			[webview stopLoading];
		}
	}
	if (listeners!=nil)
	{
		RELEASE_TO_NIL(listeners);
	}
	RELEASE_TO_NIL(webview);
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(spinner);
	RELEASE_TO_NIL(basicCredentials);
	[self unregister];
	[super dealloc];
}


-(BOOL)isURLRemote
{
	NSString *scheme = [url scheme];
	return [scheme hasPrefix:@"http"];
}

-(UIView*)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
	/*	webview is a little _special_ and refuses to share events.
	 *	As such, we have to take the events away if we have event listeners
	 *	Or let webview has his entire cake. Through experimenting, if the
	 *	webview is interested, a subview or subsubview will be the target.
	 */

	UIView *view = [super hitTest:point withEvent:event];
	if ([self hasTouchableListener])
	{
		UIView *superview = [view superview];
		UIView *superduperview = [superview superview];
		if ((view == webview) || (superview == webview) || (superduperview == webview))
		{
			return self;
		}
	}
	
	return view;
}


-(UIWebView*)webview 
{
	if (webview==nil)
	{
		webview = [[UIWebView alloc] initWithFrame:CGRectMake(0, 0, 10, 1)];
		webview.delegate = self;
		webview.opaque = NO;
		webview.backgroundColor = [UIColor whiteColor];
       webview.contentMode = UIViewContentModeRedraw;
		[self addSubview:webview];
		
		// only show the loading indicator if it's a remote URL
		if ([self isURLRemote])
		{
			spinner = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
			[spinner setHidesWhenStopped:YES];
			spinner.autoresizingMask = UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin | UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
			[self addSubview:spinner];
			[spinner sizeToFit];
			[spinner startAnimating];
		}
	}
	return webview;
}

-(void)loadURLRequest:(NSMutableURLRequest*)request
{
	if (basicCredentials!=nil)
	{
		[request setValue:basicCredentials forHTTPHeaderField:@"Authorization"];
	}
	[[self webview] loadRequest:request];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (webview!=nil)
	{
		[TiUtils setView:webview positionRect:bounds];
		
		if (spinner!=nil)
		{
			spinner.center = self.center;
		}
		
		[[self webview] stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"document.body.style.minWidth='%fpx';document.body.style.minHeight='%fpx';",bounds.size.width-8,bounds.size.height-16]];
	}
}

-(NSURL*)fileURLToAppURL:(NSURL*)url_
{
	NSString *basepath = [[NSBundle mainBundle] resourcePath];
	NSString *urlstr = [url_ path];
	NSString *path = [urlstr stringByReplacingOccurrencesOfString:[NSString stringWithFormat:@"%@/",basepath] withString:@""];
	if ([path hasPrefix:@"/"])
	{
		path = [path substringFromIndex:1];
	}
	return [NSURL URLWithString:[[NSString stringWithFormat:@"app://%@/%@",TI_APPLICATION_ID,path] stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
}

-(NSString*)titaniumInjection
{
	NSMutableString *html = [[[NSMutableString alloc] init] autorelease];
	[html appendString:@"<script id='__ti_injection'>"];
	NSString *ti = [NSString stringWithFormat:@"%@%s",@"Ti","tanium"];
	[html appendFormat:@"window.%@={};window.Ti=%@;Ti.pageToken=%@;Ti.appId='%@';",ti,ti,pageToken,TI_APPLICATION_ID];
	[html appendString:kTitaniumJavascript];
	[html appendString:@"</script>"];
	return html;
}

-(void)prepareInjection
{
	RELEASE_TO_NIL(pageToken);
	[self unregister];
	pageToken = [[NSString stringWithFormat:@"%d",[self hash]] retain];
	[[self.proxy _host] registerContext:self forToken:pageToken];
}

-(void)loadHTML:(NSString*)content 
	   encoding:(NSStringEncoding)encoding 
	   textEncodingName:(NSString*)textEncodingName
	   mimeType:(NSString*)mimeType
	   baseURL:(NSURL*)baseURL
{
	// attempt to make well-formed HTML and inject in our Titanium bridge code
	// However, we only do this if the content looks like HTML
	NSRange range = [content rangeOfString:@"<html"];
	if (range.location!=NSNotFound)
	{
		[self prepareInjection];
		NSMutableString *html = [[NSMutableString alloc] initWithCapacity:[content length]+2000];

		NSRange nextRange = [content rangeOfString:@">" options:0 range:NSMakeRange(range.location, [content length]-range.location) locale:nil];
		if (nextRange.location!=NSNotFound)
		{
			[html appendString:[content substringToIndex:nextRange.location+1]];
			[html appendString:[self titaniumInjection]];
			[html appendString:[content substringFromIndex:nextRange.location+1]];
		}
		else
		{
			// oh well, just jack it in
			[html appendString:[self titaniumInjection]];
			[html appendString:content];
		}
		
		content = [html autorelease];
	}
	  
	NSURL *relativeURL = baseURL == nil ? [self fileURLToAppURL:url] : baseURL;
	
	if (url!=nil)
	{
		[[self webview] loadHTMLString:content baseURL:relativeURL];
	}
	else
	{
		[[self webview] loadData:[content dataUsingEncoding:encoding] MIMEType:mimeType textEncodingName:textEncodingName baseURL:relativeURL];
	}
	if (scalingOverride==NO)
	{
		[[self webview] setScalesPageToFit:NO];
	}
}


#pragma mark Public APIs

-(id)url
{
	if (webview!=nil)
	{
		return [[[webview request] URL] absoluteString];
	}
	return url;
}

- (void)reload:(id)args
{
	if (webview!=nil)
	{
		[webview reload];
	}
}

- (void)stopLoading:(id)args
{
	if (webview!=nil)
	{
		[webview stopLoading];
	}
}

- (void)goBack:(id)args
{
	if (webview!=nil)
	{
		[webview goBack];
	}
}

- (void)goForward:(id)args
{
	if (webview!=nil)
	{
		[webview goForward];
	}
}

-(id)loading
{
	if (webview!=nil)
	{
		return NUMBOOL([webview isLoading]);
	}
	return NUMBOOL(NO);
}

-(void)canGoBack:(NSMutableArray*)arg
{
	[arg addObject:NUMBOOL([webview canGoBack])];
}

-(void)canGoForward:(NSMutableArray*)arg
{
	[arg addObject:NUMBOOL([webview canGoForward])];
}

-(void)setBackgroundColor_:(id)color
{
	UIColor *c = UIColorWebColorNamed(color);
	[self setBackgroundColor:c];
	[[self webview] setBackgroundColor:c];
}

-(void)setAutoDetect_:(NSArray*)values
{
	UIDataDetectorTypes result = UIDataDetectorTypeNone;
	for (NSNumber * thisNumber in values)
	{
		result |= [TiUtils intValue:thisNumber];
	}
	[[self webview] setDataDetectorTypes:result];
}

-(void)setHtml_:(NSString*)content
{
	[self loadHTML:content encoding:NSUTF8StringEncoding textEncodingName:@"utf-8" mimeType:@"text/html" baseURL:nil];
}

-(void)setData_:(id)args
{
	RELEASE_TO_NIL(url);
	[self unregister];
	ENSURE_SINGLE_ARG(args,NSObject);
	if ([args isKindOfClass:[TiBlob class]])
	{
		if (scalingOverride==NO)
		{
			[[self webview] setScalesPageToFit:YES];
		}
		
		TiBlob *blob = (TiBlob*)args;
		TiBlobType type = [blob type];
		switch (type)
		{
			case TiBlobTypeData:
			{
				[[self webview] loadData:[blob data] MIMEType:[blob mimeType] textEncodingName:@"utf-8" baseURL:nil];
				break;
			}
			case TiBlobTypeFile:
			{
				url = [[NSURL fileURLWithPath:[blob path]] retain];
				[self loadURLRequest:[NSMutableURLRequest requestWithURL:url]];
				break;
			}
			default:
			{
				[self.proxy throwException:@"invalid blob type" subreason:[NSString stringWithFormat:@"expected either file or data blob, was: %d",type] location:CODELOCATION];
			}
		}
	}
	else if ([args isKindOfClass:[TiFile class]])
	{
		TiFile *file = (TiFile*)args;
		url = [[NSURL fileURLWithPath:[file path]] retain];
		if (scalingOverride==NO)
		{
			[[self webview] setScalesPageToFit:YES];
		}
		[self loadURLRequest:[NSMutableURLRequest requestWithURL:url]];
	}
	else
	{
		[self.proxy throwException:@"invalid datatype" subreason:[NSString stringWithFormat:@"expected a TiBlob, was: %@",[args class]] location:CODELOCATION];
	}
}

-(void)setScalesPageToFit_:(id)args
{
	// allow the user to overwrite the scale (usually if local)
	BOOL scaling = [TiUtils boolValue:args];
	scalingOverride = YES;
	[[self webview] setScalesPageToFit:scaling];
}

-(void)setUrl_:(id)args
{
	RELEASE_TO_NIL(url);
	ENSURE_SINGLE_ARG(args,NSString);
	
	url = [[TiUtils toURL:args proxy:(TiProxy*)self.proxy] retain];

	if (webview!=nil)
	{
		[self stopLoading:nil];
	}
	
	[self unregister];
	
	if ([self isURLRemote])
	{
		NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
		[self loadURLRequest:request];
		if (scalingOverride==NO)
		{
			[[self webview] setScalesPageToFit:YES];
		}
	}
	else
	{
		NSString *html = nil;
		NSStringEncoding encoding = NSUTF8StringEncoding;
		NSString *mimeType = [Mimetypes mimeTypeForExtension:[url path]];
		NSString *textEncodingName = @"utf-8";
		NSString *path = [url path];
		NSError *error = nil;
		NSURL *baseURL = [[url retain] autorelease];
		
		// first check to see if we're attempting to load a file from the 
		// filesystem and if so, and it exists, use that 
		if ([[NSFileManager defaultManager] fileExistsAtPath:path])
		{
			// per the Apple docs on what to do when you don't know the encoding ahead of a 
			// file read:
			// step 1: read and attempt to have system determine
			html = [NSString stringWithContentsOfFile:path usedEncoding:&encoding error:&error];
			if (html==nil && error!=nil)
			{
				//step 2: if unknown encoding, try UTF-8
				error = nil;
				html = [NSString stringWithContentsOfFile:path encoding:NSUTF8StringEncoding error:&error];
				if (html==nil && error!=nil)
				{
					//step 3: try an appropriate legacy encoding (if one) -- what's that? Latin-1?
					//at this point we're just going to fail
					NSLog(@"[ERROR] Couldn't determine the proper encoding. Make sure this file: %@ is UTF-8 encoded.",[path lastPathComponent]);
				}
				else
				{
					// if we get here, it succeeded using UTF8
					encoding = NSUTF8StringEncoding;
					textEncodingName = @"utf-8";
				}
			}
			else
			{
				error = nil;
				if (encoding == NSUTF8StringEncoding)
				{
					textEncodingName = @"utf-8";
				}
				else if (encoding == NSUTF16StringEncoding)
				{
					textEncodingName = @"utf-16";
				}
				else if (encoding == NSASCIIStringEncoding)
				{
					textEncodingName = @"us-ascii";
				}
				else if (encoding == NSISOLatin1StringEncoding)
				{
					textEncodingName = @"latin1";
				}
				else if (encoding == NSShiftJISStringEncoding)
				{
					textEncodingName = @"shift_jis";
				}
				else if (encoding == NSWindowsCP1252StringEncoding)
				{
					textEncodingName = @"windows-1251";
				}
				else 
				{
					NSLog(@"[WARN] I have no idea what the appropriate text encoding is for: %@. Please report this to Appcelerator support.",url);
				}
			}
			if ((error!=nil && [error code]==261) || [mimeType isEqualToString:(NSString*)svgMimeType])
			{//TODO: Shouldn't we be checking for an HTML mime type before trying to read? This is right now rather inefficient, but it
			//Gets the job done, with minimal reliance on extensions.
				// this is a different encoding than specified, just send it to the webview to load
				NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
				[self loadURLRequest:request];
				if (scalingOverride==NO)
				{
					[[self webview] setScalesPageToFit:YES];
				}
				return;
			}
			else if (error!=nil)
			{
				NSLog(@"[ERROR] error loading file: %@. Message was: %@",path,error);
				RELEASE_TO_NIL(url);
			}
		}
		else
		{
			// convert it into a app:// relative path to load the resource
			// from our application
			url = [[self fileURLToAppURL:url] retain];
			NSData *data = [TiUtils loadAppResource:url];
			if (data!=nil)
			{
				html = [[[NSString alloc] initWithData:data encoding:encoding] autorelease];
			}
		}
		if (html!=nil)
		{
			[self loadHTML:html encoding:encoding textEncodingName:textEncodingName mimeType:mimeType baseURL:baseURL];
		}
		else 
		{
			NSLog(@"[WARN] couldn't load URL: %@",url);
			RELEASE_TO_NIL(url);
		}
	}
}

-(void)setBasicAuthentication:(NSArray*)args
{
	ENSURE_ARG_COUNT(args,2);
	NSString *username = [args objectAtIndex:0];
	NSString *password = [args objectAtIndex:1];
	
	if (username==nil && password==nil)
	{
		RELEASE_TO_NIL(basicCredentials);
		return;
	}
	
	NSString *toEncode = [NSString stringWithFormat:@"%@:%@",username,password];
	const char *data = [toEncode UTF8String];
	size_t len = [toEncode length];
	
	size_t outsize = EstimateBas64EncodedDataSize(len);
	char *base64Result = malloc(sizeof(char)*outsize);
    size_t theResultLength = outsize;
	
    bool result = Base64EncodeData(data, len, base64Result, &theResultLength);
	if (result)
	{
		NSData *theData = [NSData dataWithBytes:base64Result length:theResultLength];
		free(base64Result);
		NSString *string = [[[NSString alloc] initWithData:theData encoding:NSUTF8StringEncoding] autorelease];
		RELEASE_TO_NIL(basicCredentials);
		basicCredentials = [[NSString stringWithFormat:@"Basic %@",string] retain];
		if (url!=nil)
		{
			[self setUrl_:[NSArray arrayWithObject:[url absoluteString]]];
		}
		return;
	}    
	free(base64Result);
}



-(void)evalJS:(NSArray*)args
{
	NSString *code = [args objectAtIndex:0];
	NSString* result = [[self webview] stringByEvaluatingJavaScriptFromString:code];
	// write the result into our blob
	if ([args count] > 1 && result!=nil)
	{
		TiBlob *blob = [args objectAtIndex:1];
		[blob setData:[result dataUsingEncoding:NSUTF8StringEncoding]];
	}
}

-(void)_evalJSOnThread:(NSArray*)args
{
	// this happens from evalJSAndWait to put us on the main thread
	NSString *code = [args objectAtIndex:0];
	NSMutableString *result = [args objectAtIndex:1];
	NSString *r = [[self webview] stringByEvaluatingJavaScriptFromString:code];
	[result appendString:r];
}

-(id)evalJSAndWait:(NSString *)code
{
	NSMutableString *result = [NSMutableString string];
	NSArray *args = [NSArray arrayWithObjects:code,result,nil];
	[self performSelectorOnMainThread:@selector(_evalJSOnThread:) withObject:args waitUntilDone:YES];
	return result;
}

// Webview appears to have an interesting quirk where the web content is always scaled/sized to just barely
// not fit within the bounds of its specialized scroll box, UNLESS you are sizing the view to 320px (full width).
// 'auto' width setting for web views is NOT RECOMMENDED as a result.  'auto' height is OK, and necessary
// when placing webviews with other elements.
-(CGFloat)autoHeightForWidth:(CGFloat)value
{
	CGRect oldBounds = [[self webview] bounds];
	[webview setBounds:CGRectMake(0, 0, MAX(value,10), 1)];
	CGFloat result = [[webview stringByEvaluatingJavaScriptFromString:@"document.height"] floatValue];
	[webview setBounds:oldBounds];
	return result;
}

-(CGFloat)autoWidthForWidth:(CGFloat)value
{
    CGRect oldBounds = [[self webview] bounds];
    CGFloat currentHeight = [[webview stringByEvaluatingJavaScriptFromString:@"document.height"] floatValue];
    [webview setBounds:CGRectMake(0, 0, 10, currentHeight)];
    CGFloat realWidth = [[webview stringByEvaluatingJavaScriptFromString:@"document.width"] floatValue];
    [webview setBounds:oldBounds];
    return (value < realWidth) ? value : realWidth;
}

#pragma mark WebView Delegate

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType
{
	return YES;
}

- (void)webViewDidStartLoad:(UIWebView *)webView
{
	if ([self.proxy _hasListeners:@"beforeload"])
	{
		NSDictionary *event = url == nil ? nil : [NSDictionary dictionaryWithObject:[url absoluteString] forKey:@"url"];
		[self.proxy fireEvent:@"beforeload" withObject:event];
	}
}

- (void)webViewDidFinishLoad:(UIWebView *)webView
{
	if (spinner!=nil)
	{
		[UIView beginAnimations:@"webspiny" context:nil];
		[UIView setAnimationDuration:0.3];
		[spinner removeFromSuperview];
		[UIView commitAnimations];
		[spinner autorelease];
		spinner = nil;
	}
	if ([self.proxy _hasListeners:@"load"])
	{
		NSDictionary *event = url == nil ? nil : [NSDictionary dictionaryWithObject:[self url] forKey:@"url"];
		[self.proxy fireEvent:@"load" withObject:event];
	}
	
	TiViewProxy * ourProxy = (TiViewProxy *)[self proxy];
	
	[ourProxy setNeedsRepositionIfAutoSized];
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error
{
	// this means the pending request has been cancelled and should be
	// safely squashed
	if ([[error domain] isEqual:NSURLErrorDomain] && [error code]==-999)
	{
		return;
	}
	
	NSLog(@"[ERROR] Error loading: %@, Error: %@",[self url],error);
	
	if ([self.proxy _hasListeners:@"error"])
	{
		NSMutableDictionary *event = [NSMutableDictionary dictionaryWithObject:[self url] forKey:@"url"];
		[event setObject:[error description] forKey:@"message"];
		[self.proxy fireEvent:@"error" withObject:event];
	}
}

#pragma mark TiEvaluator

- (TiHost*)host
{
	return [self.proxy _host];
}

- (void)evalFile:(NSString*)path
{
	NSURL *url_ = [path hasPrefix:@"file:"] ? [NSURL URLWithString:path] : [NSURL fileURLWithPath:path];
	
	if (![path hasPrefix:@"/"] && ![path hasPrefix:@"file:"])
	{
		NSURL *root = [[self host] baseURL];
		url_ = [NSURL fileURLWithPath:[NSString stringWithFormat:@"%@/%@",root,path]];
	}
	
	NSString *code = [NSString stringWithContentsOfURL:url_ encoding:NSUTF8StringEncoding error:nil];
	
	[self evalJS:[NSArray arrayWithObject:code]];
}

- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(id)thisObject_
{
	NSDictionary *event = (NSDictionary*)obj;
	NSString *name = [event objectForKey:@"type"];
	NSString *js = [NSString stringWithFormat:@"Ti.App._dispatchEvent('%@',%@,%@);",name,listener,[SBJSON stringify:event]];
	[[self webview] performSelectorOnMainThread:@selector(stringByEvaluatingJavaScriptFromString:) withObject:js waitUntilDone:NO];
}

- (id)preloadForKey:(id)key
{
	return nil;
}

- (KrollContext*)krollContext
{
	return nil;
}

- (void)registerProxy:(id)proxy
{
}

- (void)unregisterProxy:(id)proxy
{
}

@end

#endif