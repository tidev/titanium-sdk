/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#define TI_USE_AUTOLAYOUT
#define TI_UNIT_TESTS

#import "TiLabel.h"
#import "TiScrollableView.h"
#import "TiSwitch.h"
#import "TiToolbar.h"
#import "TiUtils.h"
#import "TiView.h"
#import "ViewController.h"
#import <XCTest/XCTest.h>
#define WAIT_FOR(DONE)                                                                                              \
  while (!DONE) {                                                                                                   \
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]]; \
  }

static TiView *createWindow(TiView *parent)
{
  TiView *window = [[TiView alloc] init];
  [window setWidth_:@320];
  [window setHeight_:@480];
  [window setBackgroundColor:[UIColor whiteColor]];
  [window setViewName:@"window"];
  [parent addSubview:window];
  return window;
}

@interface layoutTests : XCTestCase {
  TiView *myView;
}
@end

@implementation layoutTests

- (void)setUp
{
  [super setUp];
  ViewController *controller = (ViewController *)[[[UIApplication sharedApplication] keyWindow] rootViewController];
  myView = [[TiView alloc] init];
  [[controller view] addSubview:myView];
  [myView setLayout:@"absolute"];
}

- (void)tearDown
{
  // Put teardown code here. This method is called after the invocation of each test method in the class.
  [super tearDown];
}

- (void)test_AbsoluteLayout_SimpleWidthAndHeight
{
  __block BOOL done = NO;
  TiView *view = [[TiView alloc] init];

  [view setBackgroundColor:[UIColor redColor]];
  [view setViewName:@"test view"];

  [view setWidth_:@"100"];
  [view setHeight_:@"100"];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqual(rect.size.width, 100);
    XCTAssertEqual(rect.size.height, 100);
    done = YES;
    NSLog(@"Done %s", __PRETTY_FUNCTION__);
  }];
  [myView addSubview:view];

  WAIT_FOR(done)
}

- (void)test_AbsoluteLayout_LeftPropery
{
  __block BOOL done = NO;
  TiView *view = [[TiView alloc] init];
  [view setBackgroundColor:[UIColor redColor]];
  [view setViewName:@"test view"];

  [view setLeft_:@"20"];
  [view setWidth_:@"100"];
  [view setHeight_:@"100"];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqual(rect.origin.x, 20);
    done = YES;
    NSLog(@"Done %s", __PRETTY_FUNCTION__);
  }];
  [myView addSubview:view];

  WAIT_FOR(done)
}

- (void)test_AbsoluteLayout_RightPropery
{
  __block BOOL done = NO;
  TiView *view = [[TiView alloc] init];
  [view setBackgroundColor:[UIColor redColor]];
  [view setViewName:@"test view"];
  [view setRight_:@"20"];
  [view setWidth_:@"100"];
  [view setHeight_:@"100"];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqual(rect.origin.x + rect.size.width, myView.frame.size.width - 20);
    done = YES;
    NSLog(@"Done %s", __PRETTY_FUNCTION__);
  }];
  [myView addSubview:view];

  WAIT_FOR(done)
}

- (void)test_AbsoluteLayout_TopPropery
{
  __block BOOL done = NO;
  TiView *view = [[TiView alloc] init];
  [view setBackgroundColor:[UIColor redColor]];
  [view setViewName:@"test view"];
  [view setTop_:@"20"];
  [view setWidth_:@"100"];
  [view setHeight_:@"100"];
  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqual(rect.origin.y, 20);
    done = YES;
    NSLog(@"Done %s", __PRETTY_FUNCTION__);
  }];
  [myView addSubview:view];

  WAIT_FOR(done)
}

- (void)test_AbsoluteLayout_BottomPropery
{
  __block BOOL done = NO;
  TiView *view = [[TiView alloc] init];
  [view setBackgroundColor:[UIColor redColor]];
  [view setViewName:@"test view"];
  [view setBottom_:@"20"];
  [view setWidth_:@"100"];
  [view setHeight_:@"100"];
  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqual(rect.origin.y + rect.size.height, myView.frame.size.height - 20);
    done = YES;
    NSLog(@"Done %s", __PRETTY_FUNCTION__);
  }];
  [myView addSubview:view];

  WAIT_FOR(done)
}

