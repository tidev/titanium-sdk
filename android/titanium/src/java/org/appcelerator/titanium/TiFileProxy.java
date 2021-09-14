/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2019 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper2;
import org.appcelerator.titanium.util.TiUrl;

import ti.modules.titanium.stream.FileStreamProxy;
import android.net.Uri;

@Kroll.proxy
public class TiFileProxy extends KrollProxy
{
	private static final String TAG = "TiFileProxy";

	protected String path;
	protected TiBaseFile tbf;

	public TiFileProxy(String sourceUrl, String[] parts)
	{
		this(sourceUrl, parts, true);
	}

	public TiFileProxy(String sourceUrl, String[] parts, boolean resolve)
	{
		creationUrl = TiUrl.createProxyUrl(sourceUrl);

		String scheme = "appdata-private://";
		String path = null;
		Uri uri = Uri.parse(parts[0]);
		if (uri.getScheme() != null) {
			scheme = uri.getScheme() + ":";
			ArrayList<String> pb = new ArrayList<>();

			int schemeLength = scheme.length();
			if (parts[0].charAt(schemeLength + 1) == '/') {
				// Titanium specific schemes (like app://) use two slashes instead of one
				String s = parts[0].substring(schemeLength + 2);
				if (s != null && s.length() > 0) {
					pb.add(s);
				}
			} else {
				pb.add(uri.getPath());
			}

			for (int i = 1; i < parts.length; i++) {
				pb.add(parts[i]);
			}
			String[] newParts = pb.toArray(new String[0]);
			path = TiFileHelper2.joinSegments(newParts);
			if (!path.startsWith("..") || !path.startsWith("/")) {
				path = "/" + path;
			}
			pb.clear();
		} else {
			path = TiFileHelper2.joinSegments(parts);
		}
		if (resolve) {
			path = resolveUrl(scheme, path);
		}
		tbf = TiFileFactory.createTitaniumFile(new String[] { path }, false);
	}

	public TiFileProxy(TiBaseFile tbf)
	{
		this.tbf = tbf;
	}

	public static <T> String join(final Collection<T> objs, final String delimiter)
	{
		if (objs == null || objs.isEmpty()) {
			return "";
		}

		Iterator<T> iter = objs.iterator();
		// remove the following two lines, if you expect the Collection will behave well
		if (!iter.hasNext()) {
			return "";
		}

		StringBuffer buffer = new StringBuffer(String.valueOf(iter.next()));
		while (iter.hasNext()) {
			buffer.append(delimiter).append(String.valueOf(iter.next()));
		}

		return buffer.toString();
	}

	public TiBaseFile getBaseFile()
	{
		return tbf;
	}

	@Kroll.method
	public boolean isFile()
	{
		return tbf.isFile();
	}

	@Kroll.method
	public boolean isDirectory()
	{
		return tbf.isDirectory();
	}

	@Kroll.getProperty
	public boolean getReadonly()
	{
		return tbf.isReadonly();
	}

	@Kroll.getProperty
	public boolean getWritable()
	{
		return tbf.isWriteable();
	}

	@Kroll.method
	public boolean append(Object data)
	{
		return write(new Object[] { data, true });
	}

	@Kroll.method
	public boolean copy(String destination) throws IOException
	{
		return tbf.copy(destination);
	}

	@Kroll.method
	public boolean createDirectory(@Kroll.argument(optional = true) Object arg)
	{
		boolean recursive = true;

		if (arg != null) {
			recursive = TiConvert.toBoolean(arg);
		}
		return tbf.createDirectory(recursive);
	}

	@Kroll.method
	public boolean createFile()
	{
		return tbf.createFile();
	}

	@Kroll.method
	public boolean deleteDirectory(@Kroll.argument(optional = true) Object arg)
	{
		boolean recursive = false;

		if (arg != null) {
			recursive = TiConvert.toBoolean(arg);
		}
		return tbf.deleteDirectory(recursive);
	}

	@Kroll.method
	public boolean deleteFile()
	{
		return tbf.deleteFile();
	}

	@Kroll.method
	public boolean exists()
	{
		return tbf.exists();
	}

	@Kroll.method
	public String extension()
	{
		return tbf.extension();
	}

