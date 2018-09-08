package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.database.DataSetObserver;
import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;
import ti.modules.titanium.ui.ScrollableViewProxy;

public class TiArrowPagingControl extends TiPagingControl implements ViewPager.OnPageChangeListener
{
	private static final int PAGE_LEFT_ID = 200;
	private static final int PAGE_RIGHT_ID = 201;

	private FrameLayout view;
	private TiArrowView leftArrow;
	private TiArrowView rightArrow;
	private DataSetObserver observer;
	private int pageCount;

	public TiArrowPagingControl(TiUIScrollableView scrollableView, ViewPager viewPager)
	{
		super(scrollableView, viewPager);

		ScrollableViewProxy proxy = (ScrollableViewProxy) scrollableView.getProxy();
		Context context = proxy.getActivity();

		// Calculate a density scaled left/right arrow size.
		int arrowSizeInPixels = 24;
		if (context.getResources() != null) {
			DisplayMetrics metrics = context.getResources().getDisplayMetrics();
			if ((metrics != null) && (metrics.density >= 0.5f)) {
				arrowSizeInPixels = (int) ((float) arrowSizeInPixels * metrics.density);
			}
		}

		// Create an overlay view that will display the page controls.
		FrameLayout layout = new FrameLayout(context);
		layout.setFocusable(false);
		layout.setFocusableInTouchMode(false);

		// Add left arrow button to overlay.
		leftArrow = new TiArrowView(context);
		leftArrow.setVisibility(View.INVISIBLE);
		leftArrow.setId(PAGE_LEFT_ID);
		leftArrow.setMinimumWidth(arrowSizeInPixels);
		leftArrow.setMinimumHeight(arrowSizeInPixels);
		leftArrow.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View v)
			{
				if (TiArrowPagingControl.this.scrollableView.getEnabled()) {
					TiArrowPagingControl.this.scrollableView.movePrevious();
				}
			}
		});
		FrameLayout.LayoutParams leftLayoutParams =
			new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
		leftLayoutParams.gravity = Gravity.LEFT | Gravity.CENTER_VERTICAL;
		layout.addView(leftArrow, leftLayoutParams);

		// Add right arrow button to overlay.
		rightArrow = new TiArrowView(context);
		rightArrow.setLeft(false);
		rightArrow.setVisibility(View.INVISIBLE);
		rightArrow.setId(PAGE_RIGHT_ID);
		rightArrow.setMinimumWidth(arrowSizeInPixels);
		rightArrow.setMinimumHeight(arrowSizeInPixels);
		rightArrow.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View v)
			{
				if (TiArrowPagingControl.this.scrollableView.getEnabled()) {
					TiArrowPagingControl.this.scrollableView.moveNext();
				}
			}
		});
		FrameLayout.LayoutParams rightLayoutParams =
			new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
		rightLayoutParams.gravity = Gravity.RIGHT | Gravity.CENTER_VERTICAL;
		layout.addView(rightArrow, rightLayoutParams);

		// Hide this overlay by default. Will be shown if Titanium "showPagingControl" is set true.
		if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_SHOW_PAGING_CONTROL)
			&& TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_SHOW_PAGING_CONTROL))) {
			layout.setVisibility(View.VISIBLE);
		} else {
			layout.setVisibility(View.GONE);
		}

		scrollableView.getContainer().addView(
			layout, new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

		this.view = layout;
		viewPager.addOnPageChangeListener(this);
		this.observer = new DataSetObserver() {
			@Override
			public void onChanged()
			{
				setPageCount(TiArrowPagingControl.this.viewPager.getAdapter().getCount());
			}
		};
		viewPager.getAdapter().registerDataSetObserver(this.observer);
	}

	private void setPageCount(int pages)
	{
		pageCount = pages;
	}

	@Override
	public void setVisibility(int visibility)
	{
		view.setVisibility(visibility);
	}

	@Override
	public int getVisibility()
	{
		return view.getVisibility();
	}

	@Override
	public void setPageIndicatorColor(int pageIndicatorColor)
	{
	}

	@Override
	public void setCurrentPageIndicatorColor(int currentPageIndicatorColor)
	{
	}

	@Override
	public void setPagingControlPosition(boolean onTop)
	{
	}

	@Override
	public void setPagingControlHeight(int height)
	{
	}

	@Override
	public void onPageScrolled(int i, float v, int i1)
	{
		// nothing to do
	}

	@Override
	public void onPageSelected(int i)
	{
		if (getVisibility() == View.VISIBLE) {
			leftArrow.setVisibility(i > 0 ? View.VISIBLE : View.INVISIBLE);
			rightArrow.setVisibility(i < (pageCount - 1) ? View.VISIBLE : View.INVISIBLE);
		}
	}

	@Override
	public void onPageScrollStateChanged(int i)
	{
		// nothing to do
	}

	public void release()
	{
		if (this.viewPager != null) {
			PagerAdapter adapter = viewPager.getAdapter();
			if (adapter != null) {
				if (this.observer != null) {
					adapter.unregisterDataSetObserver(this.observer);
					this.observer = null;
				}
			}
			viewPager.removeOnPageChangeListener(this);
			viewPager = null;
		}
	}
}
