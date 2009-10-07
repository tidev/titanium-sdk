package org.appcelerator.titanium.module.fs;

import java.io.File;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumFileHelper;

public class TitaniumFileFactory
{
	private static final String LCAT = "TitaniumFileFactory";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public static TitaniumBaseFile createTitaniumFile(
		TitaniumModuleManager tmm, String[] parts, boolean stream)
	{
		TitaniumBaseFile file = null;

		String initial = parts[0];
		if (DBG) {
			Log.d(LCAT,"creating initial: " + initial);
		}

		if (initial.startsWith("app://")) {
			String path = initial.substring(6);
			path = formPath(path,parts);
			file = new TitaniumResourceFile(tmm, path);
		}
		else if (initial.startsWith("appdata://")) {
			String path = initial.substring(10);
			path = formPath(path,parts);
			if (path.charAt(0)=='/')
			{
				path = path.substring(1);
			}
			File f = new File(getDataDirectory(tmm, false),path);
			file = new TitaniumFile(tmm, f,"appdata://"+path, stream);
		}
		else if (initial.startsWith("appdata-private://")) {
			String path = initial.substring(18);
			path = formPath(path,parts);
			File f = new File(getDataDirectory(tmm, true),path);
			file = new TitaniumFile(tmm, f,"appdata-private://"+path, stream);
		} else if (initial.startsWith("file://")) {
			String path = initial.substring(7);
			path = formPath(path, parts);
			file = new TitaniumFile(tmm, new File(path), "file://" + path, stream);
		} else if (initial.startsWith("content://")) {
			String path = initial.substring(10);
			path = formPath(path, parts);
			file = new TitaniumBlob(tmm, "content://" + path);
		} else if (initial.startsWith("/")) {
			String path = "";

			path = formPath(path, insertBefore(path,parts));
			file = new TitaniumFile(tmm, new File(path), "file://" + path, stream);
		} else {
			String path = "";
			path = formPath(path,insertBefore(path,parts));
			File f = new File(getDataDirectory(tmm, true),path);
			file = new TitaniumFile(tmm, f,"appdata-private://"+path, stream);
		}

		return file;
	}

	private static String[] insertBefore(String path, String[] parts) {
		String[] p = new String[parts.length + 1];
		p[0] = path;
		for(int i = 0; i < parts.length; i++) {
			p[i+1] = parts[i];
		}
		return p;
	}

	private static String formPath(String path, String parts[])
	{
		if (!path.endsWith("/") && path.length() > 0 && parts.length > 1)
		{
			path+="/";
		}
		for (int c=1;c<parts.length;c++)
		{
			String part = parts[c];
			path += part;
			if (c+1<parts.length && !part.endsWith("/"))
			{
				path+="/";
			}
		}
		return path;
	}

	public static File getDataDirectory (TitaniumModuleManager tmm, boolean privateStorage)
	{
		TitaniumFileHelper tfh = new TitaniumFileHelper(tmm.getAppContext());
		return tfh.getDataDirectory(privateStorage);
	}


}
