/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.ui.tableview;

import java.util.ArrayList;

import org.appcelerator.titanium.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class TableViewModel
{
	private static final String LCAT = "TableViewModel";
	private static final boolean DUMP = false;

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
		public String name;
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

	public int getRowCount() {
		return model.size();
	}

	public int getIndexByName(String name) {
		int index = -1;

		if (name != null) {
			for(Item item : model) {
				if (item.name != null) {
					if (name.equals(item.name)) {
						index = item.index;
						break;
					}
				}
			}
		}

		if (DUMP) {
			Log.e(LCAT, "Index of Name: " + name + " is " + index);
		}
		return index;
	}

	public void insertItemBefore(int index, JSONObject data)
	{
		try {
			if (model.size() > 0) {
				if (index < 0) {
					index = 0;
				}

				Item item = model.get(index);

				Item newItem = new Item(index);
				if (data.has("header")) {
					newItem.headerText = data.getString("header");
				}
				if (data.has("name")) {
					newItem.name = data.getString("name");
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
			} else {
				insertFirstRow(data);
			}

			dirty = true;
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to insertItemBefore " + index,e);
		}

		if (DUMP) {
			Log.w(LCAT, "==== After insertItemBefore");
			dumpModel();
		}
	}

	public void insertItemAfter(int index, JSONObject data)
	{
		try {

			if (model.size() > 0) {
				if (index > model.size()) {
					index = model.size() - 1;
				}

				Item item = model.get(index);

				Item newItem = new Item(index+1);
				if (data.has("header")) {
					newItem.headerText = data.getString("header");
				}
				if (data.has("name")) {
					newItem.name = data.getString("name");
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
			} else {
				insertFirstRow(data);
			}
			dirty = true;
		} catch (JSONException e) {
			Log.e(LCAT, "Unable to insertItemAfter " + index,e);
		}
		if (DUMP) {
			Log.w(LCAT, "==== After insertItemAfter");
			dumpModel();
		}
	}

	public void deleteItem(int index)
	{
		if (index >= 0 && index < model.size()) {
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
		} else {
			Log.w(LCAT, "Attempt to delete non-existant row with index " + index);
		}
		if (DUMP) {
			Log.w(LCAT, "==== After deleteItem");
			dumpModel();
		}
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
					item.headerText = data.getString("header");
					item.sectionIndex++;
					item.indexInSection = 0;

					updateSectionData(index+1, item.sectionIndex);
				}
			}
		} catch (JSONException e) {
			Log.e(LCAT, "Error accessing json data", e);
		}
		dirty = true;
		if (DUMP) {
			Log.w(LCAT, "==== After updateItem");
			dumpModel();
		}
	}

	// This method just brute forces the data into the table.
	public void setData(String json) {
		try {
			if (json != null && json.length() > 0) {
				setData(new JSONArray(json));
			} else {
				setData((JSONArray) null);
			}
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

		if (rows != null) {
			for(int i = 0; i < rows.length(); i++) {
				try {
					Item item = new Item(i);
					JSONObject row = rows.getJSONObject(i);
					if (row.has("name")) {
						item.name = row.getString("name");
					}
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
					Log.e(LCAT, "Error adding item at index " + i, e);
				}
			}
		}
		if (DUMP) {
			Log.w(LCAT, "==== After setData");
			dumpModel();
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
						o.put("header", item.headerText);
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

	public int getViewIndex(int index) {
		int position = -1;
		// the View index can be larger than model index if there are headers.
		if (viewModel != null && index <= viewModel.length()) {
			try {
				for(int i = 0; i < viewModel.length(); i++) {
					JSONObject o = viewModel.getJSONObject(i);
					if (o.has("index") && index == o.getInt("index")) {
						position = i;
						break;
					}
				}
			} catch (JSONException e) {
				Log.e(LCAT, e.getMessage(), e);
			}
		}

		return position;
	}

	private void insertFirstRow(JSONObject data) throws JSONException
	{
		Item newItem = new Item(0);
		if (data.has("header")) {
			newItem.headerText = data.getString("header");
		}
		if (data.has("name")) {
			newItem.name = data.getString("name");
		}
		newItem.sectionIndex = 0;
		newItem.indexInSection = 0;
		newItem.index = 0;
		newItem.data = data;
		model.add(newItem.index, newItem);
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

	public void dumpModel() {
		Log.i(LCAT, "");
		for (int i = 0; i < model.size(); i++) {
			Item item = model.get(i);
			Log.i(LCAT, i + ": index: " +  item.index + " s:" + item.sectionIndex + " iis: " +
					item.indexInSection +
					" n: " + item.name + " h: " + item.headerText);
		}
	}
}
