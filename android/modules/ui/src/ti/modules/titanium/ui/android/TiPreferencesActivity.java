package ti.modules.titanium.ui.android;

import android.os.Bundle;
import android.preference.PreferenceActivity;

import org.appcelerator.titanium.TiApplication;

public class TiPreferencesActivity extends PreferenceActivity {
	private static final String DEFAULT_PREFS_RNAME = "preferences";
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		// Find the layout file, do nothing if not found
		try {
			getPreferenceManager().setSharedPreferencesName(TiApplication.APPLICATION_PREFERENCES_NAME);
			addPreferencesFromResource(TiRHelper.getResource("xml." + DEFAULT_PREFS_RNAME));
		} catch (TiRHelper.ResourceNotFoundException e) {
			finish();
			return;
		}
	}
}
