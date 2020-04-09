package ti.modules.titanium.ui;

import android.app.Activity;
import androidx.appcompat.widget.Toolbar;
import android.view.View;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiToolbarProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiToolbar;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_BAR_COLOR,
		TiC.PROPERTY_EXTEND_BACKGROUND,
		TiC.PROPERTY_ITEMS,
		TiC.PROPERTY_TRANSLUCENT,
		TiC.PROPERTY_LOGO,
		TiC.PROPERTY_OVERFLOW_ICON,
		TiC.PROPERTY_NAVIGATION_ICON,
		TiC.PROPERTY_TITLE,
		TiC.PROPERTY_TITLE_TEXT_COLOR,
		TiC.PROPERTY_SUBTITLE,
		TiC.PROPERTY_SUBTITLE_TEXT_COLOR,
		TiC.PROPERTY_CONTENT_INSET_END_WITH_ACTIONS,
		TiC.PROPERTY_CONTENT_INSET_START_WITH_NAVIGATION
})
public class ToolbarProxy extends TiToolbarProxy
{

	private static final java.lang.String TAG = "Toolbar";

	public View getToolbarInstance()
	{
		return getTiToolbarView().getNativeView();
	}

	private TiToolbar getTiToolbarView()
	{
		return ((TiToolbar) getOrCreateView());
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		//fill the container width by default
		if (!hasProperty(TiC.PROPERTY_WIDTH)) {
			setProperty(TiC.PROPERTY_WIDTH, UIModule.FILL);
		}
		return new TiToolbar(this);
	}

	//region Android only methods
	@Kroll.method
	public void collapseActionView()
	{
		getTiToolbarView().collapseActionView();
	}

	@Kroll.method
	public void dismissPopupMenus()
	{
		getTiToolbarView().dismissPopupMenus();
	}

	@Kroll.method
	public int getContentInsetEnd()
	{
		//Gets the ending content inset for this toolbar.
		return ((Toolbar) getTiToolbarView().getNativeView()).getContentInsetEnd();
	}

	@Kroll.method
	public int getContentInsetLeft()
	{
		//Gets the left content inset for this toolbar.
		return ((Toolbar) getTiToolbarView().getNativeView()).getContentInsetLeft();
	}

	@Kroll.method
	public int getContentInsetRight()
	{
		//Gets the right content inset for this toolbar.
		return ((Toolbar) getTiToolbarView().getNativeView()).getContentInsetRight();
	}

	@Kroll.method
	public int getContentInsetStart()
	{
		//Gets the starting content inset for this toolbar.
		return ((Toolbar) getTiToolbarView().getNativeView()).getContentInsetStart();
	}

	@Kroll.method
	public int getCurrentContentInsetEnd()
	{
		//Gets the content inset that will be used on the ending side of the bar in the current toolbar configuration.
		return ((Toolbar) getTiToolbarView().getNativeView()).getCurrentContentInsetEnd();
	}

	@Kroll.method
	public int getCurrentContentInsetLeft()
	{
		//Gets the content inset that will be used on the left side of the bar in the current toolbar configuration.
		return ((Toolbar) getTiToolbarView().getNativeView()).getCurrentContentInsetLeft();
	}

	@Kroll.method
	public int getCurrentContentInsetRight()
	{
		//Gets the content inset that will be used on the right side of the bar in the current toolbar configuration.
		return ((Toolbar) getTiToolbarView().getNativeView()).getCurrentContentInsetRight();
	}

	@Kroll.method
	public int getCurrentContentInsetStart()
	{
		//Gets the content inset that will be used on the starting side of the bar in the current toolbar configuration.
		return ((Toolbar) getTiToolbarView().getNativeView()).getCurrentContentInsetStart();
	}

	@Kroll.method
	public boolean hasExpandedActionView()
	{
		return ((Toolbar) getTiToolbarView().getNativeView()).hasExpandedActionView();
	}

	@Kroll.method
	public void hideOverflowMenu()
	{
		getTiToolbarView().hideOverFlowMenu();
	}

	@Kroll.method
	public boolean isOverflowMenuShowing()
	{
		return ((Toolbar) getTiToolbarView().getNativeView()).isOverflowMenuShowing();
	}

	//Sets the content insets for this toolbar.
	@Kroll.method
	public void setContentInsetsAbsolute(int insetLeft, int insetRight)
	{
		getTiToolbarView().setContentInsetsAbsolute(insetLeft, insetRight);
	}

	//Sets the content insets for this toolbar relative to layout direction.
	@Kroll.method
	public void setContentInsetsRelative(int insetStart, int insetEnd)
	{
		getTiToolbarView().setContentInsetsRelative(insetStart, insetEnd);
	}

	@Kroll.method
	public void showOverflowMenu()
	{
		getTiToolbarView().showOverFlowMenu();
	}
	//endregion

	@Override
	public String getApiName()
	{
		return "Ti.UI.Toolbar";
	}
}
