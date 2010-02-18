package ti.modules.titanium.ui.widget.tableview;

import java.util.ArrayList;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiUIHelper;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.FrameLayout;
import android.widget.ListView;
import android.widget.AdapterView.OnItemClickListener;

public class TiTableView extends FrameLayout
{

	private static final String LCAT = "TiTableView";
	private static final boolean DBG = TiConfig.LOGD;

	public static final int TYPE_HEADER = 0;
	public static final int TYPE_NORMAL = 1;
	public static final int TYPE_HTML = 2;
	public static final int TYPE_CUSTOM = 3;

	private Handler handler;
	private TableViewModel viewModel;
	private ListView listView;
	private TiTableViewItemOptions defaults;
	private TTVListAdapter adapter;
	private TiDict rowTemplate;
	private OnItemClickedListener itemClickListener;

	private String filterAttribute;
	private String filterText;

	public interface OnItemClickedListener {
		public void onClick(TiDict item);
	}

	class TTVListAdapter extends BaseAdapter
	{
		TableViewModel viewModel;
		ArrayList<Integer> index;
		private boolean filtered;

		TTVListAdapter(TableViewModel viewModel) {
			this.viewModel = viewModel;
			this.index = new ArrayList<Integer>(viewModel.getRowCount());
			applyFilter();
		}

		public void applyFilter() {

			ArrayList<TiDict> items = viewModel.getViewModel();
			int count = items.size();

			index.clear();
			filtered = false;

			if (filterAttribute != null && filterText != null && filterAttribute.length() > 0 && filterText.length() > 0) {
				filtered = true;

				String lfilter = filterText.toLowerCase();
				for(int i = 0; i < count; i++) {
					boolean keep = true;

					TiDict item = items.get(i);
					if (item.containsKey(filterAttribute)) {
						String t = item.getString(filterAttribute).toLowerCase();
						if(t.indexOf(lfilter) < 0) {
							keep = false;
						}
					}

					if (keep) {
						index.add(i);
					}
				}
			} else {
				for(int i = 0; i < count; i++) {
					index.add(i);
				}
			}
		}

		public int getCount() {
			//return viewModel.getViewModel().length();
			return index.size();
		}

		public Object getItem(int position) {
			return viewModel.getViewModel().get(index.get(position));
		}

		public long getItemId(int position) {
			// TODO Auto-generated method stub
			return 0;
		}

		@Override
		public int getViewTypeCount() {
			return 4;
		}

		@Override
		public int getItemViewType(int position) {
			TiDict o = (TiDict) getItem(position);
			return typeForItem(o);
		}

		private int typeForItem(TiDict o) {
			int type = TYPE_NORMAL;
			if (o != null) {
				if (o.optBoolean("isDisplayHeader", false)) {
					type = TYPE_HEADER;
				} else if ((o.containsKey("layout") && !o.isNull("layout")) || (rowTemplate != null && !o.containsKey("layout"))) {
					type = TYPE_CUSTOM;
				} else if (o.containsKey("html")) {
					type = TYPE_HTML;
				}
			}
			return type;
		}

		public View getView(int position, View convertView, ViewGroup parent)
		{
			TiDict o = (TiDict) getItem(position);
			TiBaseTableViewItem v = null;

			if (convertView != null) {
				v = (TiBaseTableViewItem) convertView;
			} else {
				Context ctx = getContext();
				switch(typeForItem(o)) {
				case TYPE_HEADER :
					v = new TiTableViewHeaderItem(ctx);
					break;
				case TYPE_NORMAL :
					v = new TiTableViewNormalItem(ctx);
					break;
				case TYPE_HTML :
					v = new TiTableViewHtmlItem(ctx);
					break;
				case TYPE_CUSTOM:
					v = new TiTableViewCustomItem(ctx);
					break;
				}
			}

			v.setRowData(defaults, rowTemplate, o);
			return v;
		}

		@Override
		public boolean areAllItemsEnabled() {
			return false;
		}

		@Override
		public boolean isEnabled(int position) {
			boolean enabled = true;
			TiDict o = (TiDict) getItem(position);
			enabled = !o.getBoolean("isDisplayHeader");
			return enabled;
		}

