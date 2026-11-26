/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef API_MODULE_H
#define API_MODULE_H

#include <jsi/jsi.h>

namespace titanium {

using namespace facebook;

class APIModule
{
public:
	static void Initialize(jsi::Runtime& rt, const jsi::Object& target);
	static void Dispose(jsi::Runtime& rt);
};

} // namespace titanium

#endif
