/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIWebView.h"
#import "TiUtils.h"
#import "TiProxy.h"
#import "SBJSON.h"
#import "TiHost.h"
#import "Webcolor.h"
#import "TiBlob.h"
#import "TiFile.h"

NSString * const kTitaniumJavascript = @"Ti.App={};Ti.API={};Ti.App._listeners={};Ti.App._listener_id=1;Ti._broker=function(module,method,data){var url='ti://'+Ti.pageToken+'/'+module+'/'+method+'/'+Ti.App._JSON(data);var xhr=new XMLHttpRequest();xhr.open('GET',url,false);xhr.send()};Ti.App._JSON=function(object,bridge){var type=typeof object;switch(type){case'undefined':case'function':case'unknown':return undefined;case'number':case'boolean':return object;case'string':return'\"'+object.replace(/\"/g,'\\\\\"').replace(/\\n/g,'\\\\n').replace(/\\r/g,'\\\\r')+'\"'}if((object===null)||(object.nodeType==1))return'null';if(object.constructor.toString().indexOf('Date')!=-1){return'new Date('+object.getTime()+')'}if(object.constructor.toString().indexOf('Array')!=-1){var res='[';var pre='';var len=object.length;for(var i=0;i<len;i++){var value=object[i];if(value!==undefined)value=Ti.App._JSON(value,bridge);if(value!==undefined){res+=pre+value;pre=', '}}return res+']'}var objects=[];for(var prop in object){var value=object[prop];if(value!==undefined){value=Ti.App._JSON(value,bridge)}if(value!==undefined){objects.push(Ti.App._JSON(prop,bridge)+': '+value)}}return'{'+objects.join(',')+'}'};Ti.App._dispatchEvent=function(type,evtid,evt){var listeners=Ti.App._listeners[type];if(listeners){for(var c=0;c<listeners.length;c++){var entry=listeners[c];if(entry.id==evtid){entry.callback.call(entry.callback,evt)}}}};Ti.App.fireEvent=function(name,evt){Ti._broker('App','fireEvent',{name:name,event:evt})};Ti.API.debug=function(e){Ti._broker('API','log',{level:'debug',message:e})};Ti.API.error=function(e){Ti._broker('API','log',{level:'error',message:e})};Ti.API.info=function(e){Ti._broker('API','log',{level:'info',message:e})};Ti.API.fatal=function(e){Ti._broker('API','log',{level:'fatal',message:e})};Ti.API.warn=function(e){Ti._broker('API','log',{level:'warn',message:e})};Ti.App.addEventListener=function(name,fn){var listeners=Ti.App._listeners[name];if(typeof(listeners)=='undefined'){listeners=[];Ti.App._listeners[name]=listeners}var newid=Ti.pageToken+Ti.App._listener_id++;listeners.push({callback:fn,id:newid});Ti._broker('App','addEventListener',{name:name,id:newid})};Ti.App.removeEventListener=function(name,fn){var listeners=Ti.App._listeners[name];if(listeners){for(var c=0;c<listeners.length;c++){var entry=listeners[c];if(entry.callback==fn){listeners.splice(c,1);Ti._broker('App','removeEventListener',{name:name,id:entry.id});break}}}};";


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
		for (TiProxy *listener in listeners)
		{
		}
		RELEASE_TO_NIL(listeners);
	}
	RELEASE_TO_NIL(webview);
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(spinner);
	RELEASE_TO_NIL(appModule);
	[self unregister];
	[super dealloc];
}

-(BOOL)isURLRemote
{
	NSString *scheme = [url scheme];
	return [scheme hasPrefix:@"http"];
}

