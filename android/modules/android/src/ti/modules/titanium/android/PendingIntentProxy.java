/**
 * 
 */
package ti.modules.titanium.android;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.TiConfig;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;

/**
 * @author dthorp
 *
 */
public class PendingIntentProxy extends TiProxy 
{
	private static final String LCAT = "PendingIntentProxy";
	private static boolean DBG = TiConfig.LOGD;
	
	private PendingIntent pendingIntent;
	
	public PendingIntentProxy(TiContext tiContext, Object[] args) 
	{
		super(tiContext);

		TiDict d = null;
		
		if (args != null && args.length >= 1) {
			if (args[0] instanceof TiDict) {
				d = (TiDict) args[0];
			}
		}

		if (d == null) {
			throw new IllegalStateException("Missing creation arguments.");
		}
		
		ActivityProxy activity = null;
		IntentProxy intent = null;
		int pendingIntentType = -1;
		int flags = Integer.MIN_VALUE;
		
		if (d.containsKey("activity")) {
			activity = (ActivityProxy) d.get("activity");
		}
		if (d.containsKey("intent")) {
			intent = (IntentProxy) d.get("intent");
		}
		if (d.containsKey("type")) {
			pendingIntentType = d.getInt("type");
		}
		if (d.containsKey("flags")) {
			flags = d.getInt("flags");
		}
		
		if (activity == null || intent == null || flags == Integer.MIN_VALUE ||
				(pendingIntentType < 0 || 
					pendingIntentType > AndroidModule.PENDING_INTENT_MAX_VALUE)
				) 
		{
			throw new IllegalStateException("Creation arguments must contain activity, intent, type, flags");
		}
		
		switch(pendingIntentType) {
			case AndroidModule.PENDING_INTENT_FOR_ACTIVITY : {
				pendingIntent = PendingIntent.getActivity(activity.getContext(), 0, intent.getIntent(), flags);
				break;
			}
			case AndroidModule.PENDING_INTENT_FOR_BROADCAST : {
				pendingIntent = PendingIntent.getBroadcast(activity.getActivity(), 0, intent.getIntent(), flags);
				break;
			}
			case AndroidModule.PENDING_INTENT_FOR_SERVICE : {
				pendingIntent = PendingIntent.getService(activity.getActivity(), 0, intent.getIntent(), flags);
				break;
			}
		}
	}
	
	protected PendingIntent getPendingIntent() {
		return pendingIntent;
	}

}
