package ti.modules.titanium.ui.widget;

import android.app.Activity;
import android.support.v4.view.ViewPager;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.FrameLayout.LayoutParams;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import ti.modules.titanium.ui.ScrollableViewProxy;

public class TiDotPagingControl extends TiPagingControl
{
	private TiDotView view;

	public TiDotPagingControl(TiUIScrollableView scrollableView, ViewPager viewPager)
	{
		super(scrollableView, viewPager);

		ScrollableViewProxy proxy = (ScrollableViewProxy) scrollableView.getProxy();
		Activity activity = proxy.getActivity();
		if (activity == null) {
			return;
		}
		TiDotView mPagerIndicator = new TiDotView(activity);

		LayoutParams params =
			new LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
		mPagerIndicator.setHeight(TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_PAGING_CONTROL_HEIGHT)));
		Boolean controlOnTop = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_PAGING_CONTROL_ON_TOP));
		if (controlOnTop) {
			params.gravity = Gravity.TOP;
		} else {
			params.gravity = Gravity.BOTTOM;
		}
		if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_PAGE_INDICATOR_COLOR)) {
			mPagerIndicator.setPageIndicatorColor(
				TiConvert.toColor((String) proxy.getProperty(TiC.PROPERTY_PAGE_INDICATOR_COLOR)));
		}
		if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_CURRENT_PAGE_INDICATOR_COLOR)) {
			mPagerIndicator.setCurrentPageIndicatorColor(
				TiConvert.toColor((String) proxy.getProperty(TiC.PROPERTY_CURRENT_PAGE_INDICATOR_COLOR)));
		}
		mPagerIndicator.setViewPager(viewPager);
		view = mPagerIndicator;
		scrollableView.getContainer().addView(mPagerIndicator, params);
	}

	@Override
	public void setVisibility(int visibility)
	{
		this.view.setVisibility(visibility);
	}

	@Override
	public int getVisibility()
	{
		return this.view.getVisibility();
	}

	@Override
	public void setPageIndicatorColor(int pageIndicatorColor)
	{
		this.view.setPageIndicatorColor(pageIndicatorColor);
	}

	@Override
	public void setCurrentPageIndicatorColor(int currentPageIndicatorColor)
	{
		this.view.setCurrentPageIndicatorColor(currentPageIndicatorColor);
	}

	@Override
	public void setPagingControlPosition(boolean onTop)
	{
		LayoutParams params = (LayoutParams) view.getLayoutParams();
		if (onTop) {
			params.gravity = Gravity.TOP;
		} else {
			params.gravity = Gravity.BOTTOM;
		}
		view.setLayoutParams(params);
	}

	@Override
	public void setPagingControlHeight(int height)
	{
		view.setHeight(height);
	}

	public void release()
	{
		view.release();
	}
}
