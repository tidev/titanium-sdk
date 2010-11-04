package ti.modules.titanium.ui.android;

import android.os.Bundle;
import android.preference.PreferenceActivity;

import org.appcelerator.titanium.TiApplication;

public class TiPreferencesActivity extends PreferenceActivity {
	private static final String PREFS_RES_NAME = "preferences";
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		// Find the layout file, do nothing if not found
		int layout = 0;
		try {
			String xmlClass = getApplication().getApplicationInfo().packageName + ".R$xml";
			layout = Class.forName(xmlClass).getDeclaredField(PREFS_RES_NAME).getInt(null);
		} catch (Exception e) {
			e.printStackTrace();
			finish();
			return;
		}
		
		getPreferenceManager().setSharedPreferencesName(TiApplication.APPLICATION_PREFERENCES_NAME);
		addPreferencesFromResource(layout);
	}
}
