/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.io;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Reader;
import java.io.Writer;
import java.util.Date;
import java.util.List;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBlob;

/**
 * This is the parent class of all files/directories.
 */
public abstract class TiBaseFile
{
	private static final String TAG = "TiBaseFile";

	public static final int MODE_READ = 0;
	public static final int MODE_WRITE = 1;
	public static final int MODE_APPEND = 2;

	protected static final int TYPE_FILE = 1;
	protected static final int TYPE_RESOURCE = 2;
	protected static final int TYPE_BLOB = 3;

	protected int type; // Internal code instead of instanceof

	protected boolean typeFile;
	protected boolean typeDir;
	protected boolean flagHidden;
	protected boolean flagSymbolicLink;
	protected boolean modeExecutable;
	protected boolean modeRead;
	protected boolean modeWrite;

	protected boolean opened;
	protected InputStream instream;
	protected BufferedReader inreader;
	protected OutputStream outstream;
	protected BufferedWriter outwriter;
	protected boolean stream;
	protected boolean binary;

	protected TiBaseFile(int type)
	{
		this.type = type;
		this.typeFile = true;
		this.typeDir = false;
		this.flagHidden = false;
		this.flagSymbolicLink = false;
		this.modeExecutable = false;
		this.modeRead = true;
		this.modeWrite = false;

		this.opened = false;
		this.instream = null;
		this.inreader = null;
		this.outstream = null;
		this.outwriter = null;
		this.stream = false;
		this.binary = false;
	}

	/**
	 * @return true if the file is a File, false otherwise. See {@link java.io.File#isFile()} for more details.
	 * @module.api
	 */
	public boolean isFile()
	{
		return typeFile;
	}

	/**
	 * @return true if the file is a directory, false otherwise. See {@link java.io.File#isDirectory()} for more details.
	 * @module.api
	 */
	public boolean isDirectory()
	{
		return typeDir;
	}

	/**
	 * @return  true if the file is executable, false otherwise.
	 * @module.api
	 */
	public boolean isExecutable()
	{
		return modeExecutable;
	}

	/**
	 * @return  true if the file is read-only, false otherwise.
	 * @module.api
	 */
	public boolean isReadonly()
	{
		return modeRead && !modeWrite;
	}

	/**
	 * @return  true if the file is writable, false otherwise.
	 * @module.api
	 */
	public boolean isWriteable()
	{
		return modeWrite;
	}

	/**
	 * @return true if the file is hidden, false otherwise.
	 * @module.api
	 */
	public boolean isHidden()
	{
		return flagHidden;
	}

	/**
	 * @return true if the file is a symbolic link, false otherwise.
	 * @module.api
	 */
	public boolean isSymbolicLink()
	{
		return flagSymbolicLink;
	}

	public boolean copy(String destination) throws IOException
	{
		InputStream is = null;
		OutputStream os = null;
		boolean copied = false;

		if (destination == null)
			return false;

		try {
			is = getInputStream();
			if (is == null)
				return false;

			String[] parts = { destination };
			TiBaseFile bf = TiFileFactory.createTitaniumFile(parts, false);
			if (bf == null)
				return false;

			os = bf.getOutputStream();
			if (os == null)
				return false;

			byte[] buf = new byte[8096];
			int count = 0;
			is = new BufferedInputStream(is);
			os = new BufferedOutputStream(os);

			while ((count = is.read(buf)) != -1) {
				os.write(buf, 0, count);
			}

			copied = true;
		} catch (IOException e) {
			Log.e(TAG, "Error while copying file: ", e);
			throw e;
		} finally {
			if (is != null) {
				try {
					is.close();
					is = null;
				} catch (IOException e) {
					// ignore;
				}
			}

			if (os != null) {
				try {
					os.close();
					os = null;
				} catch (IOException e) {
					// ignore;
				}
			}
		}

		return copied;
	}

	public boolean createDirectory(boolean recursive)
	{
		logNotSupported("createDirectory");
		return false;
	}

