package org.appcelerator.titanium;

import android.app.Activity;
import android.app.KeyguardManager;
import android.app.KeyguardManager.KeyguardLock;
import android.os.Bundle;

public class UnlockScreenActivity extends Activity {
	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		KeyguardManager keyguardManager = 
			(KeyguardManager)getSystemService(Activity.KEYGUARD_SERVICE); 
		KeyguardLock lock = 
			keyguardManager.newKeyguardLock(KEYGUARD_SERVICE); 
		lock.disableKeyguard(); 
		finish(); 
	}
}