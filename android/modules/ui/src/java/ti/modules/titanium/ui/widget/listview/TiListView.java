package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.util.Pair;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ListView;

public class TiListView extends TiUIView {

	ListView listView;
	TiBaseAdapter adapter;
	ArrayList<SectionProxy> sections;
	boolean useDefaultStyle;
	AtomicInteger itemTypeCount;
	

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
		
		public int getViewTypeCount() {
			return itemTypeCount.get();
			
		}
		@Override
		public int getItemViewType(int position) {
			Pair<SectionProxy, Integer> info = getSectionInfoByEntryIndex(position);
			SectionProxy section = info.first;
			int index = info.second;
			return section.getTemplateByIndex(index).getType();
			
		}

		@Override
		public View getView(int position, View convertView, ViewGroup parent) {

			Pair<SectionProxy, Integer> info = getSectionInfoByEntryIndex(position);
			SectionProxy section = info.first;
			int index = info.second;
			if (convertView != null) {
				TiBaseListViewItem view = (TiBaseListViewItem) convertView;
				KrollDict data = section.getData(index);
				TiTemplate template = section.getTemplateByIndex(index);
				section.populateViews(data, view, template);
				Log.w("GetView", "reusing View");
				return view;
			}
			Log.w("GetView", "generating View");
			TiCompositeLayout view = section.generateView(index);
			return view;


			
			
		}

	}

	public TiListView(TiViewProxy proxy, Activity activity) {
		super(proxy);
		
		//initializing variables
		sections = new ArrayList<SectionProxy>();
		useDefaultStyle = false;

		itemTypeCount = new AtomicInteger(0);
		
		//initializing listView and adapter
		listView = new ListView(activity);
		adapter = new TiBaseAdapter(activity);

		setNativeView(listView);
	}
	
	public void processProperties(KrollDict d) {

		if (d.containsKey(TiC.PROPERTY_SECTIONS)) {
			processSections((Object[])d.get(TiC.PROPERTY_SECTIONS));
		}
		
		if (d.containsKey(TiC.PROPERTY_TEMPLATES)) {
			//process styles
		} else {
			//use default style
			useDefaultStyle = true;
		}

		listView.setAdapter(adapter);

		super.processProperties(d);
		
	}

	protected void processSections(Object[] sections) {
		
		for (int i = 0; i < sections.length; i++) {
			Object obj = sections[i];
			if (obj instanceof SectionProxy) {
				SectionProxy section = (SectionProxy) obj;
				this.sections.add(section);	
				section.setAdapter(adapter);
				section.setListView(this);
				//Each template is an item type. When we process sections, we check to see
				//if templates already have an item type set. If not, we set it
				section.setTemplateType();
			}
		}
	}
	
	protected Pair<SectionProxy, Integer> getSectionInfoByEntryIndex(int index) {
		if (index < 0) {
			return null;
		}

		for (int i = 0; i < sections.size(); i++) {
			SectionProxy section = sections.get(i);
			int sectionIndex = section.getItemCount() - 1;
			if (index <= sectionIndex) {
				return new Pair<SectionProxy, Integer>(section, index);
			} else {
				index -= sectionIndex;
			}
		}

		return null;
	}
	
	public int getItemType() {
		return itemTypeCount.incrementAndGet();
	}
	
}
