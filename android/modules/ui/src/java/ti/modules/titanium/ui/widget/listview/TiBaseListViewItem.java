package ti.modules.titanium.ui.widget.listview;

import java.util.HashMap;

import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.content.Context;
import android.util.AttributeSet;
import android.view.ViewGroup;

public class TiBaseListViewItem extends TiCompositeLayout{

	private HashMap<String, TiUIView> viewsMap;

	public TiBaseListViewItem(Context context) {
		super(context);
		viewsMap = new HashMap<String, TiUIView>();
	}
	
	public TiBaseListViewItem(Context context, AttributeSet set) {
		super(context, set);
		setId(TiListView.listContentId);
		viewsMap = new HashMap<String, TiUIView>();
	}
	
	public HashMap<String, TiUIView> getViewsMap() {
		return viewsMap;
	}
	
	public void bindView(String binding, TiUIView view) {
		viewsMap.put(binding, view);
	}
	
	public TiUIView getViewFromBinding(String binding) {
		return viewsMap.get(binding);
	}

}
