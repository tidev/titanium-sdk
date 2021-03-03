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
#import "TiUITableViewAction.h"
#import "TiUITableViewRowProxy.h"
#import "TiUITableViewSectionProxy.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiComplexValue.h>
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiViewProxy.h>
#import <TitaniumKit/WebFont.h>

NSArray *tableKeySequence;

@interface TiUITableViewProxy ()
- (void)setData:(id)args withObject:(id)properties immediate:(BOOL)immediate;
@end

@implementation TiUITableViewProxy
@synthesize internalSections = sections;

USE_VIEW_FOR_CONTENT_HEIGHT

#pragma mark Internal

- (id)init
{
  self = [super init];
  if (self != nil) {
    sections = [[NSMutableArray array] retain];
  }
  return self;
}

- (void)_initWithProperties:(NSDictionary *)properties
{
  [self replaceValue:NUMBOOL(NO) forKey:@"searchHidden" notification:NO];
  [self replaceValue:NUMBOOL(YES) forKey:@"hideSearchOnSelection" notification:NO];
  [super _initWithProperties:properties];
}

- (void)dealloc
{
  [sections makeObjectsPerformSelector:@selector(setParent:) withObject:nil];
  RELEASE_TO_NIL(sections);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.TableView";
}

- (TiUITableView *)tableView
{
  return (TiUITableView *)[self view];
}

- (void)viewWillDetach
{
  ((TiUITableView *)[self view]).viewWillDetach = YES;
  for (TiUITableViewSectionProxy *section in sections) {
    for (TiUITableViewRowProxy *row in [section rows]) {
      [row detachView];
    }
    [section detachView];
    [section setTable:nil];
  }
}

- (void)viewDidAttach
{
  TiUITableView *ourView = (TiUITableView *)[self view];
  ourView.viewWillDetach = NO;
  for (TiUITableViewSectionProxy *section in sections) {
    [section setTable:ourView];
  }
}

- (void)gainFocus
{
  [[self tableView] viewGetFocus];
}

- (void)resignFocus
{
  [[self tableView] viewResignFocus];
}

- (NSArray *)keySequence
{
  if (tableKeySequence == nil) {
    tableKeySequence = [[NSArray arrayWithObjects:@"style", @"showSearchBarInNavBar", @"search", @"data", @"backgroundColor", nil] retain];
  }
  return tableKeySequence;
}

- (NSInteger)indexForRow:(TiUITableViewRowProxy *)row
{
  NSInteger index = 0;
  for (TiUITableViewSectionProxy *thisSection in sections) {
    if (thisSection == row.section) {
      return index + row.row;
    }
    index += thisSection.rowCount.integerValue;
  }
  return index;
}

- (NSInteger)sectionIndexForIndex:(NSInteger)theindex
{
  NSInteger index = 0;
  NSInteger section = 0;

  for (TiUITableViewSectionProxy *thisSection in sections) {
    index += thisSection.rowCount.integerValue;
    if (theindex < index) {
      return section;
    }
    section++;
  }

  return 0;
}

