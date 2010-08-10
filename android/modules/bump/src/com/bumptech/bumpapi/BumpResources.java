package com.bumptech.bumpapi;

import org.appcelerator.titanium.TiContext;

import android.content.res.Resources;

public final class BumpResources
{
    private static String APP_PACKAGE_NAME = "";
    
    protected static TiContext context;
    
    public BumpResources(TiContext tiContext) {
    	BumpResources.context = tiContext;
    	BumpResources.APP_PACKAGE_NAME = tiContext.getTiApp().getPackageName();
    }

    public final static Resources getResources() {
    	return BumpResources.context.getRootActivity().getResources();
    }
		
    public static final class anim
    {
		public static final int bump_left_hand = getResources().getIdentifier("bump_left_hand", "anim", APP_PACKAGE_NAME);
        public static final int bump_right_hand = getResources().getIdentifier("bump_right_hand", "anim", APP_PACKAGE_NAME);
        public static final int bump_signal = getResources().getIdentifier("bump_signal", "anim", APP_PACKAGE_NAME);
        public static final int bump_slide_down = getResources().getIdentifier("bump_slide_down", "anim", APP_PACKAGE_NAME);
        public static final int bump_slide_up = getResources().getIdentifier("bump_slide_up", "anim", APP_PACKAGE_NAME);
    }

    public static final class attr
    {
    }

    public static final class drawable
    {
        public static final int btn_bump_normal = getResources().getIdentifier("btn_bump_normal", "drawable", APP_PACKAGE_NAME);
        public static final int btn_bump_normal_blue = getResources().getIdentifier("btn_bump_normal_blue", "drawable", APP_PACKAGE_NAME);
        public static final int btn_bump_normal_dark = getResources().getIdentifier("btn_bump_normal_dark", "drawable", APP_PACKAGE_NAME);
        public static final int btn_bump_normal_disable = getResources().getIdentifier("btn_bump_normal_disable", "drawable", APP_PACKAGE_NAME);
        public static final int btn_bump_normal_disable_focused = getResources().getIdentifier("btn_bump_normal_disable_focused", "drawable", APP_PACKAGE_NAME);
        public static final int btn_bump_pressed = getResources().getIdentifier("btn_bump_pressed", "drawable", APP_PACKAGE_NAME);
        public static final int btn_bump_selected = getResources().getIdentifier("btn_bump_selected", "drawable", APP_PACKAGE_NAME);
        public static final int bump_button_blue = getResources().getIdentifier("bump_button_blue", "drawable", APP_PACKAGE_NAME);
        public static final int bump_button_dark = getResources().getIdentifier("bump_button_dark", "drawable", APP_PACKAGE_NAME);
        public static final int bump_close = getResources().getIdentifier("bump_close", "drawable", APP_PACKAGE_NAME);
        public static final int bump_close_button = getResources().getIdentifier("bump_close_button", "drawable", APP_PACKAGE_NAME);
        public static final int bump_close_selected = getResources().getIdentifier("bump_close_selected", "drawable", APP_PACKAGE_NAME);
        public static final int bump_gradient = getResources().getIdentifier("bump_gradient", "drawable", APP_PACKAGE_NAME);
        public static final int bump_gradient_2 = getResources().getIdentifier("bump_gradient_2", "drawable", APP_PACKAGE_NAME);
        public static final int bump_lefthand = getResources().getIdentifier("bump_lefthand", "drawable", APP_PACKAGE_NAME);
        public static final int bump_nonetwork = getResources().getIdentifier("bump_nonetwork", "drawable", APP_PACKAGE_NAME);
        public static final int bump_notify = getResources().getIdentifier("bump_notify", "drawable", APP_PACKAGE_NAME);
        public static final int bump_righthand = getResources().getIdentifier("bump_righthand", "drawable", APP_PACKAGE_NAME);
        public static final int bump_signal1 = getResources().getIdentifier("bump_signal1", "drawable", APP_PACKAGE_NAME);
        public static final int bump_signal2 = getResources().getIdentifier("bump_signal2", "drawable", APP_PACKAGE_NAME);
        public static final int bump_signal3 = getResources().getIdentifier("bump_signal3", "drawable", APP_PACKAGE_NAME);
        public static final int bump_signal4 = getResources().getIdentifier("bump_signal4", "drawable", APP_PACKAGE_NAME);
        public static final int bump_white_low = getResources().getIdentifier("bump_white_low", "drawable", APP_PACKAGE_NAME);
    }

