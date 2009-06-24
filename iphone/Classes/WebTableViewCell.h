//
//  WebTableViewCell.h
//  Titanium
//
//  Created by Blain Hamon on 6/20/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>


@interface WebTableViewCell : UITableViewCell<UIWebViewDelegate> {
	UIWebView * htmlLabel;
}

@property(nonatomic,retain,readonly) UIWebView * htmlLabel;

@end