- (TiUITableViewRowProxy *)rowForIndex:(NSInteger)index section:(NSInteger *)section
{
  int current = 0;
  NSInteger row = index;
  int sectionIdx = 0;

  for (TiUITableViewSectionProxy *sectionProxy in sections) {
    NSUInteger rowCount = sectionProxy.rowCount.unsignedIntegerValue;
    if (rowCount + current > index) {
      if (section != nil) {
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

- (NSIndexPath *)indexPathFromInt:(NSInteger)index
{
  if (index < 0) {
    return nil;
  }
  int section = 0;
  int current = 0;
  NSInteger row = index;

  for (TiUITableViewSectionProxy *thisSection in sections) {
    NSUInteger rowCount = thisSection.rowCount.unsignedIntegerValue;
    if (rowCount + current > index) {
      NSMutableArray *searchIndex = ((TiUITableView *)self.view).searchResultIndexes;
      if (searchIndex.count > 0) {
        // Search screen is not dismissed
        NSMutableIndexSet *searchedRow;
        __block NSInteger rowPosition = 0;
        for (int i = 0; i < section; i++) {
          searchedRow = searchIndex[i];
          rowPosition += searchedRow.count;
        }

        searchedRow = searchIndex[section];

        [searchedRow enumerateIndexesUsingBlock:^(NSUInteger idx, BOOL *_Nonnull stop) {
          if (idx == row) {
            *stop = true;
          }
          rowPosition++;
        }];
        // If search is on, we show only one section
        return [NSIndexPath indexPathForRow:rowPosition - 1 inSection:0];
      }
      return [NSIndexPath indexPathForRow:row inSection:section];
    }
    section++;
    row -= rowCount;
    current += rowCount;
  }
  return nil;
}

- (NSInteger)indexForIndexPath:(NSIndexPath *)path
{
  NSInteger index = 0;
  int section = 0;

  for (TiUITableViewSectionProxy *thisSection in sections) {
    if (section == [path section]) {
      return index + [path row];
    }
    section++;
    index += thisSection.rowCount.integerValue;
  }

  return 0;
}

- (void)rememberSection:(TiUITableViewSectionProxy *)section
{
  [self rememberProxy:section];
  [section setParent:self];
  [section reorderRows];
}

- (void)forgetSection:(TiUITableViewSectionProxy *)section
{
  [self forgetProxy:section];
  [section setTable:nil];
  [section setParent:nil];
}

- (void)performTableActionIfInitialized:(void (^)(void))tableAction forceReload:(BOOL)forceReload;
{
  if (![self viewInitialized]) {
    return;
  }
  TiViewProxy<TiKeyboardFocusableView> *chosenField = [[[TiApp controller] keyboardFocusedProxy] retain];
  BOOL hasFocus = [chosenField focused:nil];
  BOOL oldSuppress = [chosenField suppressFocusEvents];
  [chosenField setSuppressFocusEvents:YES];
  tableAction();
  if (hasFocus) {
    [chosenField focus:nil];
  }
  [chosenField setSuppressFocusEvents:oldSuppress];
  [chosenField release];
  [(TiUITableView *)[self view] refreshSearchControllerUsingReload:forceReload];
}

- (TiUITableViewRowProxy *)makeTableViewRowFromDict:(NSDictionary *)data
{
  id<TiEvaluator> context = [self executionContext];
  if (context == nil) {
    context = [self pageContext];
  }
  TiUITableViewRowProxy *proxy = [[[TiUITableViewRowProxy alloc] _initWithPageContext:context] autorelease];
  [proxy _initWithProperties:data];
  return proxy;
}

- (TiUITableViewRowProxy *)tableRowFromArg:(id)data
{
  TiUITableViewRowProxy *row = nil;

  if ([data isKindOfClass:[NSDictionary class]]) {
    row = [self makeTableViewRowFromDict:data];
  } else if ([data isKindOfClass:[TiUITableViewRowProxy class]]) {
    row = (TiUITableViewRowProxy *)data;
  }

  if (row == nil) {
    [self throwException:@"couldn't determine row data from argument" subreason:nil location:CODELOCATION];
  }
  return row;
}

- (TiUITableViewSectionProxy *)sectionForIndex:(NSInteger)index row:(TiUITableViewRowProxy **)rowOut
{
  NSUInteger current = 0;
  NSInteger row = index;
  NSUInteger sectionIdx = 0;

  TiUITableViewRowProxy *rowProxy = nil;
  TiUITableViewSectionProxy *sectionProxy = nil;

  for (sectionProxy in sections) {
    NSUInteger rowCount = sectionProxy.rowCount.unsignedIntegerValue;
    if (rowCount + current > index) {
      rowProxy = [sectionProxy rowAtIndex:row];
      if (rowOut != nil) {
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

- (TiUITableViewSectionProxy *)sectionWithHeader:(NSString *)newHeader table:(TiUITableView *)table
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

  if (table != nil) {
    // Set up the new section
    result.table = table;
    result.parent = (TiViewProxy *)[table proxy];
  }
  if (newHeader != nil) {
    [result replaceValue:newHeader forKey:@"headerTitle" notification:NO];
  }
  return [result autorelease];
}

#pragma mark Public APIs

- (void)selectRow:(id)args
{
  TiThreadPerformOnMainThread(
      ^{
        [(TiUITableView *)[self view] selectRow:args];
      },
      NO);
}

- (void)deselectRow:(id)args
{
  TiThreadPerformOnMainThread(
      ^{
        [(TiUITableView *)[self view] deselectRow:args];
      },
      NO);
}

- (void)scrollToIndex:(id)args
{
  ENSURE_UI_THREAD(scrollToIndex, args);

  if (!((TiUITableView *)[self view]).shouldDelayScrolling) {
    [self performSelector:_cmd withObject:args afterDelay:.1];
    ((TiUITableView *)[self view]).shouldDelayScrolling = YES;
    return;
  }

  NSInteger index = [TiUtils intValue:[args objectAtIndex:0]];
  NSDictionary *options = [args count] > 1 ? [args objectAtIndex:1] : nil;

  UITableViewScrollPosition scrollPosition = [TiUtils intValue:@"position" properties:options def:UITableViewScrollPositionNone];
  BOOL animated = [TiUtils boolValue:@"animated" properties:options def:YES];

  [(TiUITableView *)[self view] scrollToIndex:index position:scrollPosition animated:animated];
}

- (void)scrollToTop:(id)args
{
  ENSURE_UI_THREAD(scrollToTop, args);
  NSInteger top = [TiUtils intValue:[args objectAtIndex:0]];
  NSDictionary *options = [args count] > 1 ? [args objectAtIndex:1] : nil;
  BOOL animated = [TiUtils boolValue:@"animated" properties:options def:YES];

  [(TiUITableView *)[self view] scrollToTop:top animated:animated];
}

- (NSNumber *)getIndexByName:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);

  int c = 0;

  for (TiUITableViewSectionProxy *section in sections) {
    for (TiUITableViewRowProxy *row in [section rows]) {
      if ([args isEqualToString:[row valueForUndefinedKey:@"name"]]) {
        return NUMINT(c);
      }
      c++;
    }
  }
  return NUMINT(-1);
}

- (void)updateRow:(id)args
{
  int index = 0;
  id data = nil;
  NSDictionary *anim = nil;

  ENSURE_INT_AT_INDEX(index, args, 0); // FIXME: Support larger number by coercing to uint32?
  ENSURE_ARG_AT_INDEX(data, args, 1, NSObject);
  ENSURE_ARG_OR_NIL_AT_INDEX(anim, args, 2, NSDictionary);

  TiUITableViewRowProxy *newrow = [self tableRowFromArg:data];

  __block TiUITableViewRowProxy *rowProxy = nil;

  TiThreadPerformOnMainThread(
      ^{
        NSUInteger current = 0;
        NSUInteger row = index;
        NSUInteger sectionIdx = 0;
        TiUITableViewSectionProxy *sectionProxy = nil;

        for (sectionProxy in sections) {
          NSUInteger rowCount = sectionProxy.rowCount.unsignedIntegerValue;
          if (rowCount + current > index) {
            rowProxy = [sectionProxy rowAtIndex:row];
            break;
          }
          row -= rowCount;
          current += rowCount;
          sectionIdx++;
        }
      },
      YES);

  if (rowProxy == nil) {
    [self throwException:[NSString stringWithFormat:@"cannot find row at index: %d", index] subreason:nil location:CODELOCATION];
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

  TiThreadPerformOnMainThread(
      ^{
        TiUITableView *table = [self viewInitialized] ? [self tableView] : nil;
        TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:newrow animation:anim type:TiUITableViewActionUpdateRow] autorelease];
        [table dispatchAction:action];
      },
      [NSThread isMainThread]);
}

- (void)deleteRow:(id)args
{
  ENSURE_UI_THREAD(deleteRow, args);

  id theArg = [args objectAtIndex:0];
  NSDictionary *anim = [args count] > 1 ? [args objectAtIndex:1] : nil;

  if ([sections count] == 0) {
    DebugLog(@"[WARN] No rows found in table, ignoring delete");
    return;
  }

  TiUITableViewRowProxy *row = nil;
  TiUITableViewSectionProxy *section = nil;

  if ([theArg isKindOfClass:[TiUITableViewRowProxy class]]) {
    row = (TiUITableViewRowProxy *)theArg;
    section = row.section;

    if (section == nil) {
      DebugLog(@"[WARN] No section found for row: %@", row);
      return;
    }
  } else if ([theArg isKindOfClass:[NSNumber class]]) {
    int index = [TiUtils intValue:theArg];
    section = [self sectionForIndex:index row:&row];
    if (section == nil || row == nil) {
      DebugLog(@"[WARN] No row found for index: %d", index);
      return;
    }
  } else {
    DebugLog(@"[WARN] Invalid type for row: %@", row);
    return;
  }

  if ([self viewInitialized]) {
    TiUITableView *table = [self tableView];
    TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:row animation:anim type:TiUITableViewActionDeleteRow] autorelease];
    [table dispatchAction:action];
  } else {
    //No table, we have to do the data update ourselves.
    // If we don't handle it, the row gets dropped on the ground,
    // but if we create the tableview, there's this horrible issue where
    // the uitableview isn't fully formed, it gets this message to do an action,
    // and ends up throwing an exception because we're out of bounds.
    [section remove:row];
  }
}

- (void)insertRowBefore:(id)args
{
  //	ENSURE_UI_THREAD(insertRowBefore,args);

  int index = [TiUtils intValue:[args objectAtIndex:0]];
  NSDictionary *data = [args objectAtIndex:1];
  NSDictionary *anim = [args count] > 2 ? [args objectAtIndex:2] : nil;

  TiUITableView *table = [self viewInitialized] ? [self tableView] : nil;

  if ([sections count] == 0) {
    [self throwException:@"invalid number of rows" subreason:nil location:CODELOCATION];
    return;
  }

  TiUITableViewRowProxy *row = nil;
  TiUITableViewSectionProxy *section = [self sectionForIndex:index row:&row];

  if (section == nil || row == nil) {
    [self throwException:@"no row found for index" subreason:nil location:CODELOCATION];
    return;
  }

  TiUITableViewRowProxy *newrow = [self tableRowFromArg:data];
  TiUITableViewActionType actionType = TiUITableViewActionInsertRowBefore;
  id header = [newrow valueForKey:@"header"];
  if (header != nil) {
    TiUITableViewSectionProxy *newSection = [self sectionWithHeader:header table:table];

    // Insert the new section into the array - but, exactly WHERE we insert depends.
    NSInteger sectionIndex = [sections indexOfObject:section];
    if (row.row != 0) {
      sectionIndex++;
    }

    // Set the section index here, so that it goes in the right place
    newSection.section = sectionIndex;

    // Thanks to how we track sections, we also need to manually update the index
    // of each section in the array after where the insert will be.
    for (NSUInteger i = sectionIndex; i < [sections count]; i++) {
      TiUITableViewSectionProxy *updateSection = [sections objectAtIndex:i];
      updateSection.section = updateSection.section + 1;
    }

    // Configure the new row
    [newSection rememberProxy:newrow]; //If we wait until the main thread, it'll be too late!
    newrow.section = newSection;
    newrow.parent = newSection;
    newrow.row = row.row; // HACK: Used to determine the row we're being placed before in the old section

    // Configure the action
    actionType = TiUITableViewActionInsertSectionBefore;
  } else {
    [section rememberProxy:newrow]; //If we wait until the main thread, it'll be too late!
    newrow.section = section;
    // TODO: Should we be updating every row after this one...?
    newrow.row = row.row == 0 ? 0 : row.row;
    newrow.parent = section;
  }

  if (table != nil) {
    TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:newrow animation:anim type:actionType] autorelease];
    [table dispatchAction:action];
  } else {
    //No table, we have to do the data update ourselves.
    //TODO: Implement. Better yet, refactor.
    DebugLog(@"[WARN] Table view was not in place before insertRowBefore was called.");
  }
}

