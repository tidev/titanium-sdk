//
//  ComplexTableViewCell.h
//  Titanium
//
//  Created by Blain Hamon on 11/4/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>

@class TitaniumCellWrapper;
@interface ComplexTableViewCell : UITableViewCell {
	TitaniumCellWrapper * dataWrapper;
}

@property(nonatomic,readwrite,retain) TitaniumCellWrapper * dataWrapper;

@end