	public boolean createFile()
	{
		logNotSupported("createFile");
		return false;
	}

	public boolean createShortcut()
	{
		logNotSupported("createShortcut");
		return false;
	}

	public long createTimestamp()
	{
		logNotSupported("createTimestamp");
		return 0L;
	}

	public Date createdAt()
	{
		return new Date(createTimestamp());
	}

	public boolean deleteDirectory(boolean recursive)
	{
		logNotSupported("deleteDirectory");
		return false;
	}

	public boolean deleteFile()
	{
		logNotSupported("deleteFile");
		return false;
	}

	/**
	 * @return Whether or not this file exists.
	 * @module.api
	 */
	public boolean exists()
	{
		logNotSupported("exists");
		return false;
	}

	public String extension()
	{
		logNotSupported("extensionsion");
		return null;
	}

	/**
	 * @return a list of all files and directories in this directory.
	 * @module.api
	 */
	public List<String> getDirectoryListing()
	{
		logNotSupported("getDirectoryListing");
		return null;
	}

	/**
	 * @return The parent directory of this file
	 * @module.api
	 */
	public TiBaseFile getParent()
	{
		logNotSupported("getParent");
		return null;
	}

	public long modificationTimestamp()
	{
		logNotSupported("modificationTimestamp");
		return 0L;
	}

	public Date modifiedAt()
	{
		return new Date(modificationTimestamp());
	}

	public boolean move(String destinationPath) throws IOException
	{
		boolean wasMoved = false;

		if ((destinationPath != null) && !destinationPath.isEmpty()) {
			String[] parts = { destinationPath };
			TiBaseFile tiDestinationFile = TiFileFactory.createTitaniumFile(parts, false);
			if (tiDestinationFile != null) {
				// Do not continue if destination file already exists.
				if (tiDestinationFile.exists()) {
					throw new IOException("Destination already exists.");
				}

				// Fetch the source/destination file objects.
				File sourceFile = getNativeFile();
				if (sourceFile == null) {
					throw new FileNotFoundException("Source is not a true file.");
				}
				File destinationFile = tiDestinationFile.getNativeFile();
				if (destinationFile == null) {
					throw new FileNotFoundException("Destination is not a valid location for writing");
				}

				// First, attempt to move the file by renaming it, which is the fastest way to do it.
				// Will only work if both file paths are on the same volume and we have permission.
				destinationFile.getParentFile().mkdirs();
				wasMoved = sourceFile.renameTo(destinationFile);

				// If above failed, then copy source file to destination ourselves and then delete it.
				if (!wasMoved) {
					wasMoved = copy(destinationPath);
					if (wasMoved) {
						wasMoved = deleteFile();
					}
				}
			} else {
				throw new FileNotFoundException("Destination not found: " + destinationPath);
			}
		}

		return wasMoved;
	}

	/**
	 * @return the file's name.
	 * @module.api
	 */
	public String name()
	{
		logNotSupported("name");
		return null;
	}

	/**
	 * @return the file's path.
	 * @module.api
	 */
	public String nativePath()
	{
		logNotSupported("nativePath");
		return null;
	}

	public TiBlob read() throws IOException
	{
		return TiBlob.blobFromFile(this);
	}

	public String readLine() throws IOException
	{
		logNotSupported("readLine");
		return null;
	}

	public boolean rename(String destination) throws IOException
	{
		boolean wasSuccessful = false;
		if ((destination != null) && !destination.isEmpty()) {
			File sourceFile = getNativeFile();
			if (sourceFile != null) {
				if ((destination.indexOf(File.separatorChar) >= 0) || (destination.indexOf(':') >= 0)) {
					// Received an absolute path. Only rename if destination directory is same as the source.
					String[] parts = { destination };
					TiBaseFile tiDestinationFile = TiFileFactory.createTitaniumFile(parts, false);
					File destinationFile = (tiDestinationFile != null) ? tiDestinationFile.getNativeFile() : null;
					if (destinationFile != null) {
						if (sourceFile.getParentFile().equals(destinationFile.getParentFile())) {
							wasSuccessful = sourceFile.renameTo(destinationFile);
						}
					}
				} else {
					// We were given a file name. Rename it in same directory.
					File destinationFile = new File(sourceFile.getParent(), destination);
					wasSuccessful = sourceFile.renameTo(destinationFile);
				}
			}
		}
		return wasSuccessful;
	}

