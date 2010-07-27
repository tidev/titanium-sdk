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
	
	public void start(Object[] args) 
	{
		if (args == null || args.length == 0) {
			Log.w(LCAT, "Ignoring start request. missing Intent");
			return;
		}
		
		if (args[0] instanceof IntentProxy) {
			IntentProxy ip = (IntentProxy) args[0];
			Intent intent = ip.getIntent();
			
			this.getTiContext().getActivity().startActivity(intent);
		} else {
			Log.e(LCAT, "Expected IntentProxy. Received " + args[0].getClass().getCanonicalName());
		}
	}
}
