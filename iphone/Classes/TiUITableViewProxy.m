/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#ifndef USE_TI_UISEARCHBAR
#define USE_TI_UISEARCHBAR
#endif

#import "TiUITableViewProxy.h"
#import "TiUITableView.h"
#import "TiUITableViewRowProxy.h"
#import "TiUITableViewSectionProxy.h"
#import "TiUITableViewAction.h"
#import "TiUtils.h"
#import "WebFont.h"
#import "TiViewProxy.h"
#import "TiComplexValue.h"


NSArray * tableKeySequence;

@interface TiUITableViewProxy ()
-(void)setData:(id)args withObject:(id)properties immediate:(BOOL)immediate;
@end

@implementation TiUITableViewProxy
@synthesize sections;

-(int)sectionCount
{
	return [sections count];
}

USE_VIEW_FOR_CONTENT_HEIGHT

#pragma mark Internal

- (id) init
{
	self = [super init];
	if (self != nil)
	{
		sections = [[NSMutableArray array] retain];
	}
	return self;
}

-(void)_initWithProperties:(NSDictionary *)properties
{
    [self replaceValue:NUMBOOL(NO) forKey:@"searchHidden" notification:NO];
    [self replaceValue:NUMBOOL(YES) forKey:@"hideSearchOnSelection" notification:NO];
    [super _initWithProperties:properties];
}

- (void) dealloc
{
	[sections makeObjectsPerformSelector:@selector(setParent:) withObject:nil];
	RELEASE_TO_NIL(sections);
	[super dealloc];
}


-(TiUITableView*)tableView
{
	return (TiUITableView*)[self view];
}

-(void)viewWillDetach
{
    for (TiUITableViewSectionProxy* section in sections) {
        for (TiUITableViewRowProxy* row in [section rows]) {
            [row detachView];
        }
        [section detachView];
		[section setTable:nil];
    }
}

-(void)viewDidAttach
{
	TiUITableView * ourView = (TiUITableView *)[self view];
    for (TiUITableViewSectionProxy* section in sections) {
		[section setTable:ourView];
    }
}

-(NSArray *)keySequence
{
	if (tableKeySequence == nil)
	{
		tableKeySequence = [[NSArray arrayWithObjects:@"style",@"search",@"data",@"backgroundColor",nil] retain];
	}
	return tableKeySequence;
}

-(NSInteger)indexForRow:(TiUITableViewRowProxy*)row
{
	int index = 0;
	for (TiUITableViewSectionProxy * thisSection in sections)
	{
		if (thisSection == row.section)
		{
			return index + row.row;
		}
		index+=[thisSection rowCount];
	}
	return index;
}

-(NSInteger)sectionIndexForIndex:(NSInteger)theindex
{
	int index = 0;
	int section = 0;
	
	for (TiUITableViewSectionProxy * thisSection in sections)
	{
		index+=[thisSection rowCount];
		if (theindex < index)
		{
			return section;
		}
		section++;
	}
	
	return 0;
}

-(TiUITableViewRowProxy*)rowForIndex:(NSInteger)index section:(NSInteger*)section
{
	int current = 0;
	int row = index;
	int sectionIdx = 0;
	
	for (TiUITableViewSectionProxy *sectionProxy in sections)
	{
		int rowCount = [sectionProxy rowCount];
		if (rowCount + current > index)
		{
			if (section!=nil)
			{
				*section = sectionIdx;
			}
			return [sectionProxy rowAtIndex:row];
		}
		row -= rowCount;
		current += rowCount;
		sectionIdx++;
	}

	return nil;
}

-(NSIndexPath *)indexPathFromInt:(NSInteger)index
{
	if(index < 0)
	{
		return nil;
	}
	int section = 0;
	int current = 0;
	int row = index;
	
	for (TiUITableViewSectionProxy * thisSection in sections)
	{
		int rowCount = [thisSection rowCount];
		if (rowCount + current > index)
		{
			return [NSIndexPath indexPathForRow:row inSection:section];
		}
		section++;
		row -= rowCount;
		current += rowCount;
	}
	return nil;
}

-(NSInteger)indexForIndexPath:(NSIndexPath *)path
{
	int index = 0;
	int section = 0;
	
	for (TiUITableViewSectionProxy * thisSection in sections)
	{
		if (section == [path section])
		{
			return index + [path row];
		}
		section++;
		index+=[thisSection rowCount];
	}
	
	return 0;
}

