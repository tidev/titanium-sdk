/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiTableView.h"

@implementation TiTableViewRow

- (instancetype)init
{
  self = [super init];
  if (self) {
    _parentView = [[TiLayoutView alloc] init];
    [_parentView setDefaultHeight:TiDimensionAutoSize];
    [_parentView setDefaultWidth:TiDimensionAutoSize];
    [_parentView setWidth:@"SIZE"];
    [_parentView setHeight:@"SIZE"];
    [[self contentView] addSubview:_parentView];
  }
  return self;
}

- (void)setLayout_:(id)args
{
  [_parentView setLayout_:args];
}

- (void)setHeight_:(id)args
{
  _tiHeight = TiDimensionFromObject(args);
}
- (void)addSubview:(UIView *)view
{
  if ([view isKindOfClass:[TiLayoutView class]]) {
    [_parentView addSubview:view];
  } else {
    [super addSubview:view];
  }
}

- (CGFloat)heightFromWidth:(CGFloat)width
{
  if (TiDimensionIsDip(_tiHeight)) {
    return TiDimensionCalculateValue(_tiHeight, 1);
  }

  if (TiDimensionIsUndefined(_tiHeight)) {
    return 44.0;
  }

  if (width != _width) {
    _width = width;
    _height = [_parentView heightIfWidthWere:width];
  }
  if (_height == 0) {
    _height = [_parentView heightIfWidthWere:width];
  }
  return _height + 8;
}

@end

@interface TiTableView () {
  UITableView *_tableView;
}
@end

@implementation TiTableView

- (void)initializeTiLayoutView
{
  [super initializeTiLayoutView];
  [self setDefaultHeight:TiDimensionAutoFill];
  [self setDefaultWidth:TiDimensionAutoFill];
}
- (void)setTableData:(NSArray *)tableData
{
  _tableData = tableData;
  [_tableView reloadData];
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _tableView = [[UITableView alloc] init];
    [_tableView setDataSource:self];
    [_tableView setDelegate:self];
    [_tableView setTranslatesAutoresizingMaskIntoConstraints:NO];
    [_tableView setRowHeight:UITableViewAutomaticDimension];
    [self addSubview:_tableView];
    [self setBackgroundColor:[UIColor redColor]];
  }
  return self;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath;
{

  TiTableViewRow *row = [[self tableData] objectAtIndex:[indexPath row]];
  CGSize currentSize = [self bounds].size;
  if (CGSizeEqualToSize(currentSize, CGSizeZero)) {
    currentSize = [[UIScreen mainScreen] bounds].size;
  }
  return [row heightFromWidth:currentSize.width];
}

- (void)didMoveToSuperview
{
  [super didMoveToSuperview];
  [_tableView reloadData];
}

- (NSInteger)tableView:(nonnull UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  NSInteger count = [[self tableData] count];
  return count;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
  return 1;
}

- (UITableViewCell *)tableView:(nonnull UITableView *)tableView cellForRowAtIndexPath:(nonnull NSIndexPath *)indexPath
{
  TiTableViewRow *row = [[self tableData] objectAtIndex:[indexPath row]];

  [[row parentView] setFrame:[[row contentView] bounds]];
  [[row parentView] performSelector:@selector(updateWidthAndHeight)];

  return row;
}

@end
