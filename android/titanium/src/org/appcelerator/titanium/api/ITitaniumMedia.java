/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumMedia
{
	public void beep();
	public ITitaniumSound createSound(String url);
	public void vibrate(long[] pattern);

	public void showCamera(final String successCallback, final String cancelCallback, final String errorCallback, final String options, final ITitaniumFile blob);
	public void openPhotoGallery(final String successCallback, final String cancelCallback, final String errorCallback, final ITitaniumFile blob);
	public void previewImage(final String successCallback, String errorCallback, final ITitaniumFile blob);
	public ITitaniumVideo createVideoPlayer(final String jsonOptions);

	// internal use
	public ITitaniumFile createBlob();
}