- (void)insertRowAfter:(id)args
{
  //	ENSURE_UI_THREAD(insertRowAfter,args);

  int index = [TiUtils intValue:[args objectAtIndex:0]];
  NSDictionary *data = [args objectAtIndex:1];
  NSDictionary *anim = [args count] > 2 ? [args objectAtIndex:2] : nil;

  TiUITableView *table = [self viewInitialized] ? [self tableView] : nil;

  if ([sections count] == 0) {
    [self throwException:@"invalid number of rows" subreason:nil location:CODELOCATION];
    return;
  }

  TiUITableViewRowProxy *row = nil;
  TiUITableViewSectionProxy *section = [self sectionForIndex:index row:&row];

  if (section == nil || row == nil) {
    [self throwException:@"no row found for index" subreason:nil location:CODELOCATION];
    return;
  }

  TiUITableViewRowProxy *newrow = [self tableRowFromArg:data];
  TiUITableViewActionType actionType = TiUITableViewActionInsertRowAfter;
  id header = [newrow valueForKey:@"header"];
  if (header != nil) {
    TiUITableViewSectionProxy *newSection = [self sectionWithHeader:header table:table];

    // Set up the new section
    newSection.section = section.section + 1;

    // Insert the new section into the array
    NSUInteger sectionIndex = [sections indexOfObject:section] + 1;

    // Thanks to how we track sections, we also need to manually update the index
    // of each section in the array after where the insert will be.
    for (NSUInteger i = sectionIndex; i < [sections count]; i++) {
      TiUITableViewSectionProxy *updateSection = [sections objectAtIndex:i];
      updateSection.section = updateSection.section + 1;
    }

    // Configure the new row
    [newSection rememberProxy:newrow]; //If we wait until the main thread, it'll be too late!
    newrow.section = newSection;
    newrow.parent = newSection;
    newrow.row = row.row + 1; // HACK: Used to determine the row we're being placed after in the previous section; will be set to 0 later

    // Configure the action
    actionType = TiUITableViewActionInsertSectionAfter;
  } else {
    [section rememberProxy:newrow]; //If we wait until the main thread, it'll be too late!
    newrow.section = section;
    // TODO: Should we be updating every row index of the rows which appear after this row...?
    newrow.row = row.row + 1;
    newrow.parent = section;
  }

  if (table != nil) {
    TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:newrow animation:anim type:actionType] autorelease];
    [table dispatchAction:action];
  } else {
    //No table, we have to do the data update ourselves.
    //TODO: Implement. Better yet, refactor.
    DebugLog(@"[WARN] Table view was not in place before insertRowAfter was called.");
  }
}

