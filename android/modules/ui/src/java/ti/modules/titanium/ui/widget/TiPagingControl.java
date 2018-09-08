package ti.modules.titanium.ui.widget;

import android.support.annotation.ColorInt;
import android.support.v4.view.ViewPager;

public abstract class TiPagingControl
{
	protected TiUIScrollableView scrollableView;
	protected ViewPager viewPager;

	public TiPagingControl(TiUIScrollableView scrollableView, ViewPager viewPager)
	{
		this.scrollableView = scrollableView;
		this.viewPager = viewPager;
	}

	public abstract void setVisibility(int visibility);

	public abstract int getVisibility();

	public abstract void setPageIndicatorColor(@ColorInt int pageIndicatorColor);

	public abstract void setCurrentPageIndicatorColor(@ColorInt int currentPageIndicatorColor);

	public abstract void setPagingControlPosition(boolean onTop);

	public abstract void setPagingControlHeight(int height);

	public abstract void release();
}
