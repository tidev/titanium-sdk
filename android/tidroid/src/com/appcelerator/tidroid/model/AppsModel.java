package com.appcelerator.tidroid.model;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.ContentValues;
import android.database.Cursor;
import android.database.DatabaseUtils;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;

public class AppsModel
{
	private static final String LCAT = "TiAppModel";

	private static final String APP_ID = "id";
	private static final String APP_PUBLICATION_DATE = "pubdate";
	private static final String APP_PAGE = "app_page";
	private static final String APP_TITLE = "title";
	private static final String APP_GUID = "guid";
	private static final String APP_DESCRIPTION = "desc";
	private static final String APP_URL = "url";
	private static final String APP_AUTHOR = "author";
	private static final String APP_VERSION = "version";
	private static final String APP_DOWNLOADS = "downloads";
	private static final String APP_RATING = "value";
	private static final String APP_VOTES = "votes";
	private static final String APP_IMAGE = "image";
	private static final String APP_HAS_VOTED = "hasVoted";
	private static final String APP_RELEASES = "releases";
	private static final String APP_RELEASE_PLATFORM = "platform";
	private static final String APP_RELEASE_PLATFORM_LABEL = "label";
	private static final String APP_RELEASE_URL = "url";
	private static final String APP_RELEASE_DOWNLOADS = "downloads";

	private static final String DB_APPS = "Apps";

	private static final String DB_APP_ID = "_id";
	private static final String DB_APP_PUBLICATION_DATE = "Published";
	private static final String DB_APP_PAGE = "AppUrl";
	private static final String DB_APP_TITLE = "Title";
	private static final String DB_APP_GUID = "Guid";
	private static final String DB_APP_DESCRIPTION = "Description";
	private static final String DB_APP_URL = "Url";
	private static final String DB_APP_AUTHOR = "Author";
	private static final String DB_APP_VERSION = "Version";
	private static final String DB_APP_DOWNLOADS = "Downloads";
	private static final String DB_APP_RATING = "Rating";
	private static final String DB_APP_VOTES = "Votes";
	private static final String DB_APP_IMAGE = "ImageUrl";
	private static final String DB_APP_HAS_VOTED = "HasVoted";

	private static final String DB_RELEASES = "AppReleases";

	private static final String DB_APP_RELEASE_APP_ID = "Apps_id";
	private static final String DB_APP_RELEASE_PLATFORM = "Platform";
	private static final String DB_APP_RELEASE_PLATFORM_LABEL = "PlatformLabel";
	private static final String DB_APP_RELEASE_URL = "Url";
	private static final String DB_APP_RELEASE_DOWNLOADS = "Downloads";

	private AppDatabase appDb;

	private AppsModelListener listener;

	public AppsModel(AppDatabase appDb) {
		this.appDb = appDb;
	}

	public void setModelChangeListener(AppsModelListener listener) {
		this.listener = listener;
	}

	private void fireAppsChanged() {
		if (listener != null) {
			listener.onAppsChanged();
		}
	}

