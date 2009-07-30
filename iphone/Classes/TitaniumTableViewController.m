/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TitaniumTableViewController.h"
#import "TitaniumBlobWrapper.h"
#import "UiModule.h"
#import "SBJSON.h"
#import "WebTableViewCell.h"
#import "ValueTableViewCell.h"
#import "Webcolor.h"

@implementation TitaniumTableActionWrapper
@synthesize kind,index,animation;
@synthesize insertedRow, updatedRows;

- (void) dealloc
{
	[insertedRow release];
	[updatedRows release];
	[super dealloc];
}


@end


UIColor * checkmarkColor = nil;

@interface TableRowWrapper : NSObject
{
	NSString * title;
	NSString * html;
	NSString * value;
	NSURL * imageURL;
	TitaniumBlobWrapper * imageWrapper;
	UITableViewCellAccessoryType accessoryType;
	UIButtonProxy * inputProxy;

	BOOL isButton;

}
@property(nonatomic,readwrite,copy)	NSString * title;
@property(nonatomic,readwrite,copy)	NSString * html;
@property(nonatomic,readwrite,copy)	NSString * value;
@property(nonatomic,readwrite,copy)	NSURL * imageURL;
@property(nonatomic,readonly,copy)	UIImage * image;
@property(nonatomic,readwrite,retain)	TitaniumBlobWrapper * imageWrapper;
@property(nonatomic,readwrite,assign)	UITableViewCellAccessoryType accessoryType;
@property(nonatomic,readwrite,retain)	UIButtonProxy * inputProxy;
@property(nonatomic,readwrite,assign)	BOOL isButton;


- (void) useProperties: (NSDictionary *) propDict withUrl: (NSURL *) baseUrl;
- (NSString *) stringValue;

@end

@implementation TableRowWrapper
@synthesize title,html,imageURL,imageWrapper,accessoryType,inputProxy,isButton, value;

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
			accessoryString = @"hasDetail:true,hasChild:false,selected:false";
			break;
		case UITableViewCellAccessoryDisclosureIndicator:
			accessoryString = @"hasDetail:false,hasChild:true,selected:false";
			break;
		case UITableViewCellAccessoryCheckmark:
			accessoryString = @"hasDetail:false,hasChild:false,selected:true";
			break;
		default:
			accessoryString = @"hasDetail:false,hasChild:false,selected:false";
			break;
	}

	SBJSON * packer = [[SBJSON alloc] init];
	NSString * titleString;
	if (title != nil){
		titleString = [packer stringWithFragment:title error:nil];
	} else { titleString = @"null"; }

	NSString * valueString;
	if (value != nil){
		valueString = [packer stringWithFragment:value error:nil];
	} else { valueString = @"null"; }
	
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
	
	NSString * result = [NSString stringWithFormat:@"{%@,title:%@,html:%@,image:%@,input:%@,value:%@}",
			accessoryString,titleString,htmlString,imageURLString,inputProxyString,valueString];
	[packer release];
	return result;
}

