/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiTableView.h"

@interface TiTableView()
{
    UITableView* _tableView;
}
@end

@implementation TiTableView


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
    }
    return self;
}

-(NSInteger)tableView:(nonnull UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return 35;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return 5;
}

-(UITableViewCell*)tableView:(nonnull UITableView *)tableView cellForRowAtIndexPath:(nonnull NSIndexPath *)indexPath
{
    static NSString* identifier = @"ti_tableview_cell";
    UITableViewCell* cell = [tableView dequeueReusableCellWithIdentifier:identifier];
    if (cell == nil)
    {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:identifier];
        [[cell textLabel] setNumberOfLines:0];
        [[cell detailTextLabel] setNumberOfLines:0];
    }
    [[cell textLabel] setText: TI_STRING(@"Title for section %li and row %li", (long)[indexPath section], (long)[indexPath row])];
    [[cell detailTextLabel] setText: TI_STRING(@"Subtitle for section %li and row %li", (long)[indexPath section], (long)[indexPath row])];
    [cell setNeedsUpdateConstraints];
    [cell updateConstraintsIfNeeded];

    return cell;
}

@end