	public void updateApps(String json) throws JSONException
	{
		JSONArray apps = new JSONArray(json);

		SQLiteDatabase db = null;
		try {
			db = appDb.getWritableDatabase();

			// For each app returned
			for(int i = 0; i < apps.length(); i++) {
				JSONObject app = apps.getJSONObject(i);
				ContentValues appValues = new ContentValues();

				try {
					db.beginTransaction();

					appValues.put(DB_APP_ID, app.getInt(APP_ID));
					appValues.put(DB_APP_PUBLICATION_DATE, app.getString(APP_PUBLICATION_DATE));
					appValues.put(DB_APP_PAGE, app.getString(APP_PAGE));
					appValues.put(DB_APP_TITLE,app.getString(APP_TITLE));
					appValues.put(DB_APP_GUID,app.getString(APP_GUID));
					appValues.put(DB_APP_DESCRIPTION,app.getString(APP_DESCRIPTION));
					appValues.put(DB_APP_URL,app.getString(APP_URL));
					appValues.put(DB_APP_AUTHOR,app.getString(APP_AUTHOR));
					appValues.put(DB_APP_VERSION,app.getInt(APP_VERSION));
					appValues.put(DB_APP_DOWNLOADS,app.getInt(APP_DOWNLOADS));
					appValues.put(DB_APP_RATING,app.getInt(APP_RATING));
					appValues.put(DB_APP_VOTES,app.getInt(APP_VOTES));
					appValues.put(DB_APP_IMAGE,app.getString(APP_IMAGE));
					appValues.put(DB_APP_HAS_VOTED,app.getBoolean(APP_HAS_VOTED));

					String[] args = { appValues.getAsString(DB_APP_ID) };
					int affected = db.update(DB_APPS, appValues, DB_APP_ID + "=?", args);

					if (affected == 0) {
						db.insertOrThrow(DB_APPS, null, appValues);
					}

					// Just remove any existing releases instead of trying to hand pick and update
					db.delete(DB_RELEASES, DB_APP_RELEASE_APP_ID + "=?", args);

					JSONArray releases = app.getJSONArray(APP_RELEASES);
					for(int j=0; j < releases.length(); j++) {
						JSONObject release = releases.getJSONObject(j);

						ContentValues releaseValues = new ContentValues();

						releaseValues.put(DB_APP_RELEASE_APP_ID, appValues.getAsString(DB_APP_ID));
						releaseValues.put(DB_APP_RELEASE_PLATFORM, release.getString(APP_RELEASE_PLATFORM));
						releaseValues.put(DB_APP_RELEASE_PLATFORM_LABEL,release.getString(APP_RELEASE_PLATFORM_LABEL));
						releaseValues.put(DB_APP_RELEASE_URL, release.getString(APP_RELEASE_URL));
						releaseValues.put(DB_APP_RELEASE_DOWNLOADS, release.getInt(APP_RELEASE_DOWNLOADS));

						db.insertOrThrow(DB_RELEASES, null, releaseValues);
					}

					db.setTransactionSuccessful();
					db.endTransaction();
				} catch (SQLException e) {
					db.endTransaction();
					Log.d(LCAT, "Error updating/inserting app with id " + appValues.getAsString(DB_APP_ID), e);
				}
			}
		} finally {
			if (db != null) {
				db.close();
				db = null;
			}
		}

		fireAppsChanged();
	}

	public List<AppInfo> getAppsList()
	{
		ArrayList<AppInfo> apps = new ArrayList<AppInfo>();

		SQLiteDatabase db = null;
		try {
			db = appDb.getReadableDatabase();

			String sql =
				"select * from " + DB_APPS + " order by " + DB_APP_TITLE + "," + DB_APP_RATING + " DESC";

			Cursor c = null;
			try {
				c = db.rawQuery(sql, null);

				while(c.moveToNext()) {
					ContentValues values = new ContentValues();
					DatabaseUtils.cursorRowToContentValues(c, values);

					AppInfo app = new AppInfo();
					app.setId(values.getAsInteger(DB_APP_ID));
					app.setPublishedDate(values.getAsString(DB_APP_PUBLICATION_DATE));
					app.setAppPage(values.getAsString(DB_APP_PAGE));
					app.setTitle(values.getAsString(DB_APP_TITLE));
					app.setGuid(values.getAsString(DB_APP_GUID));
					app.setDescription(values.getAsString(DB_APP_DESCRIPTION));
					app.setUrl(values.getAsString(DB_APP_URL));
					app.setAuthor(values.getAsString(DB_APP_AUTHOR));
					app.setVersion(values.getAsInteger(DB_APP_VERSION));
					app.setDownloads(values.getAsInteger(DB_APP_DOWNLOADS));
					app.setRating(values.getAsInteger(DB_APP_RATING));
					app.setVotes(values.getAsInteger(DB_APP_VOTES));
					app.setImage(values.getAsString(DB_APP_IMAGE));
					app.setHasVoted(values.getAsBoolean(DB_APP_HAS_VOTED));
					ArrayList<AppInfo.ReleaseInfo> releases = new ArrayList<AppInfo.ReleaseInfo>();
					app.setReleases(releases);

					//TODO fill releases

					apps.add(app);
				}
			} catch (Throwable t) {
				Log.e(LCAT, "Cursor error: ", t);
			} finally {
				if (c != null) {
					c.close();
					c = null;
				}
			}
		} catch (Throwable t) {
			Log.e(LCAT, "DB error: ", t);
		} finally {
			if (db != null) {
				db.close();
				db = null;
			}
		}

		return apps;
	}
}
