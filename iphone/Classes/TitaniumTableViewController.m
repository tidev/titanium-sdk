/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TitaniumTableViewController.h"
#import "TitaniumCellWrapper.h"

#import "TitaniumWebViewController.h"
#import "TitaniumHost.h"

#import "WebTableViewCell.h"
#import "ValueTableViewCell.h"
#import "ComplexTableViewCell.h"

#import "NativeControlProxy.h"
#import "SearchBarControl.h"


#import "Logging.h"

@interface TitaniumTitleView : UIView
{
	NSString * text;
	UIColor * textColor;
	UITextAlignment textAlignment;
}

@property(nonatomic,readwrite,retain)	UIColor * textColor;
@property(nonatomic,readwrite,retain)	NSString * text;
@property(nonatomic) UITextAlignment textAlignment;    // default is UITextAlignmentLeft

@end

@implementation TitaniumTitleView
@synthesize text,textColor,textAlignment;

- (id)initWithFrame:(CGRect)frame;          // default initializer
{
	self = [super initWithFrame:frame];
	if (self != nil) {
		[self setOpaque:NO];
		[self setBackgroundColor:[UIColor clearColor]];
	}
	return self;
}

- (void)drawRect:(CGRect)rect;
{
	[textColor set];
	CGRect labelBounds = [self bounds];
	UIFont * fontToUse = nil;
	if(textAlignment == UITextAlignmentLeft){
		labelBounds.origin.y += 8;
		labelBounds.size.height -= 8;
		labelBounds.origin.x += 18;
		labelBounds.size.width -= 18;
		fontToUse = [UIFont boldSystemFontOfSize:[UIFont labelFontSize]];
	} else if (textAlignment == UITextAlignmentCenter) {
		labelBounds.origin.y += 7;
		labelBounds.size.height -= 7;
		fontToUse = [UIFont systemFontOfSize:[UIFont labelFontSize]-1.5];
	}
	[text drawInRect:labelBounds withFont:fontToUse lineBreakMode:UILineBreakModeTailTruncation alignment:textAlignment];
}

- (void) dealloc
{
	[text release];
	[textColor release];
	[super dealloc];
}

@end







TitaniumCellWrapper * TitaniumCellWithData(NSDictionary * rowData, NSURL * baseUrl, TitaniumCellWrapper * templateCell)
{
	TitaniumFontDescription * defaultFont = [[TitaniumFontDescription alloc] init];
	defaultFont.isBoldWeight = YES;
	defaultFont.size = 20;
	
	TitaniumCellWrapper * result = [[TitaniumCellWrapper alloc] init];
	[result setFontDesc:defaultFont];
	[result setTemplateCell:templateCell];
	[result useProperties:rowData withUrl:baseUrl];
	
	[defaultFont release];
	return result;
}

@implementation TitaniumTableActionWrapper
@synthesize kind,row,section,index,animation;
@synthesize rowData, sectionData, replacedData;
@synthesize baseUrl;

@synthesize isAnimated, scrollPosition;

- (void) dealloc
{
	[baseUrl release];
	[replacedData release];
	[sectionData release];
	[rowData release];
	[super dealloc];
}

- (void) getBaseUrl;
{
	[self setBaseUrl:[(TitaniumWebViewController *)[[TitaniumHost sharedHost] currentTitaniumContentViewController] currentContentURL]];
}

- (void) setAnimationDict: (NSDictionary *) animationDict;
{
	if(![animationDict isKindOfClass:[NSDictionary class]]) return;

	NSNumber * animationStyleObject = [animationDict objectForKey:@"animationStyle"];
	if([animationStyleObject respondsToSelector:@selector(intValue)]){
		animation =[animationStyleObject intValue];
	}
	
}

@end


UIColor * checkmarkColor = nil;

@interface TableSectionWrapper : NSObject<NSFastEnumeration>
{
	NSString * name;
	NSString * groupType;
	NSString * header;
	NSString * footer;
	NSMutableArray * rowArray;
	float rowHeight;
	BOOL isOptionList;
	BOOL nullHeader;

	UIColor * headerColor;
	TitaniumCellWrapper * templateCell;
}
- (id) initWithHeader: (NSString *) headerString footer: (NSString *) footerString;
- (void) addRow: (TitaniumCellWrapper *) newRow;
- (TitaniumCellWrapper *) rowForIndex: (NSUInteger) rowIndex;
- (BOOL) accceptsHeader: (id) newHeader footer: (id) newFooter;

@property(nonatomic,readwrite,copy)		NSString * header;
@property(nonatomic,readwrite,retain)	UIColor * headerColor;
@property(nonatomic,readwrite,copy)		NSString * footer;
@property(nonatomic,readwrite,copy)		NSString * name;
@property(nonatomic,readonly,assign)	NSUInteger rowCount;
@property(nonatomic,readwrite,copy)		NSString * groupType;
@property(nonatomic,readwrite,assign)	BOOL isOptionList;
@property(nonatomic,readwrite,assign)	BOOL nullHeader;
@property(nonatomic,readwrite,assign)	float rowHeight;


@property(nonatomic,readwrite,retain)		NSMutableArray * rowArray;
@property(nonatomic,readwrite,retain)		TitaniumCellWrapper * templateCell;

@end

@implementation TableSectionWrapper
@synthesize header,footer,groupType,isOptionList,nullHeader,rowArray,name,rowHeight,templateCell,headerColor;

- (void) forceHeader: (NSString *) headerString footer: (NSString *)footerString;
{
	Class stringClass = [NSString class];
	
	if ([headerString respondsToSelector:@selector(stringValue)])headerString=[(id)headerString stringValue];
	if ([headerString isKindOfClass:stringClass]){
		[self setHeader:headerString];
	}else{
		[self setHeader:nil];
	}
	
	if ([footerString respondsToSelector:@selector(stringValue)])footerString=[(id)footerString stringValue];
	if ([footerString isKindOfClass:stringClass]){
		[self setFooter:footerString];
	}else{
		[self setFooter:nil];
	}

	nullHeader = (id)headerString == [NSNull null];	
}

+ (TableSectionWrapper *) tableSectionWithData: (NSDictionary *) newData withUrl: (NSURL *)baseURL template: (TitaniumCellWrapper *) tableTemplateCell;
{
	TableSectionWrapper * result = [[self alloc] initWithHeader:[newData objectForKey:@"header"] footer:[newData objectForKey:@"footer"]];

	id nameString = [newData objectForKey:@"name"];
	if ([nameString respondsToSelector:@selector(stringValue)]) nameString = [nameString stringValue];
	
	if([nameString isKindOfClass:[NSString class]])[result setName:nameString];

	id rowHeightObj = [newData objectForKey:@"rowHeight"];
	if([rowHeightObj respondsToSelector:@selector(floatValue)])[result setRowHeight:[rowHeightObj floatValue]];

	BOOL isButtonGroup = NO;
	NSString * rowType = [newData objectForKey:@"type"];
	if ([rowType isKindOfClass:[NSString class]]){
		[result setGroupType:rowType];
		if([rowType isEqualToString:@"button"]){
			isButtonGroup = YES;
		} else if ([rowType isEqualToString:@"option"]){
			[result setIsOptionList:YES];
		}
	}

	[result setHeaderColor:UIColorWebColorNamed([newData objectForKey:@"color"])];

	Class dictClass = [NSDictionary class];
	
	NSDictionary * templateCellDict = [newData objectForKey:@"template"];
	if([templateCellDict isKindOfClass:dictClass]){
		tableTemplateCell = TitaniumCellWithData(templateCellDict, baseURL, tableTemplateCell);
		[result setTemplateCell:tableTemplateCell];
		[tableTemplateCell autorelease];
	}
	

	NSArray * thisDataArray = [newData objectForKey:@"data"];
	if ([thisDataArray isKindOfClass:[NSArray class]]){
		for(NSDictionary * thisEntry in thisDataArray){
			if (![thisEntry isKindOfClass:dictClass]) continue;
			
			TitaniumCellWrapper * thisRow = TitaniumCellWithData(thisEntry,baseURL,tableTemplateCell);
			if (isButtonGroup) [thisRow setIsButton:YES];
			
			[result addRow:thisRow];
			[thisRow release];
		}
	}
		
	return [result autorelease];
}

