package org.appcelerator.titanium.util;

import androidx.exifinterface.media.ExifInterface;

public class TiExifHelper
{
	public static String[] attributes = new String[]
		{
			ExifInterface.TAG_DATETIME,
			ExifInterface.TAG_DATETIME_DIGITIZED,
			ExifInterface.TAG_EXPOSURE_TIME,
			ExifInterface.TAG_FLASH,
			ExifInterface.TAG_FOCAL_LENGTH,
			ExifInterface.TAG_GPS_ALTITUDE,
			ExifInterface.TAG_GPS_ALTITUDE_REF,
			ExifInterface.TAG_GPS_DATESTAMP,
			ExifInterface.TAG_GPS_LATITUDE,
			ExifInterface.TAG_GPS_LATITUDE_REF,
			ExifInterface.TAG_GPS_LONGITUDE,
			ExifInterface.TAG_GPS_LONGITUDE_REF,
			ExifInterface.TAG_GPS_PROCESSING_METHOD,
			ExifInterface.TAG_GPS_TIMESTAMP,
			ExifInterface.TAG_IMAGE_LENGTH,
			ExifInterface.TAG_IMAGE_WIDTH,
			ExifInterface.TAG_MAKE,
			ExifInterface.TAG_MODEL,
			ExifInterface.TAG_ORIENTATION,
			ExifInterface.TAG_SUBSEC_TIME,
			ExifInterface.TAG_WHITE_BALANCE
		};
}
