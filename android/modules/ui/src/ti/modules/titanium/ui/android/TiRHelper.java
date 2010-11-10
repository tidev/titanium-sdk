package ti.modules.titanium.ui.android;

import org.appcelerator.titanium.TiApplication;

import android.util.Log;

/*
 * A Class which allows us to pull resource integers 
 * off of the various R class structures using
 * strings at runtime.
 */
public class TiRHelper {
	private static final String LCAT = "TiRHelper";
	
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
		// Figure out what the base classname is based on the type of R we will query
		String classname = "";
		String fieldname = "";
		switch (type) {
		case ANDROID:
			classname = "android.R";
			break;
		case APPLICATION:
		default:
			classname = TiApplication.getInstance().getApplicationInfo().packageName + ".R";
			break;
		}
		
		// Get the fieldname and any extra path (as internal classes)
		if (path.lastIndexOf('.') < 0)
			fieldname = path;
		else {
			classname = classname + "$" + path.substring(0, path.lastIndexOf('.')).replace('.', '$');
			fieldname = path.substring(path.lastIndexOf('.')+1);
		}

	
		// Get the resource int id
		try {
			return Class.forName(classname).getDeclaredField(fieldname).getInt(null);
		} catch (Exception e) {
			Log.w(LCAT, "Unable to find resource: " + e.getMessage());
			throw new ResourceNotFoundException(path);
		}
	}
	
	public static int getResource(String path) throws ResourceNotFoundException {
		try {
			return getResource(RType.APPLICATION, path);
		}
		catch (ResourceNotFoundException e) {
			return getResource(RType.ANDROID, path);
		}
	}
}
