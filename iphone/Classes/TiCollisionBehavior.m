/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR
#ifdef USE_TI_UIIOSCOLLISIONBEHAVIOR
#import "TiCollisionBehavior.h"

@interface CollisionBoundary : NSObject {
  NSString *identifier;
  CGPoint p1;
  CGPoint p2;
}
@property (nonatomic, readonly) NSString *identifier;
@property (nonatomic, readonly) CGPoint p1;
@property (nonatomic, readonly) CGPoint p2;
- (id)initWithIdentifier:(NSString *)arg1 point1:(CGPoint)arg2 point2:(CGPoint)arg3;
@end

@implementation CollisionBoundary
@synthesize identifier, p1, p2;
- (id)initWithIdentifier:(NSString *)arg1 point1:(CGPoint)arg2 point2:(CGPoint)arg3
{
  if (self = [super init]) {
    identifier = [arg1 copy];
    p1 = arg2;
    p2 = arg3;
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(identifier);
  [super dealloc];
}
@end

@implementation TiCollisionBehavior
- (void)_initWithProperties:(NSDictionary *)properties
{
  _items = [[NSMutableArray alloc] init];
  _identifiers = [[NSMutableArray alloc] init];
  _boundaries = [[NSMutableArray alloc] init];
  _mode = UICollisionBehaviorModeEverything;
  _treatReferenceAsBoundary = YES;
  _insets = UIEdgeInsetsZero;
  [super _initWithProperties:properties];
}

- (void)dealloc
{
  RELEASE_TO_NIL(_items);
  RELEASE_TO_NIL(_identifiers);
  RELEASE_TO_NIL(_boundaries);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.iOS.CollisionBehavior";
}

#pragma mark - TiBehaviorProtocol
- (UIDynamicBehavior *)behaviorObject
{
  if (_needsRefresh) {
    RELEASE_TO_NIL(_collisionBehavior);
  }
  if (_collisionBehavior == nil) {
    NSMutableArray *viewItems = [[NSMutableArray alloc] initWithCapacity:_items.count];
    for (TiViewProxy *theArg in _items) {
      [viewItems addObject:[theArg view]];
    }
    _collisionBehavior = [[UICollisionBehavior alloc] initWithItems:viewItems];
    _collisionBehavior.collisionDelegate = self;
    _collisionBehavior.collisionMode = _mode;
    if ([_boundaries count] > 0) {
      for (CollisionBoundary *theArg in _boundaries) {
        [_collisionBehavior addBoundaryWithIdentifier:theArg.identifier fromPoint:theArg.p1 toPoint:theArg.p2];
      }
    }
    if (_treatReferenceAsBoundary) {
      [_collisionBehavior setTranslatesReferenceBoundsIntoBoundaryWithInsets:_insets];
    } else {
      [_collisionBehavior setTranslatesReferenceBoundsIntoBoundary:NO];
    }
    [viewItems release];
    void (^update)(void) = ^{
      [self updateItems];
    };
    [_collisionBehavior setAction:update];
  }
  _needsRefresh = NO;
  return _collisionBehavior;
}

- (void)updateItems
{
  //Nothing to do here
}

- (void)updatePositioning
{
  for (TiViewProxy *theItem in _items) {
    CGPoint center = [[theItem view] center];
#ifndef TI_USE_AUTOLAYOUT
    LayoutConstraint *constraint = [theItem layoutProperties];
    constraint->centerX = TiDimensionDip(center.x);
    constraint->centerY = TiDimensionDip(center.y);
#endif
  }
}

#pragma mark - Public API
- (void)addItem:(id)args
{
  ENSURE_SINGLE_ARG(args, TiViewProxy);
  if (![_items containsObject:args]) {
    [self rememberProxy:args];
    [_items addObject:args];
    if (_collisionBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_collisionBehavior addItem:[(TiViewProxy *)args view]];
          },
          YES);
    }
  }
}

