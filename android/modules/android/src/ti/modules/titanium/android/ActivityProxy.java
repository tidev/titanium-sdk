/**
 * 
 */
package ti.modules.titanium.android;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;

@Kroll.proxy(creatableInModule=AndroidModule.class)
public class ActivityProxy 
	extends KrollProxy
{
	private static final String LCAT = "TiActivity";
	private static boolean DBG = TiConfig.LOGD;
		
	//TODO This may need to be a soft reference.
	private TiBaseActivity activity;
	
	public ActivityProxy(TiContext tiContext) 
	{
		super(tiContext);
	}
	
	@Override
	public void handleCreationArgs(KrollModule createdInModule, Object[] args) {
		super.handleCreationArgs(createdInModule, args);
		if (args != null && args.length >= 1) {
			if (args[0] instanceof TiBaseActivity) {
				if (DBG) {
					Log.d(LCAT, "ActivityProxy created with existing Activity");
				}
				activity = (TiBaseActivity) args[0];
			}
		}
	}
	
	@Kroll.method
	public void start(IntentProxy intentProxy) 
	{
		Intent intent = intentProxy.getIntent();
		this.getTiContext().getActivity().startActivity(intent);
	}
	
	@Kroll.method
	public IntentProxy getIntent()
	{
		IntentProxy ip = null;
		Activity a = activity;
		
		if (a == null) {
			a = getTiContext().getActivity();
			if (a == null) {
				a = getTiContext().getRootActivity();
			}
		}
		
		if (a != null) {
			Intent intent = a.getIntent();
			if (intent != null) {
				ip = new IntentProxy(getTiContext(), intent);
			}
		}
		
		return ip;
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
