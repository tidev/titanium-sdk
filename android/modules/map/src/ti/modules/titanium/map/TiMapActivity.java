package ti.modules.titanium.map;

import org.appcelerator.titanium.TiContext.OnLifecycleEvent;

import android.os.Bundle;

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
	protected void onCreate(Bundle arg0) {
		super.onCreate(arg0);
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

	@Override
	protected void onDestroy() {
		super.onDestroy();

		if (lifecyleListener != null) {
			lifecyleListener.onDestroy();
		}
	}


}