- (void) useProperties: (NSDictionary *) propDict withUrl: (NSURL *) baseUrl;
{
	SEL boolSel = @selector(boolValue);
	SEL stringSel = @selector(stringValue);
	Class stringClass = [NSString class];
	
	NSNumber * hasDetail = [propDict objectForKey:@"hasDetail"];
	if ([hasDetail respondsToSelector:boolSel] && [hasDetail boolValue]){
		accessoryType = UITableViewCellAccessoryDetailDisclosureButton;
	} else {
		NSNumber * hasChild = [propDict objectForKey:@"hasChild"];
		if ([hasChild respondsToSelector:boolSel] && [hasChild boolValue]){
			[self setAccessoryType:UITableViewCellAccessoryDisclosureIndicator];
		} else {
			NSNumber * isSelected = [propDict objectForKey:@"selected"];
			if ([isSelected respondsToSelector:boolSel] && [isSelected boolValue]){
				[self setAccessoryType:UITableViewCellAccessoryCheckmark];
			} else {
				[self setAccessoryType:UITableViewCellAccessoryNone];
			}
		}
	}

	NSString * rowType = [propDict objectForKey:@"type"];
	if ([rowType isKindOfClass:stringClass]){
		isButton = [rowType isEqualToString:@"button"];
	}


	id titleString = [propDict objectForKey:@"title"];
	if ([titleString respondsToSelector:stringSel]) titleString = [titleString stringValue];
	if ([titleString isKindOfClass:stringClass] && ([titleString length] != 0)){
		[self setTitle:titleString];
	}

	id htmlString = [propDict objectForKey:@"html"];
	if ([htmlString respondsToSelector:stringSel]) htmlString = [htmlString stringValue];
	if ([htmlString isKindOfClass:stringClass] && ([htmlString length] != 0)){
		[self setHtml:htmlString];
	}

	id valueString = [propDict objectForKey:@"value"];
	if ([valueString respondsToSelector:stringSel]) valueString = [valueString stringValue];
	if ([valueString isKindOfClass:stringClass] && ([valueString length] != 0)){
		[self setValue:valueString];
	}
	
	id imageString = [propDict objectForKey:@"image"];
	if ([imageString isKindOfClass:stringClass]){
		[self setImageURL:[NSURL URLWithString:imageString relativeToURL:baseUrl]];
	}

	NSDictionary * inputProxyDict = [propDict objectForKey:@"input"];
	if ([inputProxyDict isKindOfClass:[NSDictionary class]]){
		UiModule * theUiModule = (UiModule *)[[TitaniumHost sharedHost] moduleNamed:@"UiModule"];
		UIButtonProxy * thisInputProxy = [theUiModule proxyForObject:inputProxyDict scan:YES recurse:YES];
		if (thisInputProxy != nil) [self setInputProxy:thisInputProxy];
	}
}


@end

@interface TableSectionWrapper : NSObject
{
	NSInteger groupNum;
	NSString * groupType;
	NSString * header;
	NSString * footer;
	NSMutableArray * rowArray;
	BOOL isOptionList;
	BOOL nullHeader;
}
- (id) initWithHeader: (NSString *) headerString footer: (NSString *) footerString;
- (void) addRow: (TableRowWrapper *) newRow;
- (TableRowWrapper *) rowForIndex: (NSUInteger) rowIndex;
- (BOOL) accceptsHeader: (id) newHeader footer: (id) newFooter;

@property(nonatomic,readwrite,copy)		NSString * header;
@property(nonatomic,readwrite,copy)		NSString * footer;
@property(nonatomic,readonly,assign)	NSUInteger rowCount;
@property(nonatomic,readwrite,assign)	NSInteger groupNum;
@property(nonatomic,readwrite,copy)		NSString * groupType;
@property(nonatomic,readwrite,assign)	BOOL isOptionList;
@property(nonatomic,readwrite,assign)	BOOL nullHeader;

@end

@implementation TableSectionWrapper
@synthesize header,footer,groupNum,groupType,isOptionList,nullHeader;

- (id) initWithHeader: (NSString *) headerString footer: (NSString *) footerString;
{
	self = [super init];
	if (self != nil) {
		groupNum = -1;
		Class stringClass = [NSString class];
		if ([headerString isKindOfClass:stringClass])[self setHeader:headerString];
		if ([footerString isKindOfClass:stringClass])[self setFooter:footerString];
	}
	return self;
}

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

- (void) removeRowAtIndex: (int) rowIndex;
{
	if((rowIndex < 0) || (rowIndex >= [rowArray count]))return;
	[rowArray removeObjectAtIndex:rowIndex];
}

- (TableRowWrapper *) rowForIndex: (NSUInteger) rowIndex;
{
	if (rowIndex >= [rowArray count]) return nil;
	TableRowWrapper * result = [rowArray objectAtIndex:rowIndex];
	return result;
}

