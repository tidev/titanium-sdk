package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiToolbarStyleHandler;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Rect;
import android.os.Build;
import android.os.Message;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;

public class TiToolbar extends TiUIView
{
	//region private primitive fields
	private final int BACKGROUND_TRANSLUCENT_VALUE = 92;
	private final int BACKGROUND_SOLID_VALUE = 255;
	//endregion
	//region private Object fields
	private Toolbar toolbar;
	private Object logo = null;
	private Object navigationIcon = null;
	private Object overflowMenuIcon = null;
	private TiViewProxy[] viewProxiesArray;
	//endregion

	/**
	 * Constructs a TiUIView object with the associated proxy.
	 * @param proxy the associated proxy.
	 * @module.api
	 */
	public TiToolbar(TiViewProxy proxy)
	{
		super(proxy);
		toolbar = new Toolbar(proxy.getActivity()) {
			@Override
			protected void onConfigurationChanged(Configuration newConfig)
			{
				// If auto-sized, then resize toolbar height and font size to what's defined in XML.
				// Note: Typically, the default height is 56dp in portrait and 48dp in landscape.
				TiCompositeLayout.LayoutParams params = TiToolbar.this.getLayoutParams();
				boolean isAutoSized = (params != null) ? params.hasAutoSizedHeight() : true;
				if (isAutoSized) {
					TiToolbarStyleHandler styleHandler = new TiToolbarStyleHandler(this);
					styleHandler.onConfigurationChanged(newConfig);
				}
				super.onConfigurationChanged(newConfig);
			}

			@Override
			public WindowInsets onApplyWindowInsets(WindowInsets insets)
			{
				// Give toolbar a copy of insets and ignore returned "consumed" insets which is set to all zeros.
				// Returning zero insets prevents other child views in the hierarchy from receiving system insets,
				// which prevents their setFitsSystemWindows(true) from working. (Such as a 2nd toolbar.)
				WindowInsets clonedInsets = (insets != null) ? new WindowInsets(insets) : null;
				super.onApplyWindowInsets(clonedInsets);
				return insets;
			}

			@Override
			protected boolean fitSystemWindows(Rect insets)
			{
				// Do custom inset handling if "extendBackground" was applied to toolbar.
				if ((insets != null) && getFitsSystemWindows()) {
					// Determine if we need to pad the top or bottom based on toolbar's y-axis position.
					boolean isPaddingTop = true;
					TiCompositeLayout.LayoutParams params = TiToolbar.this.getLayoutParams();
					if (params != null) {
						if ((params.optionTop == null) && (params.optionCenterY == null)) {
							if ((params.optionBottom != null) && (params.optionBottom.getAsPixels(this) <= 0)) {
								// Toolbar is docked to the bottom of the view. So, pad the bottom instead.
								isPaddingTop = false;
							}
						}
					}

					// Create a new insets object with either the top or bottom inset padding stripped off.
					// Note: We never want the toolbar to pad both the top and bottom.
					//       Especially when toolbar is docked to top of view but using a translucent navigation bar.
					insets = new Rect(insets);
					if (isPaddingTop) {
						insets.bottom = 0;
					} else {
						insets.top = 0;
					}
				}

				// Apply insets to toolbar. (Google blindly pads the view based on these insets.)
				super.fitSystemWindows(insets);

				// Returning false prevents given insets from being consumed.
				// Allows other views with setFitsSystemWindows(true) to receive insets. (Such as a 2nd toolbar.)
				return false;
			}
		};
		setNativeView(toolbar);
	}

	/**
	 * Adds custom views in the toolbar
	 * @param proxies View proxies to be used
	 */
	public void setItems(TiViewProxy[] proxies)
	{
		if (proxies != null) {
			for (int i = 0; i < proxies.length; i++) {
				toolbar.addView(convertLayoutParamsForView(proxies[i].getOrCreateView()));
			}
		}
	}

