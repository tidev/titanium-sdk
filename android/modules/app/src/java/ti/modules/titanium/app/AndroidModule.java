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

	@Kroll.method
	public ActivityProxy getTopActivity()
	{
		Activity top = TiApplication.getInstance().getCurrentActivity();
		if (top == null || !(top instanceof TiBaseActivity)) {
			return null;
		}

		TiBaseActivity tiActivity = (TiBaseActivity) top;
		return tiActivity.getActivityProxy();
	}
}
