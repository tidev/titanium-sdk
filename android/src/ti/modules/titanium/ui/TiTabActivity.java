package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TitaniumCompositeLayout;

import ti.modules.titanium.ui.widget.TiUITabGroup;
import android.app.ActivityGroup;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.Window;
import android.view.WindowManager;

public class TiTabActivity extends ActivityGroup
{
	private static final String LCAT = "TiTabActivity";
	private static final boolean DBG = TiConfig.LOGD;

	protected TitaniumCompositeLayout layout;
	protected TabGroupProxy proxy;
	protected TiUITabGroup tg;
	protected Handler handler;

	public TiTabActivity() {
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);
		handler = new Handler();

		final TiTabActivity me = this;

       layout = new TitaniumCompositeLayout(this);

        Intent intent = getIntent();

        boolean fullscreen = false;
        boolean navbar = false;

        if (intent != null) {
        	if (intent.hasExtra("fullscreen")) {
        		fullscreen = intent.getBooleanExtra("fullscreen", fullscreen);
        	}
        	if (intent.hasExtra("navBarHidden")) {
        		navbar = intent.getBooleanExtra("navBarHidden", navbar);
        	}
        	if (intent.hasExtra("proxyId")) {
        		String proxyId = intent.getStringExtra("proxyId");
        		proxy = (TabGroupProxy) ((TiApplication) getApplication()).unregisterProxy(proxyId);
        	}
        }

        if (fullscreen) {
        	getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }

        if (navbar) {
        	this.requestWindowFeature(Window.FEATURE_LEFT_ICON); // TODO Keep?
	        this.requestWindowFeature(Window.FEATURE_RIGHT_ICON);
	        this.requestWindowFeature(Window.FEATURE_PROGRESS);
	        this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
        } else {
           	this.requestWindowFeature(Window.FEATURE_NO_TITLE);
        }

        setContentView(layout);

        if (proxy != null) {

        	tg = new TiUITabGroup(proxy, this);

        	handler.post(new Runnable(){

				@Override
				public void run() {
		        	proxy.handlePostOpen(me);
				}
			});
        }
	}

    public TiApplication getTiApp() {
    	return (TiApplication) getApplication();
    }

    public TitaniumCompositeLayout getLayout() {
    	return layout;
    }

    public TiUITabGroup getTabGroup() {
    	return tg;
    }

	@Override
	public void finish()
	{
		Intent intent = getIntent();
		if (intent != null) {
			if (intent.getBooleanExtra("finishRoot", false)) {
				((TiApplication) getApplication()).getRootActivity().finish();
			}
		}
		super.finish();
	}

}
