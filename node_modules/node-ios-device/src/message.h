/**
 * node-ios-device
 * Copyright (c) 2013-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef __MESSAGE_H__
#define __MESSAGE_H__

#include <string>

namespace node_ios_device {

class Message {
public:
	std::string event;
	std::string data;

	Message(const std::string& _event) : event(_event) {}
	Message(const std::string& _event, const std::string& _data) : event(_event), data(_data) {}
};

} // end namespace node_ios_device

#endif