- (void)removeItem:(id)args
{
  ENSURE_SINGLE_ARG(args, TiViewProxy);
  if ([_items containsObject:args]) {
    if (_collisionBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_collisionBehavior removeItem:[(TiViewProxy *)args view]];
          },
          YES);
    }
    [_items removeObject:args];
    [self forgetProxy:args];
  }
}

- (NSArray *)items
{
  return [NSArray arrayWithArray:_items];
}

- (NSArray *)boundaryIdentifiers
{
  return [NSArray arrayWithArray:_identifiers];
}

- (void)addBoundary:(id)args
{
  ENSURE_SINGLE_ARG(args, NSDictionary);
  NSString *identifier = [TiUtils stringValue:@"identifier" properties:args];
  if (identifier != nil) {
    if (![_identifiers containsObject:identifier]) {
      BOOL exists = NO;
      CGPoint p1 = [TiUtils pointValue:@"point1" properties:args def:CGPointZero exists:&exists];
      if (exists) {
        CGPoint p2 = [TiUtils pointValue:@"point2" properties:args def:CGPointZero exists:&exists];
        if (exists) {
          CollisionBoundary *boundary = [[CollisionBoundary alloc] initWithIdentifier:identifier point1:p1 point2:p2];
          [_boundaries addObject:boundary];
          [_identifiers addObject:identifier];
          if (_collisionBehavior != nil) {
            TiThreadPerformOnMainThread(
                ^{
                  [_collisionBehavior addBoundaryWithIdentifier:identifier fromPoint:p1 toPoint:p2];
                },
                YES);
          }
          [boundary release];
        } else {
          DebugLog(@"[ERROR] Missing required parameter point2");
        }
      } else {
        DebugLog(@"[ERROR] Missing required parameter point1");
      }
    } else {
      DebugLog(@"[ERROR] A Boundary with the given identifier already exists. %@", identifier);
    }
  } else {
    DebugLog(@"[ERROR] Missing required parameter identifier");
  }
}

- (void)removeBoundary:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);
  if ([_identifiers containsObject:args]) {
    NSUInteger index = [_identifiers indexOfObject:args];
    [_boundaries removeObjectAtIndex:index];
    [_identifiers removeObjectAtIndex:index];
    if (_collisionBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_collisionBehavior removeBoundaryWithIdentifier:args];
          },
          YES);
    }
  }
}

- (void)removeAllBoundaries:(id)unused
{
  [_identifiers removeAllObjects];
  [_boundaries removeAllObjects];
  if (_collisionBehavior != nil) {
    TiThreadPerformOnMainThread(
        ^{
          [_collisionBehavior removeAllBoundaries];
        },
        YES);
  }
}

- (void)setTreatReferenceAsBoundary:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  BOOL newVal = [TiUtils boolValue:args def:_treatReferenceAsBoundary];
  if (newVal != _treatReferenceAsBoundary) {
    _treatReferenceAsBoundary = newVal;
    if (_collisionBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            if (_treatReferenceAsBoundary) {
              [_collisionBehavior setTranslatesReferenceBoundsIntoBoundaryWithInsets:_insets];
            } else {
              [_collisionBehavior setTranslatesReferenceBoundsIntoBoundary:NO];
            }
          },
          YES);
    }
  }
}

- (NSNumber *)treatReferenceAsBoundary
{
  return NUMBOOL(_treatReferenceAsBoundary);
}

- (void)setReferenceInsets:(id)args
{
  ENSURE_SINGLE_ARG(args, NSDictionary);
  UIEdgeInsets newInsets = [TiUtils contentInsets:args];
  if (!UIEdgeInsetsEqualToEdgeInsets(newInsets, _insets)) {
    _insets = newInsets;
    if (_treatReferenceAsBoundary && _collisionBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_collisionBehavior setTranslatesReferenceBoundsIntoBoundaryWithInsets:_insets];
          },
          YES);
    }
  }
}

- (NSDictionary *)referenceInsets
{
  return [NSDictionary dictionaryWithObjectsAndKeys:NUMFLOAT(_insets.top), @"top", NUMFLOAT(_insets.left), @"left", NUMFLOAT(_insets.bottom), @"bottom", NUMFLOAT(_insets.right), @"right", nil];
}

