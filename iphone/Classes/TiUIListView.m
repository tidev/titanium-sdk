/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiUIListView.h"
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
    TiViewProxy *_pullViewProxy;
    UIView *_pullViewWrapper;
    CGFloat pullThreshhold;
    BOOL pullActive;
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
    RELEASE_TO_NIL(_pullViewWrapper);
    RELEASE_TO_NIL(_pullViewProxy);
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

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
    [super frameSizeChanged:frame bounds:bounds];
    
    if (_headerViewProxy != nil) {
        [_headerViewProxy parentSizeWillChange];
    }
    if (_footerViewProxy != nil) {
        [_footerViewProxy parentSizeWillChange];
    }
    if (_pullViewWrapper != nil) {
        _pullViewWrapper.frame = CGRectMake(0.0f, 0.0f - bounds.size.height, bounds.size.width, bounds.size.height);
        [_pullViewProxy parentSizeWillChange];
    }
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

-(void)proxyDidRelayout:(id)sender
{
    TiThreadPerformOnMainThread(^{
        if (sender == _headerViewProxy) {
            UIView* headerView = [[self tableView] tableHeaderView];
            [headerView setFrame:[headerView bounds]];
            [[self tableView] setTableHeaderView:headerView];
        }
        else if (sender == _footerViewProxy) {
            UIView *footerView = [[self tableView] tableFooterView];
            [footerView setFrame:[footerView bounds]];
            [[self tableView] setTableFooterView:footerView];
        } else if (sender == _pullViewProxy) {
            pullThreshhold = ([_pullViewProxy view].frame.origin.y - _pullViewWrapper.bounds.size.height);
        }
    },NO);
}

-(void)setContentInsets_:(id)value withObject:(id)props
{
    UIEdgeInsets insets = [TiUtils contentInsets:value];
    BOOL animated = [TiUtils boolValue:@"animated" properties:props def:NO];
    void (^setInset)(void) = ^{
        [_tableView setContentInset:insets];
    };
    if (animated) {
        double duration = [TiUtils doubleValue:@"duration" properties:props def:300]/1000;
        [UIView animateWithDuration:duration animations:setInset];
    }
    else {
        setInset();
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

-(TiUIView*)sectionView:(NSInteger)section forLocation:(NSString*)location section:(TiUIListSectionProxy**)sectionResult
{
    TiUIListSectionProxy *proxy = [self.listViewProxy sectionForIndex:section];
    //In the event that proxy is nil, this all flows out to returning nil safely anyways.
    if (sectionResult!=nil) {
        *sectionResult = proxy;
    }
    TiViewProxy* viewproxy = [proxy valueForKey:location];
    if (viewproxy!=nil && [viewproxy isKindOfClass:[TiViewProxy class]]) {
        LayoutConstraint *viewLayout = [viewproxy layoutProperties];
        //If height is not dip, explicitly set it to SIZE
        if (viewLayout->height.type != TiDimensionTypeDip) {
            viewLayout->height = TiDimensionAutoSize;
        }
        
        TiUIView* theView = [viewproxy view];
        if (![viewproxy viewAttached]) {
            [viewproxy windowWillOpen];
            [viewproxy willShow];
            [viewproxy windowDidOpen];
        }
        return theView;
    }
    return nil;
}

#pragma mark - Public API

-(void)setCanScroll_:(id)args
{
    UITableView *table = [self tableView];
    [table setScrollEnabled:[TiUtils boolValue:args def:YES]];
}

-(void)setSeparatorStyle_:(id)arg
{
    [[self tableView] setSeparatorStyle:[TiUtils intValue:arg]];
}

-(void)setSeparatorColor_:(id)arg
{
    TiColor *color = [TiUtils colorValue:arg];
    [[self tableView] setSeparatorColor:[color _color]];
}

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
        [_headerViewProxy windowWillClose];
        [_headerViewProxy setProxyObserver:nil];
        [[self proxy] forgetProxy:_headerViewProxy];
        [_headerViewProxy windowDidClose];
        _headerViewProxy = nil;
    }
	[self.proxy replaceValue:args forKey:@"headerTitle" notification:NO];
	[self.tableView setTableHeaderView:[[self class] titleViewForText:[TiUtils stringValue:args] inTable:self.tableView footer:NO]];
}

