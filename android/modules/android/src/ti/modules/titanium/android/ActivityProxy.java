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

public class ActivityProxy extends TiProxy 
{
	private static final String LCAT = "TiActivity";
	private static boolean DBG = TiConfig.LOGD;
		
	public ActivityProxy(TiContext tiContext, Object[] args) 
	{
		super(tiContext);

		TiDict d = null;
		
		if (args != null && args.length >= 1) {
			if (args[0] instanceof TiDict) {
				d = (TiDict) args[0];
			}
		}
		
	}		
}