- (void)test_AbsoluteLayout_LeftRightAndFixedWidth
{
  __block BOOL done = NO;

  TiView *window = createWindow(myView);

  TiView *view = [[TiView alloc] init];
  [view setViewName:@"test_view"];
  [view setBackgroundColor:[UIColor redColor]];

  [view setWidth_:@50];
  [view setLeft_:@10];
  [view setRight_:@10];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    // right should be ignored if width is fixed
    XCTAssertEqual(rect.origin.x, 10.0);
    XCTAssertEqual(rect.size.width, 50.0);
    done = YES;
  }];

  [window addSubview:view];
  WAIT_FOR(done);
}

- (void)test_AbsoluteLayout_LeftRightAndFillWidth
{
  __block BOOL done = NO;

  TiView *window = createWindow(myView);

  TiView *view = [[TiView alloc] init];
  [view setViewName:@"test_view"];
  [view setBackgroundColor:[UIColor redColor]];

  [view setWidth_:@"FILL"];
  [view setLeft_:@10];
  [view setRight_:@10];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    // right should _NOT_ be ignored if width is fill
    XCTAssertEqual(rect.origin.x, 10.0);
    XCTAssertEqual(rect.size.width, 300.0);
    done = YES;
  }];

  [window addSubview:view];
  WAIT_FOR(done);
}

- (void)test_AbsoluteLayout_TopBottomAndFixedHeight
{
  __block BOOL done = NO;

  TiView *window = createWindow(myView);

  TiView *view = [[TiView alloc] init];
  [view setViewName:@"test_view"];
  [view setBackgroundColor:[UIColor redColor]];

  [view setHeight_:@50];
  [view setTop_:@10];
  [view setBottom_:@10];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    // right should be ignored if width is fixed
    XCTAssertEqual(rect.origin.y, 10.0);
    XCTAssertEqual(rect.size.height, 50.0);
    done = YES;
  }];

  [window addSubview:view];
  WAIT_FOR(done);
}

- (void)test_AbsoluteLayout_TopBottomAndFillHeight
{
  __block BOOL done = NO;

  TiView *window = createWindow(myView);

  TiView *view = [[TiView alloc] init];
  [view setViewName:@"test_view"];
  [view setBackgroundColor:[UIColor redColor]];

  [view setHeight_:@"FILL"];
  [view setTop_:@10];
  [view setBottom_:@10];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    // right should _NOT_ be ignored if width is fill
    XCTAssertEqual(rect.origin.y, 10.0);
    XCTAssertEqual(rect.size.height, 460.0);
    done = YES;
  }];

  [window addSubview:view];
  WAIT_FOR(done);
}

- (void)test_AbsoluteLayout_TopBottomLeftRightAndFixedHeightFixedWidth
{
  __block BOOL done = NO;

  TiView *window = createWindow(myView);

  TiView *view = [[TiView alloc] init];
  [view setViewName:@"test_view"];
  [view setBackgroundColor:[UIColor redColor]];

  [view setHeight_:@50];
  [view setWidth_:@50];

  [view setTop_:@10];
  [view setBottom_:@10];
  [view setLeft_:@10];
  [view setRight_:@10];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    // right should be ignored if width is fixed
    XCTAssertEqual(rect.origin.x, 10.0);
    XCTAssertEqual(rect.size.width, 50.0);

    // bottom should be ignored if width is fixed
    XCTAssertEqual(rect.origin.y, 10.0);
    XCTAssertEqual(rect.size.height, 50.0);
    done = YES;
  }];

  [window addSubview:view];
  WAIT_FOR(done);
}

- (void)test_AbsoluteLayout_PercentageSize
{
  __block BOOL done = NO;
  TiView *view = [[TiView alloc] init];
  [view setBackgroundColor:[UIColor brownColor]];
  [view setWidth_:@"50%"];
  [view setHeight_:@"50%"];
  [view setViewName:@"test view"];
  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.size.height, myView.frame.size.height / 2, 2);
    XCTAssertEqualWithAccuracy(rect.size.width, myView.frame.size.width / 2, 2);
    done = YES;
    NSLog(@"Done %s", __PRETTY_FUNCTION__);
  }];
  [myView addSubview:view];
  WAIT_FOR(done)
}