-(UIWebView*)webview 
{
	if (webview==nil)
	{
		webview = [[UIWebView alloc] initWithFrame:CGRectZero];
		webview.delegate = self;
		webview.opaque = NO;
		webview.backgroundColor = [UIColor whiteColor];
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

#pragma mark Public APIs

-(id)url
{
	return url;
}

-(void)setBackgroundColor_:(id)color
{
	UIColor *c = UIColorWebColorNamed(color);
	[self setBackgroundColor:c];
	[[self webview] setBackgroundColor:c];
}

-(void)setHtml_:(NSString*)content
{
	[self unregister];
	pageToken = [[NSString stringWithFormat:@"%d",[self hash]] retain];
	[[self.proxy _host] registerContext:self forToken:pageToken];
	NSMutableString *html = [[NSMutableString alloc] init];
	
	// attempt to make well-formed HTML and inject in our Titanium bridge code
	// However, we only do this if the content looks like HTML
	NSRange range = [content rangeOfString:@"<html"];
	if (range.location!=NSNotFound)
	{
		BOOL found = NO;
		NSRange nextRange = [content rangeOfString:@">" options:0 range:NSMakeRange(range.location, [content length]) locale:nil];
		if (nextRange.location!=NSNotFound)
		{
			[html appendString:[content substringToIndex:nextRange.location+1]];
			[html appendString:@"<script>"];
			[html appendFormat:@"Titanium={};Ti=Titanium;Ti.pageToken=%@;",pageToken];
			[html appendString:kTitaniumJavascript];
			[html appendString:@"</script>"];
			[html appendString:[content substringFromIndex:nextRange.location+1]];
			found = YES;
		}
		if (found==NO)
		{
			// oh well, just jack it in
			[html appendString:@"<script>"];
			[html appendFormat:@"Titanium={};Ti=Titanium;Ti.pageToken=%@;",pageToken];
			[html appendString:kTitaniumJavascript];
			[html appendString:@"</script>"];
			[html appendString:content];
		}
	}
	
	if (url!=nil)
	{
		[[self webview] loadHTMLString:html baseURL:url];
	}
	else
	{
		NSURL *baseurl = [[[self.proxy executionContext] host] baseURL];
		[[self webview] loadData:[html dataUsingEncoding:NSUTF8StringEncoding] MIMEType:@"text/html" textEncodingName:@"utf-8" baseURL:baseurl];
	}
	[[self webview] setScalesPageToFit:NO];
	[html release];
}

-(void)setData_:(id)args
{
	RELEASE_TO_NIL(url);
	[self unregister];
	ENSURE_SINGLE_ARG(args,NSObject);
	if ([args isKindOfClass:[TiBlob class]])
	{
		[[self webview] setScalesPageToFit:YES];
		
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
				[[self webview] loadRequest:[NSURLRequest requestWithURL:url]];
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
		[[self webview] setScalesPageToFit:YES];
		[[self webview] loadRequest:[NSURLRequest requestWithURL:url]];
	}
	else
	{
		[self.proxy throwException:@"invalid datatype" subreason:[NSString stringWithFormat:@"expected a TiBlob, was: %@",[args class]] location:CODELOCATION];
	}
}

-(void)setUrl_:(id)args
{
	RELEASE_TO_NIL(url);
	
	url = [[TiUtils toURL:args proxy:(TiProxy*)self.proxy] retain];
	
	[self unregister];
	
	if ([self isURLRemote])
	{
		NSURLRequest *request = [NSURLRequest requestWithURL:url];
		[[self webview] loadRequest:request];
		[[self webview] setScalesPageToFit:YES];
	}
	else
	{
		NSString *html = nil;
		NSData *data = [TiUtils loadAppResource:url];
		if (data==nil)
		{
			html = [NSString stringWithContentsOfURL:url encoding:NSUTF8StringEncoding error:nil];
		}
		else
		{
			html = [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
		}
		if (html!=nil)
		{
			[self setHtml_:html];	
		}
		else 
		{
			[[self webview] setScalesPageToFit:YES];
			[[self webview] loadRequest:[NSURLRequest requestWithURL:url]];
		}
	}
}

-(void)evalJS:(NSString*)code
{
	[[self webview] stringByEvaluatingJavaScriptFromString:code];
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
		NSDictionary *event = url == nil ? nil : [NSDictionary dictionaryWithObject:[url absoluteString] forKey:@"url"];
		[self.proxy fireEvent:@"load" withObject:event];
	}
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error
{
	if ([self.proxy _hasListeners:@"error"])
	{
		NSMutableDictionary *event = [NSMutableDictionary dictionaryWithObject:[url absoluteString] forKey:@"url"];
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
	
	[self evalJS:code];
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

@end
