/**
 * TiDev Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef ANDROID_UTIL_H
#define ANDROID_UTIL_H

#include <android/log.h>
#include <stdlib.h>

#define LOG(level, tag, ...) __android_log_print(ANDROID_LOG_##level, tag, __VA_ARGS__)

#ifdef TI_DEBUG
# define LOGV(tag, format, ...) LOG(VERBOSE, tag, "[%s:%d] " format, __FILE__, __LINE__, ##__VA_ARGS__)
# define LOGD(tag, ...) LOG(DEBUG, tag, __VA_ARGS__)
# define LOG_TIMER(tag, desc) LogTimer timer(tag, desc)
# define ASSERT(expr) \
	if (!(expr)) { \
		LOGE("assert", "Assert failure @ [%s:%d]", __FILE__, __LINE__); \
		abort(); \
	}
#else
# define LOGV(tag, ...)
# define LOGD(tag, ...)
# define LOG_TIMER(tag, desc)
# define ASSERT(expr)
#endif

#define LOGI(tag, ...) LOG(INFO, tag, __VA_ARGS__)
#define LOGW(tag, ...) LOG(WARN, tag, __VA_ARGS__)
#define LOGE(tag, ...) LOG(ERROR, tag, __VA_ARGS__)
#define LOGF(tag, ...) LOG(FATAL, tag, __VA_ARGS__)


namespace titanium {

class AndroidUtil
{
public:
	static long getCurrentMillis();
};

class LogTimer
{
public:
	LogTimer(const char *tag, const char *description) :
		tag(tag), description(description),
		start(AndroidUtil::getCurrentMillis())
	{
	}

	~LogTimer()
	{
		LOGE(tag, "Finished %s (%d ms)", description, AndroidUtil::getCurrentMillis() - start);
	}
private:
	long start;
	const char *tag, *description;
};

} // namespace titanium

#endif
