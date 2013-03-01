package ti.modules.titanium.ui.widget.listview;

import java.util.HashMap;

import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.AbsListView;

public class TiBaseListViewItem extends TiCompositeLayout{

	private HashMap<String, TiUIView> viewsMap;

	public TiBaseListViewItem(Context context) {
		super(context);
		viewsMap = new HashMap<String, TiUIView>();
	}
	
	public TiBaseListViewItem(Context context, AttributeSet set) {
		super(context);
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

	public void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
		//Mode will be MeasureSpec.AT_MOST since default is wrap content, so
		//we change mode to MeasureSpec.EXACTLY to reflect fill behavior.
		//int w = MeasureSpec.getSize(widthMeasureSpec);
		//int newMode = MeasureSpec.makeMeasureSpec(w, MeasureSpec.EXACTLY);
		super.onMeasure(widthMeasureSpec, heightMeasureSpec);

	}
}