	/**
	 * Sets the background color of the toolbar
	 * @param color String in Titanium color format
	 */
	public void setToolbarColor(String color)
	{
		toolbar.setBackgroundColor((TiColorHelper.parseColor(color)));
		if (proxy.hasProperty(TiC.PROPERTY_TRANSLUCENT)) {
			if ((Boolean) proxy.getProperty(TiC.PROPERTY_TRANSLUCENT)) {
				toolbar.getBackground().setAlpha(BACKGROUND_TRANSLUCENT_VALUE);
			}
		}
	}

	/**
	 * Sets up the Toolbar to extend behind the Status Bar.
	 * This is useful when the Toolbar instance is set as a support bar in an activity
	 * and it positioned at the very top of it.
	 */
	public void setToolbarExtendBackground()
	{
		// This feature is only supported on Android 4.4 or higher.
		if (Build.VERSION.SDK_INT < 19) {
			return;
		}

		// Fetch the currently displayed activity window and its root decor view.
		// Note: Will be null if all activities have just been destroyed.
		Activity activity = TiApplication.getAppCurrentActivity();
		if (activity == null) {
			return;
		}
		Window window = activity.getWindow();
		if (window == null) {
			return;
		}
		View decorView = window.getDecorView();
		if (decorView == null) {
			return;
		}

		// Set up root content views to allow top status bar to overlap them.
		decorView.setFitsSystemWindows(false);
		if (activity instanceof TiBaseActivity) {
			View view = ((TiBaseActivity) activity).getLayout();
			if (view != null) {
				view.setFitsSystemWindows(false);
			}
		}

		// Set up toolbar so that it's title and buttons won't be overlapped by the status bar.
		// Note that the toolbar will automatically pad its background beneath the status bar as well.
		toolbar.setFitsSystemWindows(true);

		// Set flags so that the current window will allow drawing behind the status bar.
		int flags = decorView.getSystemUiVisibility();
		flags |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
		decorView.setSystemUiVisibility(flags);
		if (Build.VERSION.SDK_INT >= 21) {
			window.setStatusBarColor(Color.TRANSPARENT);
		} else {
			window.addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
		}

		// Request window to re-fit its views.
		toolbar.requestFitSystemWindows();
	}

	/**
	 * Sets whether the Toolbar's background is translucent.
	 * Achieved by setting the alpha of the background to 36%.
	 * @param value Boolean value to set to translucency.
	 */
	public void setTranslucent(boolean value)
	{
		toolbar.getBackground().setAlpha(value ? BACKGROUND_TRANSLUCENT_VALUE : BACKGROUND_SOLID_VALUE);
	}

	/**
	 * Changes the LayoutParams type of custom views added to the Toolbar.
	 * Width and height are preserved.
	 * They need to be of type Toolbar.LayoutParams.
	 * @param source
	 * @return
	 */
	private View convertLayoutParamsForView(TiUIView source)
	{
		View res = source.getNativeView();
		TiDimension widthDimension = source.getLayoutParams().optionWidth;
		int width = widthDimension != null ? widthDimension.getAsPixels(toolbar) : Toolbar.LayoutParams.WRAP_CONTENT;
		TiDimension heightDimension = source.getLayoutParams().optionHeight;
		int height = heightDimension != null ? heightDimension.getAsPixels(toolbar) : Toolbar.LayoutParams.WRAP_CONTENT;
		res.setLayoutParams(new Toolbar.LayoutParams(width, height));
		return res;
	}

	/**
	 * Shows the overflow menu if there is one.
	 */
	public void showOverFlowMenu()
	{
		((Toolbar) getNativeView()).showOverflowMenu();
	}

	/**
	 * Hides the overflow menu if there is one.
	 */
	public void hideOverFlowMenu()
	{
		((Toolbar) getNativeView()).hideOverflowMenu();
	}

	/**
	 * Sets the Toolbar's logo image.
	 * @param object Image to load. It can be passed as a Blob, File or path to a resource.
	 */
	public void setLogo(Object object)
	{
		logo = object;
		TiDrawableReference tiDrawableReference = TiDrawableReference.fromObject(proxy, object);
		((Toolbar) getNativeView()).setLogo(tiDrawableReference.getDrawable());
	}

	/**
	 * Return the current logo in the format it was passed
	 * @return
	 */
	public Object getLogo()
	{
		return logo;
	}