-(TiUITableViewRowProxy*)makeTableViewRowFromDict:(NSDictionary*)data
{
    id<TiEvaluator> context = [self executionContext];
    if (context == nil) {
        context = [self pageContext];
    }
	TiUITableViewRowProxy *proxy = [[[TiUITableViewRowProxy alloc] _initWithPageContext:context] autorelease];
	[proxy _initWithProperties:data];
	return proxy;
}

-(TiUITableViewRowProxy*)tableRowFromArg:(id)data
{
	TiUITableViewRowProxy *row = nil;
	
	if ([data isKindOfClass:[NSDictionary class]])
	{
		row = [self makeTableViewRowFromDict:data];
	}
	else if ([data isKindOfClass:[TiUITableViewRowProxy class]])
	{
		row = (TiUITableViewRowProxy*)data;
	}
	
	if (row == nil)
	{
		[self throwException:@"couldn't determine row data from argument" subreason:nil location:CODELOCATION];
	}
	return row;
}

-(TiUITableViewSectionProxy*)sectionForIndex:(NSInteger)index row:(TiUITableViewRowProxy**)rowOut
{
	int current = 0;
	int row = index;
	int sectionIdx = 0;
	
	TiUITableViewRowProxy *rowProxy = nil;
	TiUITableViewSectionProxy *sectionProxy = nil;
	
	for (sectionProxy in sections)
	{
		int rowCount = [sectionProxy rowCount];
		if (rowCount + current > index)
		{
			rowProxy = [sectionProxy rowAtIndex:row];
			if (rowOut!=nil)
			{	
				*rowOut = rowProxy;
			}
			break;
		}
		row -= rowCount;
		current += rowCount;
		sectionIdx++;
	}		
	
	return sectionProxy;
}

-(TiUITableViewSectionProxy *)sectionWithHeader:(NSString *)newHeader table:(TiUITableView *)table
{
    // TODO: OK, this is actually kind of important.. need to do stuff like this throughout the code,
    // to make sure that things are properly registered/unregistered.
	id<TiEvaluator> ourContext = [self executionContext];
    if (ourContext == nil) {
        ourContext = [self pageContext];
    }
	TiUITableViewSectionProxy *result = [[TiUITableViewSectionProxy alloc] _initWithPageContext:ourContext args:nil];
	[(KrollBridge *)ourContext registerProxy:result];
	[self rememberProxy:result];

	if (table != nil)
	{
		// Set up the new section
		result.table = table;
		result.parent = (TiViewProxy*)[table proxy];
	}
	if (newHeader != nil)
	{
		[result replaceValue:newHeader forKey:@"headerTitle" notification:NO];
	}
	return [result autorelease];
}

#pragma mark Public APIs

-(void)selectRow:(id)args
{
	TiThreadPerformOnMainThread(^{[(TiUITableView*)[self view] selectRow:args];}, NO);
}

-(void)deselectRow:(id)args
{
	TiThreadPerformOnMainThread(^{[(TiUITableView*)[self view] deselectRow:args];}, NO);
}

-(void)scrollToIndex:(id)args
{
	ENSURE_UI_THREAD(scrollToIndex,args);
	
	NSInteger index = [TiUtils intValue:[args objectAtIndex:0]];
	NSDictionary *options = [args count] > 1 ? [args objectAtIndex:1] : nil;

	UITableViewScrollPosition scrollPosition = [TiUtils intValue:@"position" properties:options def:UITableViewScrollPositionNone];
	BOOL animated = [TiUtils boolValue:@"animated" properties:options def:YES];
	
	[(TiUITableView*)[self view] scrollToIndex:index position:scrollPosition animated:animated];
}

-(void)scrollToTop:(id)args
{
	ENSURE_UI_THREAD(scrollToTop,args);
	NSInteger top = [TiUtils intValue:[args objectAtIndex:0]];
	NSDictionary *options = [args count] > 1 ? [args objectAtIndex:1] : nil;
	BOOL animated = [TiUtils boolValue:@"animated" properties:options def:YES];
	
	[(TiUITableView*)[self view] scrollToTop:top animated:animated];
}


-(NSNumber*)getIndexByName:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	
	int c = 0;
	
	for (TiUITableViewSectionProxy *section in sections)
	{
		for (TiUITableViewRowProxy *row in [section rows])
		{
			if ([args isEqualToString:[row valueForUndefinedKey:@"name"]])
			{
				return NUMINT(c);
			}
			c++;
		}
	}
	return NUMINT(-1);
}

