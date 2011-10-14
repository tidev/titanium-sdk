package ti.modules.titanium.app;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.ITiAppInfo;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;

@Kroll.module
public class AppModule extends KrollModule
{
	private ITiAppInfo appInfo;

	public AppModule()
	{
		super("App");

		TiApplication.getInstance().addAppEventProxy(this);
		appInfo = TiApplication.getInstance().getAppInfo();
	}

	public AppModule(TiContext tiContext)
	{
		this();
	}

	public void onDestroy() {
		TiApplication.getInstance().removeAppEventProxy(this);
	}

	@Kroll.getProperty(name="id") @Kroll.method
	public String getID() {
		return appInfo.getId();
	}

	@Kroll.getProperty @Kroll.method
	public String getName() {
		return appInfo.getName();
	}

	@Kroll.getProperty @Kroll.method
	public String getVersion() {
		return appInfo.getVersion();
	}

	@Kroll.getProperty @Kroll.method
	public String getPublisher() {
		return appInfo.getPublisher();
	}

	@Kroll.getProperty(name="url") @Kroll.method
	public String getURL() {
		return appInfo.getUrl();
	}

	@Kroll.getProperty @Kroll.method
	public String getDescription() {
		return appInfo.getDescription();
	}

	@Kroll.getProperty @Kroll.method
	public String getCopyright() {
		return appInfo.getCopyright();
	}

	@Kroll.getProperty(name="guid") @Kroll.method
	public String getGUID() {
		return appInfo.getGUID();
	}

	@Kroll.getProperty @Kroll.method
	public Object[] getArguments() {
		return new Object[0];
	}

	@Kroll.method
	public String appURLToPath(String url) {
		return resolveUrl(null, url);
	}
}
