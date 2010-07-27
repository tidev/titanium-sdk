/**
 * 
 */
package ti.modules.titanium.android;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.content.Intent;
import android.net.Uri;

public class IntentProxy extends TiProxy 
{
	private static final String LCAT = "TiIntent";
	private static boolean DBG = TiConfig.LOGD;
	
	protected Intent intent;
	
	public IntentProxy(TiContext tiContext, Object[] args) 
	{
		super(tiContext);

		TiDict d = null;
		
		if (args != null && args.length >= 1) {
			if (args[0] instanceof TiDict) {
				d = (TiDict) args[0];
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
				throw new IllegalArgumentException("className not supported yet.");
			}
		}
	}	
	
	protected Intent getIntent() {
		return intent;
	}
}
