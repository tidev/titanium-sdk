/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module.facebook;

import java.lang.ref.WeakReference;

import org.appcelerator.titanium.module.facebook.FBSession.FBSessionDelegate;

import android.R;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.util.StateSet;
import android.view.View;
import android.widget.ImageButton;


public class FBLoginButton extends ImageButton
{
    public static enum FBLoginButtonStyle 
    {
        FBLoginButtonStyleNormal, 
        FBLoginButtonStyleWide
    };

    private FBLoginButtonStyle style;
    private FBSession session;
    private FBSessionDelegate sessionDelegate;
    private WeakReference<Context> context;
    
    public FBLoginButton(Context context) 
    {
        super(context);
        initButton(context);
    }

    public FBLoginButton(Context context, AttributeSet attrs, int defStyle) 
    {
        super(context, attrs, defStyle);
        initButton(context);
    }

    public FBLoginButton(Context context, AttributeSet attrs) 
    {
        super(context, attrs);
        initButton(context);
    }

    @Override
    protected void drawableStateChanged() 
    {
        super.drawableStateChanged();

        Drawable drawable;
        int[] states = getDrawableState();

        if (StateSet.stateSetMatches(new int[] { R.attr.state_pressed }, states) || StateSet.stateSetMatches(new int[] { R.attr.state_focused }, states)) {
            drawable = buttonHighlightedImage();
        } else {
            drawable = buttonImage();
        }

        setImageDrawable(drawable);
    }

    private Drawable buttonImage() 
    {
        if (session.isConnected()) 
        {
            return FBUtil.getDrawable(getClass(), "org/appcelerator/titanium/module/facebook/resources/logout.png");
        } 
        else 
        {
            if (style == FBLoginButtonStyle.FBLoginButtonStyleNormal) 
            {
                return FBUtil.getDrawable(getClass(), "org/appcelerator/titanium/module/facebook/resources/login.png");
            } 
            else if (style == FBLoginButtonStyle.FBLoginButtonStyleWide) 
            {
                return FBUtil.getDrawable(getClass(), "org/appcelerator/titanium/module/facebook/resources/login2.png");
            } 
            else 
            {
                return null;
            }
        }
    }

    private Drawable buttonHighlightedImage() 
    {
        if (session.isConnected()) 
        {
            return FBUtil.getDrawable(getClass(), "org/appcelerator/titanium/module/facebook/resources/logout_down.png");
        } 
        else 
        {
            if (style == FBLoginButtonStyle.FBLoginButtonStyleNormal) 
            {
                return FBUtil.getDrawable(getClass(), "org/appcelerator/titanium/module/facebook/resources/login_down.png");
            } 
            else if (style == FBLoginButtonStyle.FBLoginButtonStyleWide) 
            {
                return FBUtil.getDrawable(getClass(), "org/appcelerator/titanium/module/facebook/resources/login2_down.png");
            } 
            else 
            {
                return null;
            }
        }
    }

    private void buttonClicked() 
    {
        if (session.isConnected()) 
        {
            session.logout(context.get());
        } 
        else 
        {
            Intent intent = new Intent(context.get(), FBActivity.class);
            intent.setAction("login_dialog");
            context.get().startActivity(intent);
        }
    }

    private void initButton(Context context) 
    {
        setBackgroundColor(Color.TRANSPARENT);
        setAdjustViewBounds(true);
        style = FBLoginButtonStyle.FBLoginButtonStyleNormal;

        setOnClickListener(new OnClickListener() 
        {
            public void onClick(View arg0) 
            {
                buttonClicked();
            }
        });
        
        this.session = FBSession.getSession();
        this.sessionDelegate = new FBSessionDelegateImpl();
        this.context = new WeakReference<Context>(context);
        this.session.getDelegates().add(this.sessionDelegate);
        
        invalidate();
    }

    public void setSession(FBSession session) 
    {
        if (!this.session.equals(session)) 
        {
            this.session.getDelegates().remove(sessionDelegate);
            this.session = session;
            this.session.getDelegates().add(sessionDelegate);
            invalidate();
        }
    }

    public void setStyle(FBLoginButtonStyle style) 
    {
        this.style = style;
        invalidate();
    }

    private final class FBSessionDelegateImpl extends FBSessionDelegate 
    {
        public void session_didLogin(FBSession session, Long uid) 
        {
            FBLoginButton.this.postInvalidate();
        }

        public void sessionDidLogout(FBSession session) 
        {
            FBLoginButton.this.postInvalidate();
        }

    }

}
