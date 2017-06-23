package ti.modules.titanium.ui;

import android.app.Activity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiToolbarProxy;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.android.AndroidModule;
import ti.modules.titanium.ui.widget.TiToolbar;

@Kroll.proxy(creatableInModule=AndroidModule.class, propertyAccessors = {
		TiC.PROPERTY_BAR_COLOR,
		TiC.PROPERTY_EXTEND_BACKGROUND,
		TiC.PROPERTY_ITEMS,
		TiC.PROPERTY_TRANSLUCENT,
})
public class ToolbarProxy extends TiToolbarProxy {

	private static final java.lang.String TAG = "Toolbar";

	public View getToolbarInstance() {
		return getTiToolbarView().getNativeView();
	}

	private TiToolbar getTiToolbarView() {
		return ((TiToolbar) getOrCreateView());
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiToolbar(this);
	}

	//region Android only methods
	@Kroll.method
	public void collapseActionView() {
		getTiToolbarView().collapseActionView();
	}

	@Kroll.method
	public void dismissPopupMenus() {
		getTiToolbarView().dismissPopupMenus();
	}

	@Kroll.method
	public int getContentInsetEnd() {
		//Gets the ending content inset for this toolbar.
		return ((Toolbar) getTiToolbarView().getNativeView()).getContentInsetEnd();
	}

	@Kroll.method
	public int getContentInsetEndWithActions() {
		//Gets the end content inset to use when action buttons are present.
		return ((Toolbar) getTiToolbarView().getNativeView()).getContentInsetEndWithActions();
	}

	@Kroll.method
	public int getContentInsetLeft() {
		//Gets the left content inset for this toolbar.
		return ((Toolbar) getTiToolbarView().getNativeView()).getContentInsetLeft();
	}

	@Kroll.method
	public int getContentInsetRight() {
		//Gets the right content inset for this toolbar.
		return ((Toolbar) getTiToolbarView().getNativeView()).getContentInsetRight();
	}

	@Kroll.method
	public int getContentInsetStart() {
		//Gets the starting content inset for this toolbar.
		return ((Toolbar) getTiToolbarView().getNativeView()).getContentInsetStart();
	}

	@Kroll.method
	public int getContentInsetStartWithNavigation() {
		//Gets the start content inset to use when a navigation button is present.
		return ((Toolbar) getTiToolbarView().getNativeView()).getContentInsetStartWithNavigation();
	}

	@Kroll.method
	public int getCurrentContentInsetEnd() {
		//Gets the content inset that will be used on the ending side of the bar in the current toolbar configuration.
		return ((Toolbar) getTiToolbarView().getNativeView()).getCurrentContentInsetEnd();
	}

	@Kroll.method
	public int getCurrentContentInsetLeft() {
		//Gets the content inset that will be used on the left side of the bar in the current toolbar configuration.
		return ((Toolbar) getTiToolbarView().getNativeView()).getCurrentContentInsetLeft();
	}

	@Kroll.method
	public int getCurrentContentInsetRight() {
		//Gets the content inset that will be used on the right side of the bar in the current toolbar configuration.
		return ((Toolbar) getTiToolbarView().getNativeView()).getCurrentContentInsetRight();
	}

	@Kroll.method
	public int getCurrentContentInsetStart() {
		//Gets the content inset that will be used on the starting side of the bar in the current toolbar configuration.
		return ((Toolbar) getTiToolbarView().getNativeView()).getCurrentContentInsetStart();
	}

	@Kroll.method
	public Object getLogo() {
		return getTiToolbarView().getLogo();
	}

	@Kroll.method
	public Object getNavigationIcon() {
		return getTiToolbarView().getNavigationIcon();
	}

	@Kroll.method
	public Object getOverflowIcon() {
		return getTiToolbarView().getOverflowMenuIcon();
	}

	@Kroll.method
	public String getSubtitle() {
		return ((Toolbar) getTiToolbarView().getNativeView()).getSubtitle().toString();
	}

	@Kroll.method
	public String getTitle() {
		return ((Toolbar) getTiToolbarView().getNativeView()).getTitle().toString();
	}

	@Kroll.method
	public boolean hasExpandedActionView() {
		return ((Toolbar) getTiToolbarView().getNativeView()).hasExpandedActionView();
	}

	@Kroll.method
	public void hideOverflowMenu() {
		getTiToolbarView().hideOverFlowMenu();
	}

	@Kroll.method
	public boolean isOverflowMenuShowing() {
		return ((Toolbar) getTiToolbarView().getNativeView()).isOverflowMenuShowing();
	}

	@Kroll.method
	public void setLogo(Object object) {
		getTiToolbarView().setLogo(object);
	}

	@Kroll.method
	public void setNavigationIcon(String value) {
		getTiToolbarView().setNavigationIcon(value);
	}

	@Kroll.method
	public void setOverflowIcon(String value) {
		getTiToolbarView().setOverflowMenuIcon(value);
	}

	@Kroll.method
	public void setSubtitle(String value) {
		getTiToolbarView().setSubtitle(value);
	}

	@Kroll.method
	public void setSubtitleTextColor(String value) {
		getTiToolbarView().setSubtitleTextColor(value);
	}

	@Kroll.method
	public void setTitle(String value) {
		getTiToolbarView().setTitle(value);
	}

	@Kroll.method
	public void setTitleTextColor(String value) {
		getTiToolbarView().setTitleTextColor(value);
	}

	//Sets the start content inset to use when action buttons are present.
	@Kroll.method
	public void setContentInsetEndWithActions(int value) {
		getTiToolbarView().setContentInsetEndWithActions(value);
	}

	//Sets the start content inset to use when a navigation button is present.
	@Kroll.method
	public void setContentInsetStartWithNavigation(int value) {
		getTiToolbarView().setContentInsetStartWithNavigation(value);
	}

	//Sets the content insets for this toolbar.
	@Kroll.method
	public void setContentInsetsAbsolute(int insetLeft, int insetRight) {
		getTiToolbarView().setContentInsetsAbsolute(insetLeft, insetRight);
	}

	//Sets the content insets for this toolbar relative to layout direction.
	@Kroll.method
	public void setContentInsetsRelative(int insetStart, int insetEnd) {
		getTiToolbarView().setContentInsetsRelative(insetStart, insetEnd);
	}

	@Kroll.method
	public void showOverflowMenu() {
		getTiToolbarView().showOverFlowMenu();
	}
	//endregion

}
