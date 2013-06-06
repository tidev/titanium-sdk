//
//  ASIAuthenticationDialog.h
//  Part of ASIHTTPRequest -> http://allseeing-i.com/ASIHTTPRequest
//
//  Created by Ben Copsey on 21/08/2009.
//  Copyright 2009 All-Seeing Interactive. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
@class ASIHTTPRequest;

typedef enum TI__ASIAuthenticationType {
	TI_ASIStandardAuthenticationType = 0,
    TI_ASIProxyAuthenticationType = 1
} TI_ASIAuthenticationType;

@interface ASIAutorotatingViewController : UIViewController
@end

@interface ASIAuthenticationDialog : ASIAutorotatingViewController <UIActionSheetDelegate, UITableViewDelegate, UITableViewDataSource> {
	TI_ASIHTTPRequest *request;
	TI_ASIAuthenticationType type;
	UITableView *tableView;
	UIViewController *presentingController;
	BOOL didEnableRotationNotifications;
}
+ (void)presentAuthenticationDialogForRequest:(TI_ASIHTTPRequest *)request;
+ (void)dismiss;

@property (retain) TI_ASIHTTPRequest *request;
@property (assign) TI_ASIAuthenticationType type;
@property (assign) BOOL didEnableRotationNotifications;
@property (retain, nonatomic) UIViewController *presentingController;
@end
