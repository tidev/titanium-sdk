//
//  TiScrollView.m
//  Titanium
//
//  Created by default on 12/23/11.
//  Copyright (c) 2011 __MyCompanyName__. All rights reserved.
//

#import "TiScrollView.h"

@implementation TiScrollView

- (id)initWithFrame:(CGRect)frame 
{
	return [super initWithFrame:frame];
}
- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event{
    [self.nextResponder touchesBegan:touches withEvent:event];
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event{
    if(!self.dragging){
        [self.nextResponder touchesMoved:touches withEvent:event];
    }
	[super touchesMoved:touches withEvent:event];
}

- (void) touchesEnded: (NSSet *) touches withEvent: (UIEvent *) event 
{	
	// If not dragging, send event to next responder
	if (!self.dragging) 
		[self.nextResponder touchesEnded: touches withEvent:event]; 
	else
		[super touchesEnded: touches withEvent: event];
}

@end
