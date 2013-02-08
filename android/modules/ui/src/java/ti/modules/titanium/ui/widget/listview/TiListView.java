package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUILabel;

import android.app.Activity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.EditText;
import android.widget.ListView;

public class TiListView extends TiUIView {

	ListView listView;
	TiBaseAdapter adapter;
	ArrayList<SectionProxy> sections;
	boolean useDefaultStyle;
	

	public class TiBaseAdapter extends BaseAdapter {

		Activity context;
		public TiBaseAdapter(Activity activity) {
			context = activity;
		}

		@Override
		public int getCount() {
			int count = 0;
			for (int i = 0; i < sections.size(); i++) {
				SectionProxy section = sections.get(i);
				count += section.getItemCount();
			}
			return count;
		}

		@Override
		public Object getItem(int arg0) {
			return arg0;
		}

		@Override
		public long getItemId(int position) {
			return position;
		}

		@Override
		public View getView(int position, View convertView, ViewGroup parent) {
			//if (convertView == null) {
				TiUILabel label = new TiUILabel(sections.get(0).getViewProxies().get(0));
				KrollDict d = new KrollDict();
				d.put("title", "hello");
				label.processProperties(d);
				return label.getNativeView();
			//}
			//return null;
		}

	}

	public TiListView(TiViewProxy proxy, Activity activity) {
		super(proxy);
		
		//initializing variables
		sections = new ArrayList<SectionProxy>();
		useDefaultStyle = false;
		
		//initializing listView and adapter
		listView = new ListView(activity);
		adapter = new TiBaseAdapter(activity);
		
		
		listView.setAdapter(adapter);
		setNativeView(listView);
	}
	
	public void processProperties(KrollDict d) {

		if (d.containsKey(TiC.PROPERTY_SECTIONS)) {
			processSections((Object[])d.get(TiC.PROPERTY_SECTIONS));
		}
		
		if (d.containsKey(TiC.PROPERTY_CELLSTYLES)) {
			//process styles
		} else {
			//use default style
			useDefaultStyle = true;
		}
		super.processProperties(d);
	}

	protected void processSections(Object[] sections) {
		
		for (int i = 0; i < sections.length; i++) {
			Object obj = sections[i];
			if (obj instanceof SectionProxy) {
				this.sections.add((SectionProxy) obj);	
			}
		}
	}
	
}
