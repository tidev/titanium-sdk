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
#import "SBJSON.h"
#import "WebTableViewCell.h"

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

- (NSString *) stringValue;

@end

@implementation TableRowWrapper
@synthesize title,html,imageURL,imageWrapper,accessoryType,inputProxy;

- (UIImage *) image;
{
	if (imageWrapper != nil){
		return [imageWrapper imageBlob];
	}
	if (imageURL == nil) return nil;
	return [[TitaniumHost sharedHost] imageForResource:imageURL];
}

- (void) dealloc
{
	[title release]; [html release]; [imageURL release];
	[imageWrapper release]; [inputProxy release];
	[super dealloc];
}

- (NSString *) stringValue;
{
	NSString * accessoryString;
	switch (accessoryType) {
		case UITableViewCellAccessoryDetailDisclosureButton:
			accessoryString = @"hasDetail:true,hasChild:false";
			break;
		case UITableViewCellAccessoryDisclosureIndicator:
			accessoryString = @"hasDetail:false,hasChild:true";
			break;
		default:
			accessoryString = @"hasDetail:false,hasChild:false";
			break;
	}

	SBJSON * packer = [[SBJSON alloc] init];
	NSString * titleString;
	if (title != nil){
		titleString = [packer stringWithFragment:title error:nil];
	} else { titleString = @"null"; }

	NSString * htmlString;
	if (html != nil){
		htmlString = [packer stringWithFragment:html error:nil];
	} else { htmlString = @"null"; }

	NSString * imageURLString;
	if (imageURL != nil){
		imageURLString = [packer stringWithFragment:[imageURL absoluteString] error:nil];
	} else { imageURLString = @"null"; }

	NSString * inputProxyString;
	if (inputProxy != nil){
		inputProxyString = [@"Ti.UI._BTN." stringByAppendingString:[inputProxy token]];
	} else { inputProxyString = @"null"; }
	
	NSString * result = [NSString stringWithFormat:@"{%@,title:%@,html:%@,image:%@,input:%@}",
			accessoryString,titleString,htmlString,imageURLString,inputProxyString];
	[packer release];
}

@end

@interface TableSectionWrapper : NSObject
{
	NSString * header;
	NSString * footer;
	NSMutableArray * rowArray;
}
- (void) addRow: (TableRowWrapper *) newRow;
- (TableRowWrapper *) rowForIndex: (NSUInteger) rowIndex;
- (BOOL) accceptsHeader: (NSString *) newHeader footer: (NSString *) footer;

@property(nonatomic,readwrite,copy)		NSString * header;
@property(nonatomic,readwrite,copy)		NSString * footer;
@property(nonatomic,readonly,assign)	NSUInteger rowCount;

@end

@implementation TableSectionWrapper
@synthesize header,footer;

- (NSUInteger) rowCount;
{
	return [rowArray count];
}

- (void) addRow: (TableRowWrapper *) newRow;
{
	if (rowArray == nil){
		rowArray = [[NSMutableArray alloc] initWithObjects:newRow,nil];
	} else {
		[rowArray addObject:newRow];
	}
}

- (TableRowWrapper *) rowForIndex: (NSUInteger) rowIndex;
{
	if (rowIndex >= [rowArray count]) return nil;
	TableRowWrapper * result = [rowArray objectAtIndex:rowIndex];
	return result;
}

- (BOOL) accceptsHeader: (id) newHeader footer: (id) newFooter;
{
	BOOL result;
	if (newHeader == nil){
		result = YES;
	} else if (![newHeader isKindOfClass:[NSString class]]){
		result = NO;
	} else {
		result = ([newHeader length] == 0) || [newHeader isEqualToString:header];
	}
	if (result) {
		if ([newFooter isKindOfClass:[NSString class]]){
			[self setFooter:newFooter];
		} else if (newFooter == [NSNull null]) {
			[self setFooter:nil];
		}
	}
	return result;
}

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

	NSNumber * tableRowHeightObject = [inputState objectForKey:@"rowHeight"];
	
	if ([tableRowHeightObject respondsToSelector:@selector(intValue)]){
		tableRowHeight = [tableRowHeightObject intValue];
	}
	
	SEL stringSel = @selector(stringValue);
	Class stringClass = [NSString class];
