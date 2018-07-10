package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.database.DataSetObserver;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.support.annotation.ColorInt;
import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.util.AttributeSet;
import android.view.View;
import org.appcelerator.titanium.TiApplication;

public class TiDotView extends View implements ViewPager.OnPageChangeListener, View.OnAttachStateChangeListener
{

	private static final int DEFAULT_DOT_SIZE = 8;                   // dp
	private static final int DEFAULT_GAP = 12;                       // dp
	private static final int DEFAULT_UNSELECTED_COLOUR = 0x80ffffff; // 50% white
	private static final int DEFAULT_SELECTED_COLOUR = 0xffffffff;   // 100% white

	private int dotDiameter;
	private int gap;
	private float dotRadius;
	private float dotCenterY;
	private ViewPager viewPager;
	private DataSetObserver observer;

	private int pageCount = 0;
	private int currentPage = 0;
	private float selectedDotX;
	private float[] dotCenterX;
	private boolean isAttachedToWindow;

	private final Paint unselectedPaint;
	private final Paint selectedPaint;

	private boolean measured = false;

	public TiDotView(Context context)
	{
		super(context);
		final int density = (int) context.getResources().getDisplayMetrics().density;

		dotDiameter = DEFAULT_DOT_SIZE * density;
		dotRadius = dotDiameter / 2;
		gap = DEFAULT_GAP * density;

		unselectedPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
		unselectedPaint.setColor(DEFAULT_UNSELECTED_COLOUR);
		selectedPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
		selectedPaint.setColor(DEFAULT_SELECTED_COLOUR);

		addOnAttachStateChangeListener(this);
	}

	@ColorInt
	public int getPageIndicatorColor()
	{
		return unselectedPaint.getColor();
	}

	public void setPageIndicatorColor(@ColorInt int pageIndicatorColor)
	{
		unselectedPaint.setColor(pageIndicatorColor);
		invalidate();
	}

	@ColorInt
	public int getCurrentPageIndicatorColor()
	{
		return selectedPaint.getColor();
	}

	public void setCurrentPageIndicatorColor(@ColorInt int currentPageIndicatorColor)
	{
		selectedPaint.setColor(currentPageIndicatorColor);
		invalidate();
	}

	public void setViewPager(ViewPager viewPager)
	{
		if (this.viewPager != null && this.observer != null) {
			PagerAdapter adapter = viewPager.getAdapter();
			if (adapter != null) {
				adapter.unregisterDataSetObserver(this.observer);
			}
		}
		this.viewPager = viewPager;
		viewPager.addOnPageChangeListener(this);
		setPageCount(viewPager.getAdapter().getCount());
		this.observer = new DataSetObserver() {
			@Override
			public void onChanged()
			{
				setPageCount(TiDotView.this.viewPager.getAdapter().getCount());
				invalidate();
			}
		};
		viewPager.getAdapter().registerDataSetObserver(this.observer);
	}

	@Override
	public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels)
	{
	}

	@Override
	public void onPageSelected(int position)
	{
		setCurrentPageImmediate();
		if (isAttachedToWindow) {
			setSelectedPage(position);
			invalidate();
		}
	}

	@Override
	public void onPageScrollStateChanged(int state)
	{
		// nothing to do
	}

	private void setPageCount(int pages)
	{
		pageCount = pages;
		calculateDotPositions(getWidth(), getHeight());
		requestLayout();
	}

	protected void onSizeChanged(int w, int h, int oldW, int oldH)
	{
		calculateDotPositions(w, h);
	}

	private void calculateDotPositions(int width, int height)
	{
		if (!measured)
			return;

		int left = getPaddingLeft();
		int top = getPaddingTop();
		int right = width - getPaddingRight();
		int bottom = height - getPaddingBottom();
		float middle = (top + bottom) / 2f;
		float center = (left + right) / 2f;

		int requiredWidth = getRequiredWidth();
		float startLeft = center - requiredWidth / 2f + dotRadius;

		dotCenterX = new float[Math.max(1, pageCount)];
		for (int i = 0; i < pageCount; i++) {
			dotCenterX[i] = startLeft + i * (dotDiameter + gap);
		}

		dotCenterY = middle;

		setCurrentPageImmediate();
	}

	private void setCurrentPageImmediate()
	{
		if (viewPager != null) {
			currentPage = viewPager.getCurrentItem();
		} else {
			currentPage = 0;
		}
		if (dotCenterX != null)
			selectedDotX = dotCenterX[Math.max(0, Math.min(currentPage, dotCenterX.length - 1))];
	}

	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		int desiredHeight = getDesiredHeight();
		int height;
		switch (MeasureSpec.getMode(heightMeasureSpec)) {
			case MeasureSpec.EXACTLY:
				height = MeasureSpec.getSize(heightMeasureSpec);
				break;
			case MeasureSpec.AT_MOST:
				height = Math.min(desiredHeight, MeasureSpec.getSize(heightMeasureSpec));
				break;
			case MeasureSpec.UNSPECIFIED:
			default:
				height = desiredHeight;
				break;
		}

		int desiredWidth = getDesiredWidth();
		int width;
		switch (MeasureSpec.getMode(widthMeasureSpec)) {
			case MeasureSpec.EXACTLY:
				width = MeasureSpec.getSize(widthMeasureSpec);
				break;
			case MeasureSpec.AT_MOST:
				width = Math.min(desiredWidth, MeasureSpec.getSize(widthMeasureSpec));
				break;
			case MeasureSpec.UNSPECIFIED:
			default:
				width = desiredWidth;
				break;
		}
		setMeasuredDimension(width, height);

		if (!measured) {
			measured = true;
		}
	}

	private int getDesiredHeight()
	{
		return getPaddingTop() + dotDiameter + getPaddingBottom();
	}

	private int getRequiredWidth()
	{
		return pageCount * dotDiameter + (pageCount - 1) * gap;
	}

	private int getDesiredWidth()
	{
		return getPaddingLeft() + getRequiredWidth() + getPaddingRight();
	}

	public void setHeight(int height)
	{
		float density = TiApplication.getAppRootOrCurrentActivity().getResources().getDisplayMetrics().density;
		float realHeight = density * height;
		if (realHeight > dotDiameter) {
			float halfPadding = (realHeight - dotDiameter) / 2f;
			int top = (int) halfPadding;
			int bottom = (int) Math.ceil(halfPadding);
			setPadding(0, top, 0, bottom);
		}
	}

	@Override
	public void onViewAttachedToWindow(View view)
	{
		isAttachedToWindow = true;
	}

	@Override
	public void onViewDetachedFromWindow(View view)
	{
		isAttachedToWindow = false;
	}

	@Override
	protected void onDraw(Canvas canvas)
	{
		if (viewPager == null || pageCount == 0)
			return;
		drawUnselected(canvas);
		drawSelected(canvas);
	}

	private void drawUnselected(Canvas canvas)
	{
		for (int page = 0; page < pageCount; page++) {
			canvas.drawCircle(dotCenterX[page], dotCenterY, dotRadius, unselectedPaint);
		}
	}

	private void drawSelected(Canvas canvas)
	{
		canvas.drawCircle(selectedDotX, dotCenterY, dotRadius, selectedPaint);
	}

	private void setSelectedPage(int now)
	{
		now = Math.min(now, pageCount - 1);

		if (now == currentPage)
			return;

		currentPage = now;
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
		removeOnAttachStateChangeListener(this);
	}
}