- (id) initWithHeader: (NSString *) headerString footer: (NSString *) footerString;
{
	self = [super init];
	if (self != nil) {
		[self forceHeader:headerString footer:footerString];
	}
	return self;
}

- (NSUInteger) rowCount;
{
	return [rowArray count];
}

- (void) addRow: (TitaniumCellWrapper *) newRow;
{
	if (rowArray == nil){
		rowArray = [[NSMutableArray alloc] initWithObjects:newRow,nil];
	} else {
		[rowArray addObject:newRow];
	}
}

- (void) insertRow: (TitaniumCellWrapper *) newRow atIndex: (int) index;
{
	if (rowArray == nil){
		rowArray = [[NSMutableArray alloc] initWithObjects:newRow,nil];
	} else {
		[rowArray insertObject:newRow atIndex:index];
	}
}

- (void) addRowsFromArray: (NSArray *) otherArray;
{
	if(otherArray == nil)return;
	if (rowArray == nil){
		rowArray = [otherArray mutableCopy];
	} else {
		[rowArray addObjectsFromArray:otherArray];
	}
}

- (void) addRowsFromSection: (TableSectionWrapper *) otherSection;
{
	[self addRowsFromArray:[otherSection rowArray]];
}

- (void) trimToIndex: (int) rowIndex;
{
	int rowCount = [rowArray count];
	if(rowIndex < rowCount) {
		[rowArray removeObjectsInRange:NSMakeRange(rowIndex, rowCount-rowIndex)];
	}
}

- (TableSectionWrapper *) subSectionFromIndex: (int) rowIndex header: (NSString *)newHeader footer: (NSString *)newFooter;
{
	TableSectionWrapper * result = [[TableSectionWrapper alloc] initWithHeader:newHeader footer:newFooter];
	int rowCount = [rowArray count];
	if(rowIndex < rowCount) {
		[result addRowsFromArray:[rowArray subarrayWithRange:NSMakeRange(rowIndex,rowCount-rowIndex)]];
	}
	[result setRowHeight:rowHeight];
	[result setHeaderColor:headerColor];
	return [result autorelease];
}

- (TableSectionWrapper *) subSectionFromIndex: (int) rowIndex;
{
	TableSectionWrapper * result = [self subSectionFromIndex:rowIndex header:header footer:footer];
	[result setNullHeader:nullHeader];
	[result setRowHeight:rowHeight];
	[result setHeaderColor:headerColor];
	return result;
}

- (void) removeRowAtIndex: (int) rowIndex;
{
	if((rowIndex < 0) || (rowIndex >= [rowArray count]))return;
	[rowArray removeObjectAtIndex:rowIndex];
}

- (TitaniumCellWrapper *) rowForIndex: (NSUInteger) rowIndex;
{
	if (rowIndex >= [rowArray count]) return nil;
	TitaniumCellWrapper * result = [rowArray objectAtIndex:rowIndex];
	return result;
}

- (NSUInteger)countByEnumeratingWithState:(NSFastEnumerationState *)state objects:(id *)stackbuf count:(NSUInteger)len;
{
	return [rowArray countByEnumeratingWithState:state objects:stackbuf count:len];
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
		result = ([newHeader length] == 0);
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
	if(newView == nil){
		[tableView release];
		tableView = nil;
		[wrapperView release];
		wrapperView = nil;
	}
}

- (UIView *) view;
{
	if(wrapperView == nil){
		wrapperView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, preferredViewSize.width, preferredViewSize.height)];
		[wrapperView setBackgroundColor:[UIColor clearColor]];
		[wrapperView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
	}
	if(tableView == nil){
		CGRect startSize = [wrapperView bounds];
		startSize.origin.x += marginLeft;
		startSize.origin.y += marginTop;
		startSize.size.width -= marginLeft + marginRight;
		startSize.size.height -= marginTop + marginBottom;

		tableView = [[UITableView alloc] initWithFrame:startSize style:tableStyle];
		[tableView setDelegate:self];	[tableView setDataSource:self];
		[tableView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		if(backgroundColor != nil)[tableView setBackgroundColor:backgroundColor];
		if (tableRowHeight > 5){
			[tableView setRowHeight:tableRowHeight];
		}
		if([borderColor isEqual:[UIColor clearColor]]){
			[tableView setSeparatorStyle:UITableViewCellSeparatorStyleNone];
		} else {
			[tableView setSeparatorStyle:UITableViewCellSeparatorStyleSingleLine];
			if(borderColor != nil)[tableView setSeparatorColor:borderColor];
		}
		
		if(searchField != nil){
			if([searchField isKindOfClass:[SearchBarControl class]]){
				[(SearchBarControl *)searchField setDelegate:self];
			}
			UIView * searchView = [searchField view];
			[searchView setFrame:CGRectMake(0, 0, startSize.size.width, tableRowHeight)];
			[searchView setAutoresizingMask:UIViewAutoresizingFlexibleWidth];
			[tableView setTableHeaderView:searchView];
		}
		
		[wrapperView addSubview:tableView];
	}
	
	return wrapperView;
}