- (void)test_AbsoluteLayout_PercentageMarginLeftTop
{
  __block BOOL done = NO;
  TiView *superview = [[TiView alloc] init];
  [superview setViewName:@"superview"];
  [superview setWidth_:@"550"];
  [superview setHeight_:@"550"];

  TiView *view = [[TiView alloc] init];
  [view setBackgroundColor:[UIColor brownColor]];
  [view setWidth_:@"50"];
  [view setHeight_:@"50"];
  [view setLeft_:@"10%"];
  [view setTop_:@"10%"];
  [view setViewName:@"test view"];
  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    TiView *superview = (TiView *)[sender superview];

    CGFloat top = superview.frame.size.height * 0.10;
    CGFloat left = superview.frame.size.width * 0.10;

    XCTAssertEqualWithAccuracy(rect.origin.x, left, 2);
    XCTAssertEqualWithAccuracy(rect.origin.y, top, 2);
    done = YES;
    NSLog(@"Done %s", __PRETTY_FUNCTION__);
  }];
  [superview addSubview:view];
  [myView addSubview:superview];
  WAIT_FOR(done)
}

- (void)test_AbsoluteLayout_PercentageMarginRightBottom
{
  __block BOOL done = NO;

  TiView *superview = [[TiView alloc] init];
  [superview setWidth_:@"500"];
  [superview setHeight_:@"500"];

  TiView *view = [[TiView alloc] init];
  [view setBackgroundColor:[UIColor brownColor]];
  [view setWidth_:@"50"];
  [view setHeight_:@"50"];
  [view setRight_:@"20%"];
  [view setBottom_:@"20%"];
  [view setViewName:@"test view"];
  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    TiView *superview = (TiView *)[sender superview];

    CGFloat top = superview.frame.size.height - (superview.frame.size.height * 0.20) - rect.size.height;
    CGFloat left = superview.frame.size.width - (superview.frame.size.width * 0.20) - rect.size.width;

    XCTAssertEqualWithAccuracy(rect.origin.x, left, 2);
    XCTAssertEqualWithAccuracy(rect.origin.y, top, 2);

    done = YES;
    NSLog(@"Done %s", __PRETTY_FUNCTION__);
  }];
  [superview addSubview:view];
  [myView addSubview:superview];
  WAIT_FOR(done)
}

- (void)test_AbsoluteLayout_AllPercentageMargins
{
  __block BOOL done = NO;

  TiView *superview = [[TiView alloc] init];
  [superview setWidth_:@"500"];
  [superview setHeight_:@"500"];

  TiView *view = [[TiView alloc] init];
  [view setBackgroundColor:[UIColor brownColor]];
  [view setLeft_:@"10%"];
  [view setRight_:@"20%"];
  [view setTop_:@"30%"];
  [view setBottom_:@"40%"];
  [view setViewName:@"test view"];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    // Workaround!
    //         if (rect.origin.x < 0 || rect.origin.y < 0) return;

    TiView *superview = (TiView *)[sender superview];

    CGFloat top = superview.frame.size.height * 0.30;
    CGFloat left = superview.frame.size.width * 0.10;
    CGFloat width = superview.frame.size.width - (superview.frame.size.width * 0.10) - (superview.frame.size.width * 0.20);
    CGFloat height = superview.frame.size.height - (superview.frame.size.height * 0.30) - (superview.frame.size.height * 0.40);

    XCTAssertEqualWithAccuracy(rect.origin.x, left, 2);
    XCTAssertEqualWithAccuracy(rect.origin.y, top, 2);
    XCTAssertEqualWithAccuracy(rect.size.width, width, 2);
    XCTAssertEqualWithAccuracy(rect.size.height, height, 2);

    done = YES;
    NSLog(@"Done %s", __PRETTY_FUNCTION__);
  }];
  [superview addSubview:view];
  [myView addSubview:superview];
  WAIT_FOR(done)
}

