/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

import java.io.IOException;

public interface ITitaniumFilesystem
{
	public ITitaniumFile createTempFile() throws IOException;
	public ITitaniumFile createTempDirectory() throws IOException;
	public ITitaniumFile getFile(String parts[]) throws IOException;
	public ITitaniumInvoker getFileStream(String[] parts) throws IOException;
	public ITitaniumFile getApplicationDirectory();
	public ITitaniumFile getApplicationDataDirectory(boolean privateStorage);
	public ITitaniumFile getResourcesDirectory();
	public ITitaniumFile getUserDirectory();
	public void asyncCopy (String files[], String callback);

	// special to mobile

	public boolean isExternalStoragePresent();
}