	/**
	 * Sets the Toolbar's navigation icon.
	 * @param object Image to load. It can be passed as a Blob, File or path to a resource.
	 */
	public void setNavigationIcon(Object object)
	{
		navigationIcon = object;
		TiDrawableReference tiDrawableReference = TiDrawableReference.fromObject(proxy, object);
		((Toolbar) getNativeView()).setNavigationIcon(tiDrawableReference.getDrawable());
	}

	/**
	 * Returns the currently set navigation icon in the format it was set.
	 * @return
	 */
	public Object getNavigationIcon()
	{
		return navigationIcon;
	}

	/**
	 * Sets the overflow menu icon.
	 * @param object Image to load. It can be passed as a Blob, File or path to a resource.
	 */
	public void setOverflowMenuIcon(Object object)
	{
		overflowMenuIcon = object;
		TiDrawableReference tiDrawableReference = TiDrawableReference.fromObject(proxy, object);
		((Toolbar) getNativeView()).setOverflowIcon(tiDrawableReference.getDrawable());
	}

	/**
	 * Returns the overflow menu icon in the format it was set.
	 * @return
	 */
	public Object getOverflowMenuIcon()
	{
		return overflowMenuIcon;
	}

	/**
	 * Closes all action views expanded and hides overflow menu.
	 */
	public void dismissPopupMenus()
	{
		((Toolbar) getNativeView()).dismissPopupMenus();
	}

	/**
	 * Sets the Toolbar title
	 * @param value String to be used as title.
	 */
	private void setTitle(String value)
	{
		toolbar.setTitle(value);
	}

	/**
	 * Sets title's text color
	 * @param value Color in any format supported by Titanium.
	 */
	private void setTitleTextColor(String value)
	{
		toolbar.setTitleTextColor(TiColorHelper.parseColor(value));
	}

	/**
	 * Sets subtitle.
	 * @param value String to be used as title.
	 */
	private void setSubtitle(String value)
	{
		toolbar.setSubtitle(value);
	}

	/**
	 * Sets subtitle's text color
	 * @param value Color in any format supported by Titanium.
	 */
	private void setSubtitleTextColor(String value)
	{
		toolbar.setSubtitleTextColor(TiColorHelper.parseColor(value));
	}

	/**
	 * Saves the proxy objects of the views passed as custom items.
	 * Sets them as current custom views.
	 * @param value
	 */
	private void setViewProxiesArray(Object[] value)
	{
		viewProxiesArray = new TiViewProxy[value.length];
		for (int i = 0; i < value.length; i++) {
			viewProxiesArray[i] = (TiViewProxy) value[i];
		}
		setItems(viewProxiesArray);
	}

	/**
	 * Closes custom views's added in the toolbar.
	 */
	public void collapseActionView()
	{
		toolbar.collapseActionView();
	}

	public void setContentInsetEndWithActions(int value)
	{
		toolbar.setContentInsetEndWithActions(value);
	}

	public void setContentInsetStartWithNavigation(int value)
	{
		toolbar.setContentInsetStartWithNavigation(value);
	}

	public void setContentInsetsAbsolute(int insetLeft, int insetRight)
	{
		Integer[] values = new Integer[] { insetLeft, insetRight };
		toolbar.setContentInsetsAbsolute(values[0], values[1]);
	}

