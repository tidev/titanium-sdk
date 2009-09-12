//
//  PickerImageTextCell.h
//  Titanium
//
//  Created by Blain Hamon on 9/10/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface PickerImageTextCell : UIView {
	UIImageView * imageView;
	UILabel * textLabel;
}

@property(nonatomic,readwrite,retain)	UIImageView * imageView;
@property(nonatomic,readwrite,retain)	UILabel * textLabel;

@end
