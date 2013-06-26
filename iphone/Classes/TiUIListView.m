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
#import "TiApp.h"

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
    BOOL editing;
    BOOL pruneSections;
    BOOL caseInsensitiveSearch;
    NSString* searchString;
    BOOL searchActive;
    BOOL keepSectionsInSearch;
    NSMutableArray* _searchResults;
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
    RELEASE_TO_NIL(_searchResults);
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

#pragma mark - Helper Methods

-(id)valueWithKey:(NSString*)key atIndexPath:(NSIndexPath*)indexPath
{
    NSDictionary *item = [[self.listViewProxy sectionForIndex:indexPath.section] itemAtIndex:indexPath.row];
    id propertiesValue = [item objectForKey:@"properties"];
    NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
    id theValue = [properties objectForKey:key];
    if (theValue == nil) {
        id templateId = [item objectForKey:@"template"];
        if (templateId == nil) {
            templateId = _defaultItemTemplate;
        }
        if (![templateId isKindOfClass:[NSNumber class]]) {
            TiViewTemplate *template = [_templates objectForKey:templateId];
            theValue = [template.properties objectForKey:key];
        }
    }
    
    return theValue;
}

-(void)buildResultsForSearchText
{
    searchActive = !([searchString length] == 0);
    if (searchActive) {
        //Initialize
        if(_searchResults == nil) {
            _searchResults = [[NSMutableArray alloc] init];
        }
        //Clear Out
        [_searchResults removeAllObjects];
        
        //Search Options
        NSStringCompareOptions searchOpts = (caseInsensitiveSearch ? NSCaseInsensitiveSearch : 0);
        
        NSUInteger maxSection = [[self.listViewProxy sectionCount] unsignedIntegerValue];
        NSMutableArray* singleSection = keepSectionsInSearch ? nil : [[NSMutableArray alloc] init];
        for (int i = 0; i < maxSection; i++) {
            NSMutableArray* thisSection = keepSectionsInSearch ? [[NSMutableArray alloc] init] : nil;
            NSUInteger maxItems = [[self.listViewProxy sectionForIndex:i] itemCount];
            for (int j = 0; j < maxItems; j++) {
                NSIndexPath* thePath = [NSIndexPath indexPathForRow:j inSection:i];
                id theValue = [self valueWithKey:@"searchableText" atIndexPath:thePath];
                if (theValue!=nil && [[TiUtils stringValue:theValue] rangeOfString:searchString options:searchOpts].location != NSNotFound) {
                    (thisSection != nil) ? [thisSection addObject:thePath] : [singleSection addObject:thePath];
                }
            }
            if (thisSection != nil) {
                if ([thisSection count] > 0) {
                    [_searchResults addObject:thisSection];
                }
                [thisSection release];
            }
        }
        if (singleSection != nil) {
            if ([singleSection count] > 0) {
                [_searchResults addObject:singleSection];
            }
            [singleSection release];
        }
        
    } else {
        RELEASE_TO_NIL(_searchResults);
    }
    [_tableView reloadData];
    
    // Update keyboard status to ensure that any fields actively being edited remain in view
    if ([[[TiApp app] controller] keyboardVisible]) {
        [[[TiApp app] controller] performSelector:@selector(handleNewKeyboardStatus) withObject:nil afterDelay:0.1];
    }}

-(NSIndexPath*)pathForSearchPath:(NSIndexPath*)indexPath
{
    if (_searchResults != nil) {
        NSArray* sectionResults = [_searchResults objectAtIndex:indexPath.section];
        return [sectionResults objectAtIndex:indexPath.row];
    }
    return indexPath;
}

-(NSInteger)sectionForSearchSection:(NSInteger)section
{
    if (_searchResults != nil) {
        NSArray* sectionResults = [_searchResults objectAtIndex:section];
        NSIndexPath* thePath = [sectionResults objectAtIndex:0];
        return thePath.section;
    }
    return section;
}

#pragma mark - Public API

-(void)setPruneSectionsOnEdit_:(id)args
{
    pruneSections = [TiUtils boolValue:args def:NO];
}

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

-(void)setEditing_:(id)args
{
    if ([TiUtils boolValue:args def:NO] != editing) {
        editing = !editing;
        [self.proxy replaceValue:NUMBOOL(editing) forKey:@"editing" notification:NO];
        [[self tableView] beginUpdates];
        [_tableView setEditing:editing animated:YES];
        [_tableView endUpdates];
    }
}

