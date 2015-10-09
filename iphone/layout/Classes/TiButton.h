//
//  TiButton.h
//  layout
//
//  Created by Pedro Enrique on 9/28/15.
//  Copyright © 2015 Pedro Enrique. All rights reserved.
//

#import "TiLayoutView.h"

@interface TiButton : TiLayoutView
@property (nonatomic) UIButton* button;
@property(nonatomic, copy) void (^onClick)(TiButton* sender);

@end