-(void)updateRow:(id)args
{
    int index = 0;
    id data = nil;
    NSDictionary* anim = nil;
    
    ENSURE_INT_AT_INDEX(index, args, 0);
    ENSURE_ARG_AT_INDEX(data, args, 1, NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(anim, args, 2, NSDictionary);
    
	TiUITableViewRowProxy *newrow = [self tableRowFromArg:data];
    
    __block TiUITableViewRowProxy *rowProxy = nil;
    
    TiThreadPerformOnMainThread(^{
        int current = 0;
        int row = index;
        int sectionIdx = 0;
        TiUITableViewSectionProxy *sectionProxy = nil;
        
        for (sectionProxy in sections)
        {
            int rowCount = [sectionProxy rowCount];
            if (rowCount + current > index)
            {
                rowProxy = [sectionProxy rowAtIndex:row];
                break;
            }
            row -= rowCount;
            current += rowCount;
            sectionIdx++;
        }	
    }, YES);
    
    if (rowProxy==nil)
    {
        [self throwException:[NSString stringWithFormat:@"cannot find row at index: %d",index] subreason:nil location:CODELOCATION];
        return;
    }
    
    if (rowProxy != newrow) {
        [[rowProxy section] rememberProxy:newrow];
        
        newrow.section = rowProxy.section;
        newrow.row = rowProxy.row;
        newrow.parent = newrow.section;
        
        //We now need to disconnect the old row proxy.
        rowProxy.section = nil;
        rowProxy.parent = nil;
        rowProxy.table = nil;
        
        
        // Only update the row if we're loading it with data; but most of this should
        // be taken care of by -[TiUITableViewProxy tableRowFromArg:] anyway, right?
        if ([data isKindOfClass:[NSDictionary class]]) {
            [newrow updateRow:data withObject:anim];
        }
    }
    
    TiThreadPerformOnMainThread(^{
        TiUITableView *table = [self viewInitialized]?[self tableView]:nil;
        TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:newrow animation:anim type:TiUITableViewActionUpdateRow] autorelease];
        [table dispatchAction:action];
    }, NO);
    

}

-(void)deleteRow:(id)args
{
	ENSURE_UI_THREAD(deleteRow,args);
	
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	NSDictionary *anim = [args count] > 1 ? [args objectAtIndex:1] : nil;
	
		
	if ([sections count]==0)
	{
		DebugLog(@"[WARN] No rows found in table, ignoring delete");
		return;
	}
	
	TiUITableViewRowProxy *row = nil;
	TiUITableViewSectionProxy *section = [self sectionForIndex:index row:&row];
	
	if (section==nil || row == nil)
	{
		DebugLog(@"[WARN] No row found for index: %d",index);
		return;
	}
	
	if ([self viewInitialized])
	{
		TiUITableView *table = [self tableView];
		TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:row animation:anim type:TiUITableViewActionDeleteRow] autorelease];
		[table dispatchAction:action];
	}
	else
	{
		//No table, we have to do the data update ourselves.
		// If we don't handle it, the row gets dropped on the ground,
		// but if we create the tableview, there's this horrible issue where
		// the uitableview isn't fully formed, it gets this message to do an action,
		// and ends up throwing an exception because we're out of bounds.
		[section remove:row];
	}

}

-(void)insertRowBefore:(id)args
{
//	ENSURE_UI_THREAD(insertRowBefore,args);
	
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	NSDictionary *data = [args objectAtIndex:1];
	NSDictionary *anim = [args count] > 2 ? [args objectAtIndex:2] : nil;
	
	TiUITableView *table = [self viewInitialized]?[self tableView]:nil;
	
	if ([sections count]==0)
	{
		[self throwException:@"invalid number of rows" subreason:nil location:CODELOCATION];
		return;
	}
	
	TiUITableViewRowProxy *row = nil;
	TiUITableViewSectionProxy *section = [self sectionForIndex:index row:&row];
	
	if (section==nil || row == nil)
	{
		[self throwException:@"no row found for index" subreason:nil location:CODELOCATION];
		return;
	}
	
	TiUITableViewRowProxy *newrow = [self tableRowFromArg:data];
    TiUITableViewActionType actionType = TiUITableViewActionInsertRowBefore;
    TiUITableViewSectionProxy *actionSection = section;
    id header = [newrow valueForKey:@"header"];
    if (header != nil) {
        TiUITableViewSectionProxy *newSection = [self sectionWithHeader:header table:table];
        
        // Insert the new section into the array - but, exactly WHERE we insert depends.
        int sectionIndex = [sections indexOfObject:section];
        if (row.row != 0) {
            sectionIndex++;
        }
        
		// Set the section index here, so that it goes in the right place
		newSection.section = sectionIndex;
		
        // Thanks to how we track sections, we also need to manually update the index
        // of each section in the array after where the insert will be.
        for (int i=sectionIndex; i < [sections count]; i++) {
            TiUITableViewSectionProxy *updateSection = [sections objectAtIndex:i];
            updateSection.section = updateSection.section + 1;
        }
        
        // Configure the new row
		[newSection rememberProxy:newrow];	//If we wait until the main thread, it'll be too late!
        newrow.section = newSection;
        newrow.parent = newSection;      
        newrow.row = row.row; // HACK: Used to determine the row we're being placed before in the old section
        
        // Configure the action
        actionType = TiUITableViewActionInsertSectionBefore;
        actionSection = newSection;
    }
    else {
		[section rememberProxy:newrow];	//If we wait until the main thread, it'll be too late!
        newrow.section = section;
        // TODO: Should we be updating every row after this one...?
        newrow.row = row.row == 0 ? 0 : row.row;
        newrow.parent = section;
    }
	
	if(table != nil)
	{
		TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:newrow animation:anim type:actionType] autorelease];
		[table dispatchAction:action];
	}
	else
	{
		//No table, we have to do the data update ourselves.
		//TODO: Implement. Better yet, refactor.
		DebugLog(@"[WARN] Table view was not in place before insertRowBefore was called.");
	}

}