	@Kroll.getProperty
	public boolean getSymbolicLink()
	{
		return tbf.isSymbolicLink();
	}

	@Kroll.getProperty
	public boolean getExecutable()
	{
		return tbf.isExecutable();
	}

	@Kroll.getProperty
	public boolean getHidden()
	{
		return tbf.isHidden();
	}

	@Kroll.method
	public String[] getDirectoryListing()
	{
		if (!isDirectory()) {
			return null;
		}
		List<String> dl = tbf.getDirectoryListing();
		return dl != null ? dl.toArray(new String[0]) : null;
	}

	@Kroll.getProperty
	public TiFileProxy getParent()
	{
		TiBaseFile bf = tbf.getParent();
		return bf != null ? new TiFileProxy(bf) : null;
	}

	@Kroll.method
	public boolean move(String destination) throws IOException
	{
		return tbf.move(destination);
	}

	@Kroll.getProperty
	public String getName()
	{
		return tbf.name();
	}

	@Kroll.getProperty
	public String getNativePath()
	{
		return tbf.nativePath();
	}

	@Kroll.method
	public TiBlob read() throws IOException
	{
		return tbf.read();
	}

	@Kroll.method
	public String readLine() throws IOException
	{
		return tbf.readLine();
	}

	@Kroll.method
	public boolean rename(String destination) throws IOException
	{
		return tbf.rename(destination);
	}

	@Kroll.method
	public String resolve()
	{
		return getNativePath();
	}

	@Kroll.getProperty
	public long getSize()
	{
		return tbf.size();
	}

	@Kroll.method
	public long spaceAvailable()
	{
		return tbf.spaceAvailable();
	}

	@Kroll.method
	public boolean write(Object[] args)
	{
		try {
			if (args != null && args.length > 0) {
				boolean append = false;
				if (args.length > 1 && args[1] instanceof Boolean) {
					append = (Boolean) args[1];
				}

				if (args[0] instanceof TiBlob) {
					tbf.write((TiBlob) args[0], append);
				} else if (args[0] instanceof String) {
					tbf.write((String) args[0], append);
				} else if (args[0] instanceof TiFileProxy) {
					tbf.write(((TiFileProxy) args[0]).read(), append);
				} else {
					Log.i(TAG, "Unable to write to an unrecognized file type");
					return false;
				}
				return true;
			}
		} catch (IOException e) {
			Log.e(TAG, "IOException encountered", e);
		}
		return false;
	}

	@Kroll.method
	public void writeLine(String data) throws IOException
	{
		tbf.writeLine(data);
	}

	@Kroll.method
	public long createTimestamp()
	{
		String message
			= "createTimestamp() has been deprecated in 7.2.0 in favor of createdAt() to avoid platform-differences"
			+ " for return type between iOS and Android. createdAt() will return a Date object on all platforms.";
		Log.w(TAG, message);
		return tbf.createTimestamp();
	}

	@Kroll.method
	public long modificationTimestamp()
	{
		String message
			= "modificationTimestamp() has been deprecated in 7.2.0 in favor of modifiedAt() to avoid"
			+ " platform-differences for return type between iOS and Android. modifiedAt() will return a"
			+ " Date object on all platforms.";
		Log.w(TAG, message);
		return tbf.modificationTimestamp();
	}

	@Kroll.method
	public Date createdAt()
	{
		return tbf.createdAt();
	}

	@Kroll.method
	public Date modifiedAt()
	{
		return tbf.modifiedAt();
	}

	@Kroll.method
	public FileStreamProxy open(int mode) throws IOException
	{
		if (!(tbf.isOpen())) {
			tbf.open(mode, true);
		}
		return new FileStreamProxy(this);
	}

	@Kroll.method
	public boolean append(Object[] args) throws IOException
	{
		if (args == null || args.length == 0) {
			return false;
		}
		// delegate to #write()
		Object[] newArgs = new Object[2];
		newArgs[0] = args[0];
		newArgs[1] = Boolean.TRUE;
		return write(newArgs);
	}

	public InputStream getInputStream() throws IOException
	{
		return getBaseFile().getInputStream();
	}

	public String toString()
	{
		return "[object TiFileProxy]";
	}
}