- (void) readRowData: (NSArray *)dataArray relativeToUrl: (NSURL *)baseUrl;
{
	SEL stringSel = @selector(stringValue);
	Class dictClass = [NSDictionary class];
	
	[sectionArray autorelease];
	sectionArray = [[NSMutableArray alloc] init];

	TableSectionWrapper * thisSectionWrapper = nil;

	for(NSDictionary * thisEntry in dataArray){
		if (![thisEntry isKindOfClass:dictClass]) continue;
		
		TitaniumCellWrapper * thisRow = [TitaniumCellWithData(thisEntry,baseUrl,templateCell) autorelease];
		
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

- (void)readSections:(NSArray *)newSections relativeToUrl:(NSURL *)baseUrl;
{
	[sectionArray autorelease];
	sectionArray = [[NSMutableArray alloc] initWithCapacity:[newSections count]];

	Class dictClass = [NSDictionary class];
	for(NSDictionary * thisSectionEntry in newSections){
		if (![thisSectionEntry isKindOfClass:dictClass])continue;
		[sectionArray addObject:[TableSectionWrapper tableSectionWithData:thisSectionEntry withUrl:baseUrl template:templateCell]];
	}

}


- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	if (checkmarkColor == nil){
		checkmarkColor = [[UIColor alloc] initWithRed:(55.0/255.0) green:(79.0/255.0) blue:(130.0/255.0) alpha:1.0];
	}

	[backgroundColor release];
	backgroundColor = [UIColorWebColorNamed([inputState objectForKey:@"backgroundColor"]) retain];

	Class dictClass = [NSDictionary class];
	if (![inputState isKindOfClass:dictClass]){
		NSLog(@"[WARN] SHOULDN'T HAPPEN: %@ is trying to read the state of a non-dictionary %@!",self,inputState);
		return;
	}

	Class arrayClass = [NSArray class];
	
	SEL floatSel = @selector(floatValue);
	NSNumber * floatNumber;
	floatNumber = [inputState objectForKey:@"marginTop"];
	if([floatNumber respondsToSelector:floatSel])marginTop=[floatNumber floatValue];

	floatNumber = [inputState objectForKey:@"marginLeft"];
	if([floatNumber respondsToSelector:floatSel])marginLeft=[floatNumber floatValue];

	floatNumber = [inputState objectForKey:@"marginRight"];
	if([floatNumber respondsToSelector:floatSel])marginRight=[floatNumber floatValue];

	floatNumber = [inputState objectForKey:@"marginBottom"];
	if([floatNumber respondsToSelector:floatSel])marginBottom=[floatNumber floatValue];
	
	id searchFieldObject = [inputState objectForKey:@"search"];
	if(searchFieldObject!=nil){
		[searchField autorelease];
		searchField = [[NativeControlProxy controlProxyWithDictionary:searchFieldObject relativeToUrl:baseUrl] retain];
	}
	
	id searchKeyObject = [inputState objectForKey:@"filterAttribute"];
	if((searchKeyObject != nil) && ![searchKeyObject isEqual:searchAttributeKey]){
		[searchAttributeKey release];
		if([searchKeyObject isKindOfClass:[NSString class]])searchAttributeKey = [searchKeyObject retain];
		else searchAttributeKey = nil;
	}
	
	
	NSNumber * isGrouped = [inputState objectForKey:@"grouped"];
	SEL boolSel = @selector(boolValue);


	if ([isGrouped respondsToSelector:boolSel]){
		tableStyle = [isGrouped boolValue] ? UITableViewStyleGrouped : UITableViewStylePlain;
	} else {
		tableStyle = UITableViewStylePlain;
	}
	
	NSDictionary * templateDict = [inputState objectForKey:@"template"];
	if([templateDict isKindOfClass:dictClass]){
		[templateCell release];
		templateCell = TitaniumCellWithData(templateDict, baseUrl, nil);
	}
	
	[borderColor release];
	borderColor = [UIColorWebColorNamed([inputState objectForKey:@"borderColor"]) retain];

	NSNumber * tableRowHeightObject = [inputState objectForKey:@"rowHeight"];
	
	if ([tableRowHeightObject respondsToSelector:@selector(intValue)]){
		tableRowHeight = [tableRowHeightObject intValue];
	}
	else {
		tableRowHeight = 43;
	}

	
	Class stringClass = [NSString class];

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
		
	NSArray * groupEntries = [inputState objectForKey:@"sections"];
	NSArray * dataEntries = [inputState objectForKey:@"data"];

	if ([groupEntries isKindOfClass:arrayClass]){
		[self readSections:groupEntries relativeToUrl:baseUrl];
	} else if([dataEntries isKindOfClass:arrayClass]){
		[self readRowData:dataEntries relativeToUrl:baseUrl];
	}
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	if([tableView superview]==nil)[self setView:nil];
	if([searchTableView superview]==nil){
		[searchTableView release];
		searchTableView == nil;
	}
	// Release any cached data, images, etc that aren't in use.
}


- (void)dealloc {
	[blessedPath release];
	[sectionArray release];
	[callbackProxyPath release];
	[callbackWindowToken release];
	[sectionLock release];
	[tableView release];
	tableView = nil;
	
	[actionQueue release];
	[actionLock release];
	[borderColor release];
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
	if(index < 0)return nil;
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

- (TitaniumCellWrapper *) cellForIndexPath: (NSIndexPath *) path;
{
	TableSectionWrapper * thisSectionWrapper = [self sectionForIndex:[path section]];
	TitaniumCellWrapper * result = [thisSectionWrapper rowForIndex:[path row]];
	return result;	
}

- (NSIndexPath *) indexPathFromSearchIndex: (int) index;
{
	int sectionIndex = 0;
	for (NSIndexSet * thisSet in searchResultIndexes) {
		int thisSetCount = [thisSet count];
		if(index < thisSetCount){
			int rowIndex = [thisSet firstIndex];
			while (index > 0) {
				rowIndex = [thisSet indexGreaterThanIndex:rowIndex];
				index --;
			}
			return [NSIndexPath indexPathForRow:rowIndex inSection:sectionIndex];
		}
		sectionIndex ++;
		index -= thisSetCount;
	}
	return nil;
}


- (NSInteger)numberOfSectionsInTableView:(UITableView *)ourTableView;              // Default is 1 if not implemented
{
	if(ourTableView == searchTableView)return 1;

	[sectionLock lock];
	NSInteger count = [sectionArray count];
	[sectionLock unlock];
	
	return count;
	
//	return MAX(count,1);
}

- (NSInteger)tableView:(UITableView *)ourTableView numberOfRowsInSection:(NSInteger)section;
{
	if(ourTableView == searchTableView){
		int rowCount = 0;
		for (NSIndexSet * thisSet in searchResultIndexes) {
			rowCount += [thisSet count];
		}
		return rowCount;
	}

	[sectionLock lock];
	NSInteger rowCount = [[self sectionForIndex:section] rowCount];
	[sectionLock unlock];
	return rowCount;
}

// Row display. Implementers should *always* try to reuse cells by setting each cell's reuseIdentifier and querying for available reusable cells with dequeueReusableCellWithIdentifier:
// Cell gets various attributes set automatically based on table (separators) and data source (accessory views, editing controls)


- (UITableViewCell *)tableView:(UITableView *)ourTableView cellForRowAtIndexPath:(NSIndexPath *)indexPath;
{
	if(ourTableView == searchTableView){
		UITableViewCell * result = [ourTableView dequeueReusableCellWithIdentifier:@"search"];
		if(result==nil){
			result = [[[UITableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"search"] autorelease];
		}
		TitaniumCellWrapper * rowWrapper = [self cellForIndexPath:[self indexPathFromSearchIndex:[indexPath row]]];
		[(id)result setText:[rowWrapper title]];
		return result;
	}

	[sectionLock lock];
	TableSectionWrapper * sectionWrapper = [self sectionForIndex:[indexPath section]];
	TitaniumCellWrapper * rowWrapper = [sectionWrapper rowForIndex:[indexPath row]];
	NSString * htmlString = [rowWrapper html];
	UITableViewCellAccessoryType ourType = [rowWrapper accessoryType];
	UITableViewCell * result = nil;

	id activeLayoutArray=[rowWrapper layoutArray];

	if (htmlString != nil){ //HTML cell
		result = [ourTableView dequeueReusableCellWithIdentifier:@"html"];
		if (result == nil) {
			CGRect standardSize = CGRectMake(0, 0, 280, 30);
			result = [[[WebTableViewCell alloc] initWithFrame:standardSize reuseIdentifier:@"html"] autorelease];
		}
		[(WebTableViewCell *)result setHTML:htmlString];
	} else if ([activeLayoutArray isKindOfClass:[NSArray class]]) {
		result = [ourTableView dequeueReusableCellWithIdentifier:@"complex"];
		if(result == nil){
			result = [[[ComplexTableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"complex"] autorelease];
		}
		[(ComplexTableViewCell *)result setDataWrapper:rowWrapper];
		
	} else if ([rowWrapper isButton]) {
		result = [ourTableView dequeueReusableCellWithIdentifier:@"button"];
		if (result == nil){
			result = [[[ValueTableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"button"] autorelease];
			[(id)result setTextAlignment:UITextAlignmentCenter];
		}
		[(id)result setText:[rowWrapper title]];
		[(id)result setFont:[rowWrapper font]];
		[(id)result setImage:[rowWrapper image]];
	} else { //plain cell
		NSString * valueString = [rowWrapper value];
		if (valueString == nil){
			result = [ourTableView dequeueReusableCellWithIdentifier:@"text"];
			if (result == nil) result = [[[ValueTableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"text"] autorelease];
		} else {
			UILabel * valueLabel;
			result = [ourTableView dequeueReusableCellWithIdentifier:@"value"];
			if (result == nil){
				result = [[[ValueTableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"value"] autorelease];
				valueLabel = [(ValueTableViewCell *)result valueLabel];
				[valueLabel setTextColor:checkmarkColor];
			} else {
				valueLabel = [(ValueTableViewCell *)result valueLabel];
			}
			[valueLabel setText:valueString];
			[valueLabel setFont:[rowWrapper font]];			
		}
		[(id)result setText:[rowWrapper title]];
		[(id)result setFont:[rowWrapper font]];
		UIColor * textColor = [UIColor blackColor];
		if (ourType == UITableViewCellAccessoryCheckmark) textColor = checkmarkColor;
		[(id)result setTextColor:textColor];
		[(id)result setImage:[rowWrapper image]];
	}

	NSString * selectionStyleString = [rowWrapper stringForKey:@"selectionStyle"];
	if([selectionStyleString isEqualToString:@"none"]){
		[result setSelectionStyle:UITableViewCellSelectionStyleNone];
	} else if([selectionStyleString isEqualToString:@"gray"]){
		[result setSelectionStyle:UITableViewCellSelectionStyleGray];
	} else {
		[result setSelectionStyle:UITableViewCellSelectionStyleBlue];
	}
	

	[result setAccessoryType:ourType];
	[result setAccessoryView:[[rowWrapper inputProxy] view]];
	UIColor * bgColor = [rowWrapper colorForKey:@"backgroundColor"];
	UIColor * selectedBgColor = [rowWrapper colorForKey:@"selectedBackgroundColor"];

	// UIImage * bgImage = [rowWrapper imageForKey:@"backgroundImage"]; //[rowWrapper stretchableImageForKey:@"backgroundImage"];
	// UIImage	* selectedBgImage = [rowWrapper imageForKey:@"selectedBackgroundImage"]; //[rowWrapper stretchableImageForKey:@"selectedBackgroundImage"];
	UIImage * bgImage = [rowWrapper stretchableImageForKey:@"backgroundImage"];
	UIImage	* selectedBgImage = [rowWrapper stretchableImageForKey:@"selectedBackgroundImage"];


	if((tableStyle == UITableViewStyleGrouped) && (bgImage == nil)){
		if(bgColor != nil)[result setBackgroundColor:bgColor];
		else [result setBackgroundColor:[UIColor whiteColor]];
	} else {

		UIImageView * bgView = (UIImageView *)[result backgroundView];
		if(![bgView isKindOfClass:[UIImageView class]]){
			bgView = [[[UIImageView alloc] initWithFrame:[result frame]] autorelease];
			[bgView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
			[result setBackgroundView:bgView];
		}
		[bgView setImage:bgImage];
		[bgView setBackgroundColor:(bgColor==nil)?[UIColor clearColor]:bgColor];
		
	}

	if((selectedBgColor == nil)&&(selectedBgImage == nil)){
		[result setSelectedBackgroundView:nil];
	} else {
		UIImageView * selectedBgView = (UIImageView *)[result selectedBackgroundView];
		if(![selectedBgView isKindOfClass:[UIImageView class]]){
			selectedBgView = [[[UIImageView alloc] initWithFrame:[result frame]] autorelease];
			[selectedBgView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
			[result setSelectedBackgroundView:selectedBgView];
		}
		
		[selectedBgView setImage:selectedBgImage];
		[selectedBgView setBackgroundColor:(selectedBgColor==nil)?[UIColor clearColor]:selectedBgColor];
		
	}



	[sectionLock unlock];
	return result;
}

- (NSString *)tableView:(UITableView *)ourTableView titleForHeaderInSection:(NSInteger)section;    // fixed font style. use custom view (UILabel) if you want something different
{
	if(ourTableView==searchTableView)return nil;

	[sectionLock lock];
	NSString * result = [[[[self sectionForIndex:section] header] copy] autorelease];
	[sectionLock unlock];
	return result;
}

- (NSString *)tableView:(UITableView *)ourTableView titleForFooterInSection:(NSInteger)section;
{
	if(ourTableView==searchTableView)return nil;
	
	[sectionLock lock];
	NSString * result = [[[[self sectionForIndex:section] footer] copy] autorelease];
	[sectionLock unlock];
	return result;
}

- (UIView *)tableView:(UITableView *)ourTableView viewForHeaderInSection:(NSInteger)section;   // custom view for header. will be adjusted to default or specified header height
{
	if([ourTableView style]==UITableViewStylePlain)return nil;

	[sectionLock lock];
	TableSectionWrapper * thisSection = [self sectionForIndex:section];
	NSString * ourTitle = [thisSection header];
	UIColor * ourColor = [thisSection headerColor];
	[sectionLock unlock];
	
	if((ourTitle==nil) || (ourColor == nil))return nil;
	
	TitaniumTitleView * result = [[TitaniumTitleView alloc] initWithFrame:CGRectMake(0, 0, [tableView frame].size.width, 20)];
	[result setText:ourTitle];
	[result setTextColor:ourColor];
	[result setTextAlignment:UITextAlignmentLeft];
	
	return [result autorelease];
}

- (UIView *)tableView:(UITableView *)ourTableView viewForFooterInSection:(NSInteger)section;   // custom view for footer. will be adjusted to default or specified footer height
{
	if([ourTableView style]==UITableViewStylePlain)return nil;

	[sectionLock lock];
	TableSectionWrapper * thisSection = [self sectionForIndex:section];
	NSString * ourTitle = [thisSection footer];
	UIColor * ourColor = [thisSection headerColor];
	[sectionLock unlock];
	
	if((ourTitle==nil) || (ourColor == nil))return nil;

	TitaniumTitleView * result = [[TitaniumTitleView alloc] initWithFrame:CGRectMake(0, 0, [tableView frame].size.width, 20)];
	[result setText:ourTitle];
	[result setTextColor:ourColor];
	[result setTextAlignment:UITextAlignmentCenter];
	
	return [result autorelease];
}

- (CGFloat)tableView:(UITableView *)ourTableView heightForHeaderInSection:(NSInteger)section;
{
	CGFloat result = [ourTableView sectionFooterHeight];
	if([ourTableView style]==UITableViewStylePlain)return result;

	NSString * ourTitle = [self tableView:ourTableView titleForHeaderInSection:section];
	if(ourTitle==nil)return result;

	return result + 26;
}


- (CGFloat)tableView:(UITableView *)ourTableView heightForFooterInSection:(NSInteger)section;
{
	CGFloat result = [ourTableView sectionFooterHeight];
	if([ourTableView style]==UITableViewStylePlain)return result;

	NSString * ourTitle = [self tableView:ourTableView titleForFooterInSection:section];
	if(ourTitle==nil)return result;

	return result + 26;
}


#pragma mark Delegate methods
- (CGFloat)tableView:(UITableView *)ourTableView heightForRowAtIndexPath:(NSIndexPath *)indexPath;
{
	if(ourTableView==searchTableView)return [ourTableView rowHeight];

	TableSectionWrapper * ourTableSection = [self sectionForIndex:[indexPath section]];
	TitaniumCellWrapper * ourTableCell = [ourTableSection rowForIndex:[indexPath row]];

	float result = [ourTableCell rowHeight];
	if(result > 1.0) return result;

	result = [[ourTableSection templateCell] rowHeight];
	if(result > 1.0) return result;

	result = [ourTableSection rowHeight];
	if(result > 1.0) return result;

	result = [templateCell rowHeight];
	if(result > 1.0) return result;

	return tableRowHeight;
}

- (void)triggerActionForIndexPath: (NSIndexPath *)indexPath wasAccessory: (BOOL) accessoryTapped search: (BOOL) viaSearch;
{
	if ((callbackProxyPath == nil) || (callbackWindowToken == nil)) return;
	int section = [indexPath section];
	int row = [indexPath row];
	int index = [self rowCountBeforeSection:section] + row;
	
	NSString * itemName = @"";
	UITableViewCell * triggeredCell = [tableView cellForRowAtIndexPath:indexPath];
	if([triggeredCell isKindOfClass:[ComplexTableViewCell class]]){
		NSString * newItemName = [(ComplexTableViewCell *)triggeredCell clickedName];
		if(newItemName != nil) itemName = [NSString stringWithFormat:@",layoutName:'%@'",newItemName];
	}
	
	NSString * rowData;
	if(tableStyle == UITableViewStyleGrouped){
		rowData = [callbackProxyPath stringByAppendingFormat:@".sections[%d].data[%d]",section,row];
	} else {
		rowData = [callbackProxyPath stringByAppendingFormat:@".data[%d]",index];
	}
	NSString * detail = accessoryTapped ? @"true" : @"false";
	NSString * search = viaSearch ? @"true" : @"false";

	NSString * triggeredCode = [[NSString alloc] initWithFormat:@".onClick('click',{type:'click',"
			"index:%d,row:%d,section:%d,rowData:%@,detail:%@,searchMode:%@%@})",
			index,row,section,rowData,detail,search,itemName];
	
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	[theHost sendJavascript:[callbackProxyPath stringByAppendingString:triggeredCode] toPageWithToken:callbackWindowToken];
	
	NSString * groupCode = [[NSString alloc] initWithFormat:@"%@.sections[%d]%@",callbackProxyPath,section,triggeredCode];
	[theHost sendJavascript:groupCode toPageWithToken:callbackWindowToken];
	[groupCode release];
	
	[triggeredCode release];
}

- (NSIndexPath *)tableView:(UITableView *)tableView willSelectRowAtIndexPath:(NSIndexPath *)indexPath;
{
	return indexPath;
}

- (void)tableView:(UITableView *)tableView accessoryButtonTappedForRowWithIndexPath:(NSIndexPath *)indexPath;
{
	[sectionLock lock];
	[self triggerActionForIndexPath:indexPath wasAccessory:YES search:NO];
	[sectionLock unlock];
}

- (void)tableView:(UITableView *)ourTableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath;
{
	[sectionLock lock];
	[ourTableView deselectRowAtIndexPath:indexPath animated:YES];

	if(ourTableView == searchTableView){
		indexPath = [self indexPathFromSearchIndex:[indexPath row]];
	}

	int section = [indexPath section];
	int blessedRow = [indexPath row];
	TableSectionWrapper * sectionWrapper = [self sectionForIndex:section];

	if ([sectionWrapper isOptionList] && ![[sectionWrapper rowForIndex:blessedRow] isButton]){
		for (int row=0;row<[sectionWrapper rowCount];row++) {
			TitaniumCellWrapper * rowWrapper = [sectionWrapper rowForIndex:row];
			UITableViewCellAccessoryType rowType = [rowWrapper accessoryType];
			BOOL isBlessed = (row == blessedRow);
			BOOL isUpdated = NO;
			
			UITableViewCell * thisCell = [ourTableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:row inSection:section]];
			
			if (!isBlessed && (rowType == UITableViewCellAccessoryCheckmark)) {
				[rowWrapper setAccessoryType:UITableViewCellAccessoryNone];
				if (thisCell != nil){
					[thisCell setAccessoryType:UITableViewCellAccessoryNone];
					[(id)thisCell setTextColor:[UIColor blackColor]];
					isUpdated = YES;
				}
			} else if (isBlessed && (rowType == UITableViewCellAccessoryNone)){
				[rowWrapper setAccessoryType:UITableViewCellAccessoryCheckmark];
				if (thisCell != nil){
					[thisCell setAccessoryType:UITableViewCellAccessoryCheckmark];
					[(id)thisCell setTextColor:checkmarkColor];
					isUpdated = YES;
				}
			}
			
			if (isUpdated && [thisCell respondsToSelector:@selector(updateState:)]){
				[(WebTableViewCell *)thisCell updateState:YES];
			}
			
		}
	}

	[self triggerActionForIndexPath:indexPath wasAccessory:NO search:(ourTableView == searchTableView)];
	[sectionLock unlock];
}

#pragma mark UIModule methods

- (void)enqueueAction: (TitaniumTableActionWrapper *) newAction;
{
	[actionLock lock];
	if(actionQueue == nil){
		actionQueue = [[NSMutableArray alloc] initWithObjects:newAction,nil];
		[self performSelectorOnMainThread:@selector(performActions) withObject:nil waitUntilDone:NO];
	}else if(([newAction kind]==TitaniumTableActionReloadData) || ([newAction kind]==TitaniumGroupActionReloadSections)){ //Dump old actions. They're unnecessary.
		[actionQueue release];
		actionQueue = [[NSMutableArray alloc] initWithObjects:newAction,nil];
	}else{
		[actionQueue addObject:newAction];
	}
	[actionLock unlock];
}

- (void)deleteRowAtIndex: (int)index animation: (UITableViewRowAnimation) animation;
{	
	if(index < 0){
		VERBOSE_LOG(@"[DEBUG] -[%@ deleteRowAtIndex:%d animation:%d]: Index is less than 0.",self,index,animation);
		return;
	}
	
	int thisSectionIndex = 0;
#ifdef USE_VERBOSE_DEBUG	
	int oldIndex = index;
#endif
	
	for(TableSectionWrapper * thisSection in sectionArray){
		int rowCount = [thisSection rowCount];
		if (rowCount > index){
			NSIndexPath * thisPath = [NSIndexPath indexPathForRow:index inSection:thisSectionIndex];
			if(rowCount > 1){ //We're done here.
				VERBOSE_LOG(@"[DEBUG] -[%@ deleteRowAtIndex:%d animation:%d]: Going for Section %d, row %d. (%@)",self,oldIndex,animation,thisSectionIndex,index,thisPath);
				[tableView beginUpdates];
				[thisSection removeRowAtIndex:index];
				[tableView deleteRowsAtIndexPaths:[NSArray arrayWithObject:thisPath] withRowAnimation:animation];
				[tableView endUpdates];
				return;
			}
						
			[tableView beginUpdates];
			[sectionArray removeObjectAtIndex:thisSectionIndex];
			[tableView deleteRowsAtIndexPaths:[NSArray arrayWithObject:thisPath] withRowAnimation:animation];			
			[tableView deleteSections:[NSIndexSet indexSetWithIndex:thisSectionIndex] withRowAnimation:animation];
			[tableView endUpdates];
			return;
		}
		thisSectionIndex++;
		index -= rowCount;
	}
	//At this point, We failed to delete a nonexistant index. Drop on the ground?
	
	VERBOSE_LOG(@"[DEBUG] -[%@ deleteRowAtIndex:%d animation:%d]: Index is %d rows past the end. %d sections exist.",self,oldIndex,animation,index,thisSectionIndex);
	
}

- (void)modifyRow: (NSDictionary *)rowData atIndex: (int)index action:(TitaniumTableAction)action relativeUrl: (NSURL *) baseUrl animation: (UITableViewRowAnimation) animation;
{
	if(index < 0){
#ifdef USE_VERBOSE_DEBUG	
			NSString * actionString;
			switch (action) {
				case TitaniumTableActionInsertAfterRow:
					actionString = @"insert after";
					break;
				case TitaniumTableActionInsertBeforeRow:
					actionString = @"insert before";
					break;
				case TitaniumTableActionUpdateRow:
					actionString = @"update";
					break;
				case TitaniumTableActionAppendRow:
					actionString = @"append";
					break;
				default:
					actionString = [NSString stringWithFormat:@"[SHOULDN'T HAPPEN: UNKNOWN ACTION %d]",action];
			}
			NSLog(@"[DEBUG] %@ was told to %@ row %d from %@",self,actionString,index,baseUrl);
#endif
		return;
	}

	int thisSectionIndex = 0;
	
	NSString * header = [rowData objectForKey:@"header"];
	NSString * footer = [rowData objectForKey:@"footer"];

	if([header isKindOfClass:[NSString class]] && ([header length]==0))header=nil;

	BOOL isInsertAfter = action==TitaniumTableActionInsertAfterRow;
	BOOL blankHeader = header==nil;
	BOOL isLastSection = NO;
	int lastSectionIndex = [sectionArray count];
	
	for(TableSectionWrapper * thisSection in sectionArray){
		int rowCount = [thisSection rowCount];
		if(thisSectionIndex==lastSectionIndex){
			if(action==TitaniumTableActionAppendRow)action=TitaniumTableActionInsertBeforeRow;
			isLastSection = (action==TitaniumTableActionInsertBeforeRow);
		}
		
		if((index < rowCount) || (isLastSection && (index==rowCount))){ //We have a contestant!
			NSString * oldHeader = [thisSection header];
			BOOL headerChange = (header != oldHeader) && (![header isEqual:oldHeader]);
			
			if(action==TitaniumTableActionUpdateRow){
				[[thisSection rowForIndex:index] useProperties:rowData withUrl:baseUrl];
				//If at index 0 and header is nil, merge with previous section.
				//If at index 0 and header!=oldHeader, change section name, force reload.
				//If at index !0 and header!=oldHeader, split section.
				//Otherwise, it's a meek little update.
				if(index==0){
					if(blankHeader && (thisSectionIndex>0)){
						int prevSectionIndex = thisSectionIndex - 1;
						TableSectionWrapper * prevSection = [sectionArray objectAtIndex:prevSectionIndex];
						int prevRowCount = [prevSection rowCount];

						NSMutableArray * ourInsertedRowArray = [[NSMutableArray alloc] initWithCapacity:rowCount];
						NSMutableArray * ourDeletedRowArray = [[NSMutableArray alloc] initWithCapacity:rowCount];
						for(int i=0;i<rowCount;i++){
							[ourInsertedRowArray addObject:[NSIndexPath indexPathForRow:i+prevRowCount inSection:prevSectionIndex]];
							[ourDeletedRowArray addObject:[NSIndexPath indexPathForRow:i inSection:thisSectionIndex]];
						}
						
						
						[tableView beginUpdates];
						[prevSection addRowsFromSection:thisSection];
						[sectionArray removeObjectAtIndex:thisSectionIndex];
						
						[tableView insertRowsAtIndexPaths:ourInsertedRowArray withRowAnimation:animation];
						[tableView deleteRowsAtIndexPaths:ourDeletedRowArray withRowAnimation:animation];
						[tableView deleteSections:[NSIndexSet indexSetWithIndex:thisSectionIndex] withRowAnimation:animation];
						[tableView endUpdates];
						[ourInsertedRowArray release];
						[ourDeletedRowArray release];
						return;
					} else if(headerChange){
						[thisSection forceHeader:header footer:footer];
						if([tableView respondsToSelector:@selector(reloadSections:withRowAnimation:)]){
							[tableView reloadSections:[NSIndexSet indexSetWithIndex:thisSectionIndex] withRowAnimation:animation];
						} else {
							[tableView deleteSections:[NSIndexSet indexSetWithIndex:thisSectionIndex] withRowAnimation:animation];
							[tableView insertSections:[NSIndexSet indexSetWithIndex:thisSectionIndex] withRowAnimation:animation];
						}
						return;
					}
					//Flows out to the meek little update.
				} else if(headerChange && (header != nil)){
					int insertedSectionIndex = thisSectionIndex+1;
					
					NSMutableArray * ourDeletedRowArray = [[NSMutableArray alloc] initWithCapacity:rowCount-index];
					for(int i=index;i<rowCount;i++){
						[ourDeletedRowArray addObject:[NSIndexPath indexPathForRow:i inSection:thisSectionIndex]];
					}

					[tableView beginUpdates];
					TableSectionWrapper * insertedSection = [thisSection subSectionFromIndex:index header:header footer:footer];
					[sectionArray insertObject:insertedSection atIndex:insertedSectionIndex];
					[thisSection trimToIndex:index];
					
					[tableView deleteRowsAtIndexPaths:ourDeletedRowArray withRowAnimation:animation];
					[tableView insertSections:[NSIndexSet indexSetWithIndex:insertedSectionIndex] withRowAnimation:animation];
					[tableView endUpdates];
					[ourDeletedRowArray release];
					return;
				}
				NSArray * ourIndexPathArray = [NSArray arrayWithObject:[NSIndexPath indexPathForRow:index inSection:thisSectionIndex]];
				if([tableView respondsToSelector:@selector(reloadRowsAtIndexPaths:withRowAnimation:)]){
					[tableView reloadRowsAtIndexPaths:ourIndexPathArray withRowAnimation:animation];
				} else {
					[tableView deleteRowsAtIndexPaths:ourIndexPathArray withRowAnimation:animation];
					[tableView insertRowsAtIndexPaths:ourIndexPathArray withRowAnimation:animation];
				}
				return;
			}
			//Okay, now it's an insert before or after.
			
			TitaniumCellWrapper * insertedRow = [TitaniumCellWithData(rowData,baseUrl,templateCell) autorelease];
			if(isInsertAfter){
				index++;
			}
			
			if(!headerChange || (header == nil)){//Insert row, all is well.
				[thisSection insertRow:insertedRow atIndex:index];
				NSIndexPath * thisPath = [NSIndexPath indexPathForRow:index inSection:thisSectionIndex];
				[tableView insertRowsAtIndexPaths:[NSArray arrayWithObject:thisPath] withRowAnimation:animation];
				return;
			}
			if ((index < rowCount) && (index > 0)){//We need to split up the old section.
				NSMutableArray * ourDeletedRowArray = [[NSMutableArray alloc] initWithCapacity:rowCount-index];
				TableSectionWrapper * insertedSection = [thisSection subSectionFromIndex:index header:header footer:footer];
				[insertedSection insertRow:insertedRow atIndex:0];
				for(int i=index;i<rowCount;i++){
					[ourDeletedRowArray addObject:[NSIndexPath indexPathForRow:i inSection:thisSectionIndex]];
				}

				int insertedSectionIndex=thisSectionIndex +1;
				[tableView beginUpdates];
				[sectionArray insertObject:insertedSection atIndex:insertedSectionIndex];
				[thisSection trimToIndex:index];
				[tableView deleteRowsAtIndexPaths:ourDeletedRowArray withRowAnimation:animation];
				[tableView insertSections:[NSIndexSet indexSetWithIndex:insertedSectionIndex] withRowAnimation:animation];
				[tableView endUpdates];

				[ourDeletedRowArray release];
				return;
			}
			
			//Okay, we're inserting a new section.
			//New section's index is thisSection + (isInsertAfter?1:0)
			TableSectionWrapper * insertedSection = [[TableSectionWrapper alloc] initWithHeader:header footer:footer];
			[insertedSection addRow:insertedRow];
			int insertedSectionIndex=(isInsertAfter)?(thisSectionIndex+1):thisSectionIndex;

			[sectionArray insertObject:insertedSection atIndex:insertedSectionIndex];
			[tableView insertSections:[NSIndexSet indexSetWithIndex:insertedSectionIndex] withRowAnimation:animation];
			[insertedSection release];
			return;
		}
		
		thisSectionIndex++;
		index -= rowCount;
	}		

#ifdef USE_VERBOSE_DEBUG	
		NSString * actionString;
		switch (action) {
			case TitaniumTableActionInsertAfterRow:
				actionString = @"insert after";
				break;
			case TitaniumTableActionInsertBeforeRow:
				actionString = @"insert before";
				break;
			case TitaniumTableActionUpdateRow:
				actionString = @"update";
				break;
			case TitaniumTableActionAppendRow:
				actionString = @"append";
				break;
			default:
				actionString = [NSString stringWithFormat:@"[SHOULDN'T HAPPEN: UNKNOWN ACTION %d]",action];
		}
		NSLog(@"[DEBUG] %@ was told to %@ the row %d beyond the end (from %@)",self,actionString,index,baseUrl);
#endif
	
}

- (void)appendRow: (NSDictionary *)rowData relativeUrl: (NSURL *) baseUrl animation: (UITableViewRowAnimation) animation;
{
	TitaniumCellWrapper * ourRow = TitaniumCellWithData(rowData, baseUrl,templateCell);
	TableSectionWrapper * lastSection = [sectionArray lastObject];
	SEL stringSel = @selector(stringValue);
	
	id headerString = [rowData objectForKey:@"header"];
	if ([headerString respondsToSelector:stringSel]) headerString = [headerString stringValue];
	
	id footerString = [rowData objectForKey:@"footer"];
	if ([footerString respondsToSelector:stringSel]) footerString = [footerString stringValue];
	
	if((lastSection != nil) && (headerString==nil) && (footerString == nil)){
		[lastSection addRow:ourRow];
		[tableView insertRowsAtIndexPaths:[NSArray arrayWithObject:
				[NSIndexPath indexPathForRow:[lastSection rowCount]-1 inSection:[sectionArray count]-1]] withRowAnimation:animation];
	} else {
		lastSection = [[TableSectionWrapper alloc] initWithHeader:headerString footer:footerString];
		[lastSection addRow:ourRow];
		[sectionArray addObject:lastSection];
		
		[tableView insertSections:[NSIndexSet indexSetWithIndex:[sectionArray count]-1] withRowAnimation:animation];
		[lastSection release];
	}

	[ourRow release];
}

- (void)reloadData:(NSArray *)newData relativeUrl:(NSURL *)baseUrl animation:(UITableViewRowAnimation) animation;
{
//	NSArray * oldArray = [sectionArray retain];
	int oldCount=[sectionArray count];
	NSIndexSet * oldRange = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, oldCount)];
	[self readRowData:newData relativeToUrl:baseUrl];
	int newCount=[sectionArray count];
	NSIndexSet * newRange = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, newCount)];

	[tableView beginUpdates];
	if(oldRange > 0)[tableView deleteSections:oldRange withRowAnimation:animation];
	if(newRange > 0)[tableView insertSections:newRange withRowAnimation:animation];
	[tableView endUpdates];

//	[oldArray release];
}

- (void)reloadSections:(NSArray *)newSections relativeUrl:(NSURL *)baseUrl animation:(UITableViewRowAnimation) animation;
{
	//	NSArray * oldArray = [sectionArray retain];
	int oldCount=[sectionArray count];
	NSIndexSet * oldRange = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, oldCount)];
	[self readSections:newSections relativeToUrl:baseUrl];
	int newCount=[sectionArray count];
	NSIndexSet * newRange = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, newCount)];
	
	[tableView beginUpdates];
	if(oldRange > 0)[tableView deleteSections:oldRange withRowAnimation:animation];
	if(newRange > 0)[tableView insertSections:newRange withRowAnimation:animation];
	[tableView endUpdates];
	
	//	[oldArray release];
}



