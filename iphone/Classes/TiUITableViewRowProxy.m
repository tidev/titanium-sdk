/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#import "TiUITableViewRowProxy.h"
#import "TiUITableViewAction.h"
#import "TiUITableViewSectionProxy.h"
#import "TiUITableView.h"
#import "TiViewProxy.h"
#import "TiUtils.h"
#import "Webcolor.h"
#import "ImageLoader.h"

#import <libkern/OSAtomic.h>

NSString * const defaultRowTableClass = @"_default_";
#define CHILD_ACCESSORY_WIDTH 20.0
#define CHECK_ACCESSORY_WIDTH 20.0
#define DETAIL_ACCESSORY_WIDTH 33.0

// TODO: Clean this up a bit
#define NEEDS_UPDATE_ROW 1

static void addRoundedRectToPath(CGContextRef context, CGRect rect,
								 float ovalWidth,float ovalHeight)

{
    float fw, fh;
	
    if (ovalWidth == 0 || ovalHeight == 0) {// 1
        CGContextAddRect(context, rect);
        return;
    }
	
    CGContextSaveGState(context);// 2
	
    CGContextTranslateCTM (context, CGRectGetMinX(rect),// 3
						   CGRectGetMinY(rect));
    CGContextScaleCTM (context, ovalWidth, ovalHeight);// 4
    fw = CGRectGetWidth (rect) / ovalWidth;// 5
    fh = CGRectGetHeight (rect) / ovalHeight;// 6
	
    CGContextMoveToPoint(context, fw, fh/2); // 7
    CGContextAddArcToPoint(context, fw, fh, fw/2, fh, 1);// 8
    CGContextAddArcToPoint(context, 0, fh, 0, fh/2, 1);// 9
    CGContextAddArcToPoint(context, 0, 0, fw/2, 0, 1);// 10
    CGContextAddArcToPoint(context, fw, 0, fw, fh/2, 1); // 11
    CGContextClosePath(context);// 12
	
    CGContextRestoreGState(context);// 13
}

@interface TiSelectedCellBackgroundView : UIView 
{
    TiCellBackgroundViewPosition position;
	UIColor *fillColor;
	BOOL grouped;
}
@property(nonatomic) TiCellBackgroundViewPosition position;
@property(nonatomic,retain) UIColor *fillColor;
@property(nonatomic) BOOL grouped;
@end

#define ROUND_SIZE 10

@implementation TiSelectedCellBackgroundView
@synthesize position,fillColor,grouped;

-(void)dealloc
{
	RELEASE_TO_NIL(fillColor);
	[super dealloc];
}

-(BOOL)isOpaque 
{
    return NO;
}

