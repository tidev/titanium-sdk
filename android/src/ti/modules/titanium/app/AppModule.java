package ti.modules.titanium.app;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.kroll.KrollCallback;

public class AppModule extends TiModule {

	public AppModule(TiContext tiContext) {
		super(tiContext);
		
		getTiContext().getTiApp().addAppEventProxy(this);
	}
	
	@Override
	public void onDestroy() {
		getTiContext().getTiApp().removeAppEventProxy(this);
		
		super.onDestroy();
	}
		
	public int addEventListener(String event, KrollCallback listener)
	{
		return super.addEventListener(event, listener);
	}
	
	// Try to support both event listeners + listener IDs
	public void removeEventListener(String event, Object listener)
	{
		super.removeEventListener(event, listener);
	}
	
	public void fireEvent(String event, TiDict data)
	{
		getTiContext().getTiApp().fireAppEvent(event, data);
	}
}