- (void)appendRow:(id)args
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

  TiUITableView *table = [self viewInitialized] ? [self tableView] : nil;

  // Synchronize data with UI thread
  [self data];

  if (sections == nil || [sections count] == 0) {
    [self setData:[NSArray arrayWithObject:data] withObject:anim immediate:YES];
    return;
  } else {
    id header = [row valueForKey:@"header"];
    TiUITableViewActionType actionType = TiUITableViewActionAppendRow;
    TiUITableViewSectionProxy *section = [sections lastObject];
    if (header != nil) {
      NSInteger newSectionIndex = section.section + 1;
      section = [self sectionWithHeader:header table:table];
      section.section = newSectionIndex;
      actionType = TiUITableViewActionAppendRowWithSection;
    }
    row.section = section;
    row.parent = section;

    if (table != nil) {
      [section rememberProxy:row]; //If we wait until the main thread, it'll be too late!
      TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:row animation:anim type:actionType] autorelease];
      [table dispatchAction:action];
    } else {
      //No table, we have to do the data update ourselves.
      [section add:row];
    }
  }
}

- (void)setData:(id)args withObject:(id)properties immediate:(BOOL)immediate
{
  ENSURE_TYPE_OR_NIL(args, NSArray);

  // this is on the non-UI thread. let's do the work here before we pass
  // it over to the view which will be on the UI thread

  Class dictionaryClass = [NSDictionary class];
  Class sectionClass = [TiUITableViewSectionProxy class];
  Class rowClass = [TiUITableViewRowProxy class];

  NSMutableArray *data = [NSMutableArray array];

  TiUITableViewSectionProxy *section = nil;

  for (id row in args) {
    if ([row isKindOfClass:dictionaryClass]) {
      NSDictionary *dict = (NSDictionary *)row;
      TiUITableViewRowProxy *rowProxy = [self makeTableViewRowFromDict:dict];
      NSString *header = [dict objectForKey:@"header"];
      if (section == nil || header != nil) {
        // if we don't yet have a section, that means we need to create one
        // if we have a header property, that means start a new section
        section = [self sectionWithHeader:header table:nil];
        [data addObject:section];
      }
      NSString *footer = [dict objectForKey:@"footer"];
      if (footer != nil) {
        [section replaceValue:footer forKey:@"footerTitle" notification:NO];
      }
      [section add:rowProxy];
    } else if ([row isKindOfClass:sectionClass]) {
      section = (TiUITableViewSectionProxy *)row;
      [self rememberProxy:row];
      [data addObject:section];
    } else if ([row isKindOfClass:rowClass]) {
      id rowHeader = [row valueForKey:@"header"];
      id rowFooter = [row valueForKey:@"footer"];
      if (section == nil || rowHeader != nil) {
        section = [self sectionWithHeader:rowHeader table:[self tableView]];
        section.section = [data count];
        [data addObject:section];
      }
      if (rowFooter != nil) {
        [section replaceValue:rowFooter forKey:@"footerTitle" notification:NO];
      }
      [section add:row];
    }
  }

  TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:data animation:properties type:TiUITableViewActionSetData] autorelease];
  [self makeViewPerformSelector:@selector(dispatchAction:) withObject:action createIfNeeded:YES waitUntilDone:immediate];
}

