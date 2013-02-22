package ti.modules.titanium.ui.widget.listview;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.view.View;
import android.view.View.OnClickListener;
import android.view.View.OnLongClickListener;

public class TiListCell extends TiUIView {

	public TiListCell(TiViewProxy proxy) {
		super(proxy);
	}

	public TiListCell(TiBaseListViewItem item) {
		super(null);
		setNativeView(item);
	}
	
	protected void setNativeView(View view) {
		this.nativeView = view;
	}
	
	protected void setOnClickListener(View view)
	{
		view.setOnClickListener(new OnClickListener()
		{
			public void onClick(View view)
			{
				//Handle click event
			}
		});
	}

	protected void setOnLongClickListener(View view)
	{
		view.setOnLongClickListener(new OnLongClickListener()
		{
			public boolean onLongClick(View view)
			{
				//Handle click event
				return false;
			}
		});
	}
}