-(void)drawRect:(CGRect)rect 
{
    CGContextRef ctx = UIGraphicsGetCurrentContext();
	
	CGContextSetFillColorWithColor(ctx, [fillColor CGColor]);
    CGContextSetStrokeColorWithColor(ctx, [fillColor CGColor]);
    CGContextSetLineWidth(ctx, 2);
	
    if (grouped && position == TiCellBackgroundViewPositionTop) 
	{
        CGFloat minx = CGRectGetMinX(rect), midx = CGRectGetMidX(rect), maxx = CGRectGetMaxX(rect) ;
        CGFloat miny = CGRectGetMinY(rect), maxy = CGRectGetMaxY(rect);
		
        CGContextMoveToPoint(ctx, minx, maxy);
        CGContextAddArcToPoint(ctx, minx, miny, midx, miny, ROUND_SIZE);
        CGContextAddArcToPoint(ctx, maxx, miny, maxx, maxy, ROUND_SIZE);
        CGContextAddLineToPoint(ctx, maxx, maxy);
		
        // Close the path
        CGContextClosePath(ctx);
		CGContextSaveGState(ctx);
		CGContextDrawPath(ctx, kCGPathFill);
        return;
    } 
	else if (grouped && position == TiCellBackgroundViewPositionBottom) 
	{
        CGFloat minx = CGRectGetMinX(rect) , midx = CGRectGetMidX(rect), maxx = CGRectGetMaxX(rect) ;
        CGFloat miny = CGRectGetMinY(rect) , maxy = CGRectGetMaxY(rect) ;
		
        CGContextMoveToPoint(ctx, minx, miny);
        CGContextAddArcToPoint(ctx, minx, maxy, midx, maxy, ROUND_SIZE);
        CGContextAddArcToPoint(ctx, maxx, maxy, maxx, miny, ROUND_SIZE);
        CGContextAddLineToPoint(ctx, maxx, miny);
        CGContextClosePath(ctx);
		CGContextSaveGState(ctx);
		CGContextDrawPath(ctx, kCGPathFill);
        return;
    } 
	else if (!grouped || position == TiCellBackgroundViewPositionMiddle) 
	{
        CGFloat minx = CGRectGetMinX(rect), maxx = CGRectGetMaxX(rect);
        CGFloat miny = CGRectGetMinY(rect), maxy = CGRectGetMaxY(rect);
        CGContextMoveToPoint(ctx, minx, miny);
        CGContextAddLineToPoint(ctx, maxx, miny);
        CGContextAddLineToPoint(ctx, maxx, maxy);
        CGContextAddLineToPoint(ctx, minx, maxy);
        CGContextClosePath(ctx);
		CGContextSaveGState(ctx);
		CGContextDrawPath(ctx, kCGPathFill);
        return;
    }
	else if (grouped && position == TiCellBackgroundViewPositionSingleLine)
	{
		CGContextBeginPath(ctx);
		addRoundedRectToPath(ctx, rect, ROUND_SIZE*1.5, ROUND_SIZE*1.5);
		CGContextFillPath(ctx);  
		
		CGContextSetLineWidth(ctx, 2);  
		CGContextBeginPath(ctx);
		addRoundedRectToPath(ctx, rect, ROUND_SIZE*1.5, ROUND_SIZE*1.5);  
		CGContextStrokePath(ctx);   
		
		return;
	}
	[super drawRect:rect];
}

-(void)setPosition:(TiCellBackgroundViewPosition)inPosition
{
	if(position != inPosition)
	{
		position = inPosition;
		[self setNeedsDisplay];
	}
}

@end


// used as a marker interface

@interface TiUITableViewRowContainer : UIView
{
	TiProxy * hitTarget;
	CGPoint hitPoint;
}
@property(nonatomic,retain,readwrite) TiProxy * hitTarget;
@property(nonatomic,assign,readwrite) CGPoint hitPoint;
-(void)clearHitTarget;

@end

TiProxy * DeepScanForProxyOfViewContainingPoint(UIView * targetView, CGPoint point)
{
	if (!CGRectContainsPoint([targetView bounds], point))
	{
		return nil;
	}
	for (UIView * subView in [targetView subviews])
	{
		TiProxy * subProxy = DeepScanForProxyOfViewContainingPoint(subView,[targetView convertPoint:point toView:subView]);
		if (subProxy != nil)
		{
			return subProxy;
		}
	}

	//By now, no subviews have claimed ownership.
	if ([targetView respondsToSelector:@selector(proxy)])
	{
		return [(TiUIView *)targetView proxy];
	}
	return nil;
}

@implementation TiUITableViewRowContainer
@synthesize hitTarget, hitPoint;

-(id)init
{
	if (self = [super init]) {
		hitPoint = CGPointZero;
	}
	return self;
}

-(void)clearHitTarget
{
	[hitTarget autorelease];
	hitTarget = nil;
}

-(TiProxy *)hitTarget
{
	TiProxy * result = hitTarget;
	[self clearHitTarget];
	return result;
}

- (UIView *)hitTest:(CGPoint) point withEvent:(UIEvent *)event 
{
    UIView * result = [super hitTest:point withEvent:event];
	[self setHitPoint:point];
	
	if (result==nil)
	{
		[self setHitTarget:DeepScanForProxyOfViewContainingPoint(self,point)];
		return nil;
	}

	if ([result respondsToSelector:@selector(proxy)])
	{
		[self setHitTarget:[(TiUIView *)result proxy]];
	}
	else
	{
		[self clearHitTarget];
	}

	return result;
}

- (void) dealloc
{
	[self clearHitTarget];
	[super dealloc];
}


@end

@implementation TiUITableViewRowProxy

@synthesize tableClass, table, section, row, callbackCell;

