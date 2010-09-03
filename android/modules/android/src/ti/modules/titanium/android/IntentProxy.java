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

@Kroll.proxy
public class IntentProxy extends KrollProxy 
{
	private static final String LCAT = "TiIntent";
	private static boolean DBG = TiConfig.LOGD;
	
	protected Intent intent;
	
	public IntentProxy(TiContext tiContext, Object[] args) 
	{
		super(tiContext);

		KrollDict d = null;
		
		if (args != null && args.length >= 1) {
			if (args[0] instanceof KrollDict) {
				d = (KrollDict) args[0];
			}
		}
		
		intent = new Intent();
		
		// See which set of options we have to work with.

		if (d != null) {
			String action = d.getString("action");
			String data = d.getString("data");
			String classname = d.getString("className");

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
			
			if (classname != null) {
				try {
					Class c = getClass().getClassLoader().loadClass(classname);
					intent.setClass(tiContext.getActivity().getApplicationContext(), c);
				} catch (ClassNotFoundException e) {
					Log.e(LCAT, "Unable to locate class for name: " + classname);
					throw new IllegalStateException("Missing class for name: " + classname, e);
				}
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
	
	protected Intent getIntent() { 
		return intent;
	}
}