- (void)setFooterTitle_:(id)args
{
    if (_footerViewProxy != nil) {
        [_footerViewProxy windowWillClose];
        [_footerViewProxy setProxyObserver:nil];
        [[self proxy] forgetProxy:_footerViewProxy];
        [_footerViewProxy windowDidClose];
        _footerViewProxy = nil;
    }
	[self.proxy replaceValue:args forKey:@"footerTitle" notification:NO];
	[self.tableView setTableFooterView:[[self class] titleViewForText:[TiUtils stringValue:args] inTable:self.tableView footer:YES]];
}

-(void)setHeaderView_:(id)args
{
    ENSURE_SINGLE_ARG_OR_NIL(args,TiViewProxy);
    if (args!=nil) {
        TiUIView *view = (TiUIView*) [args view];
        UITableView *table = [self tableView];
        [table setTableHeaderView:view];
        if (_headerViewProxy != nil) {
            [_headerViewProxy windowWillClose];
            [_headerViewProxy setProxyObserver:nil];
            [[self proxy] forgetProxy:_headerViewProxy];
            [_headerViewProxy windowDidClose];
        }
        _headerViewProxy = args;
        [_headerViewProxy setProxyObserver:self];
        [[self proxy] rememberProxy:_headerViewProxy];
        [_headerViewProxy windowWillOpen];
        _headerViewProxy.parentVisible = YES;
        [_headerViewProxy refreshSize];
        [_headerViewProxy willChangeSize];
        [_headerViewProxy windowDidOpen];
    }
    else {
        if (_headerViewProxy != nil) {
            [_headerViewProxy windowWillClose];
            [_headerViewProxy setProxyObserver:nil];
            [[self proxy] forgetProxy:_headerViewProxy];
            [_headerViewProxy windowDidClose];
            _headerViewProxy = nil;
        }
        [[self tableView] setTableHeaderView:nil];
    }
}

-(void)setFooterView_:(id)args
{
    ENSURE_SINGLE_ARG_OR_NIL(args,TiViewProxy);
    if (args!=nil) {
        UIView *view = [args view];
        [[self tableView] setTableFooterView:view];
        if (_footerViewProxy != nil) {
            [_footerViewProxy windowWillClose];
            [_footerViewProxy setProxyObserver:nil];
            [[self proxy] forgetProxy:_footerViewProxy];
            [_footerViewProxy windowDidClose];
        }
        _footerViewProxy = args;
        [_footerViewProxy setProxyObserver:self];
        [[self proxy] rememberProxy:_footerViewProxy];
        [_footerViewProxy windowWillOpen];
        _footerViewProxy.parentVisible = YES;
        [_footerViewProxy refreshSize];
        [_footerViewProxy willChangeSize];
        [_footerViewProxy windowDidOpen];
    }
    else {
        if (_footerViewProxy != nil) {
            [_footerViewProxy windowWillClose];
            [_footerViewProxy setProxyObserver:nil];
            [[self proxy] forgetProxy:_footerViewProxy];
            [_footerViewProxy windowDidClose];
            _footerViewProxy = nil;
        }
        [[self tableView] setTableFooterView:nil];
    }
}