- (void)setCollisionMode:(id)args
{
  ENSURE_SINGLE_ARG(args, NSNumber);
  int newVal = [TiUtils intValue:args def:-1];
  UICollisionBehaviorMode newMode;
  switch (newVal) {
  case 0:
    newMode = UICollisionBehaviorModeItems;
    break;
  case 1:
    newMode = UICollisionBehaviorModeBoundaries;
    break;
  default:
    newMode = UICollisionBehaviorModeEverything;
    break;
  }
  if (newMode != _mode) {
    _mode = newMode;
    if (_collisionBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_collisionBehavior setCollisionMode:_mode];
          },
          YES);
    }
  }
}

- (NSNumber *)collisionMode
{
  switch (_mode) {
  case UICollisionBehaviorModeItems:
    return NUMINT(0);
    break;
  case UICollisionBehaviorModeBoundaries:
    return NUMINT(1);
    break;
  default:
    return NUMINT(2);
    break;
  }
}

#pragma mark - UICollisionBehaviorDelegate Methods
- (void)collisionBehavior:(UICollisionBehavior *)behavior beganContactForItem:(id<UIDynamicItem>)item1 withItem:(id<UIDynamicItem>)item2 atPoint:(CGPoint)p
{
  if ([self _hasListeners:@"itemcollision"]) {
    NSDictionary *theEvent = [[[NSDictionary dictionaryWithObjectsAndKeys:[(TiUIView *)item1 proxy], @"item1", [(TiUIView *)item2 proxy], @"item2", [TiUtils pointToDictionary:p], @"point", NUMBOOL(YES), @"start", nil] retain] autorelease];
    [self fireEvent:@"itemcollision" withObject:theEvent propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
}
- (void)collisionBehavior:(UICollisionBehavior *)behavior endedContactForItem:(id<UIDynamicItem>)item1 withItem:(id<UIDynamicItem>)item2
{
  if ([self _hasListeners:@"itemcollision"]) {
    NSDictionary *theEvent = [[[NSDictionary dictionaryWithObjectsAndKeys:[(TiUIView *)item1 proxy], @"item1", [(TiUIView *)item2 proxy], @"item2", NUMBOOL(NO), @"start", nil] retain] autorelease];
    [self fireEvent:@"itemcollision" withObject:theEvent propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
}

// The identifier of a boundary created with translatesReferenceBoundsIntoBoundary or setTranslatesReferenceBoundsIntoBoundaryWithInsets is nil
- (void)collisionBehavior:(UICollisionBehavior *)behavior beganContactForItem:(id<UIDynamicItem>)item withBoundaryIdentifier:(id<NSCopying>)identifier atPoint:(CGPoint)p
{
  if ([self _hasListeners:@"boundarycollision"]) {
    if (identifier == nil) {
      identifier = [NSNull null];
    }
    NSDictionary *theEvent = [[[NSDictionary dictionaryWithObjectsAndKeys:[(TiUIView *)item proxy], @"item", identifier, @"identifier", [TiUtils pointToDictionary:p], @"point", NUMBOOL(YES), @"start", nil] retain] autorelease];
    [self fireEvent:@"boundarycollision" withObject:theEvent propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
}
- (void)collisionBehavior:(UICollisionBehavior *)behavior endedContactForItem:(id<UIDynamicItem>)item withBoundaryIdentifier:(id<NSCopying>)identifier
{
  if ([self _hasListeners:@"boundarycollision"]) {
    if (identifier == nil) {
      identifier = [NSNull null];
    }
    NSDictionary *theEvent = [[[NSDictionary dictionaryWithObjectsAndKeys:[(TiUIView *)item proxy], @"item", identifier, @"identifier", NUMBOOL(NO), @"start", nil] retain] autorelease];
    [self fireEvent:@"boundarycollision" withObject:theEvent propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
}

@end
#endif
#endif