/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiUIListView.h"
#import "TiUIListViewProxy.h"
#import "TiUIListSectionProxy.h"
#import "TiUIListItem.h"
#import "TiUIListItemProxy.h"

@interface TiUIListView ()
@property (nonatomic, readonly) TiUIListViewProxy *listViewProxy;
@end

static TiViewProxy * FindViewProxyWithBindIdContainingPoint(UIView *view, CGPoint point);

@implementation TiUIListView {
	UITableView *_tableView;
	NSDictionary *_templates;
	id _defaultItemTemplate;
	TiDimension _rowHeight;
    TiViewProxy *_headerViewProxy;
    TiViewProxy *_footerViewProxy;
	CGPoint tapPoint;
}

- (id)init
{
    self = [super init];
    if (self) {
		_defaultItemTemplate = [[NSNumber numberWithUnsignedInteger:UITableViewCellStyleDefault] retain];
    }
    return self;
}

- (void)dealloc
{
	_tableView.delegate = nil;
	_tableView.dataSource = nil;
	[_tableView release];
	[_templates release];
	[_defaultItemTemplate release];
    [super dealloc];
}

- (UITableView *)tableView
{
	if (_tableView == nil) {
		UITableViewStyle style = [TiUtils intValue:[self.proxy valueForKey:@"style"] def:UITableViewStylePlain];

		_tableView = [[UITableView alloc] initWithFrame:self.bounds style:style];
		_tableView.autoresizingMask = UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight;
		_tableView.delegate = self;
		_tableView.dataSource = self;
		
		if (TiDimensionIsDip(_rowHeight)) {
			[_tableView setRowHeight:_rowHeight.value];
		}
		id backgroundColor = [self.proxy valueForKey:@"backgroundColor"];
		BOOL doSetBackground = YES;
		if ([TiUtils isIOS6OrGreater] && (style == UITableViewStyleGrouped)) {
			doSetBackground = (backgroundColor != nil);
		}
		if (doSetBackground) {
			[[self class] setBackgroundColor:[TiUtils colorValue:backgroundColor] onTable:_tableView];
		}
		UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleTap:)];
		tapGestureRecognizer.delegate = self;
		[_tableView addGestureRecognizer:tapGestureRecognizer];
		[tapGestureRecognizer release];
	}
	if ([_tableView superview] != self) {
		[self addSubview:_tableView];
	}
	return _tableView;
}

- (id)accessibilityElement
{
	return self.tableView;
}

- (TiUIListViewProxy *)listViewProxy
{
	return (TiUIListViewProxy *)self.proxy;
}

- (void)deselectAll:(BOOL)animated
{
	if (_tableView != nil) {
		[_tableView.indexPathsForSelectedRows enumerateObjectsUsingBlock:^(NSIndexPath *indexPath, NSUInteger idx, BOOL *stop) {
			[_tableView deselectRowAtIndexPath:indexPath animated:animated];
		}];
	}
}

- (void)setTemplates_:(id)args
{
	ENSURE_TYPE_OR_NIL(args,NSDictionary);
	[_templates release];
	_templates = [args copy];
	if (_tableView != nil) {
		[_tableView reloadData];
	}
}

#pragma mark - Public API

- (void)setDefaultItemTemplate_:(id)args
{
	if (![args isKindOfClass:[NSString class]] && ![args isKindOfClass:[NSNumber class]]) {
		ENSURE_TYPE_OR_NIL(args,NSString);
	}
	[_defaultItemTemplate release];
	_defaultItemTemplate = [args copy];
	if (_tableView != nil) {
		[_tableView reloadData];
	}	
}

- (void)setRowHeight_:(id)height
{
	_rowHeight = [TiUtils dimensionValue:height];
	if (TiDimensionIsDip(_rowHeight)) {
		[_tableView setRowHeight:_rowHeight.value];
	}
}

- (void)setBackgroundColor_:(id)arg
{
	[self.proxy replaceValue:arg forKey:@"backgroundColor" notification:NO];
	if (_tableView != nil) {
		[[self class] setBackgroundColor:[TiUtils colorValue:arg] onTable:_tableView];
	}
}

