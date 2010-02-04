package org.appcelerator.titanium;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiActivitySupportHelper;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TitaniumCompositeLayout;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.Window;

public class TiActivity extends Activity
	implements TiActivitySupport
{
	private static final String LCAT = "TiActivity";
	private static final boolean DBG = TiConfig.LOGD;

	protected TiContext tiContext;
	protected TitaniumCompositeLayout layout;
	protected TiActivitySupportHelper supportHelper;

	public TiActivity() {
		super();
	}

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        layout = new TitaniumCompositeLayout(this);
        if (false) {
        	if (DBG) {
        		Log.d(LCAT, "Enabling No Title feature");
        	}
        	this.requestWindowFeature(Window.FEATURE_NO_TITLE);
        	//fullscreen = true;
        } else {
        	if (DBG) {
        		Log.d(LCAT, "Enabling Title area features");
        	}
	        this.requestWindowFeature(Window.FEATURE_RIGHT_ICON);
	        this.requestWindowFeature(Window.FEATURE_PROGRESS);
	        this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
			setProgressBarVisibility(true);
			setProgress(5000);
        }
        setContentView(layout);
    }

    public TiApplication getTiApp() {
    	return (TiApplication) getApplication();
    }

    public TitaniumCompositeLayout getLayout() {
    	return layout;
    }

	// Activity Support
	public int getUniqueResultCode() {
		if (supportHelper == null) {
			this.supportHelper = new TiActivitySupportHelper(this);
		}
		return supportHelper.getUniqueResultCode();
	}

	public void launchActivityForResult(Intent intent, int code, TiActivityResultHandler resultHandler)
	{
		if (supportHelper == null) {
			this.supportHelper = new TiActivitySupportHelper(this);
		}
		supportHelper.launchActivityForResult(intent, code, resultHandler);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		super.onActivityResult(requestCode, resultCode, data);

		supportHelper.onActivityResult(requestCode, resultCode, data);
	}
}
