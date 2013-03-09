/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIListItem.h"
#import "TiUtils.h"
#import "TiViewProxy.h"
#import "ImageLoader.h"

@implementation TiUIListItem {
	TiUIListItemProxy *_proxy;
	NSInteger _templateStyle;
	NSMutableDictionary *_initialValues;
	NSMutableDictionary *_currentValues;
	NSMutableSet *_resetKeys;
	NSDictionary *_item;
	NSDictionary *_bindings;
}

@synthesize templateStyle = _templateStyle;

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier proxy:(TiUIListItemProxy *)proxy
{
    self = [super initWithStyle:style reuseIdentifier:reuseIdentifier];
    if (self) {
		_templateStyle = style;
		_initialValues = [[NSMutableDictionary alloc] initWithCapacity:5];
		_currentValues = [[NSMutableDictionary alloc] initWithCapacity:5];
		_resetKeys = [[NSMutableSet alloc] initWithCapacity:5];
		_proxy = [proxy retain];
		_proxy.listItem = self;
    }
    return self;
}

- (id)initWithProxy:(TiUIListItemProxy *)proxy reuseIdentifier:(NSString *)reuseIdentifier
{
    self = [super initWithStyle:UITableViewCellStyleDefault reuseIdentifier:reuseIdentifier];
    if (self) {
		_templateStyle = TiUIListItemTemplateStyleCustom;
		_initialValues = [[NSMutableDictionary alloc] initWithCapacity:10];
		_currentValues = [[NSMutableDictionary alloc] initWithCapacity:10];
		_resetKeys = [[NSMutableSet alloc] initWithCapacity:10];
		_proxy = [proxy retain];
		_proxy.listItem = self;
    }
    return self;
}

- (void)dealloc
{
	_proxy.listItem = nil;
	[_initialValues release];
	[_currentValues release];
	[_resetKeys release];
	[_item release];
	[_proxy release];
	[_bindings release];
	[super dealloc];
}

- (NSDictionary *)bindings
{
	if (_bindings == nil) {
		NSMutableDictionary *dict = [[NSMutableDictionary alloc] initWithCapacity:10];
		[[self class] buildBindingsForViewProxy:_proxy intoDictionary:dict];
		_bindings = [dict copy];
		[dict release];
	}
	return _bindings;
}

- (void)prepareForReuse
{
	RELEASE_TO_NIL(_item);
	[super prepareForReuse];
}

- (void)applyDataItem:(NSDictionary *)item
{
	_item = [item retain];
	[_resetKeys addObjectsFromArray:[_currentValues allKeys]];
	id propertiesValue = [item objectForKey:@"properties"];
	NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
	switch (_templateStyle) {
		case UITableViewCellStyleSubtitle:
		case UITableViewCellStyleValue1:
		case UITableViewCellStyleValue2:
			self.detailTextLabel.text = [[properties objectForKey:@"subtitle"] description];
			// pass through
		case UITableViewCellStyleDefault:
			self.textLabel.text = [[properties objectForKey:@"title"] description];
			id imageValue = [properties objectForKey:@"image"];
			if ([self shouldUpdateValue:imageValue forKeyPath:@"image"]) {
				NSURL *imageUrl = [TiUtils toURL:imageValue proxy:_proxy];
				UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:imageUrl];
				if (image != nil) {
					[self recordChangeValue:imageValue forKeyPath:@"imageView.image" withBlock:^{
						self.imageView.image = image;
					}];
				}
			}

			id fontValue = [properties objectForKey:@"font"];
			if ([self shouldUpdateValue:fontValue forKeyPath:@"font"]) {
				UIFont *font = (fontValue != nil) ? [[TiUtils fontValue:fontValue] font] : nil;
				if (font != nil) {
					[self recordChangeValue:fontValue forKeyPath:@"textLabel.font" withBlock:^{
						[self.textLabel setFont:font];
					}];
				}
			}

			id colorValue = [properties objectForKey:@"color"];
			if ([self shouldUpdateValue:colorValue forKeyPath:@"color"]) {
				UIColor *color = colorValue != nil ? [[TiUtils colorValue:colorValue] _color] : nil;
				if (color != nil) {
					[self recordChangeValue:colorValue forKeyPath:@"textLabel.color" withBlock:^{
						[self.textLabel setTextColor:color];
					}];
				}
			}
			break;
			
		default:
			[item enumerateKeysAndObjectsUsingBlock:^(NSString *bindId, id dict, BOOL *stop) {
				if (![dict isKindOfClass:[NSDictionary class]] || [bindId isEqualToString:@"properties"]) {
					return;
				}
				id bindObject = [self valueForUndefinedKey:bindId];
				if (bindObject != nil) {
					[(NSDictionary *)dict enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
						NSString *keyPath = [NSString stringWithFormat:@"%@.%@", bindId, key];
						if ([self shouldUpdateValue:value forKeyPath:keyPath]) {
							[self recordChangeValue:value forKeyPath:keyPath withBlock:^{
								[bindObject setValue:value forKey:key];
							}];
						}
					}];
				}
			}];
			break;
	}
	id accessoryTypeValue = [properties objectForKey:@"accessoryType"];
	if ([self shouldUpdateValue:accessoryTypeValue forKeyPath:@"accessoryType"]) {
		if ([accessoryTypeValue isKindOfClass:[NSNumber class]]) {
			UITableViewCellAccessoryType accessoryType = [accessoryTypeValue unsignedIntegerValue];
			[self recordChangeValue:accessoryTypeValue forKeyPath:@"accessoryType" withBlock:^{
				self.accessoryType = accessoryType;
			}];
		}
	}
	
	[_resetKeys enumerateObjectsUsingBlock:^(NSString *keyPath, BOOL *stop) {
		id value = [_initialValues objectForKey:keyPath];
		[self setValue:(value != [NSNull null] ? value : nil) forKeyPath:keyPath];
		[_currentValues removeObjectForKey:keyPath];
	}];
	[_resetKeys removeAllObjects];
}

- (id)valueForUndefinedKey:(NSString *)key
{
	return [self.bindings objectForKey:key];
}

- (void)recordChangeValue:(id)value forKeyPath:(NSString *)keyPath withBlock:(void(^)(void))block
{
	if ([_initialValues objectForKey:keyPath] == nil) {
		id initialValue = [self valueForKeyPath:keyPath];
		[_initialValues setObject:(initialValue != nil ? initialValue : [NSNull null]) forKey:keyPath];
	}
	block();
	if (value != nil) {
		[_currentValues setObject:value forKey:keyPath];
	} else {
		[_currentValues removeObjectForKey:keyPath];
	}
	[_resetKeys removeObject:keyPath];
}

- (BOOL)shouldUpdateValue:(id)value forKeyPath:(NSString *)keyPath
{
	id current = [_currentValues objectForKey:keyPath];
	BOOL sameValue = ((current == value) || [current isEqual:value]);
	if (sameValue) {
		[_resetKeys removeObject:keyPath];
	}
	return !sameValue;
}

#pragma mark - Static 

+ (void)buildBindingsForViewProxy:(TiViewProxy *)viewProxy intoDictionary:(NSMutableDictionary *)dict
{
	[viewProxy.children enumerateObjectsUsingBlock:^(TiViewProxy *childViewProxy, NSUInteger idx, BOOL *stop) {
		[[self class] buildBindingsForViewProxy:childViewProxy intoDictionary:dict];
	}];
	id bindId = [viewProxy valueForKey:@"bindId"];
	if (bindId != nil) {
		[dict setObject:viewProxy forKey:bindId];
	}
}

@end