- (void)setHeaderTitle_:(id)args
{
    if (_headerViewProxy != nil) {
        [_headerViewProxy setProxyObserver:nil];
        [[self proxy] forgetProxy:_headerViewProxy];
        _headerViewProxy = nil;
    }
	[self.proxy replaceValue:args forKey:@"headerTitle" notification:NO];
	[self.tableView setTableHeaderView:[[self class] titleViewForText:[TiUtils stringValue:args] inTable:self.tableView footer:NO]];
}

- (void)setFooterTitle_:(id)args
{
    if (_footerViewProxy != nil) {
        [_footerViewProxy setProxyObserver:nil];
        [[self proxy] forgetProxy:_footerViewProxy];
        _footerViewProxy = nil;
    }
	[self.proxy replaceValue:args forKey:@"footerTitle" notification:NO];
	[self.tableView setTableFooterView:[[self class] titleViewForText:[TiUtils stringValue:args] inTable:self.tableView footer:YES]];
}

- (void)setScrollIndicatorStyle_:(id)value
{
	[self.proxy replaceValue:value forKey:@"scrollIndicatorStyle" notification:NO];
	[self.tableView setIndicatorStyle:[TiUtils intValue:value def:UIScrollViewIndicatorStyleDefault]];
}

- (void)setWillScrollOnStatusTap_:(id)value
{
	[self.proxy replaceValue:value forKey:@"willScrollOnStatusTap" notification:NO];
	[self.tableView setScrollsToTop:[TiUtils boolValue:value def:YES]];
}

- (void)setShowVerticalScrollIndicator_:(id)value
{
	[self.proxy replaceValue:value forKey:@"showVerticalScrollIndicator" notification:NO];
	[self.tableView setShowsVerticalScrollIndicator:[TiUtils boolValue:value]];
}

-(void)setAllowsSelection_:(id)value
{
	[self.proxy replaceValue:value forKey:@"allowsSelection" notification:NO];
    [[self tableView] setAllowsSelection:[TiUtils boolValue:value]];
}

#pragma mark - UITableViewDataSource

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
	NSUInteger sectionCount = [self.listViewProxy.sectionCount unsignedIntegerValue];
	return sectionCount;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
	return [self.listViewProxy sectionForIndex:section].itemCount;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
	NSDictionary *item = [[self.listViewProxy sectionForIndex:indexPath.section] itemAtIndex:indexPath.row];
	id templateId = [item objectForKey:@"template"];
	if (templateId == nil) {
		templateId = _defaultItemTemplate;
	}
	NSString *cellIdentifier = [templateId isKindOfClass:[NSNumber class]] ? [NSString stringWithFormat:@"TiUIListView__internal%@", templateId]: [templateId description];
	TiUIListItem *cell = [tableView dequeueReusableCellWithIdentifier:cellIdentifier];
	if (cell == nil) {
		id<TiEvaluator> context = self.listViewProxy.executionContext;
		if (context == nil) {
			context = self.listViewProxy.pageContext;
		}
		TiUIListItemProxy *cellProxy = [[TiUIListItemProxy alloc] initWithListViewProxy:self.listViewProxy inContext:context];
		if ([templateId isKindOfClass:[NSNumber class]]) {
			UITableViewCellStyle cellStyle = [templateId unsignedIntegerValue];
			cell = [[TiUIListItem alloc] initWithStyle:cellStyle reuseIdentifier:cellIdentifier proxy:cellProxy];
		} else {
			cell = [[TiUIListItem alloc] initWithProxy:cellProxy reuseIdentifier:cellIdentifier];
			id template = [_templates objectForKey:templateId];
			if (template != nil) {
				[cellProxy unarchiveFromTemplate:template];
			}
		}
		[cellProxy release];
		[cell autorelease];
	}
	cell.dataItem = item;
	cell.proxy.indexPath = indexPath;
	return cell;
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{	
	return [[self.listViewProxy sectionForIndex:section] headerTitle];
}

- (NSString *)tableView:(UITableView *)tableView titleForFooterInSection:(NSInteger)section
{
	return [[self.listViewProxy sectionForIndex:section] footerTitle];
}

#pragma mark - UITableViewDelegate

