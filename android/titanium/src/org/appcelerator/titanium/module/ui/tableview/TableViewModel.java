package org.appcelerator.titanium.module.ui.tableview;

import java.util.ArrayList;

import org.appcelerator.titanium.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class TableViewModel
{
	private static final String LCAT = "TableViewModel";

	// Flat view

	public class Item {
		public Item(int index) {
			this.index = index;
		}
		public boolean hasHeader() {
			return headerText != null;
		}

		public int index;
		public int sectionIndex;
		public int indexInSection;
		public String headerText;
		public JSONObject data;
	}

	private boolean dirty;
	private ArrayList<Item> model;
	private JSONArray viewModel;

	// The unstructured set of data. Modifier operations are treated as edits to this
	// and the section structure.

	public TableViewModel() {
		model = new ArrayList<Item>();
		viewModel = new JSONArray();
		dirty = true;
	}

	public void insertItemBefore(int index, JSONObject data)
	{
		try {
			Item item = model.get(index);

			Item newItem = new Item(index);
			if (data.has("header")) {
				newItem.headerText = data.getString("header");
			}
			newItem.data = data;
			model.add(newItem.index, newItem);

			updateIndexes(index+1);

			if (newItem.hasHeader()) {
				newItem.sectionIndex = item.sectionIndex;
				newItem.indexInSection = 0;
				updateSectionData(index + 1, newItem.sectionIndex);
			} else {
				if (item.hasHeader()) {
					newItem.headerText = item.headerText;
					item.headerText = null;
					newItem.sectionIndex = item.sectionIndex;
					newItem.indexInSection = 0;
					updateSectionData(index + 1, newItem.sectionIndex);
				} else {
					newItem.sectionIndex = item.sectionIndex;
					updateIndexInSection(index, item.indexInSection);
				}
			}
			dirty = true;
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to insertItemBefore " + index,e);
		}
	}

	public void insertItemAfter(int index, JSONObject data)
	{
		try {
			Item item = model.get(index);

			Item newItem = new Item(index+1);
			if (data.has("header")) {
				newItem.headerText = data.getString("header");
			}
			newItem.data = data;
			model.add(newItem.index, newItem);

			updateIndexes(newItem.index);

			if (newItem.hasHeader()) {
				newItem.sectionIndex = item.sectionIndex + 1;
				newItem.indexInSection = 0;
				updateSectionData(newItem.index, newItem.sectionIndex);
			} else {
				newItem.sectionIndex = item.sectionIndex;
				updateIndexInSection(newItem.index, item.indexInSection + 1);
			}
			dirty = true;
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to insertItemAfter " + index,e);
		}
	}

	public void deleteItem(int index)
	{
		Item oldItem = model.get(index);
		model.remove(index);
		updateIndexes(index);
		if (oldItem.hasHeader()) {
			Item item = model.get(index);
			if (item.hasHeader()) {
				updateSectionData(index, oldItem.sectionIndex-1); // gets incremented on detection.
			} else {
				item.headerText = oldItem.headerText;
				item.indexInSection = oldItem.indexInSection;
				updateIndexInSection(index + 1, item.indexInSection + 1);
			}
		} else {
			updateIndexInSection(index, oldItem.indexInSection);
		}
		dirty = true;
	}

	public void updateItem(int index, JSONObject data)
	{
		try {
			Item item = model.get(index);
			item.data = data;
			if (data.has("header")) {
				if (item.hasHeader()) {
					item.headerText = data.getString("header");
				} else {
					// We need to insert a new section.
					item.sectionIndex++;
					item.indexInSection = 0;

					updateSectionData(index+1, item.sectionIndex);
				}
			}
		} catch (JSONException e) {
			Log.e(LCAT, "Error accessing json data", e);
		}
		dirty = true;
	}

	// This method just brute forces the data into the table.
	public void setData(String json) {
		try {
			setData(new JSONArray(json));
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to parse dataset.", e);
		}
	}
	public void setData(JSONArray rows) {
		if (model != null) {
			model.clear();
		}
		dirty = true;
		int sectionCounter = 0;
		int sectionRowCounter = 0;

		for(int i = 0; i < rows.length(); i++) {
			try {
				Item item = new Item(i);
				JSONObject row = rows.getJSONObject(i);
				item.data = row;

				if (row.has("header")) {
					if (i > 0) {
						sectionCounter++;
						sectionRowCounter = 0;
					}
					item.headerText = row.getString("header");
				}

				item.sectionIndex = sectionCounter;
				item.indexInSection = sectionRowCounter;

				model.add(item);
				sectionRowCounter++;
			} catch (JSONException e) {
				Log.e(LCAT, "Error adding item at index " + i);
			}
		}
	}

	public JSONArray getViewModel() {
		if (dirty) {
			viewModel = new JSONArray();
			try {
				JSONObject o = null;
				for (Item item : model) {
					if (item.hasHeader()) {
						o = new JSONObject(item.data.toString());
						o.put("isDisplayHeader", true);
						viewModel.put(o);
					}
					o = new JSONObject(item.data.toString());
					o.put("section", item.sectionIndex);
					o.put("sectionIndex", item.indexInSection);
					o.put("index", item.index);
					o.put("isDisplayHeader", false);
					viewModel.put(o);
				}
				dirty = false;
			} catch (JSONException e) {
				Log.e(LCAT, "Error building view model", e);
			}
		}

		return viewModel;
	}

	private void updateIndexes(int start) {
		for(int i = start; i < model.size(); i++) {
			model.get(i).index = i;
		}

	}

	private void updateIndexInSection(int start, int sectionRowCounter) {
		for(int i = start; i < model.size(); i++) {
			Item itemInSection = model.get(i);
			if (itemInSection.hasHeader()) {
				break;
			}
			itemInSection.indexInSection = sectionRowCounter++;
		}
	}

	private void updateSectionData(int start, int section) {
		int sectionRowCounter = 0;
		if (!model.get(start).hasHeader()) {
			sectionRowCounter = 1;
		}
		for(int i = start; i < model.size(); i++) {
			Item item = model.get(i);
			if (item.hasHeader()) {
				section++;
				sectionRowCounter = 0;
			}
			item.sectionIndex = section;
			item.indexInSection = sectionRowCounter;
			sectionRowCounter++;
		}
	}
}
