/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
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
