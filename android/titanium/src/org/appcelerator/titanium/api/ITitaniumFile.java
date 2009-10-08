/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;

public interface ITitaniumFile
{
	public static final int MODE_READ = 0;
	public static final int MODE_WRITE = 1;
	public static final int MODE_APPEND = 2;

	public boolean isFile();
	public boolean isDirectory();
	public boolean isHidden();
	public boolean isSymbolicLink();
	public boolean isExecutable();
	public boolean isReadonly();
	public boolean isWriteable();
	public ITitaniumFile resolve();
	public void write(String data, boolean append)  throws IOException;
	public void writeFromUrl(String url, boolean append) throws IOException;
	public String read()  throws IOException;
	public String readLine()  throws IOException;
	public void writeLine(String data) throws IOException;
	public boolean copy(String destination);
	public boolean move(String destination);
	public boolean rename(String destination);
	public void createDirectory(boolean recursive);
	public void deleteDirectory(boolean recursive);
	public boolean deleteFile();
	public List<String> getDirectoryListing();
	public ITitaniumFile getParent();
	public boolean exists();
	public double createTimestamp();
	public double modificationTimestamp();
	public String name();
	public String extension();
	public String nativePath();
	public double size();
	public double spaceAvailable();
	public boolean createShortcut();
	public boolean setExecutable();
	public boolean setReadonly();
	public boolean setWriteable();
	public void unzip (String destination);
	public String toURL();

	// Filestream methods
	public void close();
	public boolean isOpen();
	public void open(int mode, boolean binary) throws IOException;

	// Internal methods
	public InputStream getInputStream() throws IOException;
	public OutputStream getOutputStream() throws IOException;
}
