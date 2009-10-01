/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.fs;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.ref.WeakReference;
import java.util.List;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumFile;
import org.appcelerator.titanium.util.Log;

public abstract class TitaniumBaseFile implements ITitaniumFile
{
	private static final String LCAT = "TiBaseFile";

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

	protected WeakReference<TitaniumModuleManager> weakTmm;

	protected TitaniumBaseFile(TitaniumModuleManager tmm, int type) {
		this.weakTmm = new WeakReference<TitaniumModuleManager>(tmm);
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

	public boolean copy(String destination) {
		logNotSupported(null);
		return false;
	}

	public void createDirectory(boolean recursive) {
		logNotSupported(null);
	}

	public boolean createShortcut() {		// TODO Auto-generated method stub
		logNotSupported(null);
		return false;
	}

	public double createTimestamp() {
		logNotSupported(null);
		return 0;
	}

	public void deleteDirectory(boolean recursive) {
		logNotSupported(null);
	}

	public boolean deleteFile() {
		logNotSupported(null);
		return false;
	}

	public boolean exists() {
		logNotSupported(null);
		return false;
	}

	public String extension() {
		logNotSupported(null);
		return null;
	}

	public List<String> getDirectoryListing() {
		logNotSupported(null);
		return null;
	}

	public ITitaniumFile getParent() {
		logNotSupported(null);
		return null;
	}

	public double modificationTimestamp() {
		logNotSupported(null);
		return 0;
	}

	public boolean move(String destination) {
		logNotSupported(null);
		return false;
	}

	public String name() {
		logNotSupported(null);
		return null;
	}

	public String nativePath() {
		logNotSupported(null);
		return null;
	}

	public String read() throws IOException {
		logNotSupported("read");
		return null;
	}

	public String readLine() throws IOException {
		logNotSupported("readLine");
		return null;
	}

	public boolean rename(String destination) {
		logNotSupported("rename");
		return false;
	}

	public ITitaniumFile resolve() {
		logNotSupported("resolve");
		return null;
	}

	public boolean setExecutable() {
		logNotSupported(null);
		return false;
	}

	public boolean setReadonly() {
		logNotSupported(null);
		return false;
	}

	public boolean setWriteable() {
		logNotSupported(null);
		return false;
	}

	public double size() {
		logNotSupported(null);
		return 0;
	}

	public double spaceAvailable() {
		logNotSupported(null);
		return 0;
	}

	public void unzip(String destination) {
		logNotSupported(null);
	}

	public void write(String data, boolean append) throws IOException {
		logNotSupported(null);
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
}
