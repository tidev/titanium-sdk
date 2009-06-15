package org.appcelerator.titanium.api;

import java.io.IOException;

public interface ITitaniumFilesystem
{
	public ITitaniumFile createTempFile() throws IOException;
	public ITitaniumFile createTempDirectory() throws IOException;
	public ITitaniumFile getFile(String parts[]) throws IOException;
	public ITitaniumFile getFileStream(Object parts[]) throws IOException;
	public ITitaniumFile getApplicationDirectory();
	public ITitaniumFile getApplicationDataDirectory(boolean privateStorage);
	public ITitaniumFile getResourcesDirectory();
	public ITitaniumFile getUserDirectory();
	public void asyncCopy (String files[], String callback);

	// special to mobile

	public boolean isExternalStoragePresent();
}
