//
//  TitaniumTableViewController.m
//  Titanium
//
//  Created by Blain Hamon on 6/17/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "TitaniumTableViewController.h"
#import "TitaniumBlobWrapper.h"
#import "UiModule.h"

@interface TableRowWrapper : NSObject
{
	NSString * title;
	NSString * html;
	NSURL * imageURL;
	TitaniumBlobWrapper * imageWrapper;
	UITableViewCellAccessoryType accessoryType;
	UIButtonProxy * inputProxy;
}
@property(nonatomic,readwrite,copy)	NSString * title;
@property(nonatomic,readwrite,copy)	NSString * html;
@property(nonatomic,readwrite,copy)	NSURL * imageURL;
@property(nonatomic,readonly,copy)	UIImage * image;
@property(nonatomic,readwrite,retain)	TitaniumBlobWrapper * imageWrapper;
@property(nonatomic,readwrite,assign)	UITableViewCellAccessoryType accessoryType;
@property(nonatomic,readwrite,retain)	UIButtonProxy * inputProxy;

@end

@implementation TableRowWrapper
@synthesize title,html,imageURL,imageWrapper,accessoryType,inputProxy;

- (UIImage *) image;
{
	if (imageWrapper != nil){
		return [imageWrapper imageBlob];
	}
	return [[TitaniumHost sharedHost] imageForResource:imageURL];
}

@end

@interface TableSectionWrapper : NSObject
{
	NSString * header;
	NSString * footer;
	NSMutableArray * rowArray;
	NSUInteger rowCount; //This way, we don't have to fill the tail of the array with nsnull.
}
- (void) insertRow: (TableRowWrapper *) newRow;
- (void) insertRow: (TableRowWrapper *) newRow atIndex: (NSUInteger) newIndex;
- (BOOL) matchesHeader: (NSString *) newHeader;

@property(nonatomic,readwrite,copy)		NSString * header;
@property(nonatomic,readwrite,copy)		NSString * footer;
@property(nonatomic,readwrite,assign)	NSUInteger rowCount;

@end




@implementation TitaniumTableViewController

+ (TitaniumViewController *) viewController;
{
	return [[[self alloc] init] autorelease];
}

- (void) loadView;
{
	UIView * rootView = [[UIView alloc] init];
	[rootView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];

	UITableView * tableView = [[UITableView alloc] initWithFrame:CGRectZero style:tableStyle];
	[tableView setDelegate:self];	[tableView setDataSource:self];
	[tableView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
	if (tableRowHeight > 5){
		[tableView setRowHeight:tableRowHeight];
	}
	[rootView addSubview:tableView];

	[self setContentView:tableView];
	[self setView:rootView];
	[tableView release];
	[rootView release];
}


- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	[super readState:inputState relativeToUrl:baseUrl];

	Class dictClass = [NSDictionary class];
	if (![inputState isKindOfClass:dictClass]){
		NSLog(@"SHOULDN'T HAPPEN: %@ is trying to read the state of a non-dictionary %@!",self,inputState);
		return;
	}

	Class arrayClass = [NSArray class];
	NSArray * dataEntries = [inputState objectForKey:@"data"];

	if (![dataEntries isKindOfClass:arrayClass]){
		NSLog(@"SHOULDN'T HAPPEN: %@ is trying to read the data which isn't an array %@!",self,dataEntries);
		return;
	}
	
	NSNumber * isGrouped = [inputState objectForKey:@"grouped"];
	SEL boolSel = @selector(boolValue);

	if ([isGrouped respondsToSelector:boolSel]){
		tableStyle = [isGrouped boolValue] ? UITableViewStyleGrouped : UITableViewStylePlain;
	} else {
		tableStyle = UITableViewStylePlain;
	}

	Class stringClass = [NSString class];
	Class blobClass = [TitaniumBlobWrapper class];

	for(NSDictionary * thisEntry in dataEntries){
		if (![thisEntry isKindOfClass:dictClass]) continue;
		
		NSNumber * hasDetail = [thisEntry objectForKey:@"hasChild"];
		
		if ([hasDetail respondsToSelector:boolSel] && [hasDetail boolValue]){
			
		}
		NSNumber * hasChild = [thisEntry objectForKey:@"hasChild"];
		
		
		
	}




	
	
	
	
	
	
	
//	NSString * newUrlString = nil;
//	NSURL * newUrl = nil;
//	
//	if ([inputState isKindOfClass:NSStringClass]){
//		newUrlString = inputState;
//	} else if ([inputState isKindOfClass:[NSURL class]]){
//		newUrl = inputState;
//	} else if ([inputState isKindOfClass:[NSDictionary class]]) {
//		
//		NSString * newUrlElement = [inputState objectForKey:@"url"];
//		if (newUrlElement != nil) {
//			newUrlString = newUrlElement;
//		}	
//	}
//	
//	if([newUrlString isKindOfClass:NSStringClass]){
//		if (baseUrl != nil){
//			newUrl = [NSURL URLWithString:newUrlString relativeToURL:baseUrl];
//		} else if (currentContentURL != nil){
//			newUrl = [NSURL URLWithString:newUrlString relativeToURL:currentContentURL];
//		} else {
//			newUrl = [NSURL URLWithString:newUrlString relativeToURL:[[TitaniumHost sharedHost] appBaseUrl]];
//		}
//	}
//	
//	if(newUrl != nil){
//		[self setCurrentContentURL:newUrl];
//	} else {
//		//Now what, doctor?
//	}
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


- (void)dealloc {
    [super dealloc];
}


@end
