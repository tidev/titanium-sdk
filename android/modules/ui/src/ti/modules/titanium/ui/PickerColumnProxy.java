package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;

import android.util.Log;

public class PickerColumnProxy extends TiProxy
{
	private PickerColumnChangeListener changeListener;
	private ArrayList<PickerRowProxy> rows = new ArrayList<PickerRowProxy>();
	private static final String LCAT = "PickerColumnProxy";
	
	public PickerColumnProxy(TiContext tiContext)
	{
		super(tiContext);
	}
	
	public void setPickerColumnChangeListener(PickerColumnChangeListener listener)
	{
		this.changeListener = listener;
	}
	
	interface PickerColumnChangeListener
	{
		void rowAdded(PickerColumnProxy column, PickerRowProxy row);
		void rowsAdded(PickerColumnProxy column, ArrayList<PickerRowProxy> rows);
	}
	
	protected void addRow(PickerRowProxy row)
	{
		addRow(row, true);
	}
	
	protected void addRow(PickerRowProxy row, boolean notifyListeners) 
	{
		rows.add(row);
		if (notifyListeners && changeListener != null) {
			changeListener.rowAdded(this, row);
		}
	}
	
	protected void addRows(Object[] rows) 
	{
		ArrayList<PickerRowProxy> newrows = null;
		for (Object obj :rows) {
			if (obj instanceof PickerRowProxy) {
				if (newrows == null) {
					newrows = new ArrayList<PickerRowProxy>();
				}
				newrows.add((PickerRowProxy)obj);
			} else {
				Log.w(LCAT, "Unexpected type not added to picker: " + obj.getClass().getName());
			}
		}
		
		addRows(newrows);
	}
	
	protected void addRows(ArrayList<PickerRowProxy> newRows)
	{
		if (newRows != null && newRows.size() > 0) {
			rows.addAll(newRows);
			if (changeListener != null) {
				changeListener.rowsAdded(this, newRows);
			}
		}
	}
	
	protected ArrayList<PickerRowProxy> getRows()
	{
		return rows;
	}

}
