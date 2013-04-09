/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiUIListViewProxy.h"
#import "TiUIListView.h"
#import "TiUtils.h"
#import "TiViewTemplate.h"

@interface TiUIListViewProxy ()
@property (nonatomic, readwrite) TiUIListView *listView;
@end

@implementation TiUIListViewProxy {
	NSMutableArray *_sections;
	NSMutableArray *_operationQueue;
	pthread_mutex_t _operationQueueMutex;
}

- (id)init
{
    self = [super init];
    if (self) {
		_sections = [[NSMutableArray alloc] initWithCapacity:4];
		_operationQueue = [[NSMutableArray alloc] initWithCapacity:10];
		pthread_mutex_init(&_operationQueueMutex,NULL);
    }
    return self;
}

- (void)dealloc
{
	[_operationQueue release];
	pthread_mutex_destroy(&_operationQueueMutex);
	[_sections release];
    [super dealloc];
}

- (TiUIListView *)listView
{
	return (TiUIListView *)self.view;
}

- (void)dispatchUpdateAction:(void(^)(UITableView *tableView))block
{
	if (view == nil) {
		block(nil);
		return;
	}
	BOOL triggerMainThread;
	pthread_mutex_lock(&_operationQueueMutex);
	triggerMainThread = [_operationQueue count] == 0;
	[_operationQueue addObject:Block_copy(block)];
    pthread_mutex_unlock(&_operationQueueMutex);
	if (triggerMainThread) {
		TiThreadPerformOnMainThread(^{
			[self processUpdateActions];
		}, NO);
	}
}

- (void)dispatchBlock:(void(^)(UITableView *tableView))block
{
	if (view == nil) {
		block(nil);
		return;
	}
	if ([NSThread isMainThread]) {
		return block(self.listView.tableView);
	}
	TiThreadPerformOnMainThread(^{
		block(self.listView.tableView);
	}, YES);
}

- (id)dispatchBlockWithResult:(id(^)(void))block
{
	if ([NSThread isMainThread]) {
		return block();
	}
	
	__block id result = nil;
	TiThreadPerformOnMainThread(^{
		result = [block() retain];
	}, YES);
	return [result autorelease];
}

- (void)processUpdateActions
{
	UITableView *tableView = self.listView.tableView;
	BOOL removeHead = NO;
	BOOL begin = YES;
	while (YES) {
		void (^block)(UITableView *) = nil;
		pthread_mutex_lock(&_operationQueueMutex);
		if (removeHead) {
			[_operationQueue removeObjectAtIndex:0];
		}
		if ([_operationQueue count] > 0) {
			block = [_operationQueue objectAtIndex:0];
			removeHead = YES;
		}
		pthread_mutex_unlock(&_operationQueueMutex);
		if (block != nil) {
			if (begin) {
				[tableView beginUpdates];
				begin = NO;
			}
			block(tableView);
			Block_release(block);
		} else {
			[tableView endUpdates];
			return;
		}
	}
}


- (TiUIListSectionProxy *)sectionForIndex:(NSUInteger)index
{
	if (index < [_sections count]) {
		return [_sections objectAtIndex:index];
	}
	return nil;
}

- (NSArray *)keySequence
{
	static dispatch_once_t onceToken;
	static NSArray *keySequence = nil;
	dispatch_once(&onceToken, ^{
		keySequence = [[NSArray alloc] initWithObjects:@"style", @"templates", @"defaultItemTemplate", @"sections", @"backgroundColor",nil];
	});
	return keySequence;
}

- (void)viewDidAttach
{
	[self.listView tableView];
}

- (void)willShow
{
	[self.listView deselectAll:YES];
	[super willShow];
}

#pragma mark - Public API

- (void)setTemplates:(id)args
{
	ENSURE_TYPE_OR_NIL(args,NSDictionary);
	NSMutableDictionary *templates = [[NSMutableDictionary alloc] initWithCapacity:[args count]];
	[(NSDictionary *)args enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {
		TiViewTemplate *template = [TiViewTemplate templateFromViewTemplate:obj];
		if (template != nil) {
			[templates setObject:template forKey:key];
		}
	}];
	TiThreadPerformOnMainThread(^{
		[self.listView setTemplates_:templates];
	}, NO);
	[templates release];
}

- (NSArray *)sections
{
	return [self dispatchBlockWithResult:^() {
		return [[_sections copy] autorelease];
	}];
}

- (NSNumber *)sectionCount
{
	return [self dispatchBlockWithResult:^() {
		return [NSNumber numberWithUnsignedInteger:[_sections count]];
	}];
}

