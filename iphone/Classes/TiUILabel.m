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
	CGSize maxSize = CGSizeMake(suggestedWidth<=0 ? 480 : suggestedWidth, 1000);
	requiresLayout = YES;
	return [value sizeWithFont:font constrainedToSize:maxSize lineBreakMode:UILineBreakModeTailTruncation];
}

-(CGFloat)autoWidthForWidth:(CGFloat)suggestedWidth
{
	return [self sizeForFont:suggestedWidth].width;
}

-(CGFloat)autoHeightForWidth:(CGFloat)width
{
	return [self sizeForFont:width].height;
}

-(void)padLabel
{
	[label setFrame:initialLabelFrame];
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
}

-(UILabel*)label
{
	if (label==nil)
	{
        label = [[UILabel alloc] initWithFrame:CGRectZero];
        label.backgroundColor = [UIColor clearColor];
        label.numberOfLines = 0;
        [self addSubview:label];
	}
	return label;
}

-(void)setHighlighted:(BOOL)newValue
{
	[[self label] setHighlighted:newValue];
}

-(BOOL)isHighlighted
{
	return [[self label] isHighlighted];
}

#pragma mark Public APIs

-(void)setText_:(id)text
{
	[[self label] setText:[TiUtils stringValue:text]];
	if (requiresLayout)
	{
		[(TiViewProxy *)[self proxy] setNeedsReposition];
	}
	else
	{
		[(TiViewProxy *)[self proxy] setNeedsRepositionIfAutoSized];
	}	
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
	if (requiresLayout)
	{
		[(TiViewProxy *)[self proxy] setNeedsReposition];
	}
	else
	{
		[(TiViewProxy *)[self proxy] setNeedsRepositionIfAutoSized];
	}
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
        UIImage* bgImage = [UIImageResize resizedImage:self.frame.size 
                                  interpolationQuality:kCGInterpolationDefault
                                                 image:[self loadImage:url]];
        
        // Resizing doesn't preserve stretchability.  Should we maybe fix this?
        bgImage = [self loadImage:url];
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

@end

#endif