-(void)_destroy
{
	RELEASE_TO_NIL(tableClass);
    [rowContainerView performSelectorOnMainThread:@selector(removeFromSuperview) withObject:nil waitUntilDone:NO];
	[rowContainerView performSelectorOnMainThread:@selector(release) withObject:nil waitUntilDone:NO];
	rowContainerView = nil;
	[callbackCell setProxy:nil];
	callbackCell = nil;
	[super _destroy];
}

-(void)_initWithProperties:(NSDictionary *)properties
{
	[super _initWithProperties:properties];
	self.modelDelegate = self;
}

-(NSString*)tableClass
{
	if (tableClass==nil)
	{
		// must use undefined key since class is a special 
		// property on the NSObject class
		id value = [self valueForUndefinedKey:@"className"];
		if (value==nil)
		{
			value = defaultRowTableClass;
		}
		// tableClass must always be a string so we coerce it
		tableClass = [[TiUtils stringValue:value] retain];
	}
	return tableClass;
}

-(void)setHeight:(id)value
{
	height = [TiUtils dimensionValue:value];
	[self replaceValue:value forKey:@"height" notification:YES];
}

-(void)setLayout:(id)value
{
	layoutProperties.layout = TiLayoutRuleFromObject(value);
	[self replaceValue:value forKey:@"layout" notification:YES];
}

-(CGFloat)sizeWidthForDecorations:(CGFloat)oldWidth forceResizing:(BOOL)force
{
	CGFloat width = oldWidth;
	if (force || !configuredChildren) {
		if ([TiUtils boolValue:[self valueForKey:@"hasChild"] def:NO]) {
			width -= CHILD_ACCESSORY_WIDTH;
		}
		else if ([TiUtils boolValue:[self valueForKey:@"hasDetail"] def:NO]) {
			width -= DETAIL_ACCESSORY_WIDTH;
		}
		else if ([TiUtils boolValue:[self valueForKey:@"hasCheck"] def:NO]) {
			width -= CHECK_ACCESSORY_WIDTH;
		}
		
		id rightImage = [self valueForKey:@"rightImage"];
		if (rightImage != nil) {
			NSURL *url = [TiUtils toURL:rightImage proxy:self];
			UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
			width -= [image size].width;
		}
		
		id leftImage = [self valueForKey:@"leftImage"];
		if (leftImage != nil) {
			NSURL *url = [TiUtils toURL:leftImage proxy:self];
			UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
			width -= [image size].width;			
		}
	}
	
	return width;
}

-(CGFloat)rowHeight:(CGFloat)width
{
	if (TiDimensionIsPixels(height))
	{
		return height.value;
	}
	CGFloat result = 0;
	if (TiDimensionIsAuto(height))
	{
		result = [self autoHeightForWidth:width];
	}
	return (result == 0) ? [table tableRowHeight:0] : result;
}

-(void)updateRow:(NSDictionary *)data withObject:(NSDictionary *)properties
{
	modifyingRow = YES;
	[super _initWithProperties:data];
	
	// check to see if we have a section header change, too...
	if ([data objectForKey:@"header"])
	{
		[section setValue:[data objectForKey:@"header"] forUndefinedKey:@"headerTitle"];
		// we can return since we're reloading the section, will cause the 
		// row to be repainted at the same time
	}
	if ([data objectForKey:@"footer"])
	{
		[section setValue:[data objectForKey:@"footer"] forUndefinedKey:@"footerTitle"];
		// we can return since we're reloading the section, will cause the 
		// row to be repainted at the same time
	}
	modifyingRow = NO;
}

-(void)configureTitle:(UITableViewCell*)cell
{
	UILabel * textLabel = [cell textLabel];

	NSString *title = [self valueForKey:@"title"];
	if (title!=nil)
	{
		[textLabel setText:title]; //UILabel already checks to see if it hasn't changed.
		
		UIColor * textColor = [[TiUtils colorValue:[self valueForKey:@"color"]] _color];
		[textLabel setTextColor:(textColor==nil)?[UIColor blackColor]:textColor];
		
		UIColor * selectedTextColor = [[TiUtils colorValue:[self valueForKey:@"selectedColor"]] _color];
		[textLabel setHighlightedTextColor:(selectedTextColor==nil)?[UIColor whiteColor]:selectedTextColor];	
	}
	else
	{
		[textLabel setText:nil];
	}
}

