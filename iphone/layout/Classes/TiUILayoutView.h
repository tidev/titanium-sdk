//
//  TiUILayoutView.h
//  layout
//
//  Created by Pedro Enrique on 8/24/15.
//  Copyright © 2015 Pedro Enrique. All rights reserved.
//
#if 0

#import <UIKit/UIKit.h>

struct TiDimension;

@interface TiUILayoutView : UIView

@property (nonatomic, retain) id left_;
@property (nonatomic, retain) id right_;
@property (nonatomic, retain) id top_;
@property (nonatomic, retain) id bottom_;
@property (nonatomic, retain) id center_;
@property (nonatomic, retain) id width_;
@property (nonatomic, retain) id height_;
@property (nonatomic, retain) UIView* innerView;
@property (nonatomic, retain) NSString* viewName_;

@property (nonatomic) struct TiDimension defaultWidth;
@property (nonatomic) struct TiDimension defaultHeight;

-(NSString*)viewName;
@end
#endif