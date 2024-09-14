/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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