	public void setContentInsetsRelative(int insetLeft, int insetRight)
	{
		Integer[] values = new Integer[] { insetLeft, insetRight };
		toolbar.setContentInsetsAbsolute(values[0], values[1]);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		//region process common properties
		if (d.containsKey(TiC.PROPERTY_BAR_COLOR)) {
			setToolbarColor(d.getString(TiC.PROPERTY_BAR_COLOR));
		}
		if (d.containsKey(TiC.PROPERTY_EXTEND_BACKGROUND)) {
			if (d.getBoolean(TiC.PROPERTY_EXTEND_BACKGROUND)) {
				setToolbarExtendBackground();
			}
		}
		if (d.containsKey(TiC.PROPERTY_ITEMS)) {
			setViewProxiesArray(((Object[]) d.get(TiC.PROPERTY_ITEMS)));
		}
		if (d.containsKey(TiC.PROPERTY_TRANSLUCENT)) {
			setTranslucent(d.getBoolean(TiC.PROPERTY_TRANSLUCENT));
		}
		//endregion
		//region Android only properties
		if (d.containsKey(TiC.PROPERTY_LOGO)) {
			setLogo(d.get(TiC.PROPERTY_LOGO));
		}
		if (d.containsKey(TiC.PROPERTY_NAVIGATION_ICON)) {
			setNavigationIcon(d.get(TiC.PROPERTY_NAVIGATION_ICON));
		}
		if (d.containsKey(TiC.PROPERTY_OVERFLOW_ICON)) {
			setOverflowMenuIcon(d.get(TiC.PROPERTY_OVERFLOW_ICON));
		}
		if (d.containsKey(TiC.PROPERTY_TITLE)) {
			setTitle(d.getString(TiC.PROPERTY_TITLE));
		}
		if (d.containsKey(TiC.PROPERTY_TITLE_TEXT_COLOR)) {
			setTitleTextColor(d.getString(TiC.PROPERTY_TITLE_TEXT_COLOR));
		}
		if (d.containsKey(TiC.PROPERTY_SUBTITLE)) {
			setSubtitle(d.getString(TiC.PROPERTY_SUBTITLE));
		}
		if (d.containsKey(TiC.PROPERTY_SUBTITLE_TEXT_COLOR)) {
			setSubtitleTextColor(d.getString(TiC.PROPERTY_SUBTITLE_TEXT_COLOR));
		}
		if (d.containsKey(TiC.PROPERTY_SUBTITLE_TEXT_COLOR)) {
			setSubtitleTextColor(d.getString(TiC.PROPERTY_SUBTITLE_TEXT_COLOR));
		}
		if (d.containsKey(TiC.PROPERTY_CONTENT_INSET_END_WITH_ACTIONS)) {
			if (toolbar != null) {
				setContentInsetEndWithActions(d.getInt(TiC.PROPERTY_CONTENT_INSET_END_WITH_ACTIONS));
			}
		}
		if (d.containsKey(TiC.PROPERTY_CONTENT_INSET_START_WITH_NAVIGATION)) {
			if (toolbar != null) {
				setContentInsetStartWithNavigation(d.getInt(TiC.PROPERTY_CONTENT_INSET_START_WITH_NAVIGATION));
			}
		}
		//end region
		super.processProperties(d);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		super.propertyChanged(key, oldValue, newValue, proxy);
		if (key.equals(TiC.PROPERTY_BAR_COLOR)) {
			setToolbarColor(((String) newValue));
		}
		if (key.equals(TiC.PROPERTY_TRANSLUCENT)) {
			setTranslucent(((Boolean) newValue));
		}
		if (key.equals(TiC.PROPERTY_ITEMS)) {
			setItems(((TiViewProxy[]) newValue));
		}
		if (key.equals(TiC.PROPERTY_LOGO)) {
			setLogo(newValue);
		}
		if (key.equals(TiC.PROPERTY_NAVIGATION_ICON)) {
			setNavigationIcon(newValue);
		}
		if (key.equals(TiC.PROPERTY_OVERFLOW_ICON)) {
			setOverflowMenuIcon(newValue);
		}
		if (key.equals(TiC.PROPERTY_TITLE)) {
			setTitle((String) newValue);
		}
		if (key.equals(TiC.PROPERTY_TITLE_TEXT_COLOR)) {
			setTitleTextColor((String) newValue);
		}
		if (key.equals(TiC.PROPERTY_SUBTITLE)) {
			setSubtitle((String) newValue);
		}
		if (key.equals(TiC.PROPERTY_SUBTITLE_TEXT_COLOR)) {
			setSubtitleTextColor((String) newValue);
		}
		if (key.equals(TiC.PROPERTY_CONTENT_INSET_END_WITH_ACTIONS)) {
			setContentInsetEndWithActions((Integer) newValue);
		}
		if (key.equals(TiC.PROPERTY_CONTENT_INSET_START_WITH_NAVIGATION)) {
			setContentInsetStartWithNavigation((Integer) newValue);
		}
	}
}
