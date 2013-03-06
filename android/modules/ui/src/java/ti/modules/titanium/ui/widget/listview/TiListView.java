package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiRHelper.ResourceNotFoundException;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Context;
import android.util.Pair;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ListView;
import android.widget.TextView;

public class TiListView extends TiUIView{

	private ListView listView;
	private TiBaseAdapter adapter;
	private ArrayList<ListSectionProxy> sections;
	private AtomicInteger itemTypeCount;
	private String defaultTemplateBinding;
	private HashMap<String, TiTemplate> templatesByBinding;
	private int listItemId;
	public static int listContentId;
	public static int isCheck;
	public static int hasChild;
	public static int accessory;
	private int headerFooterId;
	public static LayoutInflater inflater;
	private int titleId;
	private View headerView;
	private View footerView;
	
	private static final String TAG = "TiListView";
	
	public static final int HEADER_FOOTER_ITEM_TYPE = 0;

	public class TiBaseAdapter extends BaseAdapter {

		Activity context;
		
		public TiBaseAdapter(Activity activity) {
			context = activity;
		}

		@Override
		public int getCount() {
			int count = 0;
			for (int i = 0; i < sections.size(); i++) {
				ListSectionProxy section = sections.get(i);
				count += section.getItemCount();
			}
			return count;
		}

		@Override
		public Object getItem(int arg0) {
			//not using this method
			return arg0;
		}

		@Override
		public long getItemId(int position) {
			//not using this method
			return position;
		}
		
		//One type for header/footer, One type for built-in template, and one type per custom template.
		public int getViewTypeCount() {
			return 2 + templatesByBinding.size();
			
		}
		@Override
		public int getItemViewType(int position) {
			Pair<ListSectionProxy, Integer> info = getSectionInfoByEntryIndex(position);
			ListSectionProxy section = info.first;
			int index = info.second;
			if (section.isHeaderView(index) || section.isFooterView(index))
				return HEADER_FOOTER_ITEM_TYPE;
			return section.getTemplateByIndex(index).getType();			
		}

		@Override
		public View getView(int position, View convertView, ViewGroup parent) {
			//Get section info from index
			Pair<ListSectionProxy, Integer> info = getSectionInfoByEntryIndex(position);
			ListSectionProxy section = info.first;
			int index = info.second;
			View content = convertView;

			//Handling section header/footer titles
			if (section.isHeaderView(index) || section.isFooterView(index)) {
				if (content == null) {
					content = inflater.inflate(headerFooterId, null);
				}
				TextView title = (TextView)content.findViewById(titleId);
				title.setText(section.getHeaderOrFooterTitle(index));
				return content;
			}
			
			//Handling templates
			KrollDict data = section.getListItemData(index);
			TiTemplate template = section.getTemplateByIndex(index);
			if (content != null) {
				TiBaseListViewItem itemContent = (TiBaseListViewItem) content.findViewById(listContentId);
				section.populateViews(data, itemContent, template, position, index, content);
			} else {
				content = inflater.inflate(listItemId, null);
				TiBaseListViewItem itemContent = (TiBaseListViewItem) content.findViewById(listContentId);
				section.generateCellContent(index, data, template, itemContent, position, content);
			}
			return content;

		}

	}

	public TiListView(TiViewProxy proxy, Activity activity) {
		super(proxy);
		
		//initializing variables
		sections = new ArrayList<ListSectionProxy>();
		itemTypeCount = new AtomicInteger(1);
		templatesByBinding = new HashMap<String, TiTemplate>();
		
		//initializing listView and adapter
		listView = new ListView(activity);
		adapter = new TiBaseAdapter(activity);
		
		//init inflater
		if (inflater == null) {
			inflater = (LayoutInflater)activity.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		}
		
		getLayoutParams().autoFillsHeight = true;
		getLayoutParams().autoFillsWidth = true;

		try {
			headerFooterId = TiRHelper.getResource("layout.list_header_or_footer");
			listItemId = TiRHelper.getResource("layout.list_item");
			titleId = TiRHelper.getResource("id.title");
			listContentId = TiRHelper.getResource("id.listItem");
			isCheck = TiRHelper.getResource("drawable.btn_check_buttonless_on_64");
			hasChild = TiRHelper.getResource("drawable.btn_more_64");
			accessory = TiRHelper.getResource("id.accessoryType");
		} catch (ResourceNotFoundException e) {
			Log.e(TAG, "XML resources could not be found!!!");
		}
		
		
		setNativeView(listView);
	}
	
	public void setHeaderTitle(String title) {
		TextView textView = (TextView) headerView.findViewById(titleId);
		textView.setText(title);
		if (textView.getVisibility() == View.GONE) {
			textView.setVisibility(View.VISIBLE);
		}
	}
	
	public void setFooterTitle(String title) {
		TextView textView = (TextView) footerView.findViewById(titleId);
		textView.setText(title);
		if (textView.getVisibility() == View.GONE) {
			textView.setVisibility(View.VISIBLE);
		}
	}
	
