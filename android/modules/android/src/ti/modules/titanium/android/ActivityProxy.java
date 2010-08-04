/**
 * 
 */
package ti.modules.titanium.android;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.content.Context;
import android.content.Intent;

public class ActivityProxy extends TiProxy 
{
	private static final String LCAT = "TiActivity";
	private static boolean DBG = TiConfig.LOGD;
		
	//TODO This may need to be a soft reference.
	private TiBaseActivity activity;
	
	public ActivityProxy(TiContext tiContext, Object[] args) 
	{
		super(tiContext);

		TiDict d = null;
		
		if (args != null && args.length >= 1) {
			if (args[0] instanceof TiDict) {
				if (DBG) {
					Log.d("LCAT", "ActivityProxy created with dictionary");
				}
				d = (TiDict) args[0];
			} else if (args[0] instanceof TiBaseActivity) {
				if (DBG) {
					Log.d(LCAT, "ActivityProxy created with existing Activity");
				}
				activity = (TiBaseActivity) args[0];
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
	
	protected Context getContext() {
		if (activity == null) {
			return getTiContext().getActivity().getApplication();
		}
		return activity;
	}
	
	protected TiBaseActivity getActivity() {
		return activity;
	}
	
	protected void release() {
		activity = null;
	}
}