- (void)test_AbsoluteLayout_Margins
{
  __block BOOL done = NO;

  TiView *view = [[TiView alloc] init];
  [view setBackgroundColor:[UIColor brownColor]];
  [view setLeft_:@"10"];
  [view setRight_:@"20"];
  [view setTop_:@"30"];
  [view setBottom_:@"40"];
  [view setViewName:@"test view"];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    TiView *superview = (TiView *)[sender superview];

    CGFloat top = 30;
    CGFloat left = 10;
    CGFloat width = superview.frame.size.width - 10 - 20;
    CGFloat height = superview.frame.size.height - 30 - 40;

    XCTAssertEqualWithAccuracy(rect.origin.x, left, 2);
    XCTAssertEqualWithAccuracy(rect.origin.y, top, 2);
    XCTAssertEqualWithAccuracy(rect.size.width, width, 2);
    XCTAssertEqualWithAccuracy(rect.size.height, height, 2);

    done = YES;
    NSLog(@"Done %s", __PRETTY_FUNCTION__);
  }];
  [myView addSubview:view];
  WAIT_FOR(done)
}

- (void)test_VerticalLayoutOneComponent
{
  __block BOOL done = NO;
  TiView *view = [[TiView alloc] init];
  [view setBackgroundColor:[UIColor darkGrayColor]];
  [view setViewName:@"view"];

  TiView *window = createWindow(myView);
  [window setLayout_:@"vertical"];
  [window addSubview:view];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqual(rect.origin.x, 0);
    XCTAssertEqual(rect.origin.y, 0);
    XCTAssertEqual(rect.size.width, 320);
    XCTAssertEqual(rect.size.height, 480);
    done = YES;
  }];

  WAIT_FOR(done);
}
- (void)test_VerticalLayoutFillSizeLast
{
  __block BOOL done1 = NO;
  __block BOOL done2 = NO;

  TiLabel *label = [[TiLabel alloc] init];
  [label setLeft_:@10];
  [label setRight_:@10];
  [label setTop_:@10];
  [label setText:@"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas tristique lectus nec ex venenatis, eu molestie augue posuere"];
  [label setBackgroundColor:[UIColor redColor]];
  [label setViewName:@"label"];

  TiView *otherView = [[TiView alloc] init];
  [otherView setBackgroundColor:[UIColor darkGrayColor]];
  [otherView setViewName:@"otherView"];

  [label setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.origin.x, 10, 2);
    XCTAssertEqualWithAccuracy(rect.origin.y, 10, 2);
    XCTAssertEqualWithAccuracy(rect.size.width, 300, 2);
    XCTAssertEqualWithAccuracy(rect.size.height, 81, 2);
    done1 = YES;
  }];
  [otherView setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.origin.x, 0, 2);
    XCTAssertEqualWithAccuracy(rect.origin.y, 91, 2);
    XCTAssertEqualWithAccuracy(rect.size.width, 320, 2);
    XCTAssertEqualWithAccuracy(rect.size.height, 388, 2);
    done2 = YES;
  }];

  TiView *window = createWindow(myView);
  [window setLayout_:@"vertical"];
  [window addSubview:label];
  [window addSubview:otherView];

  WAIT_FOR((done1 && done2));
}

/**
 * window = view {320,480}, vertical
 * +---------+
 * |         |
 * |   red   |  redView {FILL, 100}
 * |---------|
 * |   +-+   | sized {FILL,SIZE}
 * |   +-+   |   +->small {10,10}{40,40}
 * |---------|
 * |         |
 * |  blue   |  blueView {FILL, 200}
 * |         |
 * +---------+
 */