- (void)setData:(id)args withObject:(id)properties
{
  [self setData:args withObject:properties immediate:NO];
}

- (void)setData:(id)args
{
  // if you pass in no args, it's a non animation set
  [self setData:args withObject:[NSDictionary dictionaryWithObject:NUMINT(UITableViewRowAnimationNone) forKey:@"animationStyle"]];
}

- (NSArray *)data
{
  __block NSArray *curSections = nil;
  //TIMOB-9890. Ensure data is retrieved off of the main
  //thread to ensure any pending operations are completed
  TiThreadPerformOnMainThread(
      ^{
        curSections = [sections copy];
      },
      YES);
  return [curSections autorelease];
}
- (void)setContentOffset:(id)args
{
  id arg1;
  id arg2;
  if ([args isKindOfClass:[NSDictionary class]]) {
    arg1 = args;
    arg2 = [NSDictionary dictionary];
  } else {
    arg1 = [args objectAtIndex:0];
    arg2 = [args count] > 1 ? [args objectAtIndex:1] : [NSDictionary dictionary];
  }
  TiThreadPerformOnMainThread(
      ^{
        [[self tableView] setContentOffset_:arg1 withObject:arg2];
      },
      NO);
}

- (void)setContentInsets:(id)args
{
  ENSURE_UI_THREAD(setContentInsets, args);
  id arg1;
  id arg2;
  if ([args isKindOfClass:[NSDictionary class]]) {
    arg1 = args;
    arg2 = [NSDictionary dictionary];
  } else {
    arg1 = [args objectAtIndex:0];
    arg2 = [args count] > 1 ? [args objectAtIndex:1] : [NSDictionary dictionary];
  }
  [[self view] performSelector:@selector(setContentInsets_:withObject:) withObject:arg1 withObject:arg2];
}