-(void)configureRightSide:(UITableViewCell*)cell
{
	BOOL hasChild = [TiUtils boolValue:[self valueForKey:@"hasChild"] def:NO];
	if (hasChild)
	{
		cell.accessoryType = UITableViewCellAccessoryDisclosureIndicator;
	}
	else
	{
		BOOL hasDetail = [TiUtils boolValue:[self valueForKey:@"hasDetail"] def:NO];
		if (hasDetail)
		{
			cell.accessoryType = UITableViewCellAccessoryDetailDisclosureButton;
		}
		else
		{
			BOOL hasCheck = [TiUtils boolValue:[self valueForKey:@"hasCheck"] def:NO];
			if (hasCheck)
			{
				cell.accessoryType = UITableViewCellAccessoryCheckmark;
			}
			else
			{
				cell.accessoryType = UITableViewCellAccessoryNone;
			}
		}
	}
	id rightImage = [self valueForKey:@"rightImage"];
	if (rightImage!=nil)
	{
		NSURL *url = [TiUtils toURL:rightImage proxy:self];
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
		cell.accessoryView = [[[UIImageView alloc] initWithImage:image] autorelease];
	}
    else {
        cell.accessoryView = nil;
    }
}

-(void)configureBackground:(UITableViewCell*)cell
{
	[(TiUITableViewCell *)cell setBackgroundGradient_:[self valueForKey:@"backgroundGradient"]];
	[(TiUITableViewCell *)cell setSelectedBackgroundGradient_:[self valueForKey:@"selectedBackgroundGradient"]];

	id bgImage = [self valueForKey:@"backgroundImage"];
	id selBgColor = [self valueForKey:@"selectedBackgroundColor"];

	if (bgImage!=nil)
	{
		NSURL *url = [TiUtils toURL:bgImage proxy:(TiProxy*)table.proxy];
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
		if ([cell.backgroundView isKindOfClass:[UIImageView class]]==NO)
		{
			UIImageView *view_ = [[[UIImageView alloc] initWithFrame:CGRectZero] autorelease];
			cell.backgroundView = view_;
		}
		if (image!=((UIImageView*)cell.backgroundView).image)
		{
			((UIImageView*)cell.backgroundView).image = image;
		}
	}
	else if (cell.backgroundView!=nil && [cell.backgroundView isKindOfClass:[UIImageView class]] && ((UIImageView*)cell.backgroundView).image!=nil)
	{
		cell.backgroundView = nil;
	}
	
	id selBgImage = [self valueForKey:@"selectedBackgroundImage"];
	if (selBgImage!=nil)
	{
		NSURL *url = [TiUtils toURL:selBgImage proxy:(TiProxy*)table.proxy];
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
		if ([cell.selectedBackgroundView isKindOfClass:[UIImageView class]]==NO)
		{
			UIImageView *view_ = [[[UIImageView alloc] initWithFrame:CGRectZero] autorelease];
			cell.selectedBackgroundView = view_;
		}
		if (image!=((UIImageView*)cell.selectedBackgroundView).image)
		{
			((UIImageView*)cell.selectedBackgroundView).image = image;
		}
	}
	else if (selBgColor==nil && cell.selectedBackgroundView!=nil && [cell.selectedBackgroundView isKindOfClass:[UIImageView class]] && ((UIImageView*)cell.selectedBackgroundView).image!=nil)
	{
		cell.selectedBackgroundView = nil;
	}
	
	if (selBgImage==nil && (selBgColor!=nil || [[table tableView] style]==UITableViewStyleGrouped))
	{
		if (selBgColor==nil)
		{
			// if we have a grouped view with no selected background color, we 
			// need to setup a cell and force the color otherwise you'll get
			// square corners on a rounded row
			if ([cell selectionStyle]==UITableViewCellSelectionStyleBlue)
			{
				selBgColor = @"#0272ed";
			}
			else if ([cell selectionStyle]==UITableViewCellSelectionStyleGray)
			{
				selBgColor = @"#bbb";
			}
			else 
			{
				selBgColor = @"#fff";
			}
		}
		if (cell.selectedBackgroundView == nil || [cell.selectedBackgroundView isKindOfClass:[TiSelectedCellBackgroundView class]]==NO)
		{								
			cell.selectedBackgroundView = [[[TiSelectedCellBackgroundView alloc] initWithFrame:CGRectZero] autorelease];
		}
		TiSelectedCellBackgroundView *selectedBGView = (TiSelectedCellBackgroundView*)cell.selectedBackgroundView;
		int count = [section rowCount];
		if (count == 1)
		{
			selectedBGView.position = TiCellBackgroundViewPositionSingleLine;
		}
		else 
		{
			if (row == 0)
			{
				selectedBGView.position = TiCellBackgroundViewPositionTop;
			}
			else if (row == count-1)
			{
				selectedBGView.position = TiCellBackgroundViewPositionBottom;
			}
			else 
			{
				selectedBGView.position = TiCellBackgroundViewPositionMiddle;
			}
		}
		selectedBGView.fillColor = [Webcolor webColorNamed:selBgColor];	
		selectedBGView.grouped = [[table tableView] style]==UITableViewStyleGrouped;
	}
	else if (cell.selectedBackgroundView!=nil)
	{
		cell.selectedBackgroundView.backgroundColor = nil;
	}
}

