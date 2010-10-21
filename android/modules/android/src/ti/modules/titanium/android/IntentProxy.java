/**
 * 
 */
package ti.modules.titanium.android;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

import android.content.Intent;
import android.net.Uri;

@Kroll.proxy(creatableInModule=AndroidModule.class)
public class IntentProxy extends KrollProxy 
{
	private static final String LCAT = "TiIntent";
	private static boolean DBG = TiConfig.LOGD;
	
	protected Intent intent;
	
	public IntentProxy(TiContext tiContext) 
	{
		super(tiContext);
	}
	
	public IntentProxy(TiContext tiContext, Intent intent) {
		super(tiContext);
		this.intent = intent;
	}
	
	public void handleCreationDict(KrollDict dict) {
		intent = new Intent();
		
		// See which set of options we have to work with.
		String action = dict.getString("action");
		String data = dict.getString("data");
		String classname = dict.getString("className");
		String packageName = dict.getString("packageName");
		String type = dict.getString("type");

		if (action != null) {
			if (DBG) {
				Log.d(LCAT, "Setting action: " + action);
			}
			intent.setAction(action);
		}
		
		if (data != null) {
			if (DBG) {
				Log.d(LCAT, "Setting data uri: " + data);
			}
			intent.setData(Uri.parse(data));
		}
		
		if (packageName != null) {
			if (DBG) {
				Log.d(LCAT, "Setting package: " + packageName);
			}
			intent.setPackage(packageName);
		}
		
		if (classname != null) {
			if (packageName != null) {
				if (DBG) {
					Log.d(LCAT, "Both className and packageName set, using intent.setClassName(packageName, className");
				}
				intent.setClassName(packageName, classname);
			} else {
				try {
					Class<?> c = getClass().getClassLoader().loadClass(classname);
					intent.setClass(getTiContext().getActivity().getApplicationContext(), c);
				} catch (ClassNotFoundException e) {
					Log.e(LCAT, "Unable to locate class for name: " + classname);
					throw new IllegalStateException("Missing class for name: " + classname, e);
				}
			}
		}
		
		if (type != null) {
			if (DBG) {
				Log.d(LCAT, "Setting type: " + type);
			} 
			intent.setType(type);
		} else {
			if (action != null && action.equals(Intent.ACTION_SEND)) {
				if (DBG) {
					Log.d(LCAT, "Intent type not set, defaulting to text/plain because action is a SEND action");
				}
				intent.setType("text/plain");
			}
		}
	}	
	
	@Kroll.method
	public void putExtra(String key, Object value) 
	{
		if (value instanceof String) {
			intent.putExtra(key, (String) value);
		} else if (value instanceof Boolean) {
			intent.putExtra(key, (Boolean) value);
		} else if (value instanceof Double) {
			intent.putExtra(key, (Double) value);
		} else if (value instanceof Integer) {
			intent.putExtra(key, (Integer) value);
		} else {
			Log.w(LCAT, "Warning unimplemented put conversion for " + value.getClass().getCanonicalName() + " trying String");
			intent.putExtra(key, TiConvert.toString(value));
		}
	}
	
	@Kroll.method
	public void addCategory(String category) {
		if (category != null) {
			if (DBG) {
				Log.d(LCAT, "Adding category: " + category);
			}
			intent.addCategory(category);
		}
	}
	
	@Kroll.method
	public String getStringExtra(String name) {
		return intent.getStringExtra(name);
	}
	
	@Kroll.method
	public boolean getBooleanExtra(String name, boolean defaultValue) {
		return intent.getBooleanExtra(name, defaultValue);
	}
	
	@Kroll.method
	public int getIntExtra(String name, int defaultValue) {
		return intent.getIntExtra(name, defaultValue);
	}
	
	@Kroll.method
	public double getDoubleExtra(String name, double defaultValue) {
		return intent.getDoubleExtra(name, defaultValue);
	}
	
	public Intent getIntent() { 
		return intent;
	}
}