- (void)tableView:(UITableView *)tableView willDisplayCell:(UITableViewCell *)cell forRowAtIndexPath:(NSIndexPath *)indexPath
{
    //Let the cell configure its background
    [(TiUIListItem*)cell configureCellBackground];
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
	NSDictionary *item = [[self.listViewProxy sectionForIndex:indexPath.section] itemAtIndex:indexPath.row];
	id propertiesValue = [item objectForKey:@"properties"];
	NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
	id heightValue = [properties objectForKey:@"height"];
	if (heightValue == nil) {
		id templateId = [item objectForKey:@"template"];
		if (templateId == nil) {
			templateId = _defaultItemTemplate;
		}
		if (![templateId isKindOfClass:[NSNumber class]]) {
			TiViewTemplate *template = [_templates objectForKey:templateId];
			heightValue = [template.properties objectForKey:@"height"];
		}
	}
	TiDimension height = _rowHeight;
	if (heightValue != nil) {
		height = [TiUtils dimensionValue:heightValue];
	}
	if (TiDimensionIsDip(height)) {
		return height.value;
	}
	return 44;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
	[self fireClickForItemAtIndexPath:indexPath tableView:tableView accessoryButtonTapped:NO];
}

- (void)tableView:(UITableView *)tableView accessoryButtonTappedForRowWithIndexPath:(NSIndexPath *)indexPath
{
	[self fireClickForItemAtIndexPath:indexPath tableView:tableView accessoryButtonTapped:YES];
}

#pragma mark - TiScrolling

-(void)keyboardDidShowAtHeight:(CGFloat)keyboardTop
{
	int lastSectionIndex = [self.listViewProxy.sectionCount unsignedIntegerValue] - 1;
	ENSURE_CONSISTENCY(lastSectionIndex>=0);
	CGRect minimumContentRect = [_tableView rectForSection:lastSectionIndex];
	InsetScrollViewForKeyboard(_tableView,keyboardTop,minimumContentRect.size.height + minimumContentRect.origin.y);
}

-(void)scrollToShowView:(TiUIView *)firstResponderView withKeyboardHeight:(CGFloat)keyboardTop
{
    if ([_tableView isScrollEnabled]) {
        int lastSectionIndex = [self.listViewProxy.sectionCount unsignedIntegerValue] - 1;
        ENSURE_CONSISTENCY(lastSectionIndex>=0);
        CGRect minimumContentRect = [_tableView rectForSection:lastSectionIndex];
        
        CGRect responderRect = [self convertRect:[firstResponderView bounds] fromView:firstResponderView];
        CGPoint offsetPoint = [_tableView contentOffset];
        responderRect.origin.x += offsetPoint.x;
        responderRect.origin.y += offsetPoint.y;
        
        OffsetScrollViewForRect(_tableView,keyboardTop,minimumContentRect.size.height + minimumContentRect.origin.y,responderRect);
    }
}


#pragma mark - Internal Methods

- (void)fireClickForItemAtIndexPath:(NSIndexPath *)indexPath tableView:(UITableView *)tableView accessoryButtonTapped:(BOOL)accessoryButtonTapped
{
	NSString *eventName = @"itemclick";
    if (![self.proxy _hasListeners:eventName]) {
		return;
	}
	TiUIListSectionProxy *section = [self.listViewProxy sectionForIndex:indexPath.section];
	NSDictionary *item = [section itemAtIndex:indexPath.row];
	NSMutableDictionary *eventObject = [[NSMutableDictionary alloc] initWithObjectsAndKeys:
										section, @"section",
										NUMINT(indexPath.section), @"sectionIndex",
										NUMINT(indexPath.row), @"itemIndex",
										NUMBOOL(accessoryButtonTapped), @"accessoryClicked",
										nil];
	id propertiesValue = [item objectForKey:@"properties"];
	NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
	id itemId = [properties objectForKey:@"itemId"];
	if (itemId != nil) {
		[eventObject setObject:itemId forKey:@"itemId"];
	}
	TiUIListItem *cell = (TiUIListItem *)[tableView cellForRowAtIndexPath:indexPath];
	if (cell.templateStyle == TiUIListItemTemplateStyleCustom) {
		UIView *contentView = cell.contentView;
		TiViewProxy *tapViewProxy = FindViewProxyWithBindIdContainingPoint(contentView, [tableView convertPoint:tapPoint toView:contentView]);
		if (tapViewProxy != nil) {
			[eventObject setObject:[tapViewProxy valueForKey:@"bindId"] forKey:@"bindId"];
		}
	}
	[self.proxy fireEvent:eventName withObject:eventObject];
	[eventObject release];	
}

