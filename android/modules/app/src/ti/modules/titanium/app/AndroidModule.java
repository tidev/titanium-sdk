package ti.modules.titanium.app;

import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.RProxy;

@Kroll.module(parentModule=AppModule.class)
public class AndroidModule extends KrollModule {

	protected RProxy r;
	
	public AndroidModule(TiContext context) {
		super(context);
	}
	
	@Kroll.getProperty(name="R")
	public RProxy getR(KrollInvocation invocation) {
		if (r == null) {
			r = new RProxy(invocation.getTiContext(), RProxy.RESOURCE_TYPE_APPLICATION);
		}
		return r;
	}
}