	public TiBaseFile resolve()
	{
		logNotSupported("resolve");
		return null;
	}

	public boolean setExecutable()
	{
		logNotSupported("setExecutable");
		return false;
	}

	public boolean setReadonly()
	{
		logNotSupported("setReadonly");
		return false;
	}

	public boolean setWriteable()
	{
		logNotSupported("setWriteable");
		return false;
	}

	public long size()
	{
		logNotSupported("size");
		return 0L;
	}

	public long spaceAvailable()
	{
		logNotSupported("spaceAvailable");
		return 0L;
	}

	public void unzip(String destination)
	{
		logNotSupported("unzip");
	}

	public void write(TiBlob blob, boolean append) throws IOException
	{
	}

	public void write(String data, boolean append) throws IOException
	{
		logNotSupported("write");
	}

	public void writeFromUrl(String url, boolean append) throws IOException
	{
		logNotSupported("writeFromUrl");
	}

	public void writeLine(String data) throws IOException
	{
		logNotSupported("writeLine");
	}

	public void close() throws IOException
	{
		if (opened) {
			if (instream != null) {
				try {
					instream.close();
				} catch (IOException e) {
					throw new IOException("Error closing file");
				}
				instream = null;
			}

			if (inreader != null) {
				try {
					inreader.close();
				} catch (IOException e) {
					throw new IOException("Error closing file");
				}
				inreader = null;
			}
			if (outstream != null) {
				try {
					outstream.close();
				} catch (IOException e) {
					throw new IOException("Error closing file");
				}
				outstream = null;
			}

			if (outwriter != null) {
				try {
					outwriter.close();
				} catch (IOException e) {
					throw new IOException("Error closing file");
				}
				outwriter = null;
			}

			opened = false;
		}

		binary = false;
	}

	public boolean isOpen()
	{
		return opened;
	}

	public void open(int mode, boolean binary) throws IOException
	{
		logNotSupported("open");
	}

	protected void logNotSupported(String method)
	{
		if (method == null) {
			method = Thread.currentThread().getStackTrace()[1].getMethodName();
		}
		Log.w(TAG, "Method is not supported " + this.getClass().getName() + " : " + method);
	}

	public static void copyStream(InputStream is, OutputStream os) throws IOException
	{
		byte[] buf = new byte[8096];
		int count = 0;
		while ((count = is.read(buf)) != -1) {
			os.write(buf, 0, count);
		}
	}

	protected void copyStream(Reader r, Writer w) throws IOException
	{
		char[] buf = new char[8096];
		int count = 0;
		while ((count = r.read(buf, 0, count)) != -1) {
			w.write(buf, 0, count);
		}
	}

	public InputStream getExistingInputStream()
	{
		return instream;
	}

	public OutputStream getExistingOutputStream()
	{
		return outstream;
	}

	/**
	 * Implementing subclasses should return an InputStream that can be used to retrieve
	 * the contents of the file.
	 * @return  the InputStream of the file.
	 * @throws IOException the thrown exception.
	 * @module.api
	 */
	public abstract InputStream getInputStream() throws IOException;

	/**
	 * Implementing subclasses should return an OutputStream for writing to the file.
	 * @return  the OutputStream of the file.
	 * @throws IOException the thrown exception.
	 * @module.api
	 */
	public abstract OutputStream getOutputStream() throws IOException;

	/**
	 * Implementing subclasses should return the file object.
	 * @return  the file object.
	 * @module.api
	 */
	public abstract File getNativeFile();
}