//	Class blobClass = [TitaniumBlobWrapper class];

	id windowObject = [inputState objectForKey:@"_WINTKN"];
	if ([windowObject isKindOfClass:stringClass] && ([windowObject length] != 0)){
		[callbackWindowToken release];
		callbackWindowToken = [windowObject copy];
	}
	
	id pathObject = [inputState objectForKey:@"_PATH"];
	if ([pathObject isKindOfClass:stringClass] && ([pathObject length] != 0)){
		[callbackProxyPath release];
		callbackProxyPath = [pathObject copy];
	}

	[sectionArray release];
	sectionArray = [[NSMutableArray alloc] init];
	UiModule * theUiModule = (UiModule *)[[TitaniumHost sharedHost] moduleNamed:@"UiModule"];
	TableSectionWrapper * thisSection = nil;
	
	for(NSDictionary * thisEntry in dataEntries){
		if (![thisEntry isKindOfClass:dictClass]) continue;
		
		TableRowWrapper * thisRow = [[TableRowWrapper alloc] init];
		
		NSNumber * hasDetail = [thisEntry objectForKey:@"hasDetail"];
		if ([hasDetail respondsToSelector:boolSel] && [hasDetail boolValue]){
			[thisRow setAccessoryType:UITableViewCellAccessoryDetailDisclosureButton];
		} else {
			NSNumber * hasChild = [thisEntry objectForKey:@"hasChild"];
			if ([hasChild respondsToSelector:boolSel] && [hasChild boolValue]){
				[thisRow setAccessoryType:UITableViewCellAccessoryDisclosureIndicator];
			} else {
				[thisRow setAccessoryType:UITableViewCellAccessoryNone];
			}
		}
		
		id titleString = [thisEntry objectForKey:@"title"];
		if ([titleString respondsToSelector:stringSel]) titleString = [titleString stringValue];
		if ([titleString isKindOfClass:stringClass] && ([titleString length] != 0)){
			[thisRow setTitle:titleString];
		}
		
		id htmlString = [thisEntry objectForKey:@"html"];
		if ([htmlString respondsToSelector:stringSel]) htmlString = [htmlString stringValue];
		if ([htmlString isKindOfClass:stringClass] && ([htmlString length] != 0)){
			[thisRow setHtml:htmlString];
		}

		id imageString = [thisEntry objectForKey:@"image"];
		if ([imageString isKindOfClass:stringClass]){
			[thisRow setImageURL:[NSURL URLWithString:imageString relativeToURL:baseUrl]];
		}
		
		UIButtonProxy * thisInputProxy = [theUiModule proxyForObject:[thisEntry objectForKey:@"input"]];
		if (thisInputProxy != nil) [thisRow setInputProxy:thisInputProxy];
		
		id headerString = [thisEntry objectForKey:@"header"];
		if ([headerString respondsToSelector:stringSel]) headerString = [headerString stringValue];
		
		id footerString = [thisEntry objectForKey:@"footer"];
		if ([footerString respondsToSelector:stringSel]) footerString = [footerString stringValue];
		
		if ([thisSection accceptsHeader:headerString footer:footerString]){
			[thisSection addRow:thisRow];
		} else {
			thisSection = [[TableSectionWrapper alloc] init];
			if ([headerString isKindOfClass:stringClass])[thisSection setHeader:headerString];
			if ([footerString isKindOfClass:stringClass])[footerString setHeader:footerString];
			
			[thisSection addRow:thisRow];

			[sectionArray addObject:thisSection];
			[thisSection release];
		}
		
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


- (void)dealloc {
	[sectionArray release];
	[callbackProxyPath release];
	[callbackWindowToken release];
    [super dealloc];
}

#pragma mark Datasource methods

- (NSUInteger) rowCountBeforeSection: (NSInteger) section;
{
	int result=0;
	for (TableSectionWrapper * thisSection in sectionArray){
		if (section == 0) return result;
		result += [thisSection rowCount];
		section --;
	}
	return result;
}



- (TableSectionWrapper *) sectionForIndex: (NSInteger) section;
{
	NSInteger sectionCount = [sectionArray count];
	if ((section < 0) || (section >= sectionCount)) return nil;
	return [sectionArray objectAtIndex:section];
}


- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView;              // Default is 1 if not implemented
{
	NSInteger count = [sectionArray count];
	return MAX(count,1);
}

- (NSInteger)tableView:(UITableView *)table numberOfRowsInSection:(NSInteger)section;
{
	return [[self sectionForIndex:section] rowCount];
}

// Row display. Implementers should *always* try to reuse cells by setting each cell's reuseIdentifier and querying for available reusable cells with dequeueReusableCellWithIdentifier:
// Cell gets various attributes set automatically based on table (separators) and data source (accessory views, editing controls)



- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath;
{
	TableRowWrapper * ourRow = [[self sectionForIndex:[indexPath section]] rowForIndex:[indexPath row]];
	NSString * htmlString = [ourRow html];
	UITableViewCell * result = nil;

	if (htmlString != nil){ //HTML cell
		result = [tableView dequeueReusableCellWithIdentifier:@"html"];
		if (result == nil) {
			result = [[[WebTableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"html"] autorelease];
		}
		[[(WebTableViewCell *)result htmlLabel] loadHTMLString:htmlString baseURL:[[TitaniumHost sharedHost] appBaseUrl]];
		
	} else { //plain cell
		result = [tableView dequeueReusableCellWithIdentifier:@"text"];
		if (result == nil) result = [[[UITableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"text"] autorelease];
		[result setText:[ourRow title]];
	}

	[result setImage:[ourRow image]];
	[result setAccessoryType:[ourRow accessoryType]];
	[result setAccessoryView:[[ourRow inputProxy] nativeView]];

	return result;
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section;    // fixed font style. use custom view (UILabel) if you want something different
{
	return [[self sectionForIndex:section] header];
}

- (NSString *)tableView:(UITableView *)tableView titleForFooterInSection:(NSInteger)section;
{
	return [[self sectionForIndex:section] footer];	
}

#pragma mark Delegate methods
- (void)triggerActionForIndexPath: (NSIndexPath *)indexPath wasAccessory: (BOOL) accessoryTapped;
{
	if ((callbackProxyPath == nil) || (callbackWindowToken == nil)) return;
	int section = [indexPath section];
	int row = [indexPath row];
	int index = [self rowCountBeforeSection:section] + row;
	NSString * rowData = [[[self sectionForIndex:section] rowForIndex:row] stringValue];
	if (rowData==nil) rowData = @"{}";
	NSString * detail = accessoryTapped ? @"true" : @"false";

	NSString * triggeredCode = [[NSString alloc] initWithFormat:@"%@.handleRowClick({"
			"index:%d,row:%d,section:%d,rowData:%@,detail:%@})",callbackProxyPath,
			index,row,section,rowData,detail];
	
	[[TitaniumHost sharedHost] sendJavascript:triggeredCode toPageWithToken:callbackWindowToken];
}

- (NSIndexPath *)tableView:(UITableView *)tableView willSelectRowAtIndexPath:(NSIndexPath *)indexPath;
{
	return indexPath;
}

- (void)tableView:(UITableView *)tableView accessoryButtonTappedForRowWithIndexPath:(NSIndexPath *)indexPath;
{
	[self triggerActionForIndexPath:indexPath wasAccessory:YES];
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath;
{
	[self triggerActionForIndexPath:indexPath wasAccessory:NO];
	[tableView deselectRowAtIndexPath:indexPath animated:YES];
}


@end
