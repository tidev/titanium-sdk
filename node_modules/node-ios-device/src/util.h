/**
 * node-ios-device
 * Copyright (c) 2013-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef __UTIL_H__
#define __UTIL_H__

#include <nan.h>
#include <v8.h>

namespace node_ios_device {

void send(const char* event);
void send(const char* event, const std::string& data);
void send(const std::string& event);
void send(const std::string& event, const std::string& data);
void debug(const std::string& output);
void debug(const char* format, ...);
char* cfstring_to_cstr(CFStringRef str);

} // end namespace node_ios_device

#endif