- (void)performActions;
{
	[actionLock lock];
	for(TitaniumTableActionWrapper * thisAction in actionQueue){
		TitaniumTableAction kind = [thisAction kind];
		
		UITableViewRowAnimation animation = [thisAction animation];

		if (animation & TitaniumTableActionScroll) {
			NSIndexPath * thisPath = nil;
			switch (animation) {
				case TitaniumTableActionScrollRow:
					thisPath = [self indexPathFromInt:[thisAction index]];
					break;
				case TitaniumTableActionScrollSectionRow:
					break;
				default:
					break;
			}
			if(thisPath == nil)continue;
			
			[tableView scrollToRowAtIndexPath:thisPath
					atScrollPosition:[thisAction scrollPosition] animated:[thisAction isAnimated]];
			continue;
		}

		TableSectionWrapper * thisSectionWrapper=nil;
		int row = -1;
		int section = -1;
		NSArray * ourIndexPathArray = nil;
		NSIndexSet * ourSectionSet = nil;
		TitaniumCellWrapper * thisRow=nil;
		if(kind & TitaniumTableActionSectionRow){
			section = [thisAction section];
			row	 = [thisAction row];
			if(row<0)continue;
			thisSectionWrapper = [self sectionForIndex:section];
			if(thisSectionWrapper == nil)continue;
			ourIndexPathArray = [NSArray arrayWithObject:[NSIndexPath indexPathForRow:row inSection:section]];
		} else if (kind & TitaniumTableActionSection){
			section = [thisAction section];
			if(section<0)continue;
			ourSectionSet = [NSIndexSet indexSetWithIndex:section];
		}

		switch (kind) {
			case TitaniumTableActionInsertAfterRow:
			case TitaniumTableActionInsertBeforeRow:
			case TitaniumTableActionUpdateRow:
				[self modifyRow:[thisAction rowData] atIndex:[thisAction index] action:kind relativeUrl:[thisAction baseUrl] animation:animation];
				break;
			case TitaniumTableActionAppendRow:
				[self appendRow:[thisAction rowData] relativeUrl:[thisAction baseUrl] animation:animation];
				break;
			case TitaniumTableActionDeleteRow:
				[self deleteRowAtIndex:[thisAction index] animation:animation];
				break;
			case TitaniumTableActionReloadData:
				[self reloadData:[thisAction replacedData] relativeUrl:[thisAction baseUrl] animation:animation];
				break;
			case TitaniumGroupActionInsertBeforeRow:
				if(row > [thisSectionWrapper rowCount]) break;
				thisRow = TitaniumCellWithData([thisAction rowData],[thisAction baseUrl],templateCell);
				[thisSectionWrapper insertRow:thisRow atIndex:row];
				[tableView insertRowsAtIndexPaths:ourIndexPathArray withRowAnimation:animation];
				[thisRow release];
				break;
			case TitaniumGroupActionDeleteRow:
				if(row >= [thisSectionWrapper rowCount]) break;
				[thisSectionWrapper removeRowAtIndex:row];
				[tableView deleteRowsAtIndexPaths:ourIndexPathArray withRowAnimation:animation];
				break;
			case TitaniumGroupActionUpdateRow:
				if(row >= [thisSectionWrapper rowCount]) break;
				thisRow = [thisSectionWrapper rowForIndex:row];
				[thisRow useProperties:[thisAction rowData] withUrl:[thisAction baseUrl]];
				if([tableView respondsToSelector:@selector(reloadRowsAtIndexPaths:withRowAnimation:)]){
					[tableView reloadRowsAtIndexPaths:ourIndexPathArray withRowAnimation:animation];
				} else {
					[tableView deleteRowsAtIndexPaths:ourIndexPathArray withRowAnimation:animation];
					[tableView insertRowsAtIndexPaths:ourIndexPathArray withRowAnimation:animation];
				}
				break;
			case TitaniumGroupActionInsertBeforeGroup:
				if(section > [sectionArray count])break;
				[sectionArray insertObject:[TableSectionWrapper tableSectionWithData:[thisAction sectionData]
						withUrl:[thisAction baseUrl] template:templateCell] atIndex:section];
				[tableView insertSections:ourSectionSet withRowAnimation:animation];
				break;
			case TitaniumGroupActionUpdateGroup:
				if(section >= [sectionArray count])break;
				//Todo: Possibly not replace, but just update?
				[sectionArray replaceObjectAtIndex:section withObject:[TableSectionWrapper
						tableSectionWithData:[thisAction sectionData] withUrl:[thisAction baseUrl] template:templateCell]];
				if([tableView respondsToSelector:@selector(reloadSections:withRowAnimation:)]){
					[tableView reloadSections:ourSectionSet withRowAnimation:animation];
				} else {
					[tableView deleteSections:ourSectionSet withRowAnimation:animation];
					[tableView insertSections:ourSectionSet withRowAnimation:animation];
				}
				break;
			case TitaniumGroupActionDeleteGroup:
				if(section >= [sectionArray count])break;
				[sectionArray removeObjectAtIndex:section];
				[tableView deleteSections:ourSectionSet withRowAnimation:animation];
				break;
			case TitaniumGroupActionReloadSections:
				[self reloadSections:[thisAction replacedData] relativeUrl:[thisAction baseUrl] animation:animation];
				break;
		}
	}
	[actionQueue release];
	actionQueue = nil;
	[actionLock unlock];
}

