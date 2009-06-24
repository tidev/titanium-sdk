//
//  ValueTableViewCell.h
//  Titanium
//
//  Created by Blain Hamon on 6/23/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>


@interface ValueTableViewCell : UITableViewCell {
	UILabel * valueLabel;
}

@property(nonatomic,readonly)	UILabel * valueLabel;
@end