- (BOOL) accceptsHeader: (id) newHeader footer: (id) newFooter;
{
	Class stringClass = [NSString class];
	BOOL result;
	
	if ((newHeader == nil) || ([rowArray count]==0)){
		result = YES;
	} else if (![newHeader isKindOfClass:stringClass]){
		result = NO;
	} else {
		result = ([newHeader length] == 0) || [newHeader isEqualToString:header];
	}
	if (result) {
		if ([newHeader isKindOfClass:stringClass]){
			[self setHeader:newHeader];
		} else if (newHeader == [NSNull null]){
			nullHeader = YES;
		}
		if ([newFooter isKindOfClass:stringClass]){
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

- (id) init
{
	self = [super init];
	if (self != nil) {
		sectionLock = [[NSRecursiveLock alloc] init];
		actionLock = [[NSLock alloc] init];
	}
	return self;
}

- (void) setView:(UIView *)newView;
{
	[super setView:newView];
	if(newView == nil){
		[tableView release];
		tableView = nil;
	}
}

- (void) loadView;
{
	CGRect startSize = CGRectMake(0, 0, preferredViewSize.width, preferredViewSize.height);
	UIView * rootView = [[UIView alloc] initWithFrame:startSize];
	[rootView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];

	[tableView release];
	tableView = [[UITableView alloc] initWithFrame:startSize style:tableStyle];
	[tableView setDelegate:self];	[tableView setDataSource:self];
	[tableView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
	if (tableRowHeight > 5){
		[tableView setRowHeight:tableRowHeight];
	}
	[rootView addSubview:tableView];

	[self setView:rootView];
	[rootView release];
}


- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	if (checkmarkColor == nil){
		checkmarkColor = [[UIColor alloc] initWithRed:(55.0/255.0) green:(79.0/255.0) blue:(130.0/255.0) alpha:1.0];
	}

	Class dictClass = [NSDictionary class];
	if (![inputState isKindOfClass:dictClass]){
		NSLog(@"SHOULDN'T HAPPEN: %@ is trying to read the state of a non-dictionary %@!",self,inputState);
		return;
	}

	Class arrayClass = [NSArray class];
	
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
		
	NSArray * groupEntries = [inputState objectForKey:@"_GRP"];
	NSArray * dataEntries = [inputState objectForKey:@"data"];
	BOOL isValidDataEntries = [dataEntries isKindOfClass:arrayClass];

	if (![groupEntries isKindOfClass:arrayClass]){
		if (isValidDataEntries){
			groupEntries = [NSArray arrayWithObject:[NSDictionary dictionaryWithObject:dataEntries forKey:@"data"]];
			//While it's tempting to just use inputState as a shortcut, that could lead to undocumented pain.
		} else {
			groupEntries = nil; //Just so we don't interate on the wrong things.
		}
	} else {
		if (isValidDataEntries){
			groupEntries = [groupEntries arrayByAddingObject:[NSDictionary dictionaryWithObject:dataEntries forKey:@"data"]];
			//While it's tempting to just use inputState as a shortcut, that could lead to undocumented pain.
		}
	}
	
	[sectionArray autorelease];
	sectionArray = [[NSMutableArray alloc] init];
	TableSectionWrapper * thisSectionWrapper = nil;
	
	int groupNum = 0;
	for(NSDictionary * thisSectionEntry in groupEntries){
		id headerString = [thisSectionEntry objectForKey:@"header"];
		if ([headerString respondsToSelector:stringSel]) headerString = [headerString stringValue];
		
		id footerString = [thisSectionEntry objectForKey:@"footer"];
		if ([footerString respondsToSelector:stringSel]) footerString = [footerString stringValue];
		
		if (![thisSectionWrapper accceptsHeader:headerString footer:footerString]){
			thisSectionWrapper = [[TableSectionWrapper alloc] initWithHeader:headerString footer:footerString];
			[sectionArray addObject:thisSectionWrapper];
			[thisSectionWrapper release];
		}

		BOOL isButtonGroup = NO;
		NSString * rowType = [thisSectionEntry objectForKey:@"type"];
		if ([rowType isKindOfClass:stringClass]){
			[thisSectionWrapper setGroupType:rowType];
			if([rowType isEqualToString:@"button"]){
				isButtonGroup = YES;
			} else if ([rowType isEqualToString:@"option"]){
				[thisSectionWrapper setIsOptionList:YES];
			}
			[thisSectionWrapper setGroupNum:groupNum];
		}
		groupNum++;
		
		NSArray * thisDataArray = [thisSectionEntry objectForKey:@"data"];
		if ([thisDataArray isKindOfClass:arrayClass]){
			for(NSDictionary * thisEntry in thisDataArray){
				if (![thisEntry isKindOfClass:dictClass]) continue;
				
				TableRowWrapper * thisRow = [[[TableRowWrapper alloc] init] autorelease];
				if (isButtonGroup) [thisRow setIsButton:YES];
				
				[thisRow useProperties:thisEntry withUrl:baseUrl];
				
				id headerString = [thisEntry objectForKey:@"header"];
				if ([headerString respondsToSelector:stringSel]) headerString = [headerString stringValue];
				
				id footerString = [thisEntry objectForKey:@"footer"];
				if ([footerString respondsToSelector:stringSel]) footerString = [footerString stringValue];
				
				if ([thisSectionWrapper accceptsHeader:headerString footer:footerString]){
					[thisSectionWrapper addRow:thisRow];
				} else {
					thisSectionWrapper = [[TableSectionWrapper alloc] initWithHeader:headerString footer:footerString];
					
					[thisSectionWrapper addRow:thisRow];

					[sectionArray addObject:thisSectionWrapper];
					[thisSectionWrapper release];
				}
			}
		}
		
		
	}
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	
	// Release any cached data, images, etc that aren't in use.
}


- (void)dealloc {
	[blessedPath release];
	[sectionArray release];
	[callbackProxyPath release];
	[callbackWindowToken release];
	[sectionLock release];
	[tableView release];
	
	[actionQueue release];
	[actionLock release];
	
    [super dealloc];
}

- (void)willUpdateLayout: (BOOL)animated;
{
	[sectionLock lock];
	UITableViewCell * targetCell = nil;
	for (UITableViewCell * thisCell in [tableView visibleCells]){
		UIView * thisAccessoryView = [thisCell accessoryView];
		if ([thisAccessoryView isFirstResponder]){
			targetCell = thisCell;
			break;
		}
		for (UIView * thisAccessorySubView in [thisAccessoryView subviews]){
			if ([thisAccessorySubView isFirstResponder]){
				targetCell = thisCell;
				break;
			}			
		}
	}
	if(targetCell != nil){
		[blessedPath release];
		blessedPath = [[tableView indexPathForCell:targetCell] retain];
	}
	[sectionLock unlock];
	
}

- (void)updateLayout: (BOOL)animated;
{
	if(blessedPath != nil){
		[tableView scrollToRowAtIndexPath:blessedPath atScrollPosition:UITableViewScrollPositionMiddle animated:animated];
		[blessedPath release];
		blessedPath = nil;
	}
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

- (NSIndexPath *) indexPathFromInt: (int) index;
{
	int section = 0;
	int rowCount = 0;
	for(TableSectionWrapper * thisSection in sectionArray){
		rowCount = [thisSection rowCount];
		if (rowCount > index){
			return [NSIndexPath indexPathForRow:index inSection:section];
		}
		section++;
		index -= rowCount;
	}
	return nil;
}

- (NSIndexPath *) indexPathFromDict: (NSDictionary *) inputDict;
{
	int section = 0;
	BOOL validSection = NO;
	int row = 0;
	BOOL validRow = NO;
	
	NSNumber * sectionNumber = [inputDict objectForKey:@"section"];
	if([sectionNumber respondsToSelector:@selector(intValue)]){
		section = [sectionNumber intValue];
		validSection = YES;
	}
	
	NSNumber * rowNumber = [inputDict objectForKey:@"row"];
	if([rowNumber respondsToSelector:@selector(intValue)]){
		row = [rowNumber intValue];
		validRow = YES;
	}
	
	if(validRow && validSection){
		return [NSIndexPath indexPathForRow:row inSection:section];
	}
	
	NSNumber * indexNumber = [inputDict objectForKey:@"index"];
	if([indexNumber respondsToSelector:@selector(intValue)]){
		int index = [indexNumber intValue];
		return [self indexPathFromInt:index];
	}
	return [NSIndexPath indexPathForRow:row inSection:section];
}


- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView;              // Default is 1 if not implemented
{
	[sectionLock lock];
	NSInteger count = [sectionArray count];
	[sectionLock unlock];
	return MAX(count,1);
}

- (NSInteger)tableView:(UITableView *)table numberOfRowsInSection:(NSInteger)section;
{
	[sectionLock lock];
	NSInteger rowCount = [[self sectionForIndex:section] rowCount];
	[sectionLock unlock];
	return rowCount;
}

// Row display. Implementers should *always* try to reuse cells by setting each cell's reuseIdentifier and querying for available reusable cells with dequeueReusableCellWithIdentifier:
// Cell gets various attributes set automatically based on table (separators) and data source (accessory views, editing controls)



- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath;
{
	[sectionLock lock];
	TableSectionWrapper * sectionWrapper = [self sectionForIndex:[indexPath section]];
	TableRowWrapper * rowWrapper = [sectionWrapper rowForIndex:[indexPath row]];
	NSString * htmlString = [rowWrapper html];
	UITableViewCellAccessoryType ourType = [rowWrapper accessoryType];
	UITableViewCell * result = nil;

	if (htmlString != nil){ //HTML cell
		result = [tableView dequeueReusableCellWithIdentifier:@"html"];
		if (result == nil) {
			result = [[[WebTableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"html"] autorelease];
		}
		[[(WebTableViewCell *)result htmlLabel] loadHTMLString:htmlString baseURL:[[TitaniumHost sharedHost] appBaseUrl]];
		
	} else if ([rowWrapper isButton]) {
		result = [tableView dequeueReusableCellWithIdentifier:@"button"];
		if (result == nil){
			result = [[[UITableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"button"] autorelease];
			[result setTextAlignment:UITextAlignmentCenter];
		}
		[result setText:[rowWrapper title]];
		
	} else { //plain cell
		NSString * valueString = [rowWrapper value];
		if (valueString == nil){
			result = [tableView dequeueReusableCellWithIdentifier:@"text"];
			if (result == nil) result = [[[UITableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"text"] autorelease];
		} else {
			UILabel * valueLabel;
			result = [tableView dequeueReusableCellWithIdentifier:@"value"];
			if (result == nil){
				result = [[[ValueTableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"value"] autorelease];
				valueLabel = [(ValueTableViewCell *)result valueLabel];
				[valueLabel setTextColor:checkmarkColor];
			} else {
				valueLabel = [(ValueTableViewCell *)result valueLabel];
			}
			[valueLabel setText:valueString];
		}
		[result setText:[rowWrapper title]];
		UIColor * textColor = [UIColor blackColor];
		if (ourType == UITableViewCellAccessoryCheckmark) textColor = checkmarkColor;
		[result setTextColor:textColor];
	}

	[result setImage:[rowWrapper image]];
	[result setAccessoryType:ourType];
	[result setAccessoryView:[[rowWrapper inputProxy] nativeView]];

	[sectionLock unlock];
	return result;
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section;    // fixed font style. use custom view (UILabel) if you want something different
{
	[sectionLock lock];
	NSString * result = [[[[self sectionForIndex:section] header] copy] autorelease];
	[sectionLock unlock];
	return result;
}

- (NSString *)tableView:(UITableView *)tableView titleForFooterInSection:(NSInteger)section;
{
	[sectionLock lock];
	NSString * result = [[[[self sectionForIndex:section] footer] copy] autorelease];
	[sectionLock unlock];
	return result;
}


#pragma mark Delegate methods
- (void)triggerActionForIndexPath: (NSIndexPath *)indexPath wasAccessory: (BOOL) accessoryTapped;
{
	if ((callbackProxyPath == nil) || (callbackWindowToken == nil)) return;
	int section = [indexPath section];
	int row = [indexPath row];
	int index = [self rowCountBeforeSection:section] + row;
	TableSectionWrapper * sectionWrapper = [self sectionForIndex:section];
	NSString * rowData = [[sectionWrapper rowForIndex:row] stringValue];
	if (rowData==nil) rowData = @"{}";
	NSString * detail = accessoryTapped ? @"true" : @"false";

	NSString * triggeredCode = [[NSString alloc] initWithFormat:@".onClick({type:'click',"
			"index:%d,row:%d,section:%d,rowData:%@,detail:%@})",
			index,row,section,rowData,detail];
	
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	[theHost sendJavascript:[callbackProxyPath stringByAppendingString:triggeredCode] toPageWithToken:callbackWindowToken];
	int groupNum = [sectionWrapper groupNum];
	
	if (groupNum >= 0) {
		NSString * groupCode = [[NSString alloc] initWithFormat:@"%@._GRP[%d]%@",callbackProxyPath,groupNum,triggeredCode];
		[theHost sendJavascript:groupCode toPageWithToken:callbackWindowToken];
		[groupCode release];
	}
	[triggeredCode release];
}

- (NSIndexPath *)tableView:(UITableView *)tableView willSelectRowAtIndexPath:(NSIndexPath *)indexPath;
{
	return indexPath;
}

- (void)tableView:(UITableView *)tableView accessoryButtonTappedForRowWithIndexPath:(NSIndexPath *)indexPath;
{
	[sectionLock lock];
	[self triggerActionForIndexPath:indexPath wasAccessory:YES];
	[sectionLock unlock];
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath;
{
	[sectionLock lock];
	[tableView deselectRowAtIndexPath:indexPath animated:YES];

	int section = [indexPath section];
	int blessedRow = [indexPath row];
	TableSectionWrapper * sectionWrapper = [self sectionForIndex:section];

	if ([sectionWrapper isOptionList] && ![[sectionWrapper rowForIndex:blessedRow] isButton]){
		for (int row=0;row<[sectionWrapper rowCount];row++) {
			TableRowWrapper * rowWrapper = [sectionWrapper rowForIndex:row];
			UITableViewCellAccessoryType rowType = [rowWrapper accessoryType];
			BOOL isBlessed = (row == blessedRow);
			BOOL isUpdated = NO;
			
			UITableViewCell * thisCell = [tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:row inSection:section]];
			
			if (!isBlessed && (rowType == UITableViewCellAccessoryCheckmark)) {
				[rowWrapper setAccessoryType:UITableViewCellAccessoryNone];
				if (thisCell != nil){
					[thisCell setAccessoryType:UITableViewCellAccessoryNone];
					[thisCell setTextColor:[UIColor blackColor]];
					isUpdated = YES;
				}
			} else if (isBlessed && (rowType == UITableViewCellAccessoryNone)){
				[rowWrapper setAccessoryType:UITableViewCellAccessoryCheckmark];
				if (thisCell != nil){
					[thisCell setAccessoryType:UITableViewCellAccessoryCheckmark];
					[thisCell setTextColor:checkmarkColor];
					isUpdated = YES;
				}
			}
			
			if (isUpdated && [thisCell respondsToSelector:@selector(updateState:)]){
				[(WebTableViewCell *)thisCell updateState:YES];
			}
			
		}
	}

	[self triggerActionForIndexPath:indexPath wasAccessory:NO];
	[sectionLock unlock];
}

#pragma mark UIModule methods

- (void)enqueueAction: (TitaniumTableActionWrapper *) newAction;
{
	[actionLock lock];
	if(actionQueue == nil){
		actionQueue = [[NSMutableArray alloc] initWithObjects:newAction,nil];
		[self performSelectorOnMainThread:@selector(performActions) withObject:nil waitUntilDone:NO];
	}else{
		[actionQueue addObject:newAction];
	}
	[actionLock unlock];
}

/*	Blain's sit-down-and-think-about-this: Changing rows.
 *	
 *	At first, I thought it'd be a case of simply mapping things on. But the issue is that the GroupedView is explicit in the groupings. TableView is implicit in the groupings.
 *	So while GroupedView calls should only insert, delete, or modify the row or section mentioned, TableView needs to handle some odd situations:
 *	
 *	Delete:
 *	If the section has more than 1 row, delete simply deletes the row.
 *	If the section has only 1 row (which is being deleted), delete the section as well.
 *		If the previous section and the next section have the same header and are not nullHeaders, merge the two sections (IE, create all the rows as the bottom of the first section,
 *		and remove all of the second section.
 *	
 *	Insert:
 *	If the row is to be inserted at the beginning of the section, or if the IndexPath is nil (after the end of the table), look at the section before it.
 *		If the previousSection exists (Will be nil in the case of inserting at the first section), see if the previousSection will accept the row. If yes, insert there and return.
 *		If the currentSection exists (Will be nil if at the end of the table), see if the currentSection will accept the row. If yes, 
 *	
 *	
 *	
 *	
 *	
 *	
 */

- (void)performActions;
{
	[actionLock lock];
	for(TitaniumTableActionWrapper * thisAction in actionQueue){
		TitaniumTableAction kind = [thisAction kind];
		NSIndexPath * ourPath;

		switch (kind) {
			case TitaniumTableActionInsertRow:
			case TitaniumTableActionDeleteRow:
				ourPath = [self indexPathFromInt:[thisAction index]];
				if(ourPath != nil){
					TableSectionWrapper * ourWrapper = [self sectionForIndex:[ourPath section]];
					NSArray * ourArray = [[NSArray alloc] initWithObjects:ourPath,nil];
					if(kind == TitaniumTableActionDeleteRow){
						//TODO: Handle the restructuring of the sections based on headers.						
						[ourWrapper removeRowAtIndex:[ourPath row]];
						[tableView deleteRowsAtIndexPaths:ourArray withRowAnimation:[thisAction animation]];
					} else {
						
					}
					[ourArray release];
				}
				
				break;
			case TitaniumTableActionUpdateRows:
				
				
				break;
			default:
				break;
		}
	}
	[actionQueue release];
	actionQueue = nil;
	[actionLock unlock];
}

- (void)deleteRowsBundle: (NSArray *) rowContainers;
{
	NSNumber * index = [rowContainers objectAtIndex:0];
	UITableViewRowAnimation animation = UITableViewRowAnimationFade;
	
	if([rowContainers count]>1){
		NSNumber * animationStyleObject = [[rowContainers objectAtIndex:1] objectForKey:@"animationStyle"];
		animation = [animationStyleObject intValue];
	}
	
	[sectionLock lock];
	
	NSIndexPath * doomedPath = [self indexPathFromInt:[index intValue]];
	if (doomedPath != nil){
	
		TableSectionWrapper * doomedSection = [self sectionForIndex:[doomedPath section]];
		[doomedSection removeRowAtIndex:[doomedPath row]];

		NSArray * doomedArray = [[NSArray alloc] initWithObjects:doomedPath,nil];
		[tableView deleteRowsAtIndexPaths:doomedArray withRowAnimation:animation];
		[doomedArray release];
	}
	
	[sectionLock unlock];	
}

- (void)updateRowsBundle: (NSArray *) rowContainers;
{
	NSNumber * index = [rowContainers objectAtIndex:0];
	UITableViewRowAnimation animation = UITableViewRowAnimationNone;
	
	if([rowContainers count]>1){
		NSNumber * animationStyleObject = [[rowContainers objectAtIndex:1] objectForKey:@"animationStyle"];
		animation = [animationStyleObject intValue];
	}
	
	[sectionLock lock];
	
	NSIndexPath * doomedPath = [self indexPathFromInt:[index intValue]];
	if (doomedPath != nil){		
		NSArray * doomedArray = [[NSArray alloc] initWithObjects:doomedPath,nil];
		[tableView deleteRowsAtIndexPaths:doomedArray withRowAnimation:animation];

		[doomedArray release];
	}
	
	[sectionLock unlock];	
}

@end