#pragma mark Search bar stuffs

- (UIButton *) searchScreenView;
{
	if (searchScreenView == nil) {
		searchScreenView = [[UIButton alloc] init];
		[searchScreenView addTarget:self action:@selector(hideSearchScreen:) forControlEvents:UIControlEventTouchUpInside];
		[searchScreenView setShowsTouchWhenHighlighted:NO];
		[searchScreenView setAdjustsImageWhenDisabled:NO];
		[searchScreenView setOpaque:NO];
		[searchScreenView setBackgroundColor:[UIColor blackColor]];
	}
	return searchScreenView;
}


- (UITableView *) searchTableView;
{
	if(searchTableView == nil){
		CGRect searchFrame = [[self searchScreenView] frame];
		//Todo: make sure we account for the keyboard.
		searchTableView = [[UITableView alloc] initWithFrame:searchFrame style:UITableViewStylePlain];
		[searchTableView setDelegate:self];
		[searchTableView setDataSource:self];
	}
	return searchTableView;
}


- (void)updateSearchResultIndexesForString:(NSString *) searchString;
{
	NSEnumerator * searchResultIndexEnumerator;
	if(searchResultIndexes == nil){
		searchResultIndexes = [[NSMutableArray alloc] initWithCapacity:[sectionArray count]];
		searchResultIndexEnumerator = nil;
	} else {
		searchResultIndexEnumerator = [searchResultIndexes objectEnumerator];
	}

	//TODO: If the search is adding letters to the previous search string, do it by elimination instead of adding.
	
	NSString * ourSearchAttribute = searchAttributeKey;
	if(ourSearchAttribute == nil)ourSearchAttribute = @"title";
	
	for (TableSectionWrapper * thisSection in sectionArray) {
		NSMutableIndexSet * thisIndexSet = [searchResultIndexEnumerator nextObject];
		if(thisIndexSet == nil){
			searchResultIndexEnumerator = nil; //Make sure we don't use the enumerator anymore. 
			thisIndexSet = [NSMutableIndexSet indexSet];
			[searchResultIndexes addObject:thisIndexSet];
		} else {
			[thisIndexSet removeAllIndexes];
		}
		int cellIndex = 0;
		for (TitaniumCellWrapper * thisCell in thisSection) {
			if([thisCell stringForKey:ourSearchAttribute containsString:searchString]){
				[thisIndexSet addIndex:cellIndex];
			}
			cellIndex ++;
		}
	}
}