    public static final class id
    {
        public static final int api_popup = getResources().getIdentifier("api_popup", "id", APP_PACKAGE_NAME) ;
        public static final int bump_hand_left = getResources().getIdentifier("bump_hand_left", "id", APP_PACKAGE_NAME);
        public static final int bump_hand_right =getResources().getIdentifier("bump_hand_right", "id", APP_PACKAGE_NAME) ;
        public static final int bump_icon = getResources().getIdentifier("bump_icon", "id", APP_PACKAGE_NAME);
        public static final int bump_logo = getResources().getIdentifier("bump_logo", "id", APP_PACKAGE_NAME);
        public static final int bump_signal = getResources().getIdentifier("bump_signal", "id", APP_PACKAGE_NAME);
        public static final int bump_signal4 = getResources().getIdentifier("bump_signal4", "id", APP_PACKAGE_NAME);
        public static final int close_window = getResources().getIdentifier("close_window", "id", APP_PACKAGE_NAME);
        public static final int confirm_prompt = getResources().getIdentifier("confirm_prompt", "id", APP_PACKAGE_NAME);
        public static final int content_layout = getResources().getIdentifier("content_layout", "id", APP_PACKAGE_NAME);
        public static final int edit_text_cancel = getResources().getIdentifier("edit_text_cancel", "id", APP_PACKAGE_NAME);
        public static final int edit_text_okay = getResources().getIdentifier("edit_text_okay", "id", APP_PACKAGE_NAME);
        public static final int no_button = getResources().getIdentifier("no_button", "id", APP_PACKAGE_NAME);
        public static final int notify = getResources().getIdentifier("notify", "id", APP_PACKAGE_NAME);
        public static final int notify_bar = getResources().getIdentifier("notify_bar", "id", APP_PACKAGE_NAME);
        public static final int progress = getResources().getIdentifier("progress", "id", APP_PACKAGE_NAME);
        public static final int prompt_edit_text = getResources().getIdentifier("prompt_edit_text", "id", APP_PACKAGE_NAME);
        public static final int response_bar = getResources().getIdentifier("response_bar", "id", APP_PACKAGE_NAME);
        public static final int start_edit_name = getResources().getIdentifier("start_edit_name", "id", APP_PACKAGE_NAME);
        public static final int start_prompt = getResources().getIdentifier("start_prompt", "id", APP_PACKAGE_NAME);
        public static final int start_user_name = getResources().getIdentifier("start_user_name", "id", APP_PACKAGE_NAME);
        public static final int status = getResources().getIdentifier("status", "id", APP_PACKAGE_NAME);
        public static final int status_bar = getResources().getIdentifier("status_bar", "id", APP_PACKAGE_NAME);
        public static final int text_edit_text = getResources().getIdentifier("text_edit_text", "id", APP_PACKAGE_NAME);
        public static final int title_bar = getResources().getIdentifier("title_bar", "id", APP_PACKAGE_NAME);
        public static final int user_bar = getResources().getIdentifier("user_bar", "id", APP_PACKAGE_NAME);
        public static final int waiting_progress =getResources().getIdentifier("waiting_progress", "id", APP_PACKAGE_NAME);
        public static final int waiting_prompt = getResources().getIdentifier("waiting_prompt", "id", APP_PACKAGE_NAME);
        public static final int yes_button =getResources().getIdentifier("yes_button", "id", APP_PACKAGE_NAME);
    }

    public static final class layout
    {
        public static final int bump_api_popup = getResources().getIdentifier("bump_api_popup", "layout", APP_PACKAGE_NAME);
        public static final int bump_confirm_view = getResources().getIdentifier("bump_confirm_view", "layout", APP_PACKAGE_NAME);
        public static final int bump_edit_text = getResources().getIdentifier("bump_edit_text", "layout", APP_PACKAGE_NAME);
        public static final int bump_start_view = getResources().getIdentifier("bump_start_view", "layout", APP_PACKAGE_NAME);
        public static final int bump_waiting_view = getResources().getIdentifier("bump_waiting_view", "layout", APP_PACKAGE_NAME);
    }
    