- (void)test_VerticalLayoutMultipleSizes
{
  __block BOOL doneWindow = NO;
  __block BOOL doneRed = NO;
  __block BOOL doneSized = NO;
  __block BOOL doneSmall = NO;
  __block BOOL doneBlue = NO;

  TiView *window = [[TiView alloc] init];
  [window setViewName:@"window"];
  [window setWidth_:@320];
  [window setHeight_:@480];
  [window setLayout_:@"vertical"];
  [window setBackgroundColor:[UIColor lightGrayColor]];

  TiView *redView = [[TiView alloc] init];
  [redView setViewName:@"red"];
  [redView setBackgroundColor:[UIColor redColor]];
  [redView setHeight_:@100];

  TiView *sized = [[TiView alloc] init];
  [sized setViewName:@"size"];
  [sized setHeight_:@"SIZE"];
  [sized setTop_:@10];
  [sized setBackgroundColor:[UIColor lightGrayColor]];
  {
    TiView *small = [[TiView alloc] init];
    [small setViewName:@"size"];
    [small setHeight_:@20];
    [small setWidth_:@20];
    [small setTop_:@10];
    [small setBottom_:@10];
    [small setBackgroundColor:[UIColor purpleColor]];
    [sized addSubview:small];

    [small setOnLayout:^(TiLayoutView *sender, CGRect rect) {
      XCTAssertEqualWithAccuracy(rect.origin.y, 10, 0);
      XCTAssertEqualWithAccuracy(rect.size.height, 20, 0);
      XCTAssertEqualWithAccuracy(rect.size.width, 20, 0);
      doneSmall = YES;
    }];
  }
  TiView *blueView = [[TiView alloc] init];
  [blueView setTop_:@10];
  [blueView setViewName:@"blue"];
  [blueView setBackgroundColor:[UIColor blueColor]];
  [blueView setHeight_:@200];

  [window addSubview:redView];
  [window addSubview:sized];
  [window addSubview:blueView];

  [window setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.size.width, 320, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, 480, 0);
    doneWindow = YES;
  }];
  [redView setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.origin.y, 0, 0);
    XCTAssertEqualWithAccuracy(rect.origin.x, 0, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, 100, 0);
    XCTAssertEqualWithAccuracy(rect.size.width, 320, 0);
    doneRed = YES;
  }];
  [sized setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.origin.y, 110, 0);
    XCTAssertEqualWithAccuracy(rect.origin.x, 0, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, 10 + 20 + 10, 0);
    XCTAssertEqualWithAccuracy(rect.size.width, 320, 0);
    doneSized = YES;
  }];
  [blueView setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.origin.y, 160, 0);
    XCTAssertEqualWithAccuracy(rect.origin.x, 0, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, 200, 0);
    XCTAssertEqualWithAccuracy(rect.size.width, 320, 0);
    doneBlue = YES;
  }];

  [myView addSubview:window];
  WAIT_FOR((doneWindow && doneRed && doneSized && doneSmall && doneBlue));
}

- (void)test_VerticalLayoutMultipleSizesAndMarginsLabels
{
  __block BOOL doneWindow = NO;
  __block BOOL doneLabel1 = NO;
  __block BOOL doneLabel2 = NO;
  __block BOOL doneLabel3 = NO;

  TiView *window = [[TiView alloc] init];
  [window setViewName:@"window"];
  [window setWidth_:@320];
  [window setHeight_:@480];
  [window setLayout_:@"vertical"];
  [window setBackgroundColor:[UIColor lightGrayColor]];

  TiLabel *label1 = [[TiLabel alloc] init];
  label1.viewName = @"red";
  [label1 setHeight_:@100];
  [label1 setWidth_:@"FILL"];
  [label1 setText:@"label 1"];
  [label1 setBackgroundColor:[UIColor redColor]];
  [window addSubview:label1];

  TiLabel *label2 = [[TiLabel alloc] init];
  label2.viewName = @"yellow";
  [label2 setHeight_:@"SIZE"];
  [label2 setWidth_:@"FILL"];
  [label2 setText:@"label 2"];
  [label2 setTop_:@10];
  [label2 setBottom_:@10];
  [label2 setBackgroundColor:[UIColor yellowColor]];
  [window addSubview:label2];

  TiLabel *label3 = [[TiLabel alloc] init];
  label3.viewName = @"green";
  [label3 setText:@"label 3"];
  [label3 setBottom_:@"0"];
  [label3 setBackgroundColor:[UIColor greenColor]];
  [window addSubview:label3];
  [myView addSubview:window];

  [window setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.size.width, 320, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, 480, 0);
    doneWindow = YES;
  }];

  [label1 setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.origin.x, 0, 0);
    XCTAssertEqualWithAccuracy(rect.origin.y, 0, 0);
    XCTAssertEqualWithAccuracy(rect.size.width, 320, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, 100, 0);
    doneLabel1 = YES;
  }];

  [label2 setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.origin.x, 0, 0);
    XCTAssertEqualWithAccuracy(rect.origin.y, 100 + 10, 0);
    XCTAssertEqualWithAccuracy(rect.size.width, 320, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, 20, 2);
    doneLabel2 = YES;
  }];

  [label3 setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.origin.x, 135, 2);
    XCTAssertEqualWithAccuracy(rect.origin.y, 140, 2);
    XCTAssertEqualWithAccuracy(rect.size.width, 50, 2);
    XCTAssertEqualWithAccuracy(rect.size.height, 20, 2);
    doneLabel3 = YES;
  }];

  WAIT_FOR((doneWindow && doneLabel1 && doneLabel2 && doneLabel3));
}

