/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import "TitaniumContentViewController.h"

#import "TitaniumWebViewController.h"
#import "TitaniumTableViewController.h"
#import "TitaniumScrollableViewController.h"
#import "TitaniumCompositeViewController.h"
#import "TitaniumImageViewController.h"
#import "TitaniumCoverFlowViewController.h"

#import "TitaniumViewController.h"
#import "TitaniumHost.h"

int nextContentViewToken = 0;
NSMutableDictionary * registery = nil;

@implementation TitaniumContentViewController
@synthesize titaniumWindowToken, primaryToken, nameString;
@synthesize preferredViewSize;

+ (NSString *) requestToken;
{
	return [NSString stringWithFormat:@"VIEW%d",nextContentViewToken++];
}

+ (void)registerContentViewController: (Class)controllerClass forToken:(NSString*)token
{
	if (registery == nil)
	{
		registery = [[NSMutableDictionary alloc] init];
	}
	[registery setObject:controllerClass forKey:token];
}


+ (TitaniumContentViewController *) viewControllerForState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	TitaniumContentViewController * result=nil;
	NSString * resultToken = nil;
	NSString * resultName = nil;
	//NOTE: ViewControllerFactory here.
	Class dictionaryClass = [NSDictionary class];

	if ([inputState isKindOfClass:dictionaryClass]){
		NSString * tokenString = [(NSDictionary *)inputState objectForKey:@"_TOKEN"];
		if([tokenString isKindOfClass:[NSString class]]){
			result = [[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
			if (result != nil) return result;
			resultToken = tokenString;
		}

		NSString * typeString = [(NSDictionary *)inputState objectForKey:@"_TYPE"];
		if ([typeString isKindOfClass:[NSString class]]) 
		{
			//TODO: refactor to register these from within the modules after 0.7
			if ([typeString isEqualToString:@"table"]){
				result = [[TitaniumTableViewController alloc] init];
			} else if ([typeString isEqualToString:@"scroll"]){
				result = [[TitaniumScrollableViewController alloc] init];
			} else if ([typeString isEqualToString:@"multi"]){
				result = [[TitaniumCompositeViewController alloc] init];
			} else if ([typeString isEqualToString:@"image"]){
				result = [[TitaniumImageViewController alloc] init];
			} else if ([typeString isEqualToString:@"coverflow"]){
				result = [[TitaniumCoverFlowViewController alloc] init];
			}
			else 
			{
				Class viewControllerClass = [registery objectForKey:typeString];
				if (viewControllerClass!=nil)
				{
					result = [[viewControllerClass alloc] init];
				}
			}
		}
		resultName = [(NSDictionary *)inputState objectForKey:@"name"];
	}
	if (result == nil){
		result = [[TitaniumWebViewController alloc] init];
	}
	if(resultToken == nil)resultToken = [self requestToken];

	[result setPrimaryToken:resultToken];
	
	[result setNameString:resultName];
	[result readState:inputState relativeToUrl:baseUrl];

	[[TitaniumHost sharedHost] registerContentViewController:result forKey:resultToken];

	return [result autorelease];
	
}

//- (void) setTitaniumWindowToken: (NSString *) newToken;
//{
//	NSLog(@"[%@ setTitaniumWindowToken: %@] (was %@)",self,newToken,titaniumWindowToken);
//	[titaniumWindowToken autorelease];
//	titaniumWindowToken = [newToken copy];
//}

- (BOOL) isShowingView: (TitaniumContentViewController *) contentView;
{
	return (self==contentView);
}

- (void)updateLayout: (BOOL)animated;
{
	
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	
	// Release any cached data, images, etc that aren't in use.
}

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	NSLog(@"[WARN] Shouldn't happen: readstate on the abstract contentViewController");
}

- (NSDictionary *) stateValue;
{
	return [NSDictionary dictionaryWithObjectsAndKeys:primaryToken,@"_TOKEN",nameString,@"name",nil];
}

- (void)release;
{
	[TitaniumHostContentViewLock lock];
	if([self retainCount]<2){
		[[TitaniumHost sharedHost] unregisterContentViewControllerForKey:primaryToken];
	}
	[super release];
	[TitaniumHostContentViewLock unlock];
}

- (void)dealloc {
	[titaniumWindowToken release];
	[primaryToken release];
	[nameString release];
    [super dealloc];
}

- (BOOL) hasToken: (NSString *) tokenString;
{
	return ([primaryToken isEqualToString:tokenString]);
}

- (void) addListeningWebContextToken: (NSString *)newContext;
{
	if(newContext==nil)return;
	if(listeningWebContextTokens == nil){
		listeningWebContextTokens = [[NSMutableSet alloc] initWithObjects:newContext,nil];
	} else {
		[listeningWebContextTokens addObject:newContext];
	}
}

- (void) removeListeningWebContextToken: (NSString *)oldContext;
{
	if(oldContext==nil)return;
	[listeningWebContextTokens removeObject:oldContext];
}

- (NSString *) javaScriptPath;
{
	return [@"Ti.UI._VIEW." stringByAppendingString:primaryToken];
}

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event;
{
	return;
	//To stop the event chain from oscillating.
}


@end