DEFINE_DEF_PROP(scrollsToTop, [NSNumber numberWithBool:YES]);

#pragma mark Section management

- (NSArray *)sections
{
  __block NSArray *result = nil;
  TiThreadPerformOnMainThread(
      ^{
        result = [sections copy];
      },
      YES);
  return [result autorelease];
}

- (void)setSections:(NSArray *)newSections withObject:(id)properties
{
  ENSURE_TYPE_OR_NIL(newSections, NSArray);

  //Step 1: Sanity check. This might be optional.
  Class sectionClass = [TiUITableViewSectionProxy class];
  int sectionIndex = 0;
  for (TiUITableViewSectionProxy *section in newSections) {
    if (![section isKindOfClass:sectionClass]) {
      NSString *exceptionDetail = [NSString stringWithFormat:
                                                @"section %d expected: %@, was: %@",
                                            sectionIndex, sectionClass, [section class]];
      [self throwException:TiExceptionInvalidType subreason:exceptionDetail location:CODELOCATION];
    }
    sectionIndex++;
  }

  //Step 2: Prepare the sections for entry. Only things that will not affect
  //	sections already in the table view.
  for (TiUITableViewSectionProxy *section in newSections) {
    [self rememberSection:section];
  }

  //Step 3: Apply on main thread.
  TiThreadPerformOnMainThread(
      ^{
        NSArray *oldSections = sections;

        int sectionIndex = 0;
        for (TiUITableViewSectionProxy *section in newSections) {
          [section setSection:sectionIndex];
          sectionIndex++;
        }

        sections = [newSections mutableCopy];
        [self
            performTableActionIfInitialized:^{
              UITableViewRowAnimation ourAnimation = [TiUITableViewAction animationStyleForProperties:properties];
              TiUITableView *ourView = (TiUITableView *)[self view];
              for (TiUITableViewSectionProxy *section in newSections) {
                [section setTable:ourView];
              }
              [ourView reloadDataFromCount:[oldSections count] toCount:sectionIndex animation:ourAnimation];
            }
                                forceReload:YES];

        for (TiUITableViewSectionProxy *section in oldSections) {
          if (![newSections containsObject:section]) {
            [self forgetSection:section];
          }
        }
        [oldSections release];
      },
      [NSThread isMainThread]);
}

- (void)setSections:(NSArray *)newSections
{
  [self setSections:newSections withObject:nil];
}

- (void)willShow
{
  [(TiUITableView *)[self view] refreshSearchControllerUsingReload:YES];
}

- (NSNumber *)sectionCount
{ //TODO: Shouldn't this be in the main thread, too?
  return NUMUINTEGER((sections != nil) ? sections.count : 0);
}

- (TiUITableViewSectionProxy *)tableSectionFromArg:(id)arg
{
  if ([arg isKindOfClass:[TiUITableViewSectionProxy class]]) {
    return arg;
  }
  if (![arg isKindOfClass:[NSDictionary class]]) {
    return nil;
  }
  id<TiEvaluator> context = [self executionContext];
  if (context == nil) {
    context = [self pageContext];
  }
  TiUITableViewSectionProxy *result = [[TiUITableViewSectionProxy alloc] _initWithPageContext:context];
  [result _initWithProperties:arg];
  return [result autorelease];
}

