/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSPLITWINDOW
#import "TiUIiOSSplitWindow.h"

@implementation TiUIiOSSplitWindow

-(void) dealloc
{
    RELEASE_TO_NIL(masterViewWrapper);
    RELEASE_TO_NIL(detailViewWrapper);
    [super dealloc];
}

-(void) initWrappers
{
    if (!viewsInitialized) {
        masterViewWrapper = [[UIView alloc] initWithFrame:CGRectZero];
        detailViewWrapper = [[UIView alloc] initWithFrame:CGRectZero];
        masterViewWrapper.backgroundColor = [UIColor colorWithRed:0 green:0 blue:1 alpha:0.2];
        detailViewWrapper.backgroundColor = [UIColor colorWithRed:0 green:1 blue:0 alpha:0.2];
        [self addSubview:detailViewWrapper];
        [self addSubview:masterViewWrapper];
        [self setClipsToBounds:YES];
        viewsInitialized = YES;
    }
}

-(void)layoutSubviews
{
    [super layoutSubviews];
    [self initWrappers];
    [self layoutSubviewsForOrientation:[[UIApplication sharedApplication] statusBarOrientation]];
}

-(void)layoutSubviewsForOrientation:(UIInterfaceOrientation) orientation
{
    CGSize refSize = self.bounds.size;
    BOOL isPortrait = UIInterfaceOrientationIsPortrait(orientation);
    
    CGRect masterRect = CGRectZero;
    CGRect detailRect  = CGRectZero;
    CGPoint masterCenter = CGPointZero;
    CGPoint detailCenter = CGPointZero;
    CGSize detailSize = CGSizeZero;
    CGSize masterSize = CGSizeZero;
    
    if (isPortrait) {
        if (showMasterInPortrait) {
            if (masterIsOverlayed) {
                /*
                 * Master on top. Detail occupies visible area. Master on top.
                 */
                detailSize = CGSizeMake(refSize.width, refSize.height);
                masterSize = CGSizeMake(refSize.height - refSize.width, refSize.height);
                masterRect = CGRectMake(0, 0, masterSize.width, masterSize.height);
                masterCenter = CGPointMake(masterSize.width/2, masterSize.height/2);
                detailRect = CGRectMake(0, 0, detailSize.width, detailSize.height);
                detailCenter = CGPointMake(detailSize.width/2, detailSize.height/2);
            } else {
                /*
                 * Side by side. Master+detail occupy visible area 
                 */
                masterSize = CGSizeMake(refSize.height - refSize.width, refSize.height);
                masterRect = CGRectMake(0, 0, masterSize.width, masterSize.height);
                masterCenter = CGPointMake(masterSize.width/2, masterSize.height/2);
                detailSize = CGSizeMake(refSize.width - masterSize.width, refSize.height);
                detailRect = CGRectMake(0, 0, detailSize.width, detailSize.height);
                detailCenter = CGPointMake(masterSize.width +  (detailSize.width/2), detailSize.height/2);
            }
            
        } else {
            /*
             * Side by side. Detail in visible area. Master off screen to left.
             */
            detailSize = CGSizeMake(refSize.width, refSize.height);
            masterSize = CGSizeMake(refSize.height - refSize.width, refSize.height);
            masterRect = CGRectMake(0, 0, masterSize.width, masterSize.height);
            masterCenter = CGPointMake(-masterSize.width/2, masterSize.height/2);
            detailRect = CGRectMake(0, 0, detailSize.width, detailSize.height);
            detailCenter = CGPointMake(detailSize.width/2, detailSize.height/2);
        }
    } else {
        /*
         * Side by side. Detail in a square box. Master in remaining width
         */
        detailSize = CGSizeMake(refSize.height, refSize.height);
        masterSize = CGSizeMake(refSize.width - refSize.height, refSize.height);
        masterRect = CGRectMake(0, 0, masterSize.width, masterSize.height);
        masterCenter = CGPointMake(masterSize.width/2, masterSize.height/2);
        detailRect = CGRectMake(0, 0, detailSize.width, detailSize.height);
        detailCenter = CGPointMake(masterSize.width + (detailSize.width/2), detailSize.height/2);
    }
    
    [detailViewWrapper setBounds:detailRect];
    [detailViewWrapper setCenter:detailCenter];
    [masterViewWrapper setBounds:masterRect];
    [masterViewWrapper setCenter:masterCenter];
}


-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
    [super frameSizeChanged:frame bounds:bounds];
    [self layoutSubviewsForOrientation:[[UIApplication sharedApplication] statusBarOrientation]];
}

-(void)setShowMasterInPortrait_:(id)value withObject:(id)animated
{
    BOOL oldVal = showMasterInPortrait;
    showMasterInPortrait = [TiUtils boolValue:value def:oldVal];
    if (showMasterInPortrait == oldVal) {
        return;
    }
    BOOL animate = [TiUtils boolValue:@"animated" properties:animated def:NO];
    
    if (viewsInitialized) {
        if (animate) {
            void (^animation)() = ^{
                [self layoutSubviewsForOrientation:[[UIApplication sharedApplication] statusBarOrientation]];
            };
            [UIView animateWithDuration:0.2 animations:animation];
        } else {
            [self layoutSubviewsForOrientation:[[UIApplication sharedApplication] statusBarOrientation]];
        }
    }
    
}

-(void)setMasterIsOverlayed_:(id)value withObject:(id)animated
{
    BOOL oldVal = masterIsOverlayed;
    masterIsOverlayed = [TiUtils boolValue:value def:oldVal];
    if (masterIsOverlayed == oldVal) {
        return;
    }
    BOOL animate = [TiUtils boolValue:@"animated" properties:animated def:NO];
    
    if (viewsInitialized) {
        if (animate) {
            void (^animation)() = ^{
                [self layoutSubviewsForOrientation:[[UIApplication sharedApplication] statusBarOrientation]];
            };
            [UIView animateWithDuration:0.2 animations:animation];
        } else {
            [self layoutSubviewsForOrientation:[[UIApplication sharedApplication] statusBarOrientation]];
        }
    }
}

-(void)setMasterView_:(id)args
{
    //TODO
}

-(void)setDetailView_:(id)args
{
    //TODO
}



@end
#endif