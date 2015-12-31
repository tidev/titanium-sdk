//
//  TiToolbar.h
//  layout
//
//  Created by Pedro Enrique on 8/17/15.
//  Copyright © 2015 Pedro Enrique. All rights reserved.
//

#import "TiLayoutView.h"

@interface TiToolbar : TiLayoutView
{
    
}

@property(nonatomic, readonly, retain) UIToolbar* toolbar;

-(void)setItems:(id)items;

@end
