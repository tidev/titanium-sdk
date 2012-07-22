/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILABEL

#import "TiUILabel.h"
#import "TiUILabelProxy.h"
#import "TiUtils.h"
#import "UIImage+Resize.h"

@implementation TiUILabel

#pragma mark Internal

-(id)init
{
    if (self = [super init]) {
        padding = CGRectZero;
        textPadding = CGPointZero;
		initialLabelFrame = CGRectZero;
    }
    return self;
}

-(void)dealloc
{
    RELEASE_TO_NIL(label);
    RELEASE_TO_NIL(backgroundView);
    [super dealloc];
}

- (BOOL)interactionDefault
{
	// by default, labels don't have any interaction unless you explicitly add
	// it via addEventListener
	return NO;
}

-(CGSize)sizeForFont:(CGFloat)suggestedWidth
{
	NSString *value = [label text];
	UIFont *font = [label font];
	CGSize maxSize = CGSizeMake(suggestedWidth<=0 ? 480 : suggestedWidth, 10000);
	CGSize shadowOffset = [label shadowOffset];
	requiresLayout = YES;
	if ((suggestedWidth > 0) && [value characterAtIndex:value.length-1] == ' ') {
		// (CGSize)sizeWithFont:(UIFont *)font constrainedToSize:(CGSize)size lineBreakMode:(UILineBreakMode)lineBreakMode method truncates
		// the string having trailing spaces when given size parameter width is equal to the expected return width, so we adjust it here.
		maxSize.width += 0.00001;
	}
	CGSize size = [value sizeWithFont:font constrainedToSize:maxSize lineBreakMode:[label lineBreakMode]];
	if (shadowOffset.width > 0)
	{
		// if we have a shadow and auto, we need to adjust to prevent
		// font from clipping
		size.width += shadowOffset.width + 10;
	}
	return size;
}

-(CGFloat)contentWidthForWidth:(CGFloat)suggestedWidth
{
	return [self sizeForFont:suggestedWidth].width;
}

-(CGFloat)contentHeightForWidth:(CGFloat)width
{
	return [self sizeForFont:width].height;
}

-(void)padLabel
{
    CGSize actualLabelSize = [self sizeForFont:initialLabelFrame.size.width - 2*textPadding.x];

    CGRect labelRect = CGRectMake(textPadding.x, textPadding.y, initialLabelFrame.size.width - 2*textPadding.x, actualLabelSize.height);
    switch (verticalAlign) {
        case UIControlContentVerticalAlignmentBottom:
            labelRect.origin.y = initialLabelFrame.size.height - textPadding.y - labelRect.size.height;
            break;
        case UIControlContentVerticalAlignmentCenter:
            labelRect.origin.y = (initialLabelFrame.size.height - labelRect.size.height)/2;
            if (labelRect.origin.y < 0) {
                labelRect.origin.y = 0;
                labelRect.size.height = initialLabelFrame.size.height - 2*textPadding.y;
            }
            break;
        default:
            if (initialLabelFrame.size.height < actualLabelSize.height) {
                labelRect.size.height = initialLabelFrame.size.height - 2*textPadding.y;
            }
            break;
    }
    
    [label setFrame:CGRectIntegral(labelRect)];

    if (repad &&
        backgroundView != nil && 
        !CGRectIsEmpty(initialLabelFrame))
    {
        [backgroundView setFrame:CGRectMake(initialLabelFrame.origin.x - padding.origin.x,
                                            initialLabelFrame.origin.y - padding.origin.y,
                                            initialLabelFrame.size.width + padding.origin.x + padding.size.width,
                                            initialLabelFrame.size.height + padding.origin.y + padding.size.height)];
        repad = NO;
    }
	return;
}

// FIXME: This isn't quite true.  But the brilliant soluton wasn't so brilliant, because it screwed with layout in unpredictable ways.
//	Sadly, there was a brilliant solution for fixing the blurring here, but it turns out there's a 
//	quicker fix: Make sure the label itself has an even height and width. Everything else is irrelevant.
-(void)setCenter:(CGPoint)newCenter
{
	[super setCenter:CGPointMake(floorf(newCenter.x), floorf(newCenter.y))];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	initialLabelFrame = bounds;
    
    repad = YES;
    [self padLabel];
    
    [super frameSizeChanged:frame bounds:bounds];
}

-(UILabel*)label
{
	if (label==nil)
	{
        verticalAlign = 0;
        label = [[UILabel alloc] initWithFrame:CGRectZero];
        label.backgroundColor = [UIColor clearColor];
        label.numberOfLines = 0;
        label.lineBreakMode = UILineBreakModeWordWrap; //default wordWrap to True
        [self addSubview:label];
        self.clipsToBounds = YES;
	}
	return label;
}

