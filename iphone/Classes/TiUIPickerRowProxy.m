/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPICKER

#import "TiUIPickerRowProxy.h"

@implementation TiUIPickerRowProxy

-(void)dealloc
{
    RELEASE_TO_NIL(tempView);
    RELEASE_TO_NIL(imageView);
    RELEASE_TO_NIL(image);
	[super dealloc];
}

-(NSString*)apiName
{
    return @"Ti.UI.PickerRow";
}

-(TiUIView*)newView
{
    return [super newView];
}

-(UIView*)viewWithFrame:(CGRect)theFrame reusingView:(UIView*)theView
{
    //The picker on IOS seems to consist of 3 tableViews (or some derivative of it) each of which calls the
    //delegate method. So we have a singleView from our proxy residing in 3 superViews.
    //While older version of IOS somehow made this work, IOS7 seems to be completely broken.
    //So what we are doing is creating a snapshot (toImage() -> UIImageView) and returning that.
    //Downside -> No touch events from pickerrow or its children
    //Upside -> It works and is performant. Accessibility is configured on the delegate
    
    NSString *title = [self valueForKey:@"title"];
    WebFont *pickerFont = [TiUtils fontValue:[self valueForKey:@"font"] def:[WebFont defaultFont]];
    if (title!=nil) {
        UILabel *pickerLabel = nil;
		
        if ([theView isMemberOfClass:[UILabel class]]) {
            pickerLabel = (UILabel*)theView;
        }

        if (pickerLabel == nil) {
            pickerLabel = [[[UILabel alloc] initWithFrame:theFrame] autorelease];
            [pickerLabel setTextAlignment:NSTextAlignmentLeft];
            [pickerLabel setBackgroundColor:[UIColor clearColor]];
            [pickerLabel setFont:[pickerFont font]];
        }
        [pickerLabel setText:title];
        return pickerLabel;
    }
    else
    {
        
        if (tempView == nil) {
            tempView = [[UIView alloc] init];
        }
        [tempView addSubview:[self view]];
        [tempView bringSubviewToFront:[self view]];
        
        [[self view] setOnLayout:^(TiLayoutView *sender, CGRect rect) {
            [sender setOnLayout:nil];
            UIGraphicsBeginImageContextWithOptions(rect.size, false, 0);
            [[tempView layer] renderInContext:UIGraphicsGetCurrentContext()];
            image = [UIGraphicsGetImageFromCurrentImageContext() retain];
            UIGraphicsEndImageContext();
        }];
        if (image != nil) {
            RELEASE_TO_NIL(imageView)
            imageView = [[UIImageView alloc] initWithImage:image];
            return imageView;
        }
        return tempView;
    }
}

@end

#endif