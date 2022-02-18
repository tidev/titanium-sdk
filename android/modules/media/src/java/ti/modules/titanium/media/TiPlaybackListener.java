/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.media;

public interface TiPlaybackListener {
	void onStartPlayback();

	void onPausePlayback();

	void onStopPlayback();

	void onPlayingPlayback();

	void onSeekingBackward();

	void onSeekingForward();
}
