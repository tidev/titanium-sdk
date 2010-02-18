package ti.modules.titanium.ui.iphone;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

public class GroupedViewProxy extends TiViewProxy
{
	private static final String LCAT = "GroupedViewProxy";

	public GroupedViewProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return null;
	}

	public void hideStatusBar() {
		Log.w(LCAT, "hideStatusBar not valid on Android");
	}

	public void showStatusBar() {
		Log.w(LCAT, "showStatusBar not valid on Android");
	}
}