#pragma mark - UITapGestureRecognizer

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
	tapPoint = [gestureRecognizer locationInView:gestureRecognizer.view];
	return NO;
}

- (void)handleTap:(UITapGestureRecognizer *)tapGestureRecognizer
{
	// Never called
}

#pragma mark - Static Methods

+ (void)setBackgroundColor:(TiColor*)color onTable:(UITableView*)table
{
	UIColor* defaultColor = [table style] == UITableViewStylePlain ? [UIColor whiteColor] : [UIColor groupTableViewBackgroundColor];
	UIColor* bgColor = [color _color];
	
	// WORKAROUND FOR APPLE BUG: 4.2 and lower don't like setting background color for grouped table views on iPad.
	// So, we check the table style and device, and if they match up wrong, we replace the background view with our own.
	if ([table style] == UITableViewStyleGrouped && ([TiUtils isIPad] || [TiUtils isIOS6OrGreater])) {
		UIView* bgView = [[[UIView alloc] initWithFrame:[table frame]] autorelease];
		[table setBackgroundView:bgView];
	}
	
	[table setBackgroundColor:(bgColor != nil ? bgColor : defaultColor)];
	[[table backgroundView] setBackgroundColor:[table backgroundColor]];
	
	[table setOpaque:![[table backgroundColor] isEqual:[UIColor clearColor]]];
}

+ (UIView*)titleViewForText:(NSString*)text inTable:(UITableView *)tableView footer:(BOOL)footer
{
	CGSize maxSize = CGSizeMake(320, 1000);
	UIFont *font = [UIFont boldSystemFontOfSize:17];
	CGSize size = [text sizeWithFont:font constrainedToSize:maxSize lineBreakMode:UILineBreakModeTailTruncation];
	size.height += 20;
	
	int x = (tableView.style==UITableViewStyleGrouped) ? 15 : 10;
	UIView *containerView = [[[UIView alloc] initWithFrame:CGRectMake(0, 0, size.width, size.height)] autorelease];
    UILabel *headerLabel = [[[UILabel alloc] initWithFrame:CGRectMake(x, 0, size.width, size.height)] autorelease];
	
    headerLabel.text = text;
	headerLabel.baselineAdjustment = UIBaselineAdjustmentAlignCenters;
    headerLabel.textColor = [UIColor blackColor];
    headerLabel.shadowColor = [UIColor whiteColor];
    headerLabel.shadowOffset = CGSizeMake(0, 1);
	headerLabel.font = font;
    headerLabel.backgroundColor = [UIColor clearColor];
    headerLabel.numberOfLines = 0;
    [containerView addSubview:headerLabel];
	
	return containerView;
}

+ (UITableViewRowAnimation)animationStyleForProperties:(NSDictionary*)properties
{
	BOOL found;
	UITableViewRowAnimation animationStyle = [TiUtils intValue:@"animationStyle" properties:properties def:UITableViewRowAnimationNone exists:&found];
	if (found) {
		return animationStyle;
	}
	BOOL animate = [TiUtils boolValue:@"animated" properties:properties def:NO];
	return animate ? UITableViewRowAnimationFade : UITableViewRowAnimationNone;
}

@end

static TiViewProxy * FindViewProxyWithBindIdContainingPoint(UIView *view, CGPoint point)
{
	if (!CGRectContainsPoint([view bounds], point)) {
		return nil;
	}
	for (UIView *subview in [view subviews]) {
		TiViewProxy *viewProxy = FindViewProxyWithBindIdContainingPoint(subview, [view convertPoint:point toView:subview]);
		if (viewProxy != nil) {
			id bindId = [viewProxy valueForKey:@"bindId"];
			if (bindId != nil) {
				return viewProxy;
			}
		}
	}
	if ([view isKindOfClass:[TiUIView class]]) {
		TiViewProxy *viewProxy = (TiViewProxy *)[(TiUIView *)view proxy];
		id bindId = [viewProxy valueForKey:@"bindId"];
		if (bindId != nil) {
			return viewProxy;
		}
	}
	return nil;
}

#endif