-(void)setHighlighted:(BOOL)newValue
{
	[[self label] setHighlighted:newValue];
}

- (void)didMoveToSuperview
{
	/*
	 *	Because of how we re-use the same cells in both a tableview and its
	 *	search table, there is the chance that the label is transported between
	 *	the two views before a selected search row is deselected. In other
	 *	words, make sure we're not highlighted when changing superviews.
	 */
	[self setHighlighted:NO];
	[super didMoveToSuperview];
}

-(BOOL)isHighlighted
{
	return [[self label] isHighlighted];
}

#pragma mark Public APIs

-(void)setVerticalAlign_:(id)value
{
    verticalAlign = [TiUtils intValue:value def:0];
    if (label != nil) {
        [self padLabel];
    }
}
-(void)setText_:(id)text
{
	[[self label] setText:[TiUtils stringValue:text]];
    [self padLabel];
	[(TiViewProxy *)[self proxy] contentsWillChange];
}

-(void)setColor_:(id)color
{
	UIColor * newColor = [[TiUtils colorValue:color] _color];
	[[self label] setTextColor:(newColor != nil)?newColor:[UIColor darkTextColor]];
}

-(void)setHighlightedColor_:(id)color
{
	UIColor * newColor = [[TiUtils colorValue:color] _color];
	[[self label] setHighlightedTextColor:(newColor != nil)?newColor:[UIColor lightTextColor]];
}

-(void)setFont_:(id)font
{
	[[self label] setFont:[[TiUtils fontValue:font] font]];
	[(TiViewProxy *)[self proxy] contentsWillChange];
}

-(void)setMinimumFontSize_:(id)size
{
    CGFloat newSize = [TiUtils floatValue:size];
    if (newSize < 4) { // Beholden to 'most minimum' font size
        [[self label] setAdjustsFontSizeToFitWidth:NO];
        [[self label] setMinimumFontSize:0.0];
        [[self label] setNumberOfLines:0];
    }
    else {
        [[self label] setNumberOfLines:1];
        [[self label] setAdjustsFontSizeToFitWidth:YES];
        [[self label] setMinimumFontSize:newSize];
    }
    
}

-(void)setBackgroundImage_:(id)url
{
    if (url != nil) {
        UIImage* bgImage = [self loadImage:url];
        if (backgroundView == nil) {
            backgroundView = [[UIImageView alloc] initWithImage:bgImage];
            backgroundView.userInteractionEnabled = NO;
            [self insertSubview:backgroundView atIndex:0];
            repad = YES;
            [self padLabel];
        }
        else {
            backgroundView.image = bgImage;
            [backgroundView setNeedsDisplay];
            
            repad = YES;
            [self padLabel];
        }
    }
    else {
        if (backgroundView) {
            [backgroundView removeFromSuperview];
            RELEASE_TO_NIL(backgroundView);
        }
    }
    
    self.backgroundImage = url;
}

-(void)setBackgroundPaddingLeft_:(id)left
{
    padding.origin.x = [TiUtils floatValue:left];
    repad = YES;
    [self padLabel];
}

-(void)setBackgroundPaddingRight_:(id)right
{
    padding.size.width = [TiUtils floatValue:right];
    repad = YES;
    [self padLabel];
}

-(void)setBackgroundPaddingTop_:(id)top
{
    padding.origin.y = [TiUtils floatValue:top];
    repad = YES;
    [self padLabel];
}

-(void)setBackgroundPaddingBottom_:(id)bottom
{
    padding.size.height = [TiUtils floatValue:bottom];
    repad = YES;
    [self padLabel];
}

-(void)setTextAlign_:(id)alignment
{
	[[self label] setTextAlignment:[TiUtils textAlignmentValue:alignment]];
}

-(void)setShadowColor_:(id)color
{
	if (color==nil)
	{
		[[self label] setShadowColor:nil];
	}
	else
	{
		color = [TiUtils colorValue:color];
		[[self label] setShadowColor:[color _color]];
	}
}

-(void)setShadowOffset_:(id)value
{
	CGPoint p = [TiUtils pointValue:value];
	CGSize size = {p.x,p.y};
	[[self label] setShadowOffset:size];
}

-(void)setTextPadding_:(id)value
{
    textPadding = [TiUtils pointValue:value];
    [self padLabel];
}

-(void)setWordWrap_:(id)value
{
    BOOL shouldWordWrap = [TiUtils boolValue:value def:YES];
    if (shouldWordWrap)
        [[self label] setLineBreakMode:UILineBreakModeWordWrap];
    else 
        [[self label] setLineBreakMode:UILineBreakModeTailTruncation];
}

@end

#endif
