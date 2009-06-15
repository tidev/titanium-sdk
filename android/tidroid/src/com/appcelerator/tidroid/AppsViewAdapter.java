package com.appcelerator.tidroid;

import java.util.List;

import android.app.Activity;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.RatingBar;
import android.widget.TextView;

import com.appcelerator.tidroid.model.AppInfo;

public class AppsViewAdapter extends ArrayAdapter<AppInfo>
{
	private static final String LCAT = "AppVwAdapt";

	private Activity context;

	public AppsViewAdapter(Activity context, List<AppInfo> items) {
		super(context, R.layout.approw, items);

		this.context = context;
	}

	@Override
	public View getView(int position, View convertView, ViewGroup parent)
	{
		// return super.getView(position, convertView, parent);
		LayoutInflater inflator = context.getLayoutInflater();
		View row = inflator.inflate(R.layout.approw, null);

		RatingBar rating = (RatingBar) row.findViewById(R.id.app_rating);

		TextView title = (TextView) row.findViewById(R.id.app_title);
		TextView author = (TextView) row.findViewById(R.id.app_author);
		TextView version = (TextView) row.findViewById(R.id.app_version);
		TextView pubdate = (TextView) row.findViewById(R.id.app_published);
		TextView downloads = (TextView) row.findViewById(R.id.app_downloads);
		ImageView image = (ImageView) row.findViewById(R.id.app_image);

		AppInfo app = (AppInfo) getItem(position);
		rating.setRating(app.getRating() + 0.0f);
		author.setText(app.getAuthor());
		title.setText(app.getTitle());
		version.setText(String.valueOf(app.getVersion()));
		downloads.setText(String.valueOf(app.getDownloads()));
		pubdate.setText("Published: " + app.getPublishedDate());
//		image.setImageResource(R.drawable.about_icon);


		return row;
	}


}