- (void)test_scrollableViewHeightSIZE
{
  __block BOOL done = NO;
  TiScrollableView *scrollable = [[TiScrollableView alloc] init];
  [scrollable setViewName:@"scrollable"];
  [scrollable setBackgroundColor:[UIColor grayColor]];
  [scrollable setHeight_:@"SIZE"];

  NSNumber *bigger = @300;
  for (int i = 0; i < 5; i++) {
    TiView *view = [[TiView alloc] init];
    [view setBackgroundColor:[UIColor blueColor]];
    if (i == 2) {
      [view setHeight_:bigger];
    } else {
      [view setHeight_:@200];
    }
    [view setWidth_:@200];
    [scrollable addSubview:view];
  }

  [myView addSubview:scrollable];

  [scrollable setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.size.width, myView.frame.size.width, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, [bigger floatValue], 0);

    done = YES;
  }];
  WAIT_FOR(done);
}

- (void)test_scrollableViewHeightSIZEwithTopAndBottom
{
  __block BOOL done = NO;
  TiScrollableView *scrollable = [[TiScrollableView alloc] init];
  [scrollable setViewName:@"scrollable"];
  [scrollable setBackgroundColor:[UIColor grayColor]];
  [scrollable setHeight_:@"SIZE"];

  NSNumber *bigger = @300;
  NSNumber *top = @10;
  NSNumber *bottom = @5;
  for (int i = 0; i < 5; i++) {
    TiView *view = [[TiView alloc] init];
    [view setBackgroundColor:[UIColor blueColor]];
    if (i == 2) {
      [view setHeight_:bigger];
      [view setTop_:top];
      [view setBottom_:bottom];
    } else {
      [view setHeight_:@200];
    }
    [view setWidth_:@200];
    [scrollable addSubview:view];
  }

  [myView addSubview:scrollable];

  [scrollable setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.size.width, myView.frame.size.width, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, ([bigger floatValue] + [top floatValue] + [bottom floatValue]), 0);

    done = YES;
  }];
  WAIT_FOR(done);
}

- (void)test_ToolbarItems
{
  TiToolbar *toolbar = [[TiToolbar alloc] init];

  __block BOOL done1 = NO;
  __block BOOL done2 = NO;
  __block BOOL done3 = NO;

  [myView addSubview:toolbar];

  TiSwitch *toggle1 = [[TiSwitch alloc] init];
  TiSwitch *toggle2 = [[TiSwitch alloc] init];
  TiSwitch *toggle3 = [[TiSwitch alloc] init];

  toggle1.viewName = @"switch_1";
  toggle2.viewName = @"switch_2";
  toggle3.viewName = @"switch_3";

  toggle1.backgroundColor = [UIColor redColor];
  toggle2.backgroundColor = [UIColor yellowColor];
  toggle3.backgroundColor = [UIColor greenColor];

  [toggle1 setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.size.width, 49, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, 31, 0);
    XCTAssertEqualWithAccuracy(rect.origin.x, 20, 1);
    XCTAssertEqualWithAccuracy(rect.origin.y, 6.5, 1);

    done1 = YES;
  }];
  [toggle2 setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.size.width, 49, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, 31, 0);
    XCTAssertEqualWithAccuracy(rect.origin.x, 79, 1);
    XCTAssertEqualWithAccuracy(rect.origin.y, 6.5, 1);

    done2 = YES;
  }];
  [toggle3 setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    XCTAssertEqualWithAccuracy(rect.size.width, 49, 0);
    XCTAssertEqualWithAccuracy(rect.size.height, 31, 0);
    XCTAssertEqualWithAccuracy(rect.origin.x, 138, 1);
    XCTAssertEqualWithAccuracy(rect.origin.y, 6.5, 1);

    done3 = YES;
  }];

  [toolbar setItems:@[ toggle1, toggle2, toggle3 ]];

  WAIT_FOR((done1 && done2 && done3));
}

