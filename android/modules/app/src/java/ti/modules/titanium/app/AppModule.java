package ti.modules.titanium.app;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.ITiAppInfo;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiPlatformHelper;

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

	@Kroll.getProperty @Kroll.method
	public String getId() {
		return appInfo.getId();
	}

	@Kroll.method
	public String getID() {
		return getId();
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

	@Kroll.getProperty @Kroll.method
	public String getUrl() {
		return appInfo.getUrl();
	}

	@Kroll.method
	public String getURL() {
		return getUrl();
	}

	@Kroll.getProperty @Kroll.method
	public String getDescription() {
		return appInfo.getDescription();
	}

	@Kroll.getProperty @Kroll.method
	public String getCopyright() {
		return appInfo.getCopyright();
	}

	@Kroll.getProperty @Kroll.method
	public String getGuid() {
		return appInfo.getGUID();
	}

	@Kroll.method
	public String getGUID() {
		return getGuid();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getDeployType() {
		return TiApplication.getInstance().getDeployType();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getSessionId() {
		return TiPlatformHelper.getSessionId();
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean getAnalytics() {
		return appInfo.isAnalyticsEnabled();
	}
	
	@Kroll.method
	public String appURLToPath(String url) {
		return resolveUrl(null, url);
	}
}
