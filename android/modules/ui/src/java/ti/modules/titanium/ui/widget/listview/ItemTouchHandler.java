/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.RecyclerView;

import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;

public class ItemTouchHandler extends ItemTouchHelper.SimpleCallback
{
	private TiRecyclerViewAdapter adapter;
	private RecyclerViewProxy recyclerViewProxy;

	private Drawable icon;
	private final ColorDrawable background;

	public ItemTouchHandler(TiRecyclerViewAdapter adapter, RecyclerViewProxy recyclerViewProxy)
	{
		super(0, 0);

		this.adapter = adapter;
		this.recyclerViewProxy = recyclerViewProxy;

		this.icon = this.adapter.getContext().getResources().getDrawable(R.drawable.titanium_icon_delete);
		this.background = new ColorDrawable(Color.RED);
	}

	/**
	 * Override drag direction flags.
	 *
	 * @param recyclerView Current RecyclerView.
	 * @param viewHolder Current Holder.
	 * @return Integer containing drag flags.
	 */
	@Override
	public int getDragDirs(@NonNull RecyclerView recyclerView, @NonNull RecyclerView.ViewHolder viewHolder)
	{
		final TiRecyclerViewHolder holder = (TiRecyclerViewHolder) viewHolder;
		final TiViewProxy holderProxy = holder.getProxy();

		String moveProperty = TiC.PROPERTY_MOVABLE;
		if (holderProxy instanceof ListItemProxy) {

			// Set to `canMove` property for ListItem.
			moveProperty = TiC.PROPERTY_CAN_MOVE;
		}

		// Obtain default move value from RecyclerView proxy.
		final boolean defaultValue = this.recyclerViewProxy.getProperties().optBoolean(moveProperty, false);

		// Obtain move value from current holder proxy.
		final boolean canMove = holderProxy.getProperties().optBoolean(moveProperty, defaultValue);

		if ((isEditing() || isMoving()) && canMove) {
			return ItemTouchHelper.UP | ItemTouchHelper.DOWN;
		}
		return 0;
	}

	/**
	 * Override swipe direction flags.
	 *
	 * @param recyclerView Current RecyclerView.
	 * @param viewHolder Current Holder.
	 * @return Integer containing swipe flags.
	 */
	@Override
	public int getSwipeDirs(@NonNull RecyclerView recyclerView, @NonNull RecyclerView.ViewHolder viewHolder)
	{
		final TiRecyclerViewHolder holder = (TiRecyclerViewHolder) viewHolder;
		final TiViewProxy holderProxy = holder.getProxy();

		String editProperty = TiC.PROPERTY_EDITABLE;
		if (holderProxy instanceof ListItemProxy) {
			editProperty = TiC.PROPERTY_CAN_EDIT;
		}

		// Obtain default edit value from RecyclerView proxy.
		final boolean defaultValue = this.recyclerViewProxy.getProperties().optBoolean(editProperty, false);

		// Obtain edit value from current holder proxy.
		final boolean canSwipe = holderProxy.getProperties().optBoolean(editProperty, defaultValue);

		if ((isEditing() || isMoving()) && canSwipe) {
			return ItemTouchHelper.LEFT | ItemTouchHelper.RIGHT;
		}
		return 0;
	}

	/**
	 * Override movement flags to update our swipe and drag properties.
	 *
	 * @param recyclerView Current RecyclerView.
	 * @param viewHolder Current Holder.
	 * @return Integer containing movement flags.
	 */
	@Override
	public int getMovementFlags(@NonNull RecyclerView recyclerView, @NonNull RecyclerView.ViewHolder viewHolder)
	{
		// Update drag and swipe directions.
		setDefaultDragDirs(getDragDirs(recyclerView, viewHolder));
		setDefaultSwipeDirs(getDragDirs(recyclerView, viewHolder));

		return super.getMovementFlags(recyclerView, viewHolder);
	}

	/**
	 * Determine if `editing` mode is enabled for proxy.
	 *
	 * @return Boolean
	 */
	private boolean isEditing()
	{
		return this.recyclerViewProxy.getProperties().optBoolean(TiC.PROPERTY_EDITING, false);
	}

	/**
	 * Determine if `moving` mode is enabled for proxy.
	 *
	 * @return Boolean
	 */
	private boolean isMoving()
	{
		return this.recyclerViewProxy.getProperties().optBoolean(TiC.PROPERTY_MOVING, false);
	}

	/**
	 * Called when moving an item from one position to another.
	 *
	 * @param recyclerView Current RecyclerView.
	 * @param fromHolder Holder to move from current position.
	 * @param toHolder Holder at specified move position.
	 * @return
	 */
	@Override
	public boolean onMove(@NonNull RecyclerView recyclerView,
						  @NonNull RecyclerView.ViewHolder fromHolder,
						  @NonNull RecyclerView.ViewHolder toHolder)
	{
		this.recyclerViewProxy.moveItem(fromHolder.getAdapterPosition(), toHolder.getAdapterPosition());
		return true;
	}

	/**
	 * Called when swiping an item.
	 *
	 * @param viewHolder Holder being swiped.
	 * @param direction Direction of swipe.
	 */
	@Override
	public void onSwiped(@NonNull RecyclerView.ViewHolder viewHolder, int direction)
	{
		this.recyclerViewProxy.swipeItem(viewHolder.getAdapterPosition());
	}

	/**
	 * Override draw method to display background behind swipe-item.
	 *
	 * @param c Canvas
	 * @param recyclerView Current RecyclerView.
	 * @param viewHolder Holder to draw.
	 * @param dX X-axis offset.
	 * @param dY Y-axis offset.
	 * @param actionState Current action state.
	 * @param isCurrentlyActive Is currently active.
	 */
	@Override
	public void onChildDraw(@NonNull Canvas c,
							@NonNull RecyclerView recyclerView,
							@NonNull RecyclerView.ViewHolder viewHolder,
							float dX,
							float dY,
							int actionState,
							boolean isCurrentlyActive)
	{
		super.onChildDraw(c, recyclerView, viewHolder, dX, dY, actionState, isCurrentlyActive);

		if ((!isEditing() && !isMoving()) || dX == 0) {

			// No swipe, do not render.
			return;
		}

		final View view = viewHolder.itemView;

		final int iconMargin = view.getHeight() - icon.getIntrinsicHeight();
		final int iconTop = view.getTop() + (view.getHeight() - icon.getIntrinsicHeight()) / 2;
		final int iconBottom = iconTop + icon.getIntrinsicHeight();
		final int backgroundWidth = view.getMeasuredWidth() / 2;

		if (dX > 0) {
			final int iconLeft = view.getLeft() + iconMargin;
			final int iconRight = view.getLeft() + iconMargin + icon.getIntrinsicWidth();
			final int backgroundRight = view.getLeft() + ((int) dX) + backgroundWidth;

			// Set bounds for right swipe.
			icon.setBounds(iconLeft, iconTop, iconRight, iconBottom);
			background.setBounds(view.getLeft(), view.getTop(), backgroundRight, view.getBottom());

		} else if (dX < 0) {
			final int iconLeft = view.getRight() - iconMargin - icon.getIntrinsicWidth();
			final int iconRight = view.getRight() - iconMargin;
			final int backgroundLeft = view.getRight() + ((int) dX) - backgroundWidth;

			// Set bounds for left swipe.
			icon.setBounds(iconLeft, iconTop, iconRight, iconBottom);
			background.setBounds(backgroundLeft, view.getTop(), view.getRight(), view.getBottom());
		}

		background.draw(c);
		icon.draw(c);
	}
}
