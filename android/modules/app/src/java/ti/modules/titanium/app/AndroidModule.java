package ti.modules.titanium.app;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.RProxy;

import android.app.Activity;

@Kroll.module(parentModule=AppModule.class)
public class AndroidModule extends KrollModule
{
	private static final String TAG = "AndroidModule";

	protected RProxy r;


	public AndroidModule()
	{
		super();
	}

	public AndroidModule(TiContext context)
	{
		this();
	}

	@Kroll.getProperty(name="R")
	public RProxy getR()
	{
		if (r == null) {
			r = new RProxy(RProxy.RESOURCE_TYPE_APPLICATION);
		}
		return r;
	}

	// this shouldn't be called from anything other than the runtime thread
	@Kroll.method
	public ActivityProxy getTopActivity()
	{
		try {
			TiApplication.getInstance().rootActivityLatch.await();

		} catch (InterruptedException e) {
			e.printStackTrace();
		}

		Activity activity = TiApplication.getInstance().getCurrentActivity();
		if (activity == null || !(activity instanceof TiBaseActivity)) {
			activity = TiApplication.getInstance().getRootActivity();
		}

		return ((TiBaseActivity)activity).getActivityProxy();
	}
}

