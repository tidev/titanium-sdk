package org.appcelerator.titanium.module.ui.widgets;

import org.appcelerator.titanium.util.TitaniumLogWatcher;

import android.content.Context;
import android.graphics.Color;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;

public class TitaniumCompositeLayout extends ViewGroup
{

	public TitaniumCompositeLayout(Context context)
	{
		super(context);

		//setBackgroundColor(Color.RED);
	}

	public TitaniumCompositeLayout(Context context, AttributeSet attrs) {
		super(context, attrs);
	}

	public TitaniumCompositeLayout(Context context, AttributeSet attrs,
			int defStyle) {
		super(context, attrs, defStyle);
	}

	@Override
	protected boolean checkLayoutParams(LayoutParams p) {
		return p instanceof TitaniumCompositeLayoutParams;
	}

	@Override
	protected LayoutParams generateDefaultLayoutParams()
	{
		// Default is fill view
		TitaniumCompositeLayoutParams params = new TitaniumCompositeLayoutParams();
		params.optionLeft = 0;
		params.optionRight = 0;
		params.optionTop = 0;
		params.optionBottom = 0;
		params.optionZIndex = 0;
		return params;
	}

	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		int count = getChildCount();

		int w = MeasureSpec.getSize(widthMeasureSpec);
		int wMode = MeasureSpec.getMode(widthMeasureSpec);
		int h = MeasureSpec.getSize(heightMeasureSpec);
		int hMode = MeasureSpec.getMode(heightMeasureSpec);

		int maxWidth = w;
		int maxHeight = h;

		// measure all the kids

		//ignore z-order for now
		for (int i = 0; i < count; i++) {
			View child = getChildAt(i);
			if (child.getVisibility() != View.GONE) {
				TitaniumCompositeLayout.TitaniumCompositeLayoutParams p =
					(TitaniumCompositeLayout.TitaniumCompositeLayoutParams) child.getLayoutParams();
				if (p.optionLeft != null) {
					p.mLeft = Math.min(p.optionLeft.intValue(), w);
					if (p.optionRight != null) {
						p.mRight = Math.max(p.mLeft, w - p.optionRight.intValue());
					} else if (p.optionWidth != null) {
						p.mRight = Math.min(p.mLeft + p.optionWidth.intValue(), w);
					} else {
						p.mRight = w;
					}
				} else if (p.optionRight != null) {
					p.mRight = Math.max(w-p.optionRight.intValue(), 0);
					if (p.optionLeft != null) {
						p.mLeft = Math.max(p.optionLeft.intValue(), p.mRight);
					} else if (p.optionWidth != null) {
						p.mLeft = Math.max(0, p.mRight - p.optionWidth.intValue());
					} else {
						p.mLeft = 0;
					}
				} else if (p.optionWidth != null) {
					p.mLeft = 0;
					p.mRight = w;
					int space = (w - p.optionWidth.intValue())/2;
					if (space > 0) {
						p.mLeft = space;
						p.mRight = w - space;
					}
				} else {
					p.mLeft = 0;
					p.mRight = w;
				}

				if (p.optionTop != null) {
					p.mTop = Math.min(p.optionTop.intValue(), h);
					if (p.optionBottom != null) {
						p.mBottom = Math.max(p.mTop, h - p.optionBottom.intValue());
					} else if (p.optionHeight != null) {
						p.mBottom = Math.min(p.mTop + p.optionHeight.intValue(), h);
					} else {
						p.mBottom = h;
					}
				} else if (p.optionBottom != null) {
					p.mBottom = Math.max(h-p.optionBottom.intValue(), 0);
					if (p.optionTop != null) {
						p.mTop = Math.max(p.optionTop.intValue(), p.mBottom);
					} else if (p.optionHeight != null) {
						p.mTop = Math.max(0, p.mBottom - p.optionHeight.intValue());
					} else {
						p.mTop = 0;
					}
				} else if (p.optionHeight != null) {
					p.mTop = 0;
					p.mBottom = h;
					int space = (h - p.optionHeight.intValue())/2;
					if (space > 0) {
						p.mTop = space;
						p.mBottom = h - space;
					}
				} else {
					p.mTop = 0;
					p.mBottom = h;
				}

				child.measure(MeasureSpec.makeMeasureSpec(p.mRight-p.mLeft, MeasureSpec.EXACTLY),
						MeasureSpec.makeMeasureSpec(p.mBottom-p.mTop, MeasureSpec.EXACTLY));

			}
		}

		// account for padding

		maxWidth += getPaddingLeft() + getPaddingRight();
		maxHeight += getPaddingTop() + getPaddingBottom();

		// check minimums
		maxWidth = Math.max(maxWidth, getSuggestedMinimumWidth());
		maxHeight = Math.max(maxHeight, getSuggestedMinimumHeight());

		setMeasuredDimension(resolveSize(maxWidth, widthMeasureSpec),
				resolveSize(maxHeight, heightMeasureSpec));
	}

	@Override
	protected void onLayout(boolean changed, int l, int t, int r, int b)
	{
		int count = getChildCount();

		// should already be in z-order and coords stamped during layout.
		for (int i = 0; i < count; i++) {
			View child = getChildAt(i);
			if (child.getVisibility() != View.GONE) {
				TitaniumCompositeLayout.TitaniumCompositeLayoutParams params =
					(TitaniumCompositeLayout.TitaniumCompositeLayoutParams) child.getLayoutParams();
				child.layout(params.mLeft, params.mTop, params.mRight, params.mBottom);
			}
		}
	}

	public static class TitaniumCompositeLayoutParams extends LayoutParams
	{
		public Integer optionZIndex;
		public Integer optionLeft;
		public Integer optionTop;
		public Integer optionRight;
		public Integer optionBottom;
		public Integer optionWidth;
		public Integer optionHeight;

		// Used in onMeasure to assign size for onLayout
		public int mLeft;
		public int mTop;
		public int mRight;
		public int mBottom;

		public TitaniumCompositeLayoutParams() {
			super(WRAP_CONTENT, WRAP_CONTENT);
		}
	}
}
