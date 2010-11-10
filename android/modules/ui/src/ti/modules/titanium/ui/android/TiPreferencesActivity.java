package ti.modules.titanium.ui.android;

import android.os.Bundle;
import android.preference.PreferenceActivity;

import org.appcelerator.titanium.TiApplication;

public class TiPreferencesActivity extends PreferenceActivity {
	private static final String DEFAULT_PREFS_RNAME = "preferences";
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		String prefsName = DEFAULT_PREFS_RNAME;
		if (getIntent().hasExtra("prefsName"))
			prefsName = getIntent().getExtras().getString("prefsName");
		
		// Find the layout file, do nothing if not found
		try {
			getPreferenceManager().setSharedPreferencesName(TiApplication.APPLICATION_PREFERENCES_NAME);
			addPreferencesFromResource(TiRHelper.getResource("xml." + prefsName));
		} catch (TiRHelper.ResourceNotFoundException e) {
			finish();
			return;
		}
	}
}