-(void)configureLeftSide:(UITableViewCell*)cell
{
	id image = [self valueForKey:@"leftImage"];
	if (image!=nil)
	{
		NSURL *url = [TiUtils toURL:image proxy:(TiProxy*)table.proxy];
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
		if (cell.imageView.image!=image)
		{
			cell.imageView.image = image;
		}
	}
	else if (cell.imageView!=nil && cell.imageView.image!=nil)
	{
		cell.imageView.image = nil;
	}
}

-(void)configureIndentionLevel:(UITableViewCell*)cell
{
	cell.indentationLevel = [TiUtils intValue:[self valueForKey:@"indentionLevel"] def:0];
}

-(void)configureSelectionStyle:(UITableViewCell*)cell
{
	id value = [self valueForKey:@"selectionStyle"];
	if (value == nil)
	{
		if (table!=nil)
		{
			// look at the tableview if not on the row
			value = [[table proxy] valueForUndefinedKey:@"selectionStyle"];
		}
	}
	if (value!=nil)
	{
		cell.selectionStyle = [TiUtils intValue:value];
	}
	else
	{
		cell.selectionStyle = UITableViewCellSelectionStyleBlue;
	}
}

-(UIView *)parentViewForChild:(TiViewProxy *)child
{
	return rowContainerView;
}

-(BOOL)viewAttached
{
	return rowContainerView != nil;
}

-(BOOL)canHaveControllerParent
{
	return NO;
}

-(void)redelegateViews:(TiViewProxy *)proxy toView:(UIView *)touchDelegate;
{
	[[proxy view] setTouchDelegate:touchDelegate];
	for (TiViewProxy * childProxy in [proxy children])
	{
		[self redelegateViews:childProxy toView:touchDelegate];
	}
}

-(UIView*)view
{
	return nil;
}

+(void)clearTableRowCell:(UITableViewCell *)cell
{
	NSArray* cellSubviews = [[cell contentView] subviews];
    
	// Clear out the old cell view
	for (UIView* view in cellSubviews) {
		[view removeFromSuperview];
	}
    
    // ... But that's not enough. We need to detatch the views
    // for all children of the row, to clean up memory.
    NSArray* children = [[(TiUITableViewCell*)cell proxy] children];
    for (TiViewProxy* child in children) {
        [child detachView];
    }
}

