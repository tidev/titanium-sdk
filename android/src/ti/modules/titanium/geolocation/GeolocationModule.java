package ti.modules.titanium.geolocation;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.TiConfig;

public class GeolocationModule
	extends TiModule
{
	private static final String LCAT = "TiGeo";
	private static final boolean DBG = TiConfig.LOGD;

	private static TiDict constants;

	private TiLocation tiLocation;
	private TiCompass tiCompass;


	public GeolocationModule(TiContext tiContext)
	{
		super(tiContext);

		tiLocation = new TiLocation(this);
		tiCompass = new TiCompass(this);

		tiContext.addOnEventChangeListener(this);
	}

	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			constants.put("ACCURACY_BEST", TiLocation.ACCURACY_BEST);
			constants.put("ACCURACY_NEAREST_TEN_METERS", TiLocation.ACCURACY_NEAREST_TEN_METERS);
			constants.put("ACCURACY_HUNDRED_METERS", TiLocation.ACCURACY_HUNDRED_METERS);
			constants.put("ACCURACY_HUNDRED_METERS", TiLocation.ACCURACY_HUNDRED_METERS);
			constants.put("ACCURACY_THREE_KILOMETERS", TiLocation.ACCURACY_THREE_KILOMETERS);
		}

		return constants;
	}

	public boolean locationServicesEnabled() {
		return tiLocation.isLocationEnabled();
	}

	public boolean hasCompass() {
		return tiCompass.hasCompass();
	}

	public void getCurrentHeading(KrollCallback listener)
	{
		if(listener != null) {
			tiCompass.getCurrentHeading(listener);
		}
	}

	public void getCurrentPosition(KrollCallback listener)
	{
		if (listener != null) {
			tiLocation.getCurrentPosition(listener);
		}
	}

	@Override
	public void listenerAdded(String eventName, int count, TiProxy proxy) {
		super.listenerAdded(eventName, count, proxy);

		if (proxy != null && proxy.equals(this)) {
			if (eventName != null) {
				if (eventName.equals(TiLocation.EVENT_LOCATION)) {
					tiLocation.manageLocationListener(true);
				} else if (eventName.equals(TiCompass.EVENT_HEADING)) {
					tiCompass.manageUpdateListener(true);
				}
			}
		}
	}

	@Override
	public void listenerRemoved(String eventName, int count, TiProxy proxy) {
		super.listenerRemoved(eventName, count, proxy);

		if (proxy != null && proxy.equals(this)) {
			if (eventName != null && count == 0) {
				if (eventName.equals(TiLocation.EVENT_LOCATION)) {
					tiLocation.manageLocationListener(false);
				} else if (eventName.equals(TiCompass.EVENT_HEADING)) {
					tiCompass.manageUpdateListener(false);
				}
			}
		}
	}

	// Lifecycle

	@Override
	public void onResume() {
		super.onResume();

		tiLocation.onResume();
		tiCompass.onResume();
	}

	@Override
	public void onPause() {
		super.onPause();

		tiLocation.onPause();
		tiCompass.onPause();
	}
}