- (void)appendSection:(id)args
{
  //Step one: sanity
  NSUInteger argCount = [args count];
  if (argCount < 1) {
    [self throwException:TiExceptionNotEnoughArguments
               subreason:@"expected 1 argument, received none"
                location:CODELOCATION];
  }

  //Step two: Prepare
  id appendum = [args objectAtIndex:0];
  TiUITableViewSectionProxy *section = nil;
  NSMutableArray *sectionArray = nil;

  if ([appendum isKindOfClass:[NSArray class]]) {
    NSUInteger arrayCount = [appendum count];
    if (arrayCount < 1) {
      [self throwException:TiExceptionNotEnoughArguments subreason:@"array must not be empty" location:CODELOCATION];
    }
    sectionArray = [NSMutableArray arrayWithCapacity:arrayCount];
    for (id thisSectionObject in appendum) {
      TiUITableViewSectionProxy *thisSection = [self tableSectionFromArg:thisSectionObject];
      if (thisSection == nil) {
        [self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"array must contain Ti.UI.tableSections or objects to be such. Got %@ instead", thisSectionObject] location:CODELOCATION];
      }
      [sectionArray addObject:thisSection];
      [self rememberSection:thisSection];
    }
  } else {
    section = [self tableSectionFromArg:appendum];
    if (section == nil) {
      [self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"expected Ti.UI.tableSection or object. Got %@ instead", appendum] location:CODELOCATION];
    }
    [self rememberSection:section];
  }

  NSDictionary *options = nil;
  if (argCount > 1) {
    options = [args objectAtIndex:1];
  }

  //Step three: Main thread
  TiThreadPerformOnMainThread(
      ^{
        BOOL falseFirstSection = [sections count] == 0;
        NSRange sectionRange = NSMakeRange([sections count], 1);
        if (sectionArray != nil) {
          sectionRange.length = [sectionArray count];
          NSUInteger sectionIndex = sectionRange.location;
          for (TiUITableViewSectionProxy *thisSection in sectionArray) {
            [thisSection setSection:sectionIndex++];
          }
          [sections addObjectsFromArray:sectionArray];
        } else {
          //A nil array means a single section.
          [section setSection:sectionRange.location];
          [sections addObject:section];
        }

        [self
            performTableActionIfInitialized:^{
              UITableViewRowAnimation ourAnimation = [TiUITableViewAction animationStyleForProperties:options];
              TiUITableView *ourView = (TiUITableView *)[self view];
              UITableView *ourTable = [ourView tableView];
              [section setTable:ourView];
              for (TiUITableViewSectionProxy *thisSection in sectionArray) {
                [thisSection setTable:ourView];
              }
              if (!falseFirstSection) {
                [ourTable insertSections:[NSIndexSet indexSetWithIndexesInRange:sectionRange] withRowAnimation:ourAnimation];
              } else { //UITableView doesn't know we had 0 sections.
                [ourTable beginUpdates];
                [ourTable deleteSections:[NSIndexSet indexSetWithIndex:0] withRowAnimation:ourAnimation];
                [ourTable insertSections:[NSIndexSet indexSetWithIndexesInRange:sectionRange] withRowAnimation:ourAnimation];
                [ourTable endUpdates];
              }
            }
                                forceReload:NO];
      },
      [NSThread isMainThread]);
}

- (void)deleteSection:(id)args
{
  //Step one: sanity
  NSUInteger argCount = [args count];
  if (argCount < 1) {
    [self throwException:TiExceptionNotEnoughArguments
               subreason:@"expected 1 argument, received none"
                location:CODELOCATION];
  }
  int sectionIndex;
  ENSURE_INT_AT_INDEX(sectionIndex, args, 0);
  if (sectionIndex < 0) {
    [self throwException:TiExceptionRangeError subreason:@"index must be non-negative" location:CODELOCATION];
  }

  NSDictionary *options = nil;
  if (argCount > 1) {
    options = [args objectAtIndex:1];
  }

  TiThreadPerformOnMainThread(
      ^{
        if (sectionIndex >= [sections count]) {
          return;
        }
        [self forgetSection:[sections objectAtIndex:sectionIndex]];
        [sections removeObjectAtIndex:sectionIndex];
        [self
            performTableActionIfInitialized:^{
              UITableViewRowAnimation ourAnimation = [TiUITableViewAction animationStyleForProperties:options];
              TiUITableView *ourView = (TiUITableView *)[self view];
              UITableView *ourTable = [ourView tableView];
              if ([sections count] == 0) { //UITableView can't handle 0 sections.
                [ourTable reloadSections:[NSIndexSet indexSetWithIndex:0] withRowAnimation:ourAnimation];
              } else {
                [ourTable deleteSections:[NSIndexSet indexSetWithIndex:sectionIndex] withRowAnimation:ourAnimation];
              }
            }
                                forceReload:NO];
      },
      [NSThread isMainThread]);
}

- (void)insertSection:(TiUITableViewSectionProxy *)section atIndex:(int)sectionIndex withOptions:(id)options
{
  [self rememberSection:section];
  TiThreadPerformOnMainThread(
      ^{
        NSUInteger oldSectionCount = [sections count];
        NSUInteger boundSectionIndex = MIN(sectionIndex, oldSectionCount);
        [section setSection:boundSectionIndex];
        [sections insertObject:section atIndex:boundSectionIndex];

        [self
            performTableActionIfInitialized:^{
              UITableViewRowAnimation ourAnimation = [TiUITableViewAction animationStyleForProperties:options];
              TiUITableView *ourView = (TiUITableView *)[self view];
              UITableView *ourTable = [ourView tableView];
              [section setTable:ourView];
              if (oldSectionCount == 0) { //UITableView doesn't know we have 0 sections.
                [ourTable reloadSections:[NSIndexSet indexSetWithIndex:0] withRowAnimation:ourAnimation];
              } else {
                [ourTable insertSections:[NSIndexSet indexSetWithIndex:boundSectionIndex] withRowAnimation:ourAnimation];
              }
            }
                                forceReload:NO];
      },
      [NSThread isMainThread]);
}