-(void)configureChildren:(UITableViewCell*)cell
{
	// this method is called when the cell is initially created
	// to be initialized. on subsequent repaints of a re-used
	// table cell, the updateChildren below will be called instead
	configuredChildren = YES;
	if (self.children!=nil)
	{
		UIView *contentView = cell.contentView;
		CGRect rect = [contentView frame];
        CGSize cellSize = [(TiUITableViewCell*)cell computeCellSize];
		CGFloat rowWidth = cellSize.width;
		CGFloat rowHeight = cellSize.height;

		if (rowHeight < rect.size.height || rowWidth < rect.size.width)
		{
			rect.size.height = rowHeight;
			rect.size.width = rowWidth;
			contentView.frame = rect;
		}
        else if (CGSizeEqualToSize(rect.size, CGSizeZero)) {
            rect.size = CGSizeMake(rowWidth, rowHeight);
            [contentView setFrame:rect];
        }
		rect.origin = CGPointZero;
        [rowContainerView removeFromSuperview];
		[rowContainerView release];
		rowContainerView = [[TiUITableViewRowContainer alloc] initWithFrame:rect];
		[rowContainerView setBackgroundColor:[UIColor clearColor]];
		[rowContainerView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		
		for (TiViewProxy *proxy in self.children)
		{
			if (!CGRectEqualToRect([proxy sandboxBounds], rect)) {
				[proxy setSandboxBounds:rect];
			}
			[proxy windowWillOpen];
			[proxy setReproxying:YES];
			TiUIView *uiview = [proxy view];
			[self redelegateViews:proxy toView:contentView];
			[rowContainerView addSubview:uiview];
			[proxy setReproxying:NO];
		}
		[self willEnqueue];
		[contentView addSubview:rowContainerView];
	}
	configuredChildren = YES;
}

-(void)reproxyChildren:(TiViewProxy*)proxy 
				  view:(TiUIView*)uiview 
				parent:(TiViewProxy*)newParent
		 touchDelegate:(id)touchDelegate
{
	TiViewProxy * oldProxy = (TiViewProxy*)[uiview proxy];
	
	// We ONLY have to transfer the proxy if we're not reusing the one that already belongs to us.
	if (oldProxy != proxy) {
		[uiview transferProxy:proxy];
		
		// because proxies can have children, we need to recursively do this
		NSArray *children_ = proxy.children;
		if (children_!=nil && [children_ count]>0)
		{
			NSArray * oldProxyChildren = [oldProxy children];
			
			if ([oldProxyChildren count] != [children_ count])
			{
				NSLog(@"[WARN] looks like we have a different table cell layout than expected.  Make sure you set the 'className' property of the table row when you have different cell layouts");
				NSLog(@"[WARN] if you don't fix this, your tableview will suffer performance issues and also will not render properly");
				return;
			}
			int c = 0;
			NSEnumerator * oldChildrenEnumator = [oldProxyChildren objectEnumerator];
			for (TiViewProxy* child in children_)
			{
				TiViewProxy * oldChild = [oldChildrenEnumator nextObject];
				if (![oldChild viewAttached])
				{
					NSLog(@"[WARN] Orphaned child found during proxy transfer!");
				}
				//Todo: We should probably be doing this only if the view is attached,
				//And something else entirely if the view wasn't attached.
				[self reproxyChildren:child 
								 view:[oldChild view]
							   parent:proxy touchDelegate:nil];
				[proxy willEnqueue];
			}
		}
	}
}

-(void)updateChildren:(UITableViewCell*)cell
{
	// this method is called with a cached table cell and we need
	// to cause the existing cell to be updated with any values 
	// that are different from the previous cached use of the cell.  
	// we simply do this by sending property change events to the 
	// cached cell view and then switching it's active proxy.
	// this will cause any property changes to be reflected in the 
	// cached cell (and resulting underlying UI component changes)
	// and the proxy change ensures that the new row proxy gets the
	// events now
	BOOL emptyChildren = [[self children] count] == 0;
	
	if (emptyChildren)
	{
		return;
	}
	
	UIView *contentView = cell.contentView;
	NSArray *subviews = [contentView subviews];
	if (contentView==nil || [subviews count]==0)
	{
		// this can happen if we're giving a reused table cell
		// but he's removed the children from it... in this 
		// case we just re-add like it was brand new
		[self configureChildren:cell];
		return;
	}
	BOOL found = NO;
	for (UIView *aview in subviews)
	{
		// since the table will insert the accessory view and 
		// other stuff in our contentView we need to check and
		// and skip non TiUIViews
		if ([aview isKindOfClass:[TiUITableViewRowContainer class]])
		{
			NSArray *subviews = [aview subviews];
			// this can happen because the cell dropped our views
			if ([subviews count]==0)
			{
				[aview removeFromSuperview];
				[self configureChildren:cell];
				return;
			}
			
			if (rowContainerView != aview) {
				[rowContainerView release];
				rowContainerView = [aview retain];
			}
			
			for (size_t x=0;x<[subviews count];x++)
			{
				TiViewProxy *proxy = [self.children objectAtIndex:x];
				TiUIView *uiview = [subviews objectAtIndex:x];
				[self reproxyChildren:proxy view:uiview parent:self touchDelegate:contentView];
			}
			found = YES;
			// once we find the container we can break
			break;
		}
	} 
	if (found==NO)
	{
		// this probably happens if a developer specified the same
		// row but the layout is different and they're trying to reuse
		// it -- in this case, we're just going to reconfig
		
		// at least warn the user
		NSLog(@"[WARN] looks like we have a different table cell layout than expected.  Make sure you set the 'className' property of the table row when you have different cell layouts");
		NSLog(@"[WARN] if you don't fix this, your tableview will suffer performance issues");
		
		// change the classname so at least we don't too much of a performance
		// hit on subsequent repaints
		RELEASE_TO_NIL(tableClass);
		tableClass = [[NSString stringWithFormat:@"%d",[self hash]] retain];
		
		// now force a repaint by reconfiguring this cell
		for (UIView *v in subviews)
		{
			[v removeFromSuperview];
		}
		
		[self configureChildren:cell];
		return;
	}
}

-(void)initializeTableViewCell:(UITableViewCell*)cell
{
	modifyingRow = YES;
	[self configureTitle:cell];
	[self configureSelectionStyle:cell];
	[self configureLeftSide:cell];
	[self configureRightSide:cell];
	[self configureBackground:cell];
	[self configureIndentionLevel:cell];
	[self configureChildren:cell];
	modifyingRow = NO;
}

-(void)renderTableViewCell:(UITableViewCell*)cell
{
	modifyingRow = YES;
	[self configureTitle:cell];
	[self configureSelectionStyle:cell];
	[self configureLeftSide:cell];
	[self configureRightSide:cell];
	[self configureBackground:cell];
	[self configureIndentionLevel:cell];

	NSString * cellReuseIdent = [cell reuseIdentifier];

	if([cellReuseIdent isEqual:defaultRowTableClass])
	{
		//We can make no assumptions when a class is not specified.
		for (UIView * oldView in [[cell contentView] subviews])
		{
			if ([oldView isKindOfClass:[TiUITableViewRowContainer class]])
			{
				[oldView removeFromSuperview];
			}
		}
		[self configureChildren:cell];
	}
	else
	{
		[self updateChildren:cell];
	}
	modifyingRow = NO;
}

-(BOOL)isAttached
{
	return (table!=nil) && ([self parent]!=nil);
}

// TODO: SUPER MEGA UGLY but it's the only workaround for now.  zindex does NOT work with table rows.
// TODO: Add child locking methods for whenever we have to touch children outside TiViewProxy
-(void)willShow
{
	pthread_rwlock_rdlock(&childrenLock);
	for (TiViewProxy* child in [self children]) {
		[child setParentVisible:YES];
	}
	pthread_rwlock_unlock(&childrenLock);
}

-(void)triggerAttach
{
	if (!attaching && ![self viewAttached]) {
		attaching = YES;
		[self windowWillOpen];
		[self willShow];
		attaching = NO;
	}
}

-(void)updateRow:(TiUITableViewAction*)action
{
	OSAtomicTestAndClearBarrier(NEEDS_UPDATE_ROW, &dirtyRowFlags);
	[table dispatchAction:action];
}

-(void)triggerRowUpdate
{	
	if ([self isAttached] && !modifyingRow && !attaching)
	{
		if (OSAtomicTestAndSetBarrier(NEEDS_UPDATE_ROW, &dirtyRowFlags)) {
			return;
		}
		
		TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithObject:self 
																		 animation:nil 
																			  type:TiUITableViewActionRowReload] autorelease];
		[self performSelectorOnMainThread:@selector(updateRow:) withObject:action waitUntilDone:NO];
	}
}

