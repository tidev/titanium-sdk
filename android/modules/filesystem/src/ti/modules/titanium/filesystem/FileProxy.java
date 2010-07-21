/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.filesystem;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiFile;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper2;

import android.net.Uri;

public class FileProxy extends TiFile
{

	String path;
	TiBaseFile tbf; // The base file object.

	public static <T>
	String join(final Collection<T> objs, final String delimiter) {
	    if (objs == null || objs.isEmpty())
	        return "";
	    Iterator<T> iter = objs.iterator();
	    // remove the following two lines, if you expect the Collection will behave well
	    if (!iter.hasNext())
	        return "";
	    StringBuffer buffer = new StringBuffer(String.valueOf(iter.next()));
	    while (iter.hasNext())
	        buffer.append(delimiter).append(String.valueOf(iter.next()));
	    return buffer.toString();
	}

	public FileProxy(TiContext tiContext, String[] parts) {
		this(tiContext, parts, true);
	}
	
	public FileProxy(TiContext tiContext, String[] parts, boolean resolve) {
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

	private FileProxy(TiContext tiContext, TiBaseFile tbf) {
		super(tiContext);
		this.tbf = tbf;
	}

	public TiBaseFile getBaseFile() {
		return tbf;
	}

	public boolean isFile() {
		return tbf.isFile();
	}

	public boolean isDirectory() {
		return tbf.isDirectory();
	}

	public boolean getReadonly() {
		return tbf.isReadonly();
	}

	public boolean getWritable() {
		return tbf.isWriteable();
	}

	public boolean copy (String destination) throws IOException {
		return tbf.copy(destination);
	}

	public void createDirectory(Object arg) {
		boolean recursive = true;

		if (arg != null) {
			recursive = TiConvert.toBoolean(arg);
		}
		tbf.createDirectory(recursive);
	}

	public boolean deleteDirectory(Object arg) {
		boolean recursive = true;

		if (arg != null) {
			recursive = TiConvert.toBoolean(arg);
		}
		return tbf.deleteDirectory(recursive);
	}

	public boolean deleteFile() {
		return tbf.deleteFile();
	}

	public boolean exists() {
		return tbf.exists();
	}

	public String extension() {
		return tbf.extension();
	}

	public boolean getSymbolicLink() {
		return tbf.isSymbolicLink();
	}

	public boolean getExecutable() {
		return tbf.isExecutable();
	}

	public boolean getHidden() {
		return tbf.isHidden();
	}

	public String[] getDirectoryListing()
	{
		List<String> dl = tbf.getDirectoryListing();
		return dl != null ? dl.toArray(new String[0]) : null;
	}

	public FileProxy getParent()
	{
		TiBaseFile bf = tbf.getParent();
		return bf != null ? new FileProxy(getTiContext(), bf) : null;
	}

	public boolean move(String destination)
		throws IOException
	{
		return tbf.move(destination);
	}

	public String getName() {
		return tbf.name();
	}

	public String getNativePath() {
		return tbf.nativePath();
	}

	public TiBlob read()
		throws IOException
	{
		return tbf.read();
	}

	public String readLine()
		throws IOException
	{
		return tbf.readLine();
	}

	public boolean rename(String destination)
	{
		return tbf.rename(destination);
	}

	public TiBaseFile resolve() {
		return tbf.resolve();
	}

	public double getSize() {
		return tbf.size();
	}

	public double spaceAvailable() {
		return tbf.spaceAvailable();
	}

	public void write(Object[] args)
		throws IOException
	{
		if (args != null && args.length > 0) {
			boolean append = false;
			if (args.length > 1 && args[1] instanceof Boolean) {
				append = ((Boolean)args[1]).booleanValue();
			}
			if (args[0] instanceof TiBlob) {
				tbf.write((TiBlob)args[0], append);
			} else if (args[0] instanceof String) {
				tbf.write((String)args[0], append);
			} else if (args[0] instanceof FileProxy) {
				tbf.write(((FileProxy)args[0]).read(), append);
			}
		}
	}

	public void writeLine(String data)
		throws IOException
	{
		tbf.writeLine(data);
	}
	
	public double createTimestamp() 
	{
		return tbf.createTimestamp();
	}
	
	public double modificationTimestamp() 
	{
		return tbf.modificationTimestamp();
	}
	
}
