package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

public class TableViewSectionProxy extends TiViewProxy
{

	ArrayList<TableViewRowProxy> rows;

	public TableViewSectionProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
		rows = new ArrayList<TableViewRowProxy>();
	}

	@Override
	public TiUIView createView(Activity activity) {
		return null;
	}

	public TableViewRowProxy[] getRows()
	{
		return rows.toArray(new TableViewRowProxy[rows.size()]);
	}

	public double getRowCount() {
		return rows.size();
	}

	public void add(TableViewRowProxy rowProxy)
	{
		if (rowProxy != null) {
			rows.add(rowProxy);
		}
	}

	public void remove(TableViewRowProxy rowProxy) {
		if (rowProxy != null) {
			rows.remove(rowProxy);
		}
	}

	public TableViewRowProxy rowAtIndex(int index)
	{
		TableViewRowProxy result = null;
		if (index > -1 && index < rows.size()) {
			result = rows.get(index);
		}

		return result;
	}
}
