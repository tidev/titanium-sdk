//
//  TitaniumWebViewController.m
//  Titanium
//
//  Created by Blain Hamon on 6/17/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "TitaniumWebViewController.h"
#import "TitaniumHost.h"


@implementation TitaniumWebViewController

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	[super readState:inputState relativeToUrl:baseUrl];

	TitaniumHost * theTiHost = [TitaniumHost sharedHost];
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
//		NSString * newTitle = [inputState objectForKey:@"title"];
//		if (newTitle != nil) {
//			[self setTitle:newTitle];
//		}
//		
//		NSString * newTitleImagePath = [inputState objectForKey:@"titleImage"];
//		if (newTitleImagePath != nil) {
//			[self setTitleViewImagePath:newTitleImagePath];
//		}
//		
//		UITabBarItem * newTabBarItem = nil;
//		NSString * tabIconName = [inputState objectForKey:@"icon"];
//		if (tabIconName != nil) {
//			// comes in as ti://<name> or ti:<name> or path or app://path
//			if ([tabIconName hasPrefix:@"ti:"])
//			{
//				// this is a built-in system image
//				NSString *tabTemplate = [tabIconName substringFromIndex:3];
//				if ([tabTemplate characterAtIndex:0]=='/') tabTemplate = [tabTemplate substringFromIndex:1];
//				if ([tabTemplate characterAtIndex:0]=='/') tabTemplate = [tabTemplate substringFromIndex:1];
//				newTabBarItem = [[UITabBarItem alloc] initWithTabBarSystemItem:tabBarItemFromObject(tabTemplate) tag:0];
//			}
//			else
//			{
//				UIImage * tabImage = [theTiHost imageForResource:tabIconName];
//				if (tabImage != nil) {
//					newTabBarItem = [[UITabBarItem alloc] initWithTitle:[self title] image:tabImage tag:0];
//				}
//			}
//		}
//		
//		NSString * navTintName = [inputState objectForKey:@"barColor"];
//		[self setNavBarTint:UIColorWebColorNamed(navTintName)];
//		
//		NSString * backgroundColorName = [inputState objectForKey:@"backgroundColor"];
//		if ([backgroundColorName isKindOfClass:NSStringClass]){
//			[self setBackgroundColor:UIColorWebColorNamed(backgroundColorName)];
//		}
//		
//		NSString * backgroundImageName = [inputState objectForKey:@"backgroundImage"];
//		if ([backgroundImageName isKindOfClass:NSStringClass]){
//			[self setBackgroundImage:[theTiHost imageForResource:backgroundImageName]];
//		}
//		
//		id orientationObject = [inputState objectForKey:@"orientation"];
//		if (orientationObject != nil) {
//			allowedOrientations = orientationsFromObject(orientationObject);
//		}
//		
//		id hidesNavBarObject = [inputState objectForKey:@"hideNavBar"];
//		if (hidesNavBarObject == nil) hidesNavBarObject = [inputState objectForKey:@"_hideNavBar"];
//		if ([hidesNavBarObject respondsToSelector:@selector(boolValue)]) {
//			[self setHidesNavBar:[hidesNavBarObject boolValue]];
//		}
//		
//		id hidesTabBarObject = [inputState objectForKey:@"hideTabBar"];
//		if (hidesTabBarObject == nil) hidesTabBarObject = [inputState objectForKey:@"_hideTabBar"];
//		if ([hidesTabBarObject respondsToSelector:@selector(boolValue)]) {
//			[self setHidesBottomBarWhenPushed:[hidesTabBarObject boolValue]];
//		}
//		
//		id fullScreenObject = [inputState objectForKey:@"fullscreen"];
//		if ([fullScreenObject respondsToSelector:@selector(boolValue)]) {
//			[self setFullscreen:[fullScreenObject boolValue]];
//		}
//		
//		[self setStatusBarStyleObject:[inputState objectForKey:@"statusBarStyle"]];
//		
//		
//		if (newTabBarItem != nil) {
//			[self setTabBarItem:newTabBarItem];
//			[newTabBarItem release];
//		}
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




/*
 // The designated initializer.  Override if you create the controller programmatically and want to perform customization that is not appropriate for viewDidLoad.
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
        // Custom initialization
    }
    return self;
}
*/

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

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	
	// Release any cached data, images, etc that aren't in use.
}

- (void)viewDidUnload {
	// Release any retained subviews of the main view.
	// e.g. self.myOutlet = nil;
}


- (void)dealloc {
    [super dealloc];
}


@end
