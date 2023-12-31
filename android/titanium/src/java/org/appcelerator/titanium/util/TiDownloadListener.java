/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.net.URI;

public interface TiDownloadListener {
	void downloadTaskFinished(URI uri);

	void downloadTaskFailed(URI uri);

	// This method will be called after the download is finished in the
	// same background thread, but BEFORE TaskFinished is called.
	void postDownload(URI uri);
}