-(void)setCaseInsensitiveSearch_:(id)args
{
    caseInsensitiveSearch = [TiUtils boolValue:args def:YES];
    [self.proxy replaceValue:NUMBOOL(caseInsensitiveSearch) forKey:@"caseInsensitiveSearch" notification:NO];
}

-(void)setSearchText_:(id)args
{
    [self.proxy replaceValue:args forKey:@"searchText" notification:NO];
    id searchView = [self.proxy valueForKey:@"searchView"];
    if (!IS_NULL_OR_NIL(searchView)) {
        DebugLog(@"Can not use searchText with searchView. Ignoring call.");
        return;
    }
    searchString = [TiUtils stringValue:args];
    [self buildResultsForSearchText];
}

#pragma mark - Editing Support

-(BOOL)canEditRowAtIndexPath:(NSIndexPath *)indexPath
{
    id editValue = [self valueWithKey:@"canEdit" atIndexPath:indexPath];
    //canEdit if undefined is false
    return [TiUtils boolValue:editValue def:NO];
}


-(BOOL)canMoveRowAtIndexPath:(NSIndexPath *)indexPath
{
    id moveValue = [self valueWithKey:@"canMove" atIndexPath:indexPath];
    //canMove if undefined is false
    return [TiUtils boolValue:moveValue def:NO];
}

#pragma mark - Editing Support Datasource methods.

- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (tableView != _tableView) {
        return NO;
    }
    
    if (searchActive) {
        return NO;
    }
    
    if ([self canEditRowAtIndexPath:indexPath]) {
        return YES;
    }
    if (editing) {
        return [self canMoveRowAtIndexPath:indexPath];
    }
    return NO;
}

- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (editingStyle == UITableViewCellEditingStyleDelete) {
        TiUIListSectionProxy* theSection = [[self.listViewProxy sectionForIndex:indexPath.section] retain];
        NSDictionary *theItem = [[theSection itemAtIndex:indexPath.row] retain];
        
        //Delete Data
        [theSection deleteItemAtIndex:indexPath.row];
        
        //Fire the delete Event if required
        NSString *eventName = @"delete";
        if ([self.proxy _hasListeners:eventName]) {
        
            NSMutableDictionary *eventObject = [[NSMutableDictionary alloc] initWithObjectsAndKeys:
                                                theSection, @"section",
                                                NUMINT(indexPath.section), @"sectionIndex",
                                                NUMINT(indexPath.row), @"itemIndex",
                                                nil];
            id propertiesValue = [theItem objectForKey:@"properties"];
            NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
            id itemId = [properties objectForKey:@"itemId"];
            if (itemId != nil) {
                [eventObject setObject:itemId forKey:@"itemId"];
            }
            [self.proxy fireEvent:eventName withObject:eventObject withSource:self.proxy propagate:NO reportSuccess:NO errorCode:0 message:nil];
            [eventObject release];
        }
        [theItem release];
        
        BOOL emptySection = NO;
        
        if ([theSection itemCount] == 0) {
            emptySection = YES;
            if (pruneSections) {
                [self.listViewProxy deleteSectionAtIndex:indexPath.section];
            }
        }
        
        BOOL emptyTable = NO;
        NSUInteger sectionCount = [[self.listViewProxy sectionCount] unsignedIntValue];
        if ( sectionCount == 0) {
            emptyTable = YES;
        }
        
        //Reload the data now.
        [tableView beginUpdates];
        if (emptyTable) {
            //Table is empty. Just reload fake section with FADE animation to clear out header and footers
            NSIndexSet *theSet = [NSIndexSet indexSetWithIndex:0];
            [tableView reloadSections:theSet withRowAnimation:UITableViewRowAnimationFade];
        } else if (emptySection) {
            //Section is empty.
            if (pruneSections) {
                //Delete the section
                
                BOOL needsReload = (indexPath.section < sectionCount);
                //If this is not the last section we need to set indices for all the sections coming in after this that are visible.
                //Otherwise the events will not work properly since the indexPath stored in the cell will be incorrect.
                
                if (needsReload) {
                    NSArray* visibleRows = [tableView indexPathsForVisibleRows];
                    [visibleRows enumerateObjectsUsingBlock:^(NSIndexPath *vIndexPath, NSUInteger idx, BOOL *stop) {
                        if (vIndexPath.section > indexPath.section) {
                            //This belongs to the next section. So set the right indexPath otherwise events wont work properly.
                            NSIndexPath *newIndex = [NSIndexPath indexPathForRow:vIndexPath.row inSection:(vIndexPath.section -1)];
                            UITableViewCell* theCell = [tableView cellForRowAtIndexPath:vIndexPath];
                            if ([theCell isKindOfClass:[TiUIListItem class]]) {
                                ((TiUIListItem*)theCell).proxy.indexPath = newIndex;
                            }
                        }
                    }];
                }
                NSIndexSet *deleteSet = [NSIndexSet indexSetWithIndex:indexPath.section];
                [tableView deleteSections:deleteSet withRowAnimation:UITableViewRowAnimationFade];
            } else {
                //Just delete the row. Section stays
                [tableView deleteRowsAtIndexPaths:[NSArray arrayWithObject:indexPath] withRowAnimation:UITableViewRowAnimationFade];
            }
        } else {
            //Just delete the row.
            BOOL needsReload = (indexPath.row < [theSection itemCount]);
            //If this is not the last row need to set indices for all rows in the section following this row.
            //Otherwise the events will not work properly since the indexPath stored in the cell will be incorrect.
            
            if (needsReload) {
                NSArray* visibleRows = [tableView indexPathsForVisibleRows];
                [visibleRows enumerateObjectsUsingBlock:^(NSIndexPath *vIndexPath, NSUInteger idx, BOOL *stop) {
                    if ( (vIndexPath.section == indexPath.section) && (vIndexPath.row > indexPath.row) ) {
                        //This belongs to the same section. So set the right indexPath otherwise events wont work properly.
                        NSIndexPath *newIndex = [NSIndexPath indexPathForRow:(vIndexPath.row - 1) inSection:(vIndexPath.section)];
                        UITableViewCell* theCell = [tableView cellForRowAtIndexPath:vIndexPath];
                        if ([theCell isKindOfClass:[TiUIListItem class]]) {
                            ((TiUIListItem*)theCell).proxy.indexPath = newIndex;
                        }
                    }
                }];
            }
            [tableView deleteRowsAtIndexPaths:[NSArray arrayWithObject:indexPath] withRowAnimation:UITableViewRowAnimationFade];
        
        }
        [tableView endUpdates];
        [theSection release];
    }
}

