//
//  TiUIiOSPreviewViewController.m
//  Titanium
//
//  Created by Hans Knöchel on 05/10/15.
//
//

#import "TiUIiOSPreviewViewController.h"

@interface TiUIiOSPreviewViewController ()

@end

@implementation TiUIiOSPreviewViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#if IS_XCODE_7
-(NSArray<id<UIPreviewActionItem>> *)previewActionItems
{
    if([self previewActions] == nil) {
        [self setPreviewActions:[NSArray array]];
    }
    
    return [self previewActions];
}
#endif

@end
