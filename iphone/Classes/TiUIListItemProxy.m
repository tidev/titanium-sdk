/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiUIListItemProxy.h"
#import "TiUtils.h"
#import "TiUIListItem.h"
#import "TiUIListViewProxy.h"

static void SetEventOverrideDelegateRecursive(NSArray *children, id<TiViewEventOverrideDelegate> eventOverrideDelegate);

@implementation TiUIListItemProxy {
	TiUIListViewProxy *_listViewProxy; // weak
}

@synthesize listItem = _listItem;
@synthesize indexPath = _indexPath;

- (id)initWithListViewProxy:(TiUIListViewProxy *)listViewProxy inContext:(id<TiEvaluator>)context
{
    self = [self _initWithPageContext:context];
    if (self) {
		_listViewProxy = listViewProxy;
		[context.krollContext invokeBlockOnThread:^{
			[context registerProxy:self];
			[listViewProxy rememberProxy:self];
		}];
		self.modelDelegate = self;
    }
    return self;
}

- (id)init
{
    self = [super init];
    if (self) {
		viewInitialized = YES;
		[self windowWillOpen];
		[self windowDidOpen];
		[self willShow];
    }
    return self;
}

-(void)dealloc
{
	[_indexPath release];
	[super dealloc];
}

- (TiUIView *)view
{
	return view = (TiUIView *)_listItem.contentView;
}

- (void)detachView
{
	view = nil;
	[super detachView];
}

-(void)_destroy
{
	view = nil;
	[super _destroy];
}

-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)proxy_
{
	if ([key isEqualToString:@"accessoryType"]) {
		TiThreadPerformOnMainThread(^{
			_listItem.accessoryType = [TiUtils intValue:newValue def:UITableViewCellAccessoryNone];
		}, YES);
	} else if ([key isEqualToString:@"backgroundColor"]) {
		TiThreadPerformOnMainThread(^{
			_listItem.contentView.backgroundColor = [[TiUtils colorValue:newValue] _color];
		}, YES);
	} else if ([key isEqualToString:@"selectionStyle"]) {
		TiThreadPerformOnMainThread(^{
			_listItem.selectionStyle = [TiUtils intValue:newValue def:UITableViewCellSelectionStyleBlue];
		}, YES);
	}
}

- (void)unarchiveFromTemplate:(id)viewTemplate
{
	[super unarchiveFromTemplate:viewTemplate];
	SetEventOverrideDelegateRecursive(self.children, self);
}

#pragma mark - TiViewEventOverrideDelegate

- (NSDictionary *)overrideEventObject:(NSDictionary *)eventObject forEvent:(NSString *)eventType fromViewProxy:(TiViewProxy *)viewProxy
{
	NSMutableDictionary *updatedEventObject = [eventObject mutableCopy];
	[updatedEventObject setObject:NUMINT(_indexPath.section) forKey:@"sectionIndex"];
	[updatedEventObject setObject:NUMINT(_indexPath.row) forKey:@"itemIndex"];
	[updatedEventObject setObject:[_listViewProxy sectionForIndex:_indexPath.section] forKey:@"section"];
	id propertiesValue = [_listItem.dataItem objectForKey:@"properties"];
	NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
	id itemId = [properties objectForKey:@"itemId"];
	if (itemId != nil) {
		[updatedEventObject setObject:itemId forKey:@"itemId"];
	}
	id bindId = [viewProxy valueForKey:@"bindId"];
	if (bindId != nil) {
		[updatedEventObject setObject:bindId forKey:@"bindId"];
	}
	return [updatedEventObject autorelease];
}

@end

static void SetEventOverrideDelegateRecursive(NSArray *children, id<TiViewEventOverrideDelegate> eventOverrideDelegate)
{
	[children enumerateObjectsUsingBlock:^(TiViewProxy *child, NSUInteger idx, BOOL *stop) {
		child.eventOverrideDelegate = eventOverrideDelegate;
		SetEventOverrideDelegateRecursive(child.children, eventOverrideDelegate);
	}];
}

#endif