-(void)insertRowAfter:(id)args
{
//	ENSURE_UI_THREAD(insertRowAfter,args);
	
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	NSDictionary *data = [args objectAtIndex:1];
	NSDictionary *anim = [args count] > 2 ? [args objectAtIndex:2] : nil;

	TiUITableView *table = [self viewInitialized]?[self tableView]:nil;
	
	if ([sections count]==0)
	{
		[self throwException:@"invalid number of rows" subreason:nil location:CODELOCATION];
		return;
	}
	
	TiUITableViewRowProxy *row = nil;
	TiUITableViewSectionProxy *section = [self sectionForIndex:index row:&row];
	
	if (section==nil || row == nil)
	{
		[self throwException:@"no row found for index" subreason:nil location:CODELOCATION];
		return;
	}
	
	TiUITableViewRowProxy *newrow = [self tableRowFromArg:data];
    TiUITableViewActionType actionType = TiUITableViewActionInsertRowAfter;
    TiUITableViewSectionProxy *actionSection = section;
    id header = [newrow valueForKey:@"header"];
    if (header != nil) {
        TiUITableViewSectionProxy *newSection = [self sectionWithHeader:header table:table];
        
        // Set up the new section
        newSection.section = section.section + 1;
        
        // Insert the new section into the array
        int sectionIndex = [sections indexOfObject:section] + 1;
        
        // Thanks to how we track sections, we also need to manually update the index
        // of each section in the array after where the insert will be.
        for (int i=sectionIndex; i < [sections count]; i++) {
            TiUITableViewSectionProxy *updateSection = [sections objectAtIndex:i];
            updateSection.section = updateSection.section + 1;
        }
        
        // Configure the new row
		[newSection rememberProxy:newrow];	//If we wait until the main thread, it'll be too late!
        newrow.section = newSection;
        newrow.parent = newSection;   
        newrow.row = row.row+1; // HACK: Used to determine the row we're being placed after in the previous section; will be set to 0 later
        
        // Configure the action
        actionType = TiUITableViewActionInsertSectionAfter;
        actionSection = newSection;
    }
    else {
		[section rememberProxy:newrow];	//If we wait until the main thread, it'll be too late!
        newrow.section = section;
        // TODO: Should we be updating every row index of the rows which appear after this row...?
        newrow.row = row.row+1;
        newrow.parent = section;
    }

	if (table != nil)
	{
		TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:newrow animation:anim type:actionType] autorelease];
		[table dispatchAction:action];
	}
	else
	{
		//No table, we have to do the data update ourselves.
		//TODO: Implement. Better yet, refactor.
		DebugLog(@"[WARN] Table view was not in place before insertRowAfter was called.");
	}

}

