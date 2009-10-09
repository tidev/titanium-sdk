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
	public ITitaniumInvoker createTempFile() throws IOException;
	public ITitaniumInvoker createTempDirectory() throws IOException;
	public ITitaniumInvoker getFile(String parts[]) throws IOException;
	public ITitaniumInvoker getFileStream(String[] parts) throws IOException;
	public ITitaniumInvoker getApplicationDirectory();
	public ITitaniumInvoker getApplicationDataDirectory(boolean privateStorage);
	public ITitaniumInvoker getResourcesDirectory();
	public ITitaniumInvoker getUserDirectory();
	public void asyncCopy (String files[], String callback);

	// special to mobile

	public boolean isExternalStoragePresent();
}