- (void)setSections:(id)args
{
	ENSURE_TYPE_OR_NIL(args,NSArray);
	NSMutableArray *insertedSections = [args mutableCopy];
	[insertedSections enumerateObjectsUsingBlock:^(TiUIListSectionProxy *section, NSUInteger idx, BOOL *stop) {
		ENSURE_TYPE(section, TiUIListSectionProxy);
		[self rememberProxy:section];
	}];
	[self dispatchBlock:^(UITableView *tableView) {
		[_sections enumerateObjectsUsingBlock:^(TiUIListSectionProxy *section, NSUInteger idx, BOOL *stop) {
			section.delegate = nil;
			if (![insertedSections containsObject:section]) {
				[self forgetProxy:section];
			}
		}];
		[_sections release];
		_sections = [insertedSections retain];
		[_sections enumerateObjectsUsingBlock:^(TiUIListSectionProxy *section, NSUInteger idx, BOOL *stop) {
			section.delegate = self;
			section.sectionIndex = idx;
		}];
		[tableView reloadData];
	}];
	[insertedSections release];
}

- (void)appendSection:(id)args
{
	ENSURE_ARG_COUNT(args, 1);
	id arg = [args objectAtIndex:0];
	NSArray *appendedSections = [arg isKindOfClass:[NSArray class]] ? arg : [NSArray arrayWithObject:arg];
	if ([appendedSections count] == 0) {
		return;
	}
	NSDictionary *properties = [args count] > 1 ? [args objectAtIndex:1] : nil;
	UITableViewRowAnimation animation = [TiUIListView animationStyleForProperties:properties];
	[appendedSections enumerateObjectsUsingBlock:^(TiUIListSectionProxy *section, NSUInteger idx, BOOL *stop) {
		ENSURE_TYPE(section, TiUIListSectionProxy);
		[self rememberProxy:section];
	}];
	[self dispatchUpdateAction:^(UITableView *tableView) {
		NSMutableIndexSet *indexSet = [[NSMutableIndexSet alloc] init];
		[appendedSections enumerateObjectsUsingBlock:^(TiUIListSectionProxy *section, NSUInteger idx, BOOL *stop) {
			if (![_sections containsObject:section]) {
				NSUInteger insertIndex = [_sections count];
				[_sections addObject:section];
				section.delegate = self;
				section.sectionIndex = insertIndex;
				[indexSet addIndex:insertIndex];
			} else {
				DebugLog(@"[WARN] ListView: Attempt to append exising section");
			}
		}];
		if ([indexSet count] > 0) {
			[tableView insertSections:indexSet withRowAnimation:animation];
		}
		[indexSet release];
	}];
}

- (void)deleteSectionAt:(id)args
{
	ENSURE_ARG_COUNT(args, 1);
	NSUInteger deleteIndex = [TiUtils intValue:[args objectAtIndex:0]];
	NSDictionary *properties = [args count] > 1 ? [args objectAtIndex:1] : nil;
	UITableViewRowAnimation animation = [TiUIListView animationStyleForProperties:properties];
	[self dispatchUpdateAction:^(UITableView *tableView) {
		if ([_sections count] <= deleteIndex) {
			DebugLog(@"[WARN] ListView: Delete section index is out of range");
			return;
		}
		TiUIListSectionProxy *section = [_sections objectAtIndex:deleteIndex];
		[_sections removeObjectAtIndex:deleteIndex];
		section.delegate = nil;
		[tableView deleteSections:[NSIndexSet indexSetWithIndex:deleteIndex] withRowAnimation:animation];
		[self forgetProxy:section];
	}];
}

- (void)insertSectionAt:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
	NSUInteger insertIndex = [TiUtils intValue:[args objectAtIndex:0]];
	id arg = [args objectAtIndex:1];
	NSArray *insertSections = [arg isKindOfClass:[NSArray class]] ? arg : [NSArray arrayWithObject:arg];
	if ([insertSections count] == 0) {
		return;
	}
	NSDictionary *properties = [args count] > 2 ? [args objectAtIndex:2] : nil;
	UITableViewRowAnimation animation = [TiUIListView animationStyleForProperties:properties];
	[insertSections enumerateObjectsUsingBlock:^(TiUIListSectionProxy *section, NSUInteger idx, BOOL *stop) {
		ENSURE_TYPE(section, TiUIListSectionProxy);
		[self rememberProxy:section];
	}];
	[self dispatchUpdateAction:^(UITableView *tableView) {
		if ([_sections count] < insertIndex) {
			DebugLog(@"[WARN] ListView: Insert section index is out of range");
			[insertSections enumerateObjectsUsingBlock:^(TiUIListSectionProxy *section, NSUInteger idx, BOOL *stop) {
				[self forgetProxy:section];
			}];
			return;
		}
		NSMutableIndexSet *indexSet = [[NSMutableIndexSet alloc] init];
		__block NSUInteger index = insertIndex;
		[insertSections enumerateObjectsUsingBlock:^(TiUIListSectionProxy *section, NSUInteger idx, BOOL *stop) {
			if (![_sections containsObject:section]) {
				[_sections insertObject:section atIndex:index];
				section.delegate = self;
				[indexSet addIndex:index];
				++index;
			} else {
				DebugLog(@"[WARN] ListView: Attempt to insert exising section");
			}
		}];
		[_sections enumerateObjectsUsingBlock:^(TiUIListSectionProxy *section, NSUInteger idx, BOOL *stop) {
			section.sectionIndex = idx;
		}];
		[tableView insertSections:indexSet withRowAnimation:animation];
		[indexSet release];
	}];
}

