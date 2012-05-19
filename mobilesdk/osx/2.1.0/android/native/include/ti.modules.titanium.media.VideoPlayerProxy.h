/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/** This is generated, do not edit by hand. **/

#include <jni.h>

#include "Proxy.h"

		namespace titanium {
			namespace media {


class VideoPlayerProxy : public titanium::Proxy
{
public:
	explicit VideoPlayerProxy(jobject javaObject);

	static void bindProxy(v8::Handle<v8::Object> exports);
	static v8::Handle<v8::FunctionTemplate> getProxyTemplate();
	static void dispose();

	static v8::Persistent<v8::FunctionTemplate> proxyTemplate;
	static jclass javaClass;

private:
	// Methods -----------------------------------------------------------
	static v8::Handle<v8::Value> getLoadState(const v8::Arguments&);
	static v8::Handle<v8::Value> stop(const v8::Arguments&);
	static v8::Handle<v8::Value> getPlaybackState(const v8::Arguments&);
	static v8::Handle<v8::Value> getMovieControlStyle(const v8::Arguments&);
	static v8::Handle<v8::Value> setMovieControlStyle(const v8::Arguments&);
	static v8::Handle<v8::Value> setMediaControlStyle(const v8::Arguments&);
	static v8::Handle<v8::Value> play(const v8::Arguments&);
	static v8::Handle<v8::Value> setCurrentPlaybackTime(const v8::Arguments&);
	static v8::Handle<v8::Value> getScalingMode(const v8::Arguments&);
	static v8::Handle<v8::Value> getCurrentPlaybackTime(const v8::Arguments&);
	static v8::Handle<v8::Value> setMovieControlMode(const v8::Arguments&);
	static v8::Handle<v8::Value> pause(const v8::Arguments&);
	static v8::Handle<v8::Value> getMovieControlMode(const v8::Arguments&);
	static v8::Handle<v8::Value> start(const v8::Arguments&);
	static v8::Handle<v8::Value> getPlaying(const v8::Arguments&);
	static v8::Handle<v8::Value> release(const v8::Arguments&);
	static v8::Handle<v8::Value> getMediaControlStyle(const v8::Arguments&);
	static v8::Handle<v8::Value> setScalingMode(const v8::Arguments&);

	// Dynamic property accessors ----------------------------------------
	static v8::Handle<v8::Value> getter_playing(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_movieControlStyle(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_movieControlStyle(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_currentPlaybackTime(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_currentPlaybackTime(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_playbackState(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_loadState(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_mediaControlStyle(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_mediaControlStyle(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_scalingMode(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_scalingMode(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);
	static v8::Handle<v8::Value> getter_movieControlMode(v8::Local<v8::String> property, const v8::AccessorInfo& info);
	static void setter_movieControlMode(v8::Local<v8::String> property, v8::Local<v8::Value> value, const v8::AccessorInfo& info);

};

			} // namespace media
		} // titanium