    public static final class raw {
        public static final int bump_blip = getResources().getIdentifier("bump_blip", "raw", APP_PACKAGE_NAME);
    }

    public static final class string
    {
        public static final int bump_again = getResources().getIdentifier("bump_again", "string", APP_PACKAGE_NAME);
        public static final int bump_app_unsupp = getResources().getIdentifier("bump_app_unsupp", "string", APP_PACKAGE_NAME);
        public static final int bump_bad_location =getResources().getIdentifier("bump_bad_location", "string", APP_PACKAGE_NAME);
        public static final int bump_cannot_connect = getResources().getIdentifier("bump_cannot_connect", "string", APP_PACKAGE_NAME);
        public static final int bump_check_network = getResources().getIdentifier("bump_check_network", "string", APP_PACKAGE_NAME);
        public static final int bump_confirm_connect = getResources().getIdentifier("bump_confirm_connect", "string", APP_PACKAGE_NAME);
        public static final int bump_connected = getResources().getIdentifier("bump_connected", "string", APP_PACKAGE_NAME);
        public static final int bump_connecting = getResources().getIdentifier("bump_connecting", "string", APP_PACKAGE_NAME);
        public static final int bump_default_action = getResources().getIdentifier("bump_default_action", "string", APP_PACKAGE_NAME);
        public static final int bump_edit_name = getResources().getIdentifier("bump_edit_name", "string", APP_PACKAGE_NAME);
        public static final int bump_invalid_key = getResources().getIdentifier("bump_invalid_key", "string", APP_PACKAGE_NAME);
        public static final int bump_no = getResources().getIdentifier("bump_no", "string", APP_PACKAGE_NAME);
        public static final int bump_no_location = getResources().getIdentifier("bump_no_location", "string", APP_PACKAGE_NAME);
        public static final int bump_no_location_iphone = getResources().getIdentifier("bump_no_location_iphone", "string", APP_PACKAGE_NAME);
        public static final int bump_no_location_ipod = getResources().getIdentifier("bump_no_location_ipod", "string", APP_PACKAGE_NAME);
        public static final int bump_no_match = getResources().getIdentifier("bump_no_match", "string", APP_PACKAGE_NAME);
        public static final int bump_no_matches = getResources().getIdentifier("bump_no_matches", "string", APP_PACKAGE_NAME);
        public static final int bump_no_network = getResources().getIdentifier("bump_no_network", "string", APP_PACKAGE_NAME);
        public static final int bump_old_version = getResources().getIdentifier("bump_old_version", "string", APP_PACKAGE_NAME);
        public static final int bump_only_share = getResources().getIdentifier("bump_only_share", "string", APP_PACKAGE_NAME);
        public static final int bump_other_canceled = getResources().getIdentifier("bump_other_canceled", "string", APP_PACKAGE_NAME);
        public static final int bump_other_error = getResources().getIdentifier("bump_other_error", "string", APP_PACKAGE_NAME);
        public static final int bump_please_wait = getResources().getIdentifier("bump_please_wait", "string", APP_PACKAGE_NAME);
        public static final int bump_slow_network = getResources().getIdentifier("bump_slow_network", "string", APP_PACKAGE_NAME);
        public static final int bump_successful = getResources().getIdentifier("bump_successful", "string", APP_PACKAGE_NAME);
        public static final int bump_to_connect = getResources().getIdentifier("bump_to_connect", "string", APP_PACKAGE_NAME);
        public static final int bump_two_times = getResources().getIdentifier("bump_two_times", "string", APP_PACKAGE_NAME);
        public static final int bump_unsupported = getResources().getIdentifier("bump_unsupported", "string", APP_PACKAGE_NAME);
        public static final int bump_waiting_for = getResources().getIdentifier("bump_waiting_for", "string", APP_PACKAGE_NAME);
        public static final int bump_warming_up = getResources().getIdentifier("bump_warming_up", "string", APP_PACKAGE_NAME);
        public static final int bump_yes = getResources().getIdentifier("bump_yes", "string", APP_PACKAGE_NAME);
        public static final int bump_you_canceled = getResources().getIdentifier("bump_you_canceled", "string", APP_PACKAGE_NAME);
    }

    public static final class style
    {
        public static final int BumpDialog = getResources().getIdentifier("BumpDialog", "style", APP_PACKAGE_NAME);
    }
}