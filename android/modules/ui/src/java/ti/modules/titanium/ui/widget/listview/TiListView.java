package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.util.Pair;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ListView;

public class TiListView extends TiUIView {

	private ListView listView;
	private TiBaseAdapter adapter;
	private ArrayList<SectionProxy> sections;
	private AtomicInteger itemTypeCount;
	private HashMap<String, TiTemplate> templatesByBinding;

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
			KrollDict data = section.getEntryProperties(index);
			TiTemplate template = section.getTemplateByIndex(index);
			TiBaseListViewItem content = null;
			
			if (convertView != null) {
				content = (TiBaseListViewItem) convertView;
				section.populateViews(data, content, template);
				Log.d("GetView", "reusing View");
			} else {
				Log.d("GetView", "generating View");
				content = section.generateCellContent(index, data, template);
			}

			return content;
		}

	}

	public TiListView(TiViewProxy proxy, Activity activity) {
		super(proxy);
		
		//initializing variables
		sections = new ArrayList<SectionProxy>();
		itemTypeCount = new AtomicInteger(0);
		templatesByBinding = new HashMap<String, TiTemplate>();
		
		//initializing listView and adapter
		listView = new ListView(activity);
		adapter = new TiBaseAdapter(activity);
		
		getLayoutParams().autoFillsHeight = true;
		getLayoutParams().autoFillsWidth = true;

		setNativeView(listView);
	}
	
	public void processProperties(KrollDict d) {

		if (d.containsKey(TiC.PROPERTY_SECTIONS)) {
			processSections((Object[])d.get(TiC.PROPERTY_SECTIONS));
		}
		
		if (d.containsKey(TiC.PROPERTY_TEMPLATES)) {
			Object templates = d.get(TiC.PROPERTY_TEMPLATES);
			if (templates != null) {
				processTemplates(new KrollDict((HashMap)templates));
			}
		} 

		listView.setAdapter(adapter);

		super.processProperties(d);
		
	}

	protected void processTemplates(KrollDict templates) {
		for (String key : templates.keySet()) {
			//Here we bind each template with a key so we can use it to look up later
			KrollDict properties = new KrollDict((HashMap)templates.get(key));
			templatesByBinding.put(key, new TiTemplate(key, properties));
		}
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
	
	public TiTemplate getTemplateByBinding(String binding) {
		return templatesByBinding.get(binding);
	}
	
}