- (void)replaceSectionAt:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
	NSUInteger replaceIndex = [TiUtils intValue:[args objectAtIndex:0]];
	TiUIListSectionProxy *section = [args objectAtIndex:1];
	ENSURE_TYPE_OR_NIL(section, TiUIListSectionProxy);
	NSDictionary *properties = [args count] > 2 ? [args objectAtIndex:2] : nil;
	UITableViewRowAnimation animation = [TiUIListView animationStyleForProperties:properties];
	[self rememberProxy:section];
	[self dispatchUpdateAction:^(UITableView *tableView) {
		if ([_sections containsObject:section]) {
			DebugLog(@"[WARN] ListView: Attempt to insert exising section");
			return;
		}
		if ([_sections count] <= replaceIndex) {
			DebugLog(@"[WARN] ListView: Replace section index is out of range");
			[self forgetProxy:section];
			return;
		}
		TiUIListSectionProxy *prevSection = [_sections objectAtIndex:replaceIndex];
		prevSection.delegate = nil;
		[_sections replaceObjectAtIndex:replaceIndex withObject:section];
		section.delegate = self;
		section.sectionIndex = replaceIndex;
		NSIndexSet *indexSet = [NSIndexSet indexSetWithIndex:replaceIndex];
		[tableView deleteSections:indexSet withRowAnimation:animation];
		[tableView insertSections:indexSet withRowAnimation:animation];
		[self forgetProxy:prevSection];
	}];
}

- (void)scrollToItem:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
	NSUInteger sectionIndex = [TiUtils intValue:[args objectAtIndex:0]];
	NSUInteger itemIndex = [TiUtils intValue:[args objectAtIndex:1]];
	NSDictionary *properties = [args count] > 2 ? [args objectAtIndex:2] : nil;
	UITableViewScrollPosition scrollPosition = [TiUtils intValue:@"position" properties:properties def:UITableViewScrollPositionNone];
	BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];

	[self dispatchUpdateAction:^(UITableView *tableView) {
		if ([_sections count] <= sectionIndex) {
			DebugLog(@"[WARN] ListView: Scroll to section index is out of range");
			return;
		}
		TiUIListSectionProxy *section = [_sections objectAtIndex:sectionIndex];
		NSIndexPath *indexPath = [NSIndexPath indexPathForRow:MIN(itemIndex, section.itemCount) inSection:sectionIndex];
		[tableView scrollToRowAtIndexPath:indexPath atScrollPosition:scrollPosition animated:animated];
	}];
}

- (void)selectItem:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
	NSUInteger sectionIndex = [TiUtils intValue:[args objectAtIndex:0]];
	NSUInteger itemIndex = [TiUtils intValue:[args objectAtIndex:1]];
	[self dispatchUpdateAction:^(UITableView *tableView) {
		if ([_sections count] <= sectionIndex) {
			DebugLog(@"[WARN] ListView: Select section index is out of range");
			return;
		}
		TiUIListSectionProxy *section = [_sections objectAtIndex:sectionIndex];
		if (section.itemCount <= itemIndex) {
			DebugLog(@"[WARN] ListView: Select item index is out of range");
			return;
		}
		NSIndexPath *indexPath = [NSIndexPath indexPathForRow:itemIndex inSection:sectionIndex];
		[tableView selectRowAtIndexPath:indexPath animated:YES scrollPosition:UITableViewScrollPositionNone];
		[tableView scrollToRowAtIndexPath:indexPath atScrollPosition:UITableViewScrollPositionNone animated:YES];
	}];
}

DEFINE_DEF_BOOL_PROP(willScrollOnStatusTap,YES);

@end

#endif