-(void)windowWillOpen
{
	attaching = YES;
	[super windowWillOpen];
	attaching = NO;
}

-(void)contentsWillChange
{
	if (attaching==NO)
	{
		[self triggerRowUpdate];
	}
}

-(void)childWillResize:(TiViewProxy *)child
{
	[self triggerRowUpdate];
}

-(TiProxy *)touchedViewProxyInCell:(UITableViewCell *)targetCell atPoint:(CGPoint*)point
{
	for (TiUITableViewRowContainer * thisContainer in [[targetCell contentView] subviews])
	{
		if ([thisContainer isKindOfClass:[TiUITableViewRowContainer class]])
		{
			TiProxy * result = [thisContainer hitTarget];
			*point = [thisContainer hitPoint];
			if (result != nil)
			{
				return result;
			}
		}
	}
	return self;
}

-(id)createEventObject:(id)initialObject
{
	NSMutableDictionary *dict = nil;
	if (initialObject == nil)
	{
		dict = [NSMutableDictionary dictionary];
	}
	else
	{
		dict = [NSMutableDictionary dictionaryWithDictionary:initialObject];
	}
	NSInteger index = [table indexForRow:self];
	[dict setObject:NUMINT(index) forKey:@"index"];
    // TODO: We really need to ensure that a row's section is set upon creation - even if this means changing how tables work.
    if (section != nil) {
        [dict setObject:section forKey:@"section"];
    }
	[dict setObject:self forKey:@"row"];
	[dict setObject:self forKey:@"rowData"];
	[dict setObject:NUMBOOL(NO) forKey:@"detail"];
	[dict setObject:NUMBOOL(NO) forKey:@"searchMode"];
	
	return dict;
}

