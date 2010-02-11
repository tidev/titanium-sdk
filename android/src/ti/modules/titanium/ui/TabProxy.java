package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiViewProxy;
import org.appcelerator.titanium.view.TiWindowProxy;

import android.app.Activity;

public class TabProxy extends TiViewProxy
{
	private static final String LCAT = "TabProxy";
	private static final boolean DBG = TiConfig.LOGD;

	public TabProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return null;
	}

	public void open(TiWindowProxy win, TiDict args) {
		Log.e(LCAT, "OPEN ME IT");


	}

	public void close(TiDict args) {

	}
}
