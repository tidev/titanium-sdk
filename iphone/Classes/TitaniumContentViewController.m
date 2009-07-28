//
//  TitaniumContentViewController.m
//  Titanium
//
//  Created by Blain Hamon on 7/17/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "TitaniumContentViewController.h"
#import "TitaniumWebViewController.h"
#import "TitaniumTableViewController.h"
#import "TitaniumViewController.h"
#import "TitaniumHost.h"

int nextContentViewToken = 0;

@implementation TitaniumContentViewController
@synthesize titaniumWindowController, primaryToken;
@synthesize preferredViewSize;

+ (NSString *) requestToken;
{
	return [NSString stringWithFormat:@"VIEW%d",nextContentViewToken++];
}

+ (TitaniumContentViewController *) viewControllerForState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	TitaniumContentViewController * result=nil;
	NSString * resultToken = nil;
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
		if ([typeString isKindOfClass:[NSString class]]) {
			if ([typeString isEqualToString:@"table"]){
				result = [[TitaniumTableViewController alloc] init];
			}
		}
	}
	if (result == nil){
		result = [[TitaniumWebViewController alloc] init];
	}
	if(resultToken == nil)resultToken = [self requestToken];

	[result setPrimaryToken:resultToken];
	
	[result readState:inputState relativeToUrl:baseUrl];

	[[TitaniumHost sharedHost] registerContentViewController:result forKey:resultToken];

	return [result autorelease];
	
}

/*
// Implement loadView to create a view hierarchy programmatically, without using a nib.
- (void)loadView {
}
*/

/*
// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad {
    [super viewDidLoad];
}
*/

/*
// Override to allow orientations other than the default portrait orientation.
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    // Return YES for supported orientations
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}
*/
- (void)updateLayout: (BOOL)animated;
{
	
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	
	// Release any cached data, images, etc that aren't in use.
}

- (void)viewDidUnload {
	// Release any retained subviews of the main view.
	// e.g. self.myOutlet = nil;
}

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	NSLog(@"Shouldn't happen: readstate on the abstract contentViewController");
}

- (NSDictionary *) stateValue;
{
	return [NSDictionary dictionaryWithObject:primaryToken forKey:@"_TOKEN"];
}

- (void)dealloc {
	[[TitaniumHost sharedHost] unregisterContentViewControllerForKey:primaryToken];
	[primaryToken release];
    [super dealloc];
}

- (BOOL) hasToken: (NSString *) tokenString;
{
	return ([primaryToken isEqualToString:tokenString]);
}


@end
