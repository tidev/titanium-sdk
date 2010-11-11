package org.appcelerator.titanium.util;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.titanium.TiApplication;

import android.util.Log;

/*
 * A Class which allows us to pull resource integers 
 * off of the various R class structures using
 * strings at runtime.
 */
public class TiRHelper {
	private static final String LCAT = "TiRHelper";
	
	private static Map<String, Class<?>> clsCache = Collections.synchronizedMap(new HashMap<String, Class<?>>());
	private static Map<String, Integer>  valCache = Collections.synchronizedMap(new HashMap<String, Integer>());
	
	public static final class ResourceNotFoundException extends ClassNotFoundException {
		private static final long serialVersionUID = 119234857198273641L;
		
		public ResourceNotFoundException(String resource) {
			super("Resource not found: " + resource);
		}
	}

	public static enum RType {
		ANDROID,
		APPLICATION,
		// Does Ti have its own R that should be represented here?
	}
	
	public static int getResource(RType type, String path) throws ResourceNotFoundException {
		// Check the cache for this value
		String tp = type.toString() + "/" + path;
		Integer i = valCache.get(tp);
		if (i != null) return i;

		// Get the classname / fieldname
		int lastseg = path.lastIndexOf('.');
		String classname = lastseg < 0 ? ""   : path.substring(0, lastseg < 0 ? 1 : lastseg).replace('.', '$');
		String fieldname = lastseg < 0 ? path : path.substring(lastseg + 1);
		
		// Check the cache for the class value
		String tc = type.toString() + "/" + classname;
		Class<?> cls = clsCache.get(tc);
		if (cls == null) {
			// Figure out what the base classname is based on the type of R we will query
			switch (type) {
			case ANDROID:
				classname = "android.R$" + classname;
				break;
			case APPLICATION:
			default:
				classname = TiApplication.getInstance().getApplicationInfo().packageName + ".R$" + classname;
				break;
			}
			
			// Get the Class
			try {
				cls = Class.forName(classname);
				clsCache.put(tc, cls);
			} catch (ClassNotFoundException e) {
				Log.w(LCAT, "Unable to find resource: " + e.getMessage());
				throw new TiRHelper.ResourceNotFoundException(path);
			}
		}
		
		// Load the field
		try {
			i = cls.getDeclaredField(fieldname).getInt(null);
		} catch (Exception e) {
			Log.w(LCAT, "Unable to find resource: " + e.getMessage());
			throw new TiRHelper.ResourceNotFoundException(path);
		}
		
		valCache.put(tp, i);
		return i;
	}
	
	public static int getResource(String path) throws ResourceNotFoundException {
		try {
			return getResource(RType.APPLICATION, path);
		}
		catch (ResourceNotFoundException e) {
			return getResource(RType.ANDROID, path);
		}
	}
	
	public static int getString(String path) throws ResourceNotFoundException {
		return getResource("string." + path);
	}
}