#pragma mark - Editing Support Delegate Methods.

- (UITableViewCellEditingStyle)tableView:(UITableView *)tableView editingStyleForRowAtIndexPath:(NSIndexPath *)indexPath
{
    //No support for insert style yet
    if ([self canEditRowAtIndexPath:indexPath]) {
        return UITableViewCellEditingStyleDelete;
    } else {
        return UITableViewCellEditingStyleNone;
    }
}

- (BOOL)tableView:(UITableView *)tableView shouldIndentWhileEditingRowAtIndexPath:(NSIndexPath *)indexPath
{
    return [self canEditRowAtIndexPath:indexPath];
}

- (void)tableView:(UITableView *)tableView willBeginEditingRowAtIndexPath:(NSIndexPath *)indexPath
{
    editing = YES;
    [self.proxy replaceValue:NUMBOOL(editing) forKey:@"editing" notification:NO];
}

- (void)tableView:(UITableView *)tableView didEndEditingRowAtIndexPath:(NSIndexPath *)indexPath
{
    editing = [_tableView isEditing];
    [self.proxy replaceValue:NUMBOOL(editing) forKey:@"editing" notification:NO];
    if (!editing) {
        [_tableView reloadData];
    }
}

#pragma mark - UITableViewDataSource

- (BOOL)tableView:(UITableView *)tableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (tableView != _tableView) {
        return NO;
    }
    
    if (searchActive) {
        return NO;
    }
    
	return [self canMoveRowAtIndexPath:indexPath];
}

- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)fromIndexPath toIndexPath:(NSIndexPath *)toIndexPath
{
    int fromSectionIndex = [fromIndexPath section];
    int fromRowIndex = [fromIndexPath row];
    int toSectionIndex = [toIndexPath section];
    int toRowIndex = [toIndexPath row];
    
    
    
    if (fromSectionIndex == toSectionIndex) {
        if (fromRowIndex == toRowIndex) {
            return;
        }
        //Moving a row in the same index. Just move and reload section
        TiUIListSectionProxy* theSection = [[self.listViewProxy sectionForIndex:fromSectionIndex] retain];
        NSDictionary *theItem = [[theSection itemAtIndex:fromRowIndex] retain];
        
        //Delete Data
        [theSection deleteItemAtIndex:fromRowIndex];
        
        //Insert the data
        [theSection addItem:theItem atIndex:toRowIndex];
        
        //Fire the move Event if required
        NSString *eventName = @"move";
        if ([self.proxy _hasListeners:eventName]) {
            
            NSMutableDictionary *eventObject = [[NSMutableDictionary alloc] initWithObjectsAndKeys:
                                                theSection, @"section",
                                                NUMINT(fromSectionIndex), @"sectionIndex",
                                                NUMINT(fromRowIndex), @"itemIndex",
                                                theSection,@"targetSection",
                                                NUMINT(toSectionIndex), @"targetSectionIndex",
                                                NUMINT(toRowIndex), @"targetItemIndex",
                                                nil];
            id propertiesValue = [theItem objectForKey:@"properties"];
            NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
            id itemId = [properties objectForKey:@"itemId"];
            if (itemId != nil) {
                [eventObject setObject:itemId forKey:@"itemId"];
            }
            [self.proxy fireEvent:eventName withObject:eventObject withSource:self.proxy propagate:NO reportSuccess:NO errorCode:0 message:nil];
            [eventObject release];
        }
        
        [tableView reloadData];
        
        [theSection release];
        [theItem release];
        
        
    } else {
        TiUIListSectionProxy* fromSection = [[self.listViewProxy sectionForIndex:fromSectionIndex] retain];
        NSDictionary *theItem = [[fromSection itemAtIndex:fromRowIndex] retain];
        TiUIListSectionProxy* toSection = [[self.listViewProxy sectionForIndex:toSectionIndex] retain];
        
        //Delete Data
        [fromSection deleteItemAtIndex:fromRowIndex];
        
        //Insert the data
        [toSection addItem:theItem atIndex:toRowIndex];
        
        //Fire the move Event if required
        NSString *eventName = @"move";
        if ([self.proxy _hasListeners:eventName]) {
            
            NSMutableDictionary *eventObject = [[NSMutableDictionary alloc] initWithObjectsAndKeys:
                                                fromSection, @"section",
                                                NUMINT(fromSectionIndex), @"sectionIndex",
                                                NUMINT(fromRowIndex), @"itemIndex",
                                                toSection,@"targetSection",
                                                NUMINT(toSectionIndex), @"targetSectionIndex",
                                                NUMINT(toRowIndex), @"targetItemIndex",
                                                nil];
            id propertiesValue = [theItem objectForKey:@"properties"];
            NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
            id itemId = [properties objectForKey:@"itemId"];
            if (itemId != nil) {
                [eventObject setObject:itemId forKey:@"itemId"];
            }
            [self.proxy fireEvent:eventName withObject:eventObject];
            [eventObject release];
        }
        
        if ([fromSection itemCount] == 0) {
            if (pruneSections) {
                [self.listViewProxy deleteSectionAtIndex:fromSectionIndex];
            }
        }
        
        [tableView reloadData];
        
        [fromSection release];
        [toSection release];
        [theItem release];
    }
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    NSUInteger sectionCount = 0;
    
    if (_searchResults != nil) {
        sectionCount = [_searchResults count];
    } else {
        sectionCount = [self.listViewProxy.sectionCount unsignedIntegerValue];
    }
    return MAX(1,sectionCount);
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    if (_searchResults != nil) {
        if ([_searchResults count] <= section) {
            return 0;
        }
        NSArray* theSection = [_searchResults objectAtIndex:section];
        return [theSection count];
        
    } else {
        TiUIListSectionProxy* theSection = [self.listViewProxy sectionForIndex:section];
        if (theSection != nil) {
            return theSection.itemCount;
        }
        return 0;
    }
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    NSIndexPath* realIndexPath = [self pathForSearchPath:indexPath];
    TiUIListSectionProxy* theSection = [self.listViewProxy sectionForIndex:realIndexPath.section];
    NSInteger maxItem = 0;
    
    if (_searchResults != nil) {
        NSArray* sectionResults = [_searchResults objectAtIndex:indexPath.section];
        maxItem = [sectionResults count];
    } else {
        maxItem = theSection.itemCount;
    }
    
    NSDictionary *item = [theSection itemAtIndex:realIndexPath.row];
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
    cell.proxy.indexPath = realIndexPath;
    return cell;
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{
    if (tableView != _tableView) {
        return nil;
    }
    
    if (searchActive) {
        if (keepSectionsInSearch && ([_searchResults count] > 0) ) {
            NSInteger realSection = [self sectionForSearchSection:section];
            return [[self.listViewProxy sectionForIndex:realSection] headerTitle];
        } else {
            return nil;
        }
    }
    
    return [[self.listViewProxy sectionForIndex:section] headerTitle];
}

- (NSString *)tableView:(UITableView *)tableView titleForFooterInSection:(NSInteger)section
{
    if (tableView != _tableView) {
        return nil;
    }
    
    if (searchActive) {
        if (keepSectionsInSearch && ([_searchResults count] > 0) ) {
            NSInteger realSection = [self sectionForSearchSection:section];
            return [[self.listViewProxy sectionForIndex:realSection] headerTitle];
        } else {
            return nil;
        }
    }
    return [[self.listViewProxy sectionForIndex:section] footerTitle];
}

#pragma mark - UITableViewDelegate

- (UIView *)tableView:(UITableView *)tableView viewForHeaderInSection:(NSInteger)section
{
    if (tableView != _tableView) {
        return nil;
    }
    
    if (searchActive) {
        if (keepSectionsInSearch && ([_searchResults count] > 0) ) {
            NSInteger realSection = [self sectionForSearchSection:section];
            return [self sectionView:realSection forLocation:@"headerView" section:nil];
        } else {
            return nil;
        }
    }

    return [self sectionView:section forLocation:@"headerView" section:nil];
}

- (UIView *)tableView:(UITableView *)tableView viewForFooterInSection:(NSInteger)section
{
    if (tableView != _tableView) {
        return nil;
    }
    
    if (searchActive) {
        if (keepSectionsInSearch && ([_searchResults count] > 0) ) {
            NSInteger realSection = [self sectionForSearchSection:section];
            return [self sectionView:realSection forLocation:@"footerView" section:nil];
        } else {
            return nil;
        }
    }
    
    return [self sectionView:section forLocation:@"footerView" section:nil];
}

#define DEFAULT_SECTION_HEADERFOOTER_HEIGHT 20.0

- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section
{
    if (tableView != _tableView) {
        return 0.0;
    }
    
    NSInteger realSection = section;
    
    if (searchActive) {
        if (keepSectionsInSearch && ([_searchResults count] > 0) ) {
            realSection = [self sectionForSearchSection:section];
        } else {
            return 0.0;
        }
    }
    
    TiUIListSectionProxy *sectionProxy = [self.listViewProxy sectionForIndex:realSection];
    TiUIView *view = [self sectionView:realSection forLocation:@"headerView" section:nil];
	
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
    if (tableView != _tableView) {
        return 0.0;
    }
    
    NSInteger realSection = section;
    
    if (searchActive) {
        if (keepSectionsInSearch && ([_searchResults count] > 0) ) {
            realSection = [self sectionForSearchSection:section];
        } else {
            return 0.0;
        }
    }

    TiUIListSectionProxy *sectionProxy = [self.listViewProxy sectionForIndex:realSection];
    TiUIView *view = [self sectionView:realSection forLocation:@"footerView" section:nil];
	
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
    NSIndexPath* realPath = [self pathForSearchPath:indexPath];
    
    id heightValue = [self valueWithKey:@"height" atIndexPath:realPath];
    
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

#pragma mark - ScrollView Delegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
    //Events - pull (maybe scroll later)
    if (![self.proxy _hasListeners:@"pull"]) {
        return;
    }
    
    if ( (_pullViewProxy != nil) && ([scrollView isTracking]) ) {
        if ( (scrollView.contentOffset.y < pullThreshhold) && (pullActive == NO) ) {
            pullActive = YES;
            [self.proxy fireEvent:@"pull" withObject:[NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(pullActive),@"active",nil] withSource:self.proxy propagate:NO reportSuccess:NO errorCode:0 message:nil];
        } else if ( (scrollView.contentOffset.y > pullThreshhold) && (pullActive == YES) ) {
            pullActive = NO;
            [self.proxy fireEvent:@"pull" withObject:[NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(pullActive),@"active",nil] withSource:self.proxy propagate:NO reportSuccess:NO errorCode:0 message:nil];
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
        [self.proxy fireEvent:@"pullend" withObject:nil withSource:self.proxy propagate:NO reportSuccess:NO errorCode:0 message:nil];
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
    CGRect minimumContentRect = [_tableView bounds];
	InsetScrollViewForKeyboard(_tableView,keyboardTop,minimumContentRect.size.height + minimumContentRect.origin.y);
}

-(void)scrollToShowView:(TiUIView *)firstResponderView withKeyboardHeight:(CGFloat)keyboardTop
{
    if ([_tableView isScrollEnabled]) {
        CGRect minimumContentRect = [_tableView bounds];
        
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
