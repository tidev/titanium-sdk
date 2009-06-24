/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.fs;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

import org.appcelerator.titanium.config.TitaniumConfig;
import android.util.Log;

public class TitaniumFile extends TitaniumBaseFile
{
	private static final String LCAT = "TiFile";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private final File file;
	private final String path;

	public TitaniumFile(File file, String path)
	{
		super(TitaniumBaseFile.TYPE_FILE);
		this.file = file;
		this.path = path;
	}
	@Override
	public boolean isFile()
	{
		return file.isFile();
	}

	@Override
	public boolean isDirectory()
	{
		return file.isDirectory();
	}

	@Override
	public boolean isHidden()
	{
		return file.isHidden();
	}

	@Override
	public boolean isReadonly()
	{
		return file.canRead() && !file.canWrite();
	}

	@Override
	public boolean isWriteable()
	{
		return file.canWrite();
	}

	@Override
	public void write(String data, boolean append) throws IOException
	{
		if (DBG) {
			Log.d(LCAT,"write called for file = " + file);
		}
		if (!file.exists())
		{
			file.createNewFile();
		}
		FileOutputStream out = null;
		try
		{
			out = new FileOutputStream(file,append);
			out.write(data.getBytes());
			out.flush();
		}
		finally
		{
			if (out!=null)
			{
				out.close();
			}
		}
	}

	@Override
	public String read() throws IOException
	{
		if (!file.exists())
		{
			return null;
		}
		StringBuilder builder=new StringBuilder();
		FileInputStream in = null;
		try
		{
			in = new FileInputStream(file);
			byte buffer [] = new byte[4096];
			while(true)
			{
				int count = in.read(buffer);
				if (count < 0)
				{
					break;
				}
				builder.append(new String(buffer,0,count));
			}
		}
		finally
		{
			if (in!=null)
			{
				in.close();
			}
		}
		return builder.toString();
	}

	@Override
	public void createDirectory(boolean recursive)
	{
		if (recursive)
		{
			file.mkdirs();
		}
		else
		{
			file.mkdir();
		}
	}

	@Override
	public boolean deleteFile()
	{
		return file.delete();
	}

	@Override
	public boolean exists()
	{
		return file.exists();
	}

	@Override
	public double createTimestamp()
	{
		return file.lastModified();
	}

	@Override
	public double modificationTimestamp()
	{
		return file.lastModified();
	}

	@Override
	public String name()
	{
		return file.getName();
	}

	@Override
	public String extension()
	{
		String name = file.getName();
		int idx = name.lastIndexOf(".");
		if (idx != -1)
		{
			return name.substring(idx+1);
		}
		return null;
	}

	@Override
	public String nativePath()
	{
		return file.getAbsolutePath();
	}

	@Override
	public double size()
	{
		return file.length();
	}

	@Override
	public double spaceAvailable()
	{
		//FIXME
		return 99999999L;
	}

	@Override
	public boolean setReadonly()
	{
		file.setReadOnly();
		return isReadonly();
	}

	public String toString()
	{
		return path;
	}

	public File getFile()
	{
		return file;
	}
}
