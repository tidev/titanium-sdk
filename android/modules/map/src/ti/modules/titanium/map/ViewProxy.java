package ti.modules.titanium.map;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.app.LocalActivityManager;
import android.content.Intent;
import android.view.Window;

public class ViewProxy extends TiViewProxy
	implements OnLifecycleEvent
{

	private static LocalActivityManager lam;
	private static Window mapWindow;

	public ViewProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);

		tiContext.addOnEventChangeListener(this);
		tiContext.addOnLifecycleEventListener(this);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		if (lam == null) {
			lam = new LocalActivityManager(getTiContext().getRootActivity(), true);
			lam.dispatchCreate(null);
		}

		if (mapWindow != null) {
			throw new IllegalStateException("MapView already created. Android can support one MapView per Application.");
		}

		TiApplication tiApp = getTiContext().getTiApp();
		Intent intent = new Intent(tiApp, TiMapActivity.class);
		mapWindow = lam.startActivity("TIMAP", intent);
		return new TiMapView(this, mapWindow);
	}

	public void onDestroy() {
		if (lam != null) {
			lam.dispatchDestroy(true);
		}
		lam.destroyActivity("TIMAP", true);
		mapWindow = null;
	}

	public void onPause() {
		if (lam != null) {
			lam.dispatchPause(false);
		}
	}

	public void onResume() {
		if (lam != null) {
			lam.dispatchResume();
		}
	}

	public void onStart() {
	}

	public void onStop() {
		if (lam != null) {
			lam.dispatchStop();
		}
	}
}