- (void)insertSectionAfter:(id)args
{
  NSUInteger argCount = [args count];
  ENSURE_ARG_COUNT(args, 2)

  NSDictionary *options = nil;
  if (argCount > 2) {
    options = [args objectAtIndex:2];
  }

  int sectionIndex;
  ENSURE_INT_AT_INDEX(sectionIndex, args, 0);
  if (sectionIndex < 0) {
    [self throwException:TiExceptionRangeError subreason:@"index must be non-negative" location:CODELOCATION];
  }

  id sectionObject = [args objectAtIndex:1];
  TiUITableViewSectionProxy *section = [self tableSectionFromArg:sectionObject];

  if (section == nil) {
    [self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"expected Ti.UI.tableSection or object. Got %@ instead", sectionObject] location:CODELOCATION];
  }

  [self insertSection:section atIndex:sectionIndex + 1 withOptions:options];
}

- (void)insertSectionBefore:(id)args
{
  NSUInteger argCount = [args count];
  ENSURE_ARG_COUNT(args, 2)

  NSDictionary *options = nil;
  if (argCount > 2) {
    options = [args objectAtIndex:2];
  }

  int sectionIndex;
  ENSURE_INT_AT_INDEX(sectionIndex, args, 0);
  if (sectionIndex < 0) {
    [self throwException:TiExceptionRangeError subreason:@"index must be non-negative" location:CODELOCATION];
  }

  id sectionObject = [args objectAtIndex:1];
  TiUITableViewSectionProxy *section = [self tableSectionFromArg:sectionObject];

  if (section == nil) {
    [self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"expected Ti.UI.tableSection or object. Got %@ instead", sectionObject] location:CODELOCATION];
  }

  [self insertSection:section atIndex:sectionIndex withOptions:options];
}

- (void)updateSection:(id)args
{
  NSUInteger argCount = [args count];
  ENSURE_ARG_COUNT(args, 2)

  NSDictionary *options = nil;
  if (argCount > 2) {
    options = [args objectAtIndex:2];
  }

  int sectionIndex;
  ENSURE_INT_AT_INDEX(sectionIndex, args, 0);

  id sectionObject = [args objectAtIndex:1];
  TiUITableViewSectionProxy *section = [self tableSectionFromArg:sectionObject];

  if (section == nil) {
    [self throwException:TiExceptionInvalidType subreason:[NSString stringWithFormat:@"expected Ti.UI.tableSection or object. Got %@ instead", sectionObject] location:CODELOCATION];
  }

  [self rememberSection:section];

  TiThreadPerformOnMainThread(
      ^{
        if ((sectionIndex < 0) || (sectionIndex >= [sections count])) {
          return;
        }

        [section setSection:sectionIndex];
        TiUITableViewSectionProxy *oldSection = [sections objectAtIndex:sectionIndex];
        if (oldSection != section) {
          [self forgetSection:oldSection];
          [sections replaceObjectAtIndex:sectionIndex withObject:section];
        }

        [self
            performTableActionIfInitialized:^{
              UITableViewRowAnimation ourAnimation = [TiUITableViewAction animationStyleForProperties:options];
              TiUITableView *ourView = (TiUITableView *)[self view];
              UITableView *ourTable = [ourView tableView];
              [section setTable:ourView];
              [ourTable reloadSections:[NSIndexSet indexSetWithIndex:sectionIndex] withRowAnimation:ourAnimation];
            }
                                forceReload:NO];
      },
      [NSThread isMainThread]);
}

- (void)add:(id)arg
{
  NSLog(@"[ERROR] Cannot add sub-views to table views. Use \"appendRow\" or \"appendSection\" instead.");
}

#pragma mark Accessibility Overrides

- (void)setAccessibilityLabel:(NSString *)accessibilityLabel
{
  [super setAccessibilityLabel:accessibilityLabel];

  [[[self tableView] tableView] setAccessibilityLabel:accessibilityLabel];
  [self replaceValue:accessibilityLabel forKey:@"accessibilityLabel" notification:NO];
}

- (void)setAccessibilityValue:(NSString *)accessibilityValue
{
  [super setAccessibilityValue:accessibilityValue];

  [[[self tableView] tableView] setAccessibilityValue:accessibilityValue];
  [self replaceValue:accessibilityValue forKey:@"accessibilityValue" notification:NO];
}

- (void)setAccessibilityHint:(NSString *)accessibilityHint
{
  [super setAccessibilityHint:accessibilityHint];

  [[[self tableView] tableView] setAccessibilityHint:accessibilityHint];
  [self replaceValue:accessibilityHint forKey:@"accessibilityHint" notification:NO];
}

@end

#endif
