/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
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
import java.lang.ref.WeakReference;
import java.util.List;

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;

public abstract class TiBaseFile
{
	private static final String LCAT = "TiBaseFile";

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

	protected WeakReference<TiContext> weakTiContext;

	protected TiBaseFile(TiContext tiContext, int type) {
		this.weakTiContext = new WeakReference<TiContext>(tiContext);
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

	protected TiContext getTiContext() {
		return weakTiContext.get();
	}

	public boolean isFile() {
		return typeFile;
	}

	public boolean isDirectory() {
		return typeDir;
	}

	public boolean isExecutable() {
		return modeExecutable;
	}

	public boolean isReadonly() {
		return modeRead && !modeWrite;
	}

	public boolean isWriteable() {
		return modeWrite;
	}

	public boolean isHidden() {
		return flagHidden;
	}

	public boolean isSymbolicLink() {
		return flagSymbolicLink;
	}

	public boolean copy(String destination) throws IOException
	{
		InputStream is = null;
		OutputStream os = null;
		boolean copied = false;

		if (destination != null) {
			TiContext tiContext = getTiContext();
			if (tiContext != null) {
				try {
					is = getInputStream();
					if (is != null) {
						String parts[] = { destination };
						TiBaseFile bf = TiFileFactory.createTitaniumFile(tiContext, parts, false);
						if (bf != null) {
							os = bf.getOutputStream();
							if (os != null) {
								byte[] buf = new byte[8096];
								int count = 0;
								is = new BufferedInputStream(is);
								os = new BufferedOutputStream(os);

								while((count = is.read(buf)) != -1) {
									os.write(buf, 0, count);
								}

								copied = true;
							}
						}
					}
				} catch (IOException e) {
					Log.e(LCAT, "Error while copying file: ", e);
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
			}
		}

		return copied;
	}

	public boolean createDirectory(boolean recursive) {
		logNotSupported("createDirectory");
		return false;
	}

	public boolean createShortcut() {		// TODO Auto-generated method stub
		logNotSupported("createShortcut");
		return false;
	}

	public double createTimestamp() {
		logNotSupported("createTimestamp");
		return 0;
	}

	public boolean deleteDirectory(boolean recursive) {
		logNotSupported("deleteDirectory");
		return false;
	}

	public boolean deleteFile() {
		logNotSupported("deleteFile");
		return false;
	}

	public boolean exists() {
		logNotSupported("exists");
		return false;
	}

	public String extension() {
		logNotSupported("extensionsion");
		return null;
	}

	public List<String> getDirectoryListing() {
		logNotSupported("getDirectoryListing");
		return null;
	}

	public TiBaseFile getParent() {
		logNotSupported("getParent");
		return null;
	}

	public double modificationTimestamp() {
		logNotSupported("modificationTimestamp");
		return 0;
	}

	public boolean move(String destination)  throws IOException
	{
		boolean moved = false;

		if (destination != null) {
			TiContext tiContext = getTiContext();
			if (tiContext != null) {
				String parts[] = { destination };
				TiBaseFile bf = TiFileFactory.createTitaniumFile(tiContext, parts, false);
				if (bf != null) {
					if (bf.exists()) {
						throw new IOException("Destination already exists.");
					}

					File fsrc = getNativeFile();
					if (fsrc == null) {
						throw new FileNotFoundException("Source is not a true file.");
					}
					File fdest = bf.getNativeFile();
					if (fdest == null) {
						throw new FileNotFoundException("Destination is not a valid location for writing");
					}

					if(copy(destination)) {
						moved = deleteFile();
					}
				} else {
					throw new FileNotFoundException("Destination not found: " + destination);
				}
			}
		}

		return moved;
	}

	public String name() {
		logNotSupported("name");
		return null;
	}

	public String nativePath() {
		logNotSupported("nativePath");
		return null;
	}

	public TiBlob read() throws IOException {
		logNotSupported("read");
		return null;
	}

	public String readLine() throws IOException {
		logNotSupported("readLine");
		return null;
	}

	public boolean rename(String destination) {
		boolean renamed = false;
		if (destination != null) {
			File f = getNativeFile();
			if (f != null) {
				File dest = new File(f.getParent(), destination);
				renamed = f.renameTo(dest);
			}
		}

		return renamed;
	}

	public TiBaseFile resolve() {
		logNotSupported("resolve");
		return null;
	}

	public boolean setExecutable() {
		logNotSupported("setExecutable");
		return false;
	}

	public boolean setReadonly() {
		logNotSupported("setReadonly");
		return false;
	}

	public boolean setWriteable() {
		logNotSupported("setWriteable");
		return false;
	}

	public double size() {
		logNotSupported("size");
		return 0;
	}

	public double spaceAvailable() {
		logNotSupported("spaceAvailable");
		return 0;
	}

	public void unzip(String destination) {
		logNotSupported("unzip");
	}

	public void write(TiBlob blob, boolean append) throws IOException {

	}

	public void write(String data, boolean append) throws IOException {
		logNotSupported("write");
	}

	public void writeFromUrl(String url, boolean append) throws IOException {
		logNotSupported("writeFromUrl");
	}

	public void writeLine(String data) throws IOException {
		logNotSupported("writeLine");
	}

	public void close() {
		if (opened) {
			if (instream != null) {
				try {
					instream.close();
				} catch (IOException e) {
					//Ignore
				}
				instream = null;
			}

			if (inreader != null) {
				try {
					inreader.close();
				} catch (IOException e) {
					//Ignore
				}
				inreader = null;
			}
			if (outstream != null) {
				try {
					outstream.close();
				} catch (IOException e) {
					// Ignore
				}
				outstream = null;
			}

			if (outwriter != null) {
				try {
					outwriter.close();
				} catch (IOException e) {
					// Ignore
				}
				outwriter = null;
			}

			opened = false;
		}

		binary = false;
	}

	public boolean isOpen() {
		return opened;
	}

	public void open(int mode, boolean binary) throws IOException
	{
		logNotSupported("open");
	}

	protected void logNotSupported(String method) {
		if (method == null) {
			method = Thread.currentThread().getStackTrace()[1].getMethodName();
		}
		Log.w(LCAT, "Method is not supported " + this.getClass().getName() + " : " + method);
	}

	protected void copyStream(InputStream is, OutputStream os) throws IOException {
		byte[] buf = new byte[8096];
		int count = 0;
		while((count = is.read(buf)) != -1) {
			os.write(buf, 0, count);
		}
	}

	protected void copyStream(Reader r, Writer w) throws IOException {
		char[] buf = new char[8096];
		int count = 0;
		while((count = r.read(buf, 0, count)) != -1) {
			w.write(buf, 0, count);
		}
	}

	public abstract InputStream getInputStream() throws IOException;
	public abstract OutputStream getOutputStream() throws IOException;
	public abstract File getNativeFile();
}
