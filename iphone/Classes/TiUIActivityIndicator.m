/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIACTIVITYINDICATOR

#import "TiUIActivityIndicator.h"
#import "TiViewProxy.h"
#import "TiUtils.h"
#import "WebFont.h"
#import "Webcolor.h"

@implementation TiUIActivityIndicator

- (id) init
{
	self = [super init];
	if (self != nil) {
		style = UIActivityIndicatorViewStyleWhite;
        [self setDefaultWidth:TiDimensionAutoSize];
        [self setDefaultHeight:TiDimensionAutoSize];
        backgroundView = [[UIView alloc] init];
        [self setInnerView:backgroundView];
        [self addSubview:backgroundView];

        [self setHidden:YES];
	}
	return self;
}


-(void)dealloc
{
	RELEASE_TO_NIL(indicatorView);
	RELEASE_TO_NIL(messageLabel);
	RELEASE_TO_NIL(fontDesc);
	RELEASE_TO_NIL(textColor);
	RELEASE_TO_NIL(spinnerColor);
	[super dealloc];
}

-(UIActivityIndicatorView*)indicatorView
{
    if (indicatorView == nil) {
        indicatorView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:style];
        [indicatorView setTranslatesAutoresizingMaskIntoConstraints:NO];
        //TIMOB-17572. When a cell is reused all animations are removed. That will hide the
        //ActivityIndicator. Setting it to false ensures that visibility is controlled by the
        //visible property of the ActivityIndicator (initialized to false)
        [indicatorView setHidesWhenStopped:NO];
        if(spinnerColor!=nil){
            [indicatorView setColor:spinnerColor];
        }
        [backgroundView addSubview:indicatorView];
    }
    return indicatorView;
}

-(UILabel *)messageLabel
{
	if (messageLabel == nil)
	{
		messageLabel = [[UILabel alloc] init];
        [messageLabel setTranslatesAutoresizingMaskIntoConstraints:NO];
		[messageLabel setBackgroundColor:[UIColor clearColor]];
		if (fontDesc != nil)
		{
			[messageLabel setFont:[fontDesc font]];
		}
		
		if (textColor != nil)
		{
			[messageLabel setTextColor:textColor];
		}
		[backgroundView addSubview:messageLabel];
	}
	return messageLabel;
}

- (id)accessibilityElement
{
	return [self messageLabel];
}

#pragma mark View controller stuff

-(void)setVisible_:(id)visible
{
	if ([TiUtils boolValue:visible])
	{
		[[self indicatorView] startAnimating];
		[self setHidden:NO];
	}
	else
	{
		[indicatorView stopAnimating];
		[self setHidden:YES];
	}
}

-(void)setFont_:(id)value
{
	WebFont * newFont = [TiUtils fontValue:value def:nil];
	if ((newFont == fontDesc) || ([fontDesc isEqual:newFont]))
	{
		return;
	}

	if (newFont == nil)
	{
		newFont = [WebFont defaultFont];
	}
	
	[fontDesc release];
	fontDesc = [newFont retain];

	if (messageLabel != nil) {
		[messageLabel setFont:[fontDesc font]];
	}
}


-(void)setColor_:(id)value
{
	UIColor * newColor = [[TiUtils colorValue:value] _color];
	[textColor release];
	textColor = [newColor retain];
	if (messageLabel != nil)
	{
		if (textColor == nil)
		{
			[messageLabel setTextColor:[UIColor blackColor]];
		}
		else
		{
			[messageLabel setTextColor:textColor];
		}
	}
}

-(void)setMessage_:(id)value
{
	NSString * text = [TiUtils stringValue:value];
	[[self messageLabel] setText:text];
}


-(void)setStyle_:(id)value
{
	int newStyle = [TiUtils intValue:value];
	
	if (style == newStyle)
	{
		return;
	}
	
	style = newStyle;
	
	if (indicatorView != nil)
	{
		[indicatorView setActivityIndicatorViewStyle:style];
	}

}

-(void)setIndicatorColor_:(id)args
{
    UIColor* newColor = [[TiUtils colorValue:args] _color];
    RELEASE_AND_REPLACE(spinnerColor, newColor);
    [[self indicatorView] setColor:spinnerColor];
}

#define TI_VIEWS(...) NSDictionaryOfVariableBindings(__VA_ARGS__)
- (void)updateConstraints
{
    if (!_constraintsAdded) {
        _constraintsAdded = YES;
    messageLabel = [self messageLabel];
    indicatorView = [self indicatorView];
    NSDictionary* views = TI_VIEWS(indicatorView, messageLabel);
    [backgroundView addConstraints:TI_CONSTR(@"V:|[indicatorView]-[messageLabel]|", views)];
    [backgroundView addConstraints:TI_CONSTR(@"H:|[indicatorView]|", views)];
    [backgroundView addConstraint:[NSLayoutConstraint constraintWithItem:messageLabel
                                                               attribute:NSLayoutAttributeCenterX
                                                               relatedBy:NSLayoutRelationEqual
                                                                  toItem:backgroundView
                                                               attribute:NSLayoutAttributeCenterX
                                                              multiplier:1
                                                                constant:0]];
    }
    [super updateConstraints];
}
#undef TI_VIEWS
-(void)didMoveToWindow
{
    //TIMOB-15293
    messageLabel = [self messageLabel];
    indicatorView = [self indicatorView];
    if ( ([self window] != nil) && (indicatorView != nil) && (![indicatorView isAnimating]) ) {
        BOOL visible = [TiUtils boolValue:[[self proxy] valueForKey:@"visible"] def:NO];
        if (visible) {
            [indicatorView startAnimating];
        }
        
    }
    [super didMoveToWindow];
}

@end


#endif