-(void)appendRow:(id)args
{
//	ENSURE_UI_THREAD(appendRow,args);
	
	id data = [args objectAtIndex:0];
	NSDictionary *anim = [args count] > 1 ? [args objectAtIndex:1] : nil;
	
    if ([data isKindOfClass:[NSArray class]]) {
        for (id row in data) {
            [self appendRow:[NSArray arrayWithObjects:row, anim, nil]];
        }
        return;
    }
    
    TiUITableViewRowProxy *row = [self tableRowFromArg:data];
    
    TiUITableView *table = [self viewInitialized]?[self tableView]:nil;
    
    if (sections == nil || [sections count]==0)
    {
        [self setData:[NSArray arrayWithObject:data] withObject:anim immediate:YES];
        return;
    }
    else
    {
        id header = [row valueForKey:@"header"];
        TiUITableViewActionType actionType = TiUITableViewActionAppendRow;
        __block TiUITableViewSectionProxy* section = nil;
        TiThreadPerformOnMainThread(^{
            section = [sections lastObject];
        }, YES);
        
        if (header != nil) {
            NSInteger newSectionIndex = section.section + 1;
            section = [self sectionWithHeader:header table:table];		
            section.section = newSectionIndex;
            actionType = TiUITableViewActionAppendRowWithSection;
        }
        row.section = section;
        row.parent = section;
        
        if(table != nil){
            [section rememberProxy:row];	//If we wait until the main thread, it'll be too late!
            TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:row animation:anim type:actionType] autorelease];
            [table dispatchAction:action];
        }
        else
        {
            //No table, we have to do the data update ourselves.
            [section add:row];
        }
    }	
}

-(void)setData:(id)args withObject:(id)properties immediate:(BOOL)immediate
{
	ENSURE_TYPE_OR_NIL(args,NSArray);
	
	// this is on the non-UI thread. let's do the work here before we pass
	// it over to the view which will be on the UI thread
	
	Class dictionaryClass = [NSDictionary class];
	Class sectionClass = [TiUITableViewSectionProxy class];
	Class rowClass = [TiUITableViewRowProxy class];
		
	NSMutableArray *data = [NSMutableArray array];
	
	TiUITableViewSectionProxy *section = nil;
	
	for (id row in args)
	{
		if ([row isKindOfClass:dictionaryClass])
		{
			NSDictionary *dict = (NSDictionary*)row;
			TiUITableViewRowProxy *rowProxy = [self makeTableViewRowFromDict:dict];
			NSString *header = [dict objectForKey:@"header"];
			if (section == nil || header!=nil)
			{
				// if we don't yet have a section, that means we need to create one
				// if we have a header property, that means start a new section
				section = [self sectionWithHeader:header table:nil];
				[data addObject:section];
			}
			NSString *footer = [dict objectForKey:@"footer"];
			if (footer!=nil)
			{
				[section replaceValue:footer forKey:@"footerTitle" notification:NO];
			}
			[section add:rowProxy];
		}
		else if ([row isKindOfClass:sectionClass])
		{
			section = (TiUITableViewSectionProxy*)row;
			[self rememberProxy:row];
			[data addObject:section];
		}
		else if ([row isKindOfClass:rowClass])
		{
			id rowHeader = [row valueForKey:@"header"];
			id rowFooter = [row valueForKey:@"footer"];
			if (section == nil || rowHeader!=nil)
			{
				section = [self sectionWithHeader:rowHeader table:[self tableView]];
				section.section = [data count];
				[data addObject:section];
			}
			if (rowFooter!=nil)
			{
				[section replaceValue:rowFooter forKey:@"footerTitle" notification:NO];
			}
			[section add:row];
		}
	}
	
	TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:data animation:properties type:TiUITableViewActionSetData] autorelease];
	[self makeViewPerformSelector:@selector(dispatchAction:) withObject:action createIfNeeded:YES waitUntilDone:immediate];
}

-(void)setData:(id)args withObject:(id)properties
{
    [self setData:args withObject:properties immediate:NO];
}

-(void)setData:(id)args
{
	// if you pass in no args, it's a non animation set
	[self setData:args withObject:[NSDictionary dictionaryWithObject:NUMINT(UITableViewRowAnimationNone) forKey:@"animationStyle"]];
}

-(NSArray*)data
{
    __block NSArray* curSections = nil;
    //TIMOB-9890. Ensure data is retrieved off of the main 
    //thread to ensure any pending operations are completed
    TiThreadPerformOnMainThread(^{
        curSections = [[NSArray arrayWithArray:sections] retain];
    }, YES);
    return [curSections autorelease];
}

-(void)setContentInsets:(id)args
{
	ENSURE_UI_THREAD(setContentInsets,args);
	id arg1;
	id arg2;
	if ([args isKindOfClass:[NSDictionary class]])
	{
		arg1 = args;
		arg2 = [NSDictionary dictionary];
	}
	else
	{
		arg1 = [args objectAtIndex:0];
		arg2 = [args count] > 1 ? [args objectAtIndex:1] : [NSDictionary dictionary];
	}
	[[self view] performSelector:@selector(setContentInsets_:withObject:) withObject:arg1 withObject:arg2];
}


@end 

#endif
