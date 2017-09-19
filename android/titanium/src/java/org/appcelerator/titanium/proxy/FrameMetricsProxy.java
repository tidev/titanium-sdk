package org.appcelerator.titanium.proxy;

import android.os.Build;
import android.support.annotation.RequiresApi;
import android.view.FrameMetrics;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;

import ti.modules.titanium.TitaniumModule;

@Kroll.proxy(parentModule = TitaniumModule.class)
public class FrameMetricsProxy extends KrollProxy {

	@Kroll.constant public final static int ANIMATION_DURATION = FrameMetrics.ANIMATION_DURATION;
	@Kroll.constant public final static int COMMAND_ISSUE_DURATION = FrameMetrics.COMMAND_ISSUE_DURATION;
	@Kroll.constant public final static int DRAW_DURATION = FrameMetrics.DRAW_DURATION;
	@Kroll.constant public final static int	FIRST_DRAW_FRAME = FrameMetrics.FIRST_DRAW_FRAME;
	@Kroll.constant public final static int	INPUT_HANDLING_DURATION = FrameMetrics.INPUT_HANDLING_DURATION;
	@Kroll.constant public final static int	INTENDED_VSYNC_TIMESTAMP = FrameMetrics.INTENDED_VSYNC_TIMESTAMP;
	@Kroll.constant public final static int	LAYOUT_MEASURE_DURATION = FrameMetrics.LAYOUT_MEASURE_DURATION;
	@Kroll.constant public final static int	SWAP_BUFFERS_DURATION = FrameMetrics.SWAP_BUFFERS_DURATION;
	@Kroll.constant public final static int	SYNC_DURATION = FrameMetrics.SYNC_DURATION;
	@Kroll.constant public final static int	TOTAL_DURATION = FrameMetrics.TOTAL_DURATION;
	@Kroll.constant public final static int	UNKNOWN_DELAY_DURATION = FrameMetrics.UNKNOWN_DELAY_DURATION;
	@Kroll.constant public final static int	VSYNC_TIMESTAMP = FrameMetrics.VSYNC_TIMESTAMP;

	private FrameMetrics frameMetrics;

	public FrameMetricsProxy(FrameMetrics source) {
		frameMetrics = source;
	}

	@RequiresApi(api = Build.VERSION_CODES.N)
	@Kroll.method
	public long getMetric(int id) {
		return frameMetrics.getMetric(id);
	}

}
