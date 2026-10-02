/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * WARNING: This is generated code. Do not modify. Your changes *will* be lost.
 */

#import "ApplicationMods.h"

@implementation ApplicationMods

+ (NSArray*) compiledMods
{
	NSMutableArray *modules = [NSMutableArray array];

	<%
	modules.forEach(function (m) {
		var prefix = m.manifest.moduleid.toUpperCase().replace(/\./g, '_');
		%>
		[modules addObject:[NSDictionary
			dictionaryWithObjectsAndKeys:@"<%- m.manifest.name.toLowerCase() %>",
			@"name",
			@"<%- m.manifest.moduleid.toLowerCase() %>",
			@"moduleid",
			@"<%- (m.manifest.version || '') %>",
			@"version",
			@"<%- (m.manifest.guid || '') %>",
			@"guid",
			@"<%- (m.manifest.licensekey || '') %>",
			@"licensekey",
			nil
		]];
		<%
	});
	%>

	return modules;
}

@end