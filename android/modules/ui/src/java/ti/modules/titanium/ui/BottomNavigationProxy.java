package ti.modules.titanium.ui;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiActivityWindow;
import org.appcelerator.titanium.TiActivityWindows;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiRootActivity;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;

import java.lang.ref.WeakReference;

import ti.modules.titanium.ui.widget.TiUIBottomNavigation;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = {})
public class BottomNavigationProxy extends TiWindowProxy implements TiActivityWindow
{
	private static final String TAG = "BottomNavigation";
	Object tabs;
	private TiUIBottomNavigation bottomNavigation;
	private WeakReference<AppCompatActivity> bottomNavigationActivity = new WeakReference<>(null);

	@Override
	protected void handleOpen(KrollDict options)
	{
		Activity topActivity = TiApplication.getAppCurrentActivity();
		// Don't open if app is closing or closed
		if (topActivity == null || topActivity.isFinishing()) {
			return;
		}

		if (getProperty(TiC.PROPERTY_THEME) != null) {
			try {
				String themeName = getProperty(TiC.PROPERTY_THEME).toString();
				int theme = TiRHelper.getResource("style."
					+ themeName.replaceAll("[^A-Za-z0-9_]", "_"));
				topActivity.setTheme(theme);
				topActivity.getApplicationContext().setTheme(theme);
			} catch (Exception e) {
			}
		}
		Intent intent = new Intent(topActivity, TiActivity.class);
		fillIntent(topActivity, intent);

		int windowId = TiActivityWindows.addWindow(this);
		intent.putExtra(TiC.INTENT_PROPERTY_WINDOW_ID, windowId);

		boolean animated = TiConvert.toBoolean(options, TiC.PROPERTY_ANIMATED, true);
		if (!animated) {
			intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION);
			topActivity.startActivity(intent);
			topActivity.overridePendingTransition(0, 0);
		} else if (options.containsKey(TiC.PROPERTY_ACTIVITY_ENTER_ANIMATION)
			|| options.containsKey(TiC.PROPERTY_ACTIVITY_EXIT_ANIMATION)) {
			topActivity.startActivity(intent);
			int enterAnimation = TiConvert.toInt(options.get(TiC.PROPERTY_ACTIVITY_ENTER_ANIMATION), 0);
			int exitAnimation = TiConvert.toInt(options.get(TiC.PROPERTY_ACTIVITY_EXIT_ANIMATION), 0);
			topActivity.overridePendingTransition(enterAnimation, exitAnimation);
		} else {
			topActivity.startActivity(intent);
			if (topActivity instanceof TiRootActivity) {
				// A fade-in transition from root splash screen to first window looks better than a slide-up.
				// Also works-around issue where splash in mid-transition might do a 2nd transition on cold start.
				topActivity.overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
			}
		}
	}

	@Override
	protected void handleClose(@NonNull KrollDict options)
	{
		// Remove this TabGroup proxy from the active/open collection.
		// Note: If the activity's onCreate() can't find this proxy, then it'll automatically destroy itself.
		//       This is needed in case the proxy's close() method was called before the activity was created.
		TiActivityWindows.removeWindow(this);
		bottomNavigationActivity.clear();
		bottomNavigation.release();
		// Release views/resources.
		modelListener = null;
		releaseViews();
		view = null;

		// Destroy this proxy's activity.
		AppCompatActivity activity = (bottomNavigationActivity != null) ? bottomNavigationActivity.get() : null;
		bottomNavigationActivity = null;
		if (activity != null && !activity.isFinishing() && !activity.isDestroyed()) {
			activity.finish();
		}

		// NOTE: this does not directly fire the close event, but is fired by closeFromActivity()
	}

	@Override
	protected Activity getWindowActivity()
	{
		return (bottomNavigationActivity != null) ? bottomNavigationActivity.get() : null;
	}

	@Override
	public void windowCreated(TiBaseActivity activity, Bundle savedInstanceState)
	{
		bottomNavigationActivity = new WeakReference<>(activity);
		activity.setWindowProxy(this);
		activity.setLayoutProxy(this);
		setActivity(activity);

		view = new TiUIBottomNavigation(this, activity);

		setModelListener(view);
	}

	@Override
	public void handleCreationDict(KrollDict options)
	{
		super.handleCreationDict(options);
		// Support setting orientation modes at creation.
		Object orientationModes = options.get(TiC.PROPERTY_ORIENTATION_MODES);
		if (orientationModes instanceof Object[]) {
			try {
				int[] modes = TiConvert.toIntArray((Object[]) orientationModes);
				setOrientationModes(modes);

			} catch (ClassCastException e) {
				Log.e(TAG, "Invalid orientationMode array. Must only contain orientation mode constants.");
			}
		}

		if (options.containsKeyAndNotNull(TiC.PROPERTY_TABS)) {
			tabs = options.get(TiC.PROPERTY_TABS);
			TiUIBottomNavigation tabGroup = (TiUIBottomNavigation) view;
			if (tabGroup != null) {
				tabGroup.setTabs(tabs);
			}
		}
	}

}
