package ti.modules.titanium.media;

import java.io.FileDescriptor;
import java.util.Map;
import android.annotation.SuppressLint;
import android.content.Context;
import android.media.MediaMetadataRetriever;
import android.net.Uri;

public class TiMediaMetadataRetriever extends MediaMetadataRetriever{

	public boolean dataSourceSet = false;
	
	public TiMediaMetadataRetriever(){
		super();
	}

	@Override
	public void setDataSource(Context context, Uri uri)
			throws IllegalArgumentException, SecurityException {
		dataSourceSet = true;
		super.setDataSource(context, uri);
	}

	@Override
	public void setDataSource(FileDescriptor fd, long offset, long length)
			throws IllegalArgumentException {
		dataSourceSet = true;
		super.setDataSource(fd, offset, length);
	}

	@Override
	public void setDataSource(FileDescriptor fd)
			throws IllegalArgumentException {
		dataSourceSet = true;
		super.setDataSource(fd);
	}

	@SuppressLint("NewApi")
	@Override
	public void setDataSource(String uri, Map<String, String> headers)
			throws IllegalArgumentException {
		dataSourceSet = true;
		super.setDataSource(uri, headers);
	}

	@Override
	public void setDataSource(String path) throws IllegalArgumentException {
		dataSourceSet = true;
		super.setDataSource(path);
	}
	
	public boolean isDataSourceSet(){
		return dataSourceSet;
	}	
	
}