-(void)fireEvent:(NSString *)type withObject:(id)obj withSource:(id)source propagate:(BOOL)propagate
{
	// merge in any row level properties for the event
	if (source!=self)
	{
		obj = [self createEventObject:obj];
	}
	[callbackCell handleEvent:type];
	[super fireEvent:type withObject:obj withSource:source propagate:propagate];
}

-(void)setSelectedBackgroundColor:(id)arg
{
	[self replaceValue:arg forKey:@"selectedBackgroundColor" notification:NO];	
	if (callbackCell != nil) {
		[self configureBackground:callbackCell];
	}
}

-(void)setBackgroundImage:(id)arg
{
	[self replaceValue:arg forKey:@"backgroundImage" notification:NO];	
	if (callbackCell != nil) {
		[self configureBackground:callbackCell];
	}
}

-(void)setSelectedBackgroundImage:(id)arg
{
	[self replaceValue:arg forKey:@"selectedBackgroundImage" notification:NO];	
	if (callbackCell != nil) {
		[self configureBackground:callbackCell];
	}
}

-(void)setBackgroundGradient:(id)arg
{
	TiGradient * newGradient = [TiGradient gradientFromObject:arg proxy:self];
	[self replaceValue:newGradient forKey:@"backgroundGradient" notification:NO];
	
	[callbackCell performSelectorOnMainThread:@selector(setBackgroundGradient_:)
			withObject:newGradient waitUntilDone:NO];
}

-(void)setSelectedBackgroundGradient:(id)arg
{
	TiGradient * newGradient = [TiGradient gradientFromObject:arg proxy:self];
	[self replaceValue:newGradient forKey:@"selectedBackgroundGradient" notification:NO];
	
	[callbackCell performSelectorOnMainThread:@selector(setSelectedBackgroundGradient_:)
			withObject:newGradient waitUntilDone:NO];
}


-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)proxy
{
	// these properties should trigger a re-paint for the row
	static NSSet * TableViewRowProperties = nil;
	if (TableViewRowProperties==nil)
	{
		TableViewRowProperties = [[NSSet alloc] initWithObjects:
					@"title", @"backgroundImage",
					@"leftImage",@"hasDetail",@"hasCheck",@"hasChild",	
					@"indentionLevel",@"selectionStyle",@"color",@"selectedColor",
					@"height",@"width",@"backgroundColor",@"rightImage",
					nil];
	}
	
	if ([TableViewRowProperties member:key]!=nil)
	{
		[self triggerRowUpdate];
	}
}


@end

#endif