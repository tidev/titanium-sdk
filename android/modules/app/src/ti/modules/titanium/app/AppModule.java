package ti.modules.titanium.app;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.ITiAppInfo;
import org.appcelerator.titanium.TiContext;

public class AppModule extends TiModule
{

	private ITiAppInfo appInfo;

	public AppModule(TiContext tiContext) {
		super(tiContext);

		getTiContext().getTiApp().addAppEventProxy(this);
		appInfo = getTiContext().getTiApp().getAppInfo();
	}

	@Override
	public void onDestroy() {
		getTiContext().getTiApp().removeAppEventProxy(this);

		super.onDestroy();
	}

	public int addEventListener(String event, IKrollCallable listener)
	{
		return super.addEventListener(event, listener);
	}

	// Try to support both event listeners + listener IDs
	public void removeEventListener(String event, Object listener)
	{
		super.removeEventListener(event, listener);
	}

	public boolean fireEvent(String event, KrollDict data)
	{
		return getTiContext().getTiApp().fireAppEvent(event, data);
	}

	public String getID() {
		return appInfo.getId();
	}

	public String getName() {
		return appInfo.getName();
	}

	public String getVersion() {
		return appInfo.getVersion();
	}

	public String getPublisher() {
		return appInfo.getPublisher();
	}

	public String getURL() {
		return appInfo.getUrl();
	}

	public String getDescription() {
		return appInfo.getDescription();
	}

	public String getCopyright() {
		return appInfo.getCopyright();
	}

	public String getGUID() {
		return appInfo.getGUID();
	}

	public Object[] getArguments() {
		return new Object[0];
	}

	public String appURLToPath(String url) {
		return getTiContext().resolveUrl(null, url);
	}
}