- (void)test_CalculateHeight_AbsoluteLayout_BeforeAddingToSuperview
{
  __block BOOL done = NO;
  // Parent
  TiLayoutView *parentView = [[TiLayoutView alloc] init];
  [parentView setWidth:@300];
  [parentView setHeight:@500];
  [parentView setBackgroundColor:[UIColor lightGrayColor]];

  // Test begins
  TiLayoutView *view = [[TiLayoutView alloc] init];
  [view setWidth:@"SIZE"];
  [view setHeight:@"SIZE"];
  [view setBackgroundColor:[UIColor redColor]];

  TiLabel *label = [[TiLabel alloc] init];
  [label setText:@"Bacon ipsum dolor amet jowl boudin prosciutto capicola, tail ribeye flank. Pork belly chicken meatloaf picanha chuck frankfurter pig filet mignon jowl ham"];

  [view addSubview:label];
  CGFloat calculatedHeight = [view heightIfWidthWere:300];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    CGFloat realHeight = rect.size.height;

    XCTAssertEqual(realHeight, calculatedHeight);
    XCTAssertEqual(realHeight, 101.500000);
    done = YES;
  }];

  [parentView addSubview:view];
  [myView addSubview:parentView];
  WAIT_FOR(done);
}

- (void)test_CalculateHeight_AbsoluteLayout_AfterAddingToSuperview
{
  __block BOOL done = NO;
  // Parent
  TiLayoutView *parentView = [[TiLayoutView alloc] init];
  [parentView setWidth:@300];
  [parentView setHeight:@500];
  [parentView setBackgroundColor:[UIColor lightGrayColor]];

  // Test begins
  TiLayoutView *view = [[TiLayoutView alloc] init];
  [view setWidth:@"SIZE"];
  [view setHeight:@"SIZE"];
  [view setBackgroundColor:[UIColor redColor]];

  TiLabel *label = [[TiLabel alloc] init];
  [label setText:@"Bacon ipsum dolor amet jowl boudin prosciutto capicola, tail ribeye flank. Pork belly chicken meatloaf picanha chuck frankfurter pig filet mignon jowl ham"];

  [view addSubview:label];

  [parentView addSubview:view];
  [myView addSubview:parentView];

  CGFloat calculatedHeight = [view heightIfWidthWere:300];

  [view setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    CGFloat realHeight = rect.size.height;
    XCTAssertEqual(realHeight, calculatedHeight);
    XCTAssertEqual(realHeight, 101.500000);
    done = YES;
  }];

  WAIT_FOR(done);
}

- (void)test_CalculateHeight_VerticalLayout
{
  __block BOOL done = NO;
  TiLayoutView *parentView = [[TiLayoutView alloc] init];
  [parentView setWidth:@300];
  [parentView setHeight:@"SIZE"];
  [parentView setLayout_:@"vertical"];
  [parentView setBackgroundColor:[UIColor lightGrayColor]];

  TiLayoutView *view = [[TiLayoutView alloc] init];
  [view setWidth:@"100"];
  [view setHeight:@"100"];
  [view setViewName:@"this_view"];
  [view setBackgroundColor:[UIColor redColor]];

  TiLabel *label = [[TiLabel alloc] init];
  [label setText:@"Bacon ipsum dolor amet jowl boudin prosciutto capicola, tail ribeye flank. Pork belly chicken meatloaf picanha chuck frankfurter pig filet mignon jowl ham"];

  [parentView addSubview:view];
  [parentView addSubview:label];

  CGFloat calculatedHeight = [parentView heightIfWidthWere:300];

  [parentView setOnLayout:^(TiLayoutView *sender, CGRect rect) {
    CGFloat realHeight = rect.size.height;
    XCTAssertEqual(realHeight, calculatedHeight);
    XCTAssertEqual(realHeight, 201.500000);
    done = YES;
  }];

  [myView addSubview:parentView];

  WAIT_FOR(done);
}
@end
