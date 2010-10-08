/**
 * 
 */
package ti.modules.titanium.android;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConfig;

import android.app.PendingIntent;

/**
 * @author dthorp
 *
 */
@Kroll.proxy(creatableInModule=AndroidModule.class)
public class PendingIntentProxy extends KrollProxy 
{
	private static final String LCAT = "PendingIntentProxy";
	private static boolean DBG = TiConfig.LOGD;
	
	private PendingIntent pendingIntent;
	
	public PendingIntentProxy(TiContext tiContext) 
	{
		super(tiContext);
	}
	
	@Override
	public void handleCreationArgs(Object[] args) {
		if (args.length == 0 || !(args[0] instanceof KrollDict)) {
			throw new IllegalStateException("Missing creation arguments.");
		}
		
		super.handleCreationArgs(args);
	}
	
	public void handleCreationDict(KrollDict dict) {
		ActivityProxy activity = null;
		IntentProxy intent = null;
		int pendingIntentType = -1;
		int flags = Integer.MIN_VALUE;
		
		if (dict.containsKey("activity")) {
			activity = (ActivityProxy) dict.get("activity");
		}
		if (dict.containsKey("intent")) {
			intent = (IntentProxy) dict.get("intent");
		}
		if (dict.containsKey("type")) {
			pendingIntentType = dict.getInt("type");
		}
		if (dict.containsKey("flags")) {
			flags = dict.getInt("flags");
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
