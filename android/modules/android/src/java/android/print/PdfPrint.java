package android.print;

import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiFileHelper;

import java.io.File;

public class PdfPrint
{
	private static final String TAG = PdfPrint.class.getSimpleName();
	private final PrintAttributes printAttributes;
	File file;
	PageRange[] ONLY_FIRST_PAGE = new PageRange[] { new PageRange(0, 0) };
	PageRange[] ALL_PAGES = new PageRange[] { PageRange.ALL_PAGES };

	public PdfPrint(PrintAttributes printAttributes)
	{
		this.printAttributes = printAttributes;
	}

	public void print(final PrintDocumentAdapter printAdapter, CallbackPrint callback, Boolean firstPageOnly)
	{
		try {
			file = TiFileHelper.getInstance().getTempFile(".pdf", true);
			printAdapter.onLayout(printAttributes, printAttributes, null,
				new PrintDocumentAdapter.LayoutResultCallback()	{
					@Override
					public void onLayoutFinished(PrintDocumentInfo info, boolean changed)
					{
						ParcelFileDescriptor outputFile = getOutputFile();

						PageRange[] myRange = ALL_PAGES;
						if (firstPageOnly) {
							myRange = ONLY_FIRST_PAGE;
						}

						printAdapter.onWrite(myRange, outputFile,
							new CancellationSignal(), new PrintDocumentAdapter.WriteResultCallback()
							{
								@Override
								public void onWriteFinished(PageRange[] pages)
								{
									super.onWriteFinished(pages);
									callback.success(file);
								}
							});
					}
				}, null);
		} catch (Exception e) {
			callback.onFailure(e.getMessage());
		}
	}

	private ParcelFileDescriptor getOutputFile()
	{
		try {
			return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_WRITE);
		} catch (Exception e) {
			Log.e(TAG, "Failed to open ParcelFileDescriptor", e);
		}
		return null;
	}

	public interface CallbackPrint {
		void success(File file);

		void onFailure(String error);
	}
}