		@Override
		public boolean hasStableIds() {
			return false;
		}

		@Override
		public void notifyDataSetChanged() {
			applyFilter();
			super.notifyDataSetChanged();
		}

		public boolean isFiltered() {
			return filtered;
		}
	}

	public TiTableView(Context context)
	{
		super(context);
		this.handler = new Handler();

//TODO bookmark
		this.defaults = new TiTableViewItemOptions();
		defaults.put("rowHeight", "43");
		defaults.put("fontSize", TiUIHelper.getDefaultFontSize(getContext()));
		defaults.put("fontWeight", TiUIHelper.getDefaultFontWeight(getContext()));
		defaults.put("marginLeft", "0");
		defaults.put("marginTop", "0");
		defaults.put("marginRight", "0");
		defaults.put("marginBottom", "0");
		defaults.put("scrollBar", "auto");
		defaults.put("textAlign", "left");

		this.viewModel = new TableViewModel();

		this.listView = new ListView(getContext()) {

			@Override
			public boolean dispatchKeyEvent(KeyEvent event) {
				return super.dispatchKeyEvent(event);
			}
		};
		listView.setId(101);

		final Drawable defaultSelector = listView.getSelector();
		final Drawable adaptableSelector = new ColorDrawable(Color.TRANSPARENT) {

			@Override
			public void draw(Canvas canvas) {
				TiBaseTableViewItem v = (TiBaseTableViewItem) listView.getSelectedView();
				boolean customTable = rowTemplate != null;

				if (customTable || v != null) {
					if (customTable || v.providesOwnSelector()) {
						super.draw(canvas);
					} else {
						Rect r = getBounds();
						defaultSelector.setBounds(r);
						defaultSelector.setState(listView.getDrawableState());
						defaultSelector.draw(canvas);
					}
				} else {
					Rect r = getBounds();
					defaultSelector.setBounds(r);
					defaultSelector.setState(listView.getDrawableState());
					defaultSelector.draw(canvas);
				}
			}

		};
		listView.setSelector(adaptableSelector);

		listView.setFocusable(true);
		listView.setFocusableInTouchMode(true);
		listView.setBackgroundColor(Color.TRANSPARENT);
		listView.setCacheColorHint(Color.TRANSPARENT);
		adapter = new TTVListAdapter(viewModel);
		listView.setAdapter(adapter);

		listView.setOnItemClickListener(new OnItemClickListener() {

			public void onItemClick(AdapterView<?> parent, View view, int position, long id)
			{
				if (itemClickListener != null) {
					TiBaseTableViewItem v = (TiBaseTableViewItem) view;
					String viewClicked = v.getLastClickedViewName();
					TiDict item = viewModel.getViewModel().get(adapter.index.get(position));
					TiDict event = new TiDict();

					event.put("rowData", item);
					event.put("section", item.getInt("section"));
					event.put("row", item.getInt("sectionIndex"));
					event.put("index", item.getInt("index"));
					event.put("detail", false);
					if (item.containsKey("name")) {
						event.put("name", item.getString("name"));
					}

					if (viewClicked != null) {
						event.put("layoutName", viewClicked);
					}

					event.put("searchMode", adapter.isFiltered());

					itemClickListener.onClick(event);
				}
			}});

		addView(listView);
	}

	private void dataSetChanged() {
		//handler.post(dataSetChanged);
		if (adapter != null) {
			adapter.notifyDataSetChanged();
		}
	}

	public void setOnItemClickListener(OnItemClickedListener listener) {
		this.itemClickListener = listener;
	}

	public void setTemplate(TiDict rowTemplate) {
		this.rowTemplate = rowTemplate;
		dataSetChanged();
	}

	public void setData(Object[] rows) {
		viewModel.setData(rows);
		dataSetChanged();
	}

	public void setRowHeight(String rowHeight) {
//TODO
	}
//	@Override
//	protected void onLayout(boolean changed, int left, int top, int right, int bottom)
//	{
//		if (changed) {
//			listView.layout(left, top, right, bottom);
//		}
//	}
}