	public void processProperties(KrollDict d) {
		
		if (d.containsKey(TiC.PROPERTY_TEMPLATES)) {
			Object templates = d.get(TiC.PROPERTY_TEMPLATES);
			if (templates != null) {
				processTemplates(new KrollDict((HashMap)templates));
			}
		} 
		
		if (d.containsKey(TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR)) {
			listView.setVerticalScrollBarEnabled(TiConvert.toBoolean(d, TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR, true));
		}

		if (d.containsKey(TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE)) {
			defaultTemplateBinding = TiConvert.toString(d, TiC.PROPERTY_DEFAULT_ITEM_TEMPLATE);
		}
		
		if (d.containsKey(TiC.PROPERTY_SECTIONS)) {
			processSections((Object[])d.get(TiC.PROPERTY_SECTIONS));
		}
		
		if (d.containsKey(TiC.PROPERTY_HEADER_TITLE)) {
			headerView = inflater.inflate(headerFooterId, null);
			setHeaderTitle(TiConvert.toString(d, TiC.PROPERTY_HEADER_TITLE));
		}
		
		if (d.containsKey(TiC.PROPERTY_FOOTER_TITLE)) {
			footerView = inflater.inflate(headerFooterId, null);
			setFooterTitle(TiConvert.toString(d, TiC.PROPERTY_FOOTER_TITLE));
		}

		//Check to see if headerTitle and footerTitle are specified. If not, we hide the views
		if (headerView == null) {
			headerView = inflater.inflate(headerFooterId, null);
			headerView.findViewById(titleId).setVisibility(View.GONE);
		}
		
		if (footerView == null) {
			footerView = inflater.inflate(headerFooterId, null);
			footerView.findViewById(titleId).setVisibility(View.GONE);
		}

		//Have to add header and footer before setting adapter
		listView.addHeaderView(headerView);
		listView.addFooterView(footerView);

		listView.setAdapter(adapter);

		super.processProperties(d);
		
	}
	
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {

		if (key.equals(TiC.PROPERTY_HEADER_TITLE)) {
			setHeaderTitle(TiConvert.toString(newValue));
		} else if (key.equals(TiC.PROPERTY_FOOTER_TITLE)) {
			setFooterTitle(TiConvert.toString(newValue));
		} else if (key.equals(TiC.PROPERTY_SECTIONS) && newValue instanceof Object[] ) {
			processSections((Object[])newValue);
			if (adapter != null) {
				adapter.notifyDataSetChanged();
			}
		}
	}

	protected void processTemplates(KrollDict templates) {
		for (String key : templates.keySet()) {
			//Here we bind each template with a key so we can use it to look up later
			KrollDict properties = new KrollDict((HashMap)templates.get(key));
			TiTemplate template = new TiTemplate(key, properties);
			//Set type to template, for recycling purposes.
			template.setType(getItemType());
			templatesByBinding.put(key, template);
			//set parent of root item
			template.setRootParent(proxy);
		}
	}

	protected void processSections(Object[] sections) {
		
		this.sections.clear();
		for (int i = 0; i < sections.length; i++) {
			processSection(sections[i], -1);
		}
	}
	
	protected void processSection(Object sec, int index) {
		if (sec instanceof ListSectionProxy) {
			ListSectionProxy section = (ListSectionProxy) sec;
			if (this.sections.contains(section)) {
				return;
			}
			if (index == -1 || index >= sections.size()) {
				this.sections.add(section);	
			} else {
				this.sections.add(index, section);
			}
			section.setAdapter(adapter);
			section.setListView(this);
			//Attempts to set type for existing templates.
			section.setTemplateType();
			//Process preload data if any
			section.processPreloadData();
		}
	}
	
	protected Pair<ListSectionProxy, Integer> getSectionInfoByEntryIndex(int index) {
		if (index < 0) {
			return null;
		}

		for (int i = 0; i < sections.size(); i++) {
			ListSectionProxy section = sections.get(i);
			int sectionItemCount = section.getItemCount();
			if (index <= sectionItemCount - 1) {
				return new Pair<ListSectionProxy, Integer>(section, index);
			} else {
				index -= sectionItemCount;
			}
		}

		return null;
	}
	
	public int getItemType() {
		return itemTypeCount.getAndIncrement();
	}
	
	public TiTemplate getTemplateByBinding(String binding) {
		return templatesByBinding.get(binding);
	}
	
	public String getDefaultTemplateBinding() {
		return defaultTemplateBinding;
	}
	
	public int getSectionCount() {
		return sections.size();
	}
	
	public void appendSection(Object section) {
		if (section instanceof Object[]) {
			Object[] secs = (Object[]) section;
			for (int i = 0; i < secs.length; i++) {
				processSection(secs[i], -1);
			}
		} else {
			processSection(section, -1);
		}
		adapter.notifyDataSetChanged();
	}
	
	public void deleteSectionAt(int index) {
		if (index < sections.size()) {
			sections.remove(index);
			adapter.notifyDataSetChanged();
		}
	}
	
	public void insertSectionAt(int index, Object section) {
		if (section instanceof Object[]) {
			Object[] secs = (Object[]) section;
			for (int i = 0; i < secs.length; i++) {
				processSection(secs[i], index);
				index++;
			}
		} else {
			processSection(section, index);
		}
		adapter.notifyDataSetChanged();
	}
	
	public void replaceSectionAt(int index, Object section) {
		deleteSectionAt(index);
		insertSectionAt(index, section);
	}
	
	public void scrollToItem(int sectionIndex, int itemIndex) {
		int position = 1;
		for (int i = 0; i < sections.size(); i++) {
			ListSectionProxy section = sections.get(i);
			if (i == sectionIndex) {
				if (itemIndex >= section.getContentCount()) {
					Log.e(TAG, "Invalid item index");
					return;
				}
				position += itemIndex;
				if (section.getHeaderTitle() != null) {
					position += 1;			
				}
				break;
			} else {
				position += section.getItemCount();
			}
		}
		listView.smoothScrollToPosition(position);
	}
	
}