- (IBAction) hideSearchScreen: (id) sender;
{
	[UIView beginAnimations:@"searchy" context:nil];
	[searchField resignFirstResponder];
	[searchTableView removeFromSuperview];
	[searchScreenView setEnabled:NO];
	[searchScreenView setAlpha:0.0];
	[UIView commitAnimations];
}

- (IBAction) showSearchScreen: (id) sender;
{
	[tableView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]
			atScrollPosition:UITableViewScrollPositionBottom animated:NO];

	CGRect screenRect = [tableView frame];
	CGFloat searchHeight = [[tableView tableHeaderView] frame].size.height;

	screenRect.origin.y += searchHeight;
	screenRect.size.height -= searchHeight;
		
	if ([[self searchScreenView] superview] != wrapperView) {
		[searchScreenView setAlpha:0.0];
		[wrapperView insertSubview:searchScreenView aboveSubview:tableView];
	}
	[searchScreenView setFrame:screenRect];

	[UIView beginAnimations:@"searchy" context:nil];
	[searchScreenView setEnabled:YES];
	[searchScreenView setAlpha:0.85];
	[UIView commitAnimations];
}

- (void)searchBarTextDidBeginEditing:(UISearchBar *)searchBar;                     // called when text starts editing
{
	[self showSearchScreen:nil];
}

- (void)searchBarTextDidEndEditing:(UISearchBar *)searchBar;                       // called when text ends editing
{
	
}

- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText;   // called when text changes (including clear)
{
	if([searchText length]==0){
		[searchTableView removeFromSuperview];
		return;
	}
	[self updateSearchResultIndexesForString:searchText];
	
	if([searchTableView superview] != wrapperView){
		if(searchTableView == nil){
			[self searchTableView];
		} else {
			[searchTableView reloadSections:[NSIndexSet indexSetWithIndex:0]
					withRowAnimation:UITableViewRowAnimationFade];
		}
		[wrapperView addSubview:searchTableView];
	} else {
		[searchTableView reloadSections:[NSIndexSet indexSetWithIndex:0]
				withRowAnimation:UITableViewRowAnimationFade];
	}
}

- (void)searchBarSearchButtonClicked:(UISearchBar *)searchBar;
{
	[searchField resignFirstResponder];
}

- (void)searchBarCancelButtonClicked:(UISearchBar *) searchBar;
{
	[searchBar setText:nil];
	[self hideSearchScreen:nil];
}

@end
