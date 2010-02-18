package ti.modules.titanium.map;

import org.appcelerator.titanium.TiContext.OnLifecycleEvent;

import com.google.android.maps.MapActivity;

public class TiMapActivity extends MapActivity
{

	OnLifecycleEvent lifecyleListener;

	public TiMapActivity() {
	}

	public void setLifecycleListener(OnLifecycleEvent lifecycleListener) {
		this.lifecyleListener = lifecycleListener;
	}

	@Override
	protected boolean isRouteDisplayed() {
		return false;
	}

	@Override
	protected void onPause() {
		super.onPause();

		if (lifecyleListener != null) {
			lifecyleListener.onPause();
		}
	}

	@Override
	protected void onResume() {
		super.onResume();

		if (lifecyleListener != null) {
			lifecyleListener.onResume();
		}
	}
}
