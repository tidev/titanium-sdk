/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper2;

import ti.modules.titanium.stream.FileStreamProxy;

import android.net.Uri;

@Kroll.proxy
public class TiFileProxy extends KrollProxy
{
	private static final String LCAT = "TiFileProxy";

	protected String path;
	protected TiBaseFile tbf; // The base file object.

	public TiFileProxy(TiContext tiContext)
	{
		super(tiContext);
	}

	public TiFileProxy(TiContext tiContext, String[] parts)
	{
		this(tiContext, parts, true);
	}
	
	public TiFileProxy(TiContext tiContext, String[] parts, boolean resolve)
	{
		super(tiContext);

		//String path = getTiContext().resolveUrl(join(Arrays.asList(parts), "/"));
		String scheme = "appdata-private://";
		String path = null;
		Uri uri = Uri.parse(parts[0]);
		if (uri.getScheme() != null) {
			scheme = uri.getScheme() + ":";
			ArrayList<String> pb = new ArrayList<String>();
			String s = parts[0].substring(scheme.length() + 2);
			if (s != null && s.length() > 0) {
				pb.add(s);
			}
			for (int i = 1; i < parts.length; i++) {
				pb.add(parts[i]);
			}
			String[] newParts = pb.toArray(new String[pb.size()]);
			path = TiFileHelper2.joinSegments(newParts);
			if (!path.startsWith("..") || !path.startsWith("/")) {
				path = "/" + path;
			}
			pb.clear();
		} else {
			path = TiFileHelper2.joinSegments(parts);
		}
		
		if (resolve) {
			path = getTiContext().resolveUrl(scheme, path);
		}
		tbf = TiFileFactory.createTitaniumFile(tiContext, new String[] { path }, false);
	}

	public TiFileProxy(TiContext tiContext, TiBaseFile tbf)
	{
		super(tiContext);
		this.tbf = tbf;
	}

	public static <T>
	String join(final Collection<T> objs, final String delimiter)
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

	@Kroll.getProperty @Kroll.method
	public boolean getReadonly()
	{
		return tbf.isReadonly();
	}

	@Kroll.getProperty @Kroll.method
	public boolean getWritable()
	{
		return tbf.isWriteable();
	}

	@Kroll.method
	public boolean copy (String destination)
		throws IOException
	{
		return tbf.copy(destination);
	}

	@Kroll.method
	public boolean createDirectory(@Kroll.argument(optional=true) Object arg)
	{
		boolean recursive = true;

		if (arg != null) {
			recursive = TiConvert.toBoolean(arg);
		}
		return tbf.createDirectory(recursive);
	}

	@Kroll.method
	public boolean deleteDirectory(@Kroll.argument(optional=true) Object arg)
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

	@Kroll.getProperty @Kroll.method
	public boolean getSymbolicLink()
	{
		return tbf.isSymbolicLink();
	}

	@Kroll.getProperty @Kroll.method
	public boolean getExecutable()
	{
		return tbf.isExecutable();
	}

	@Kroll.getProperty @Kroll.method
	public boolean getHidden()
	{
		return tbf.isHidden();
	}

	@Kroll.getProperty @Kroll.method
	public String[] getDirectoryListing()
	{
		List<String> dl = tbf.getDirectoryListing();
		return dl != null ? dl.toArray(new String[0]) : null;
	}

	@Kroll.getProperty @Kroll.method
	public TiFileProxy getParent()
	{
		TiBaseFile bf = tbf.getParent();
		return bf != null ? new TiFileProxy(getTiContext(), bf) : null;
	}

	@Kroll.method
	public boolean move(String destination)
		throws IOException
	{
		return tbf.move(destination);
	}

	@Kroll.getProperty @Kroll.method
	public String getName()
	{
		return tbf.name();
	}

	@Kroll.getProperty @Kroll.method
	public String getNativePath()
	{
		return tbf.nativePath();
	}

	@Kroll.method
	public TiBlob read()
		throws IOException
	{
		return tbf.read();
	}

	@Kroll.method
	public String readLine()
		throws IOException
	{
		return tbf.readLine();
	}

	@Kroll.method
	public boolean rename(String destination)
	{
		return tbf.rename(destination);
	}

	@Kroll.method
	public TiBaseFile resolve()
	{
		return tbf.resolve();
	}

	@Kroll.getProperty @Kroll.method
	public double getSize()
	{
		return tbf.size();
	}

	@Kroll.method
	public double spaceAvailable()
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
					append = ((Boolean)args[1]).booleanValue();
				}

				if (args[0] instanceof TiBlob) {
					tbf.write((TiBlob)args[0], append);
				} else if (args[0] instanceof String) {
					tbf.write((String)args[0], append);
				} else if (args[0] instanceof TiFileProxy) {
					tbf.write(((TiFileProxy)args[0]).read(), append);
				} else {
					Log.i(LCAT, "unable to write, unrecognized type");
					return false;
				}

				return true;
			}

			return false;
		} catch(IOException e) {
			Log.e(LCAT, "IOException encountered");
			return false;
		}
	}

	@Kroll.method
	public void writeLine(String data)
		throws IOException
	{
		tbf.writeLine(data);
	}

	@Kroll.method
	public double createTimestamp()
	{
		return tbf.createTimestamp();
	}

	@Kroll.method
	public double modificationTimestamp()
	{
		return tbf.modificationTimestamp();
	}

	@Kroll.method
	public FileStreamProxy open(int mode) throws IOException
	{
		if(!(tbf.isOpen())) {
			tbf.open(mode, true);
		}
		return new FileStreamProxy(this);
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