-(void)setPullView_:(id)args
{
    ENSURE_SINGLE_ARG_OR_NIL(args,TiViewProxy);
    if (args == nil) {
        [_pullViewProxy setProxyObserver:nil];
        [_pullViewProxy windowWillClose];
        [_pullViewWrapper removeFromSuperview];
        [_pullViewProxy windowDidClose];
        RELEASE_TO_NIL(_pullViewWrapper);
        RELEASE_TO_NIL(_pullViewProxy);
    } else {
        if ([self tableView].bounds.size.width==0)
        {
            [self performSelector:@selector(setPullView_:) withObject:args afterDelay:0.1];
            return;
        }
        if (_pullViewProxy != nil) {
            [_pullViewProxy setProxyObserver:nil];
            [_pullViewProxy windowWillClose];
            [_pullViewProxy windowDidClose];
            RELEASE_TO_NIL(_pullViewProxy);
        }
        if (_pullViewWrapper == nil) {
            _pullViewWrapper = [[UIView alloc] init];
            _pullViewWrapper.backgroundColor = [UIColor lightGrayColor];
            [_tableView addSubview:_pullViewWrapper];
        }
        CGSize refSize = _tableView.bounds.size;
        [_pullViewWrapper setFrame:CGRectMake(0.0, 0.0 - refSize.height, refSize.width, refSize.height)];
        _pullViewProxy = [args retain];
        LayoutConstraint *viewLayout = [_pullViewProxy layoutProperties];
        //If height is not dip, explicitly set it to SIZE
        if (viewLayout->height.type != TiDimensionTypeDip) {
            viewLayout->height = TiDimensionAutoSize;
        }
        //If bottom is not dip set it to 0
        if (viewLayout->bottom.type != TiDimensionTypeDip) {
            viewLayout->bottom = TiDimensionZero;
        }
        //Remove other vertical positioning constraints
        viewLayout->top = TiDimensionUndefined;
        viewLayout->centerY = TiDimensionUndefined;
        
        [_pullViewProxy setProxyObserver:self];
        [_pullViewProxy windowWillOpen];
        [_pullViewWrapper addSubview:[_pullViewProxy view]];
        _pullViewProxy.parentVisible = YES;
        [_pullViewProxy refreshSize];
        [_pullViewProxy willChangeSize];
        [_pullViewProxy windowDidOpen];
    }
    
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

    if (tableView.style == UITableViewStyleGrouped) {
        NSInteger maxItem = [self.listViewProxy sectionForIndex:indexPath.section].itemCount;
        if (indexPath.row == 0) {
            if (maxItem == 1) {
                [cell setPosition:TiCellBackgroundViewPositionSingleLine isGrouped:YES];
            } else {
                [cell setPosition:TiCellBackgroundViewPositionTop isGrouped:YES];
            }
        } else if (indexPath.row == (maxItem - 1) ) {
            [cell setPosition:TiCellBackgroundViewPositionBottom isGrouped:YES];
        } else {
            [cell setPosition:TiCellBackgroundViewPositionMiddle isGrouped:YES];
        }
    } else {
        [cell setPosition:TiCellBackgroundViewPositionMiddle isGrouped:NO];
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

- (UIView *)tableView:(UITableView *)tableView viewForHeaderInSection:(NSInteger)section
{
    return [self sectionView:section forLocation:@"headerView" section:nil];
}

- (UIView *)tableView:(UITableView *)tableView viewForFooterInSection:(NSInteger)section
{
    return [self sectionView:section forLocation:@"footerView" section:nil];
}

#define DEFAULT_SECTION_HEADERFOOTER_HEIGHT 20.0

- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section
{
    TiUIListSectionProxy *sectionProxy = [self.listViewProxy sectionForIndex:section];
    TiUIView *view = [self sectionView:section forLocation:@"headerView" section:nil];
	
    CGFloat size = 0.0;
    if (view!=nil) {
        TiViewProxy* viewProxy = (TiViewProxy*) [view proxy];
        LayoutConstraint *viewLayout = [viewProxy layoutProperties];
        switch (viewLayout->height.type)
        {
            case TiDimensionTypeDip:
                size += viewLayout->height.value;
                break;
            case TiDimensionTypeAuto:
            case TiDimensionTypeAutoSize:
                size += [viewProxy autoHeightForSize:[self.tableView bounds].size];
                break;
            default:
                size+=DEFAULT_SECTION_HEADERFOOTER_HEIGHT;
                break;
        }
    }
    /*
     * This behavior is slightly more complex between iOS 4 and iOS 5 than you might believe, and Apple's
     * documentation is once again misleading. It states that in iOS 4 this value was "ignored if
     * -[delegate tableView:viewForHeaderInSection:] returned nil" but apparently a non-nil value for
     * -[delegate tableView:titleForHeaderInSection:] is considered a valid value for height handling as well,
     * provided it is NOT the empty string.
     *
     * So for parity with iOS 4, iOS 5 must similarly treat the empty string header as a 'nil' value and
     * return a 0.0 height that is overridden by the system.
     */
    else if ([sectionProxy headerTitle]!=nil) {
        if ([[sectionProxy headerTitle] isEqualToString:@""]) {
            return size;
        }
        size+=[tableView sectionHeaderHeight];
        
        if (size < DEFAULT_SECTION_HEADERFOOTER_HEIGHT) {
            size += DEFAULT_SECTION_HEADERFOOTER_HEIGHT;
        }
    }
    return size;
}

- (CGFloat)tableView:(UITableView *)tableView heightForFooterInSection:(NSInteger)section
{
    TiUIListSectionProxy *sectionProxy = [self.listViewProxy sectionForIndex:section];
    TiUIView *view = [self sectionView:section forLocation:@"footerView" section:nil];
	
    CGFloat size = 0.0;
    if (view!=nil) {
        TiViewProxy* viewProxy = (TiViewProxy*) [view proxy];
        LayoutConstraint *viewLayout = [viewProxy layoutProperties];
        switch (viewLayout->height.type)
        {
            case TiDimensionTypeDip:
                size += viewLayout->height.value;
                break;
            case TiDimensionTypeAuto:
            case TiDimensionTypeAutoSize:
                size += [viewProxy autoHeightForSize:[self.tableView bounds].size];
                break;
            default:
                size+=DEFAULT_SECTION_HEADERFOOTER_HEIGHT;
                break;
        }
    }
    /*
     * This behavior is slightly more complex between iOS 4 and iOS 5 than you might believe, and Apple's
     * documentation is once again misleading. It states that in iOS 4 this value was "ignored if
     * -[delegate tableView:viewForHeaderInSection:] returned nil" but apparently a non-nil value for
     * -[delegate tableView:titleForHeaderInSection:] is considered a valid value for height handling as well,
     * provided it is NOT the empty string.
     *
     * So for parity with iOS 4, iOS 5 must similarly treat the empty string header as a 'nil' value and
     * return a 0.0 height that is overridden by the system.
     */
    else if ([sectionProxy footerTitle]!=nil) {
        if ([[sectionProxy footerTitle] isEqualToString:@""]) {
            return size;
        }
        size+=[tableView sectionFooterHeight];
        
        if (size < DEFAULT_SECTION_HEADERFOOTER_HEIGHT) {
            size += DEFAULT_SECTION_HEADERFOOTER_HEIGHT;
        }
    }
    return size;
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

#pragma ScrollView Delegate
- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
    //Events - pull (maybe scroll later)
    if (![self.proxy _hasListeners:@"pull"]) {
        return;
    }
    
    if ( (_pullViewProxy != nil) && ([scrollView isTracking]) ) {
        if ( (scrollView.contentOffset.y < pullThreshhold) && (pullActive == NO) ) {
            pullActive = YES;
            [self.proxy fireEvent:@"pull" withObject:[NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(pullActive),@"active",nil]];
        } else if ( (scrollView.contentOffset.y > pullThreshhold) && (pullActive == YES) ) {
            pullActive = NO;
            [self.proxy fireEvent:@"pull" withObject:[NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(pullActive),@"active",nil]];
        }
    }
    
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
    //Events - None (maybe dragstart later)
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
    //Events - pullend (maybe dragend later)
    if (![self.proxy _hasListeners:@"pullend"]) {
        return;
    }
    if ( (_pullViewProxy != nil) && (pullActive == YES) ) {
        pullActive = NO;
        [self.proxy fireEvent:@"pullend" withObject:nil];
    }
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
    //Events - none (maybe scrollend later)
}

- (void)scrollViewDidScrollToTop:(UIScrollView *)scrollView
{
    //Events none (maybe scroll later)
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
