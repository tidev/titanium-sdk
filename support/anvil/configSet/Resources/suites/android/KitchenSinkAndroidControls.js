/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
 
module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "KitchenSinkAndroidControls";
	this.tests = [
		{name: "test_KitchenSink_SliderBasic"},
        {name: "test_KitchenSink_SliderMinMaxRange"},
        {name: "test_KitchenSink_Switch"},
        {name: "test_KitchenSink_ActivityIndicator"},
        {name: "test_KitchenSink_Progressbar"},
        {name: "test_KitchenSink_Button"},
		{name: "test_KitchenSink_ButtonStates"},
        {name: "test_KitchenSink_LabelBasic"},
        {name: "test_KitchenSink_LabelAutolink"},
        {name: "test_KitchenSink_Searchbar"},
        {name: "test_KitchenSink_TextfieldEvents"},
        {name: "test_KitchenSink_TextfieldTherest"},
        {name: "test_KitchenSink_TextfieldKeyboard"},
        {name: "test_KitchenSink_TextfieldBoarderStyle"},
        {name: "test_KitchenSink_TextareaBasic"},
        {name: "test_KitchenSink_PickerBasicPicker"},
        {name: "test_KitchenSink_PickerBasicPicker1"},
        {name: "test_KitchenSink_PickerBasicPicker3"},
		{name: "test_KitchenSink_PickerDatepicker"},
        {name: "test_KitchenSink_PickerTimepicker"},
        {name: "test_KitchenSink_UseSpinnettext"},
        {name: "test_KitchenSink_UseSpinnettext2"},
        {name: "test_KitchenSink_UseSpinnetdate"},
        {name: "test_KitchenSink_UseSpinnettime"},
        {name: "test_KitchenSink_UseSpinnettime2"}
    ]
    
    var sdkVersion = parseFloat(Ti.version);
    var tf1 = Titanium.UI.createTextField({
		color:'#336699',
        top:10,
        left:10,
        width:250,
        height:40,
		hintText:'hintText',
        keyboardType:Titanium.UI.KEYBOARD_DEFAULT,
        returnKeyType:Titanium.UI.RETURNKEY_DEFAULT,
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
    });

	this.test_KitchenSink_SliderBasic = function(testRun) {
        var basicSlider = Titanium.UI.createSlider({
            min:0,
            max:10,
            value:5,
            width:100,
            height:'auto',
            top:30,
        });
        basicSlider.value = 2;
		basicSlider.width = 268;
		basicSlider.height = 50;
        
        valueOf(testRun, basicSlider.value).shouldBe(2);
        valueOf(testRun, basicSlider.width).shouldBe(268);
        valueOf(testRun, basicSlider.height).shouldBe(50);
        
        basicSlider.visible=false;
        valueOf(testRun, basicSlider.visible).shouldBe(false);
        basicSlider.visible=true;
        valueOf(testRun, basicSlider.visible).shouldBe(true);
		
        finish(testRun);
	}
   
    this.test_KitchenSink_SliderMinMaxRange = function(testRun) {
        var slider = Ti.UI.createSlider({
        		value : 0,
        		min : 0,
        		max : 100,
        		left : 10,
        		right : 10
        });
        slider.min = 0;
		slider.max = 100;
		slider.value = 0;
        
        valueOf(testRun, slider.min).shouldBe(0);
        valueOf(testRun, slider.max).shouldBe(100);
        valueOf(testRun, slider.value).shouldBe(0);
        
        slider.min = 0;
		slider.max = 10;
		slider.value = 5;
        
        valueOf(testRun, slider.min).shouldBe(0);
        valueOf(testRun, slider.max).shouldBe(10);
        valueOf(testRun, slider.value).shouldBe(5);
        
        slider.min = -5;
		slider.max = 105;
		slider.value = 75;
        
        valueOf(testRun, slider.min).shouldBe(-5);
        valueOf(testRun, slider.max).shouldBe(105);
        valueOf(testRun, slider.value).shouldBe(75);
		
        finish(testRun);
	}
    
    this.test_KitchenSink_Switch = function (testRun) {
    	var basicSwitch = Titanium.UI.createSwitch({
    			value : false,
    			top : 30
    	});
		valueOf(testRun, basicSwitch.value).shouldBe(false);
        
        basicSwitch.value = true;
        valueOf(testRun, basicSwitch.value).shouldBe(true);
        
        basicSwitch.visible=false;
        valueOf(testRun, basicSwitch.visible).shouldBe(false);
        basicSwitch.visible=true;
        valueOf(testRun, basicSwitch.visible).shouldBe(true);
        
        var checkBox = Titanium.UI.createSwitch({
			style:Titanium.UI.Android.SWITCH_STYLE_CHECKBOX,
            title:"CheckBox: ",
            value:false,
            top:190,
            left:60
        });
        valueOf(testRun, checkBox.value).shouldBe(false);
        checkBox.value=true;
        valueOf(testRun, checkBox.value).shouldBe(true);
        
        var titleSwitch = Titanium.UI.createSwitch({
            style:Titanium.UI.Android.SWITCH_STYLE_TOGGLEBUTTON,
            titleOff:"LO",
            titleOn:"HI",
            value:false,
            top:240
        });
        valueOf(testRun, titleSwitch.value).shouldBe(false);
        titleSwitch.value=true;
        valueOf(testRun, titleSwitch.value).shouldBe(true);
        finish(testRun);
	}
    
    this.test_KitchenSink_ActivityIndicator = function(testRun) {
        var actInd = Titanium.UI.createActivityIndicator({
            bottom : 10,
            width : Ti.UI.SIZE,
            height : Ti.UI.SIZE
        });
        actInd.visible=true;
        valueOf(testRun, actInd.bottom).shouldBe(10);
        actInd.message = 'Loading...';
        valueOf(testRun, actInd.message).shouldBe('Loading...');
        actInd.width = 210;
        valueOf(testRun, actInd.width).shouldBe(210);
        actInd.message = null;
        valueOf(testRun, actInd.message).shouldBeNull;
        actInd.visible=false;
		valueOf(testRun, actInd.visible).shouldBe(false);
        finish(testRun);
	}
    
    this.test_KitchenSink_Progressbar = function(testRun) {
		var win = Ti.UI.createWindow({
            title:'ProgressBar'
        });
        if (Titanium.Platform.name == 'android' && sdkVersion < 3.0) {
            win.title = 'Starting...';
            ind = Titanium.UI.createActivityIndicator({
				location : Titanium.UI.ActivityIndicator.DIALOG,
				type : Titanium.UI.ActivityIndicator.DETERMINANT,
				message : 'Downloading 0 of 10',
				min : 0,
				max : 10,
                value : 0
            });
            
            valueOf(testRun, ind.location).shouldBe(Titanium.UI.ActivityIndicator.DIALOG);
            valueOf(testRun, ind.type).shouldBe(Titanium.UI.ActivityIndicator.DETERMINANT);
            valueOf(testRun, ind.message).shouldBe('Downloading 0 of 10');
            valueOf(testRun, ind.min).shouldBe(0);
            valueOf(testRun, ind.max).shouldBe(10);
            valueOf(testRun, ind.value).shouldBe(0);
            win.addEventListener('open', function(e) {
                ind.visible=true;                 
                interval = setInterval(function() {
					value += 2;
					ind.setValue(value);
					valueOf(testRun, ind.value).shouldBe(value);
					ind.setMessage('Downloading ' + value + ' of 10');
					if (value >= 10) {
						clearInterval(interval);
						ind.visible=false;
						win.setTitle('Progress Bar');
					}
                }, 1000);
            });
            finish(testRun);
            
        }else {
            var ind = Titanium.UI.createProgressBar({
                width : 150,
                min : 0,
                max : 10,
                value : 0,
                height : 70,
                color : '#888',
                message : 'Downloading 0 of 10',
                font : {
                    fontSize : 14,
                    fontWeight : 'bold'
                },
                top : 60
            });
            
            valueOf(testRun, ind.width).shouldBe(150);
            valueOf(testRun, ind.min).shouldBe(0);
            valueOf(testRun, ind.max).shouldBe(10);
            valueOf(testRun, ind.value).shouldBe(0);
            valueOf(testRun, ind.height).shouldBe(70);
            valueOf(testRun, ind.color).shouldBe('#888');
            valueOf(testRun, ind.message).shouldBe('Downloading 0 of 10');
            valueOf(testRun, ind.font.fontSize).shouldBe(14);
            valueOf(testRun, ind.font.fontWeight).shouldBe('bold');
            valueOf(testRun, ind.top).shouldBe(60);
            
            win.add(ind);
            val = 0;
            if (interval) {
                clearInterval(interval);
            }
            var interval = setInterval(function() {
                Ti.API.info('INTERVAL FIRED value ' + val);
                if (val >= 11) {
                    clearInterval(interval);
                    ind.visible=false;
                    win.setTitle('Progress Bar');
                    return;
                }
                ind.value = val;
                ind.message = 'Downloading ' + val + ' of 10';
                valueOf(testRun, ind.value).shouldBe(val);
                val++;
            }, 1000);
            
            finish(testRun);
        }
    }
    this.test_KitchenSink_Button = function(testRun) {
        var button = Titanium.UI.createButton({
            color:'#fff',
            backgroundImage:'/images/BUTT_grn_off.png',
            backgroundSelectedImage:'/images/BUTT_grn_on.png',
            backgroundDisabledImage: '/images/BUTT_drk_off.png',
            top:110,
            width:301,
            height:57,
            font:{fontSize:20,fontWeight:'bold',fontFamily:'Helvetica Neue'},
            title:'Click Me'
        });
        
        valueOf(testRun, button.color).shouldBe('#fff');
        valueOf(testRun, button.backgroundImage).shouldBe('/images/BUTT_grn_off.png');
        valueOf(testRun, button.backgroundSelectedImage).shouldBe('/images/BUTT_grn_on.png');
        valueOf(testRun, button.backgroundDisabledImage).shouldBe('/images/BUTT_drk_off.png');
        valueOf(testRun, button.top).shouldBe(110);
        valueOf(testRun, button.width).shouldBe(301);
        valueOf(testRun, button.height).shouldBe(57);
        valueOf(testRun, button.font.fontSize).shouldBe(20);
        valueOf(testRun, button.font.fontWeight).shouldBe('bold');
        valueOf(testRun, button.font.fontFamily).shouldBe('Helvetica Neue');
        valueOf(testRun, button.title).shouldBe('Click Me');
       
        button.title='I am Enabled';
        valueOf(testRun, button.title).shouldBe('I am Enabled');
                                                          
        button.textAlign = Titanium.UI.TEXT_ALIGNMENT_LEFT;
        valueOf(testRun, button.textAlign).shouldBe(Titanium.UI.TEXT_ALIGNMENT_LEFT);
        button.textAlign = Titanium.UI.TEXT_ALIGNMENT_CENTER;
        valueOf(testRun, button.textAlign).shouldBe(Titanium.UI.TEXT_ALIGNMENT_CENTER);
        button.textAlign = Titanium.UI.TEXT_ALIGNMENT_RIGHT;
        valueOf(testRun, button.textAlign).shouldBe(Titanium.UI.TEXT_ALIGNMENT_RIGHT);                                                  
        button.verticalAlign = Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
        valueOf(testRun, button.verticalAlign).shouldBe(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);                                                        
        button.verticalAlign = Titanium.UI.TEXT_VERTICAL_ALIGNMENT_CENTER;
        valueOf(testRun, button.verticalAlign).shouldBe(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_CENTER);                                                  
        button.verticalAlign = Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM;
        valueOf(testRun, button.verticalAlign).shouldBe(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);

        finish(testRun);
	}
    this.test_KitchenSink_ButtonStates = function(testRun) {
        var button1 = Titanium.UI.createButton({
            left:10,
            top:10,
            height:50,
            width:50,
            enabled:true,
            focusable:true,
            title:'B1',
            backgroundColor: 'white',
            backgroundImage:'/images/slightlylargerimage.png'
        });
                                                          
        valueOf(testRun, button1.enabled).shouldBe(true);
        valueOf(testRun, button1.focusable).shouldBe(true);
        button1.enabled=false;
        button1.focusable=false;
        valueOf(testRun, button1.enabled).shouldBe(false);
        valueOf(testRun, button1.focusable).shouldBe(false);
        
		finish(testRun);
	}
    
    this.test_KitchenSink_LabelBasic = function(testRun) {
        var label1 = Titanium.UI.createLabel({
            id:'font_label_test',
            text:'Appcelerator Titanium Mobile',
            top:0,
            height:170,
            textAlign:'center'
        });
        label1.visible=false;
        valueOf(testRun, label1.visible).shouldBe(false);
        label1.visible=true;
        valueOf(testRun, label1.visible).shouldBe(true);
        var label2 = Titanium.UI.createLabel({
            text:'Appcelerator',
            height:50,
            width:'auto',
            shadowColor:'#aaa',
            shadowOffset:{x:5,y:5},
            color:'#900',
            font:{fontSize:48, fontStyle:'italic'},
            top:170,
            textAlign:'center'
        });
        
		label2.color = '#ff9900';
		label2.shadowColor = '#336699';
		label2.font = {fontSize:20};
        valueOf(testRun, label2.color).shouldBe('#ff9900');
        valueOf(testRun, label2.shadowColor).shouldBe('#336699');
        valueOf(testRun, label2.font.fontSize).shouldBe(20);
        var label3 = Titanium.UI.createLabel({
			id:'font_label_test',
            text:'Appcelerator Titanium Mobile',
            top:0,
            height:170,
            textAlign:'center'
        });
                                                          
        label3.backgroundImage = '/images/chat.png';
        valueOf(testRun, label3.backgroundImage).shouldBe('/images/chat.png');

        finish(testRun);
	}
    this.test_KitchenSink_LabelAutolink = function(testRun) {
		var l = Ti.UI.createLabel({
			autoLink : Ti.UI.Android.LINKIFY_ALL,
			left : 5, top : 5, right : 5, height : 100,
			backgroundColor : '#222',
			text : 'Contact\n test@test.com\n 817-555-5555\n http://bit.ly\n 444 Castro Street, Mountain View, CA'
		});
		l.autoLink = Ti.UI.Android.LINKIFY_ALL;
		valueOf(testRun, l.autoLink).shouldBe(Ti.UI.Android.LINKIFY_ALL);
		l.autoLink = Ti.UI.Android.LINKIFY_EMAIL_ADDRESSES;
		valueOf(testRun, l.autoLink).shouldBe(Ti.UI.Android.LINKIFY_EMAIL_ADDRESSES);
		l.autoLink = Ti.UI.Android.LINKIFY_MAP_ADDRESSES;
		valueOf(testRun, l.autoLink).shouldBe(Ti.UI.Android.LINKIFY_MAP_ADDRESSES);
		l.autoLink = Ti.UI.Android.LINKIFY_PHONE_NUMBERS;
		valueOf(testRun, l.autoLink).shouldBe(Ti.UI.Android.LINKIFY_PHONE_NUMBERS);
		l.autoLink = Ti.UI.Android.LINKIFY_WEB_URLS;
		valueOf(testRun, l.autoLink).shouldBe(Ti.UI.Android.LINKIFY_WEB_URLS);
                                                          
		finish(testRun);
    }
    this.test_KitchenSink_Searchbar = function(testRun) {
		var search = Titanium.UI.createSearchBar({
            barColor:'#000',
            showCancel:true,
            height:43,
            top:0
        });
        search.value = 'foo';
        valueOf(testRun, search.value).shouldBe('foo');                                                 
        search.focus();
        search.blur();
        search.showCancel =false;
        valueOf(testRun, search.showCancel).shouldBe(false); 
        search.showCancel =true;
        valueOf(testRun, search.showCancel).shouldBe(true); 
        search.value = 'I have changed';
        valueOf(testRun, search.value).shouldBe('I have changed');
        search.visible=true;
        valueOf(testRun, search.visible).shouldBe(true); 
        search.visible=false;
        valueOf(testRun, search.visible).shouldBe(false); 
                                                          
        finish(testRun);
	}
    
    this.test_KitchenSink_TextfieldEvents = function(testRun) {
        tf1.focus();
        tf1.blur();
        tf1.visible=true;
        valueOf(testRun, tf1.visible).shouldBe(true);
        tf1.visible=false;
        valueOf(testRun, tf1.visible).shouldBe(false);
		
        finish(testRun);
	}
    
    this.test_KitchenSink_TextfieldTherest = function(testRun) {
        tf1.enabled = false;
        valueOf(testRun, tf1.enabled).shouldBe(false);
        tf1.enabled = true;
        valueOf(testRun, tf1.enabled).shouldBe(true);
        tf1.backgroundImage = '/images/chat.png';
        valueOf(testRun, tf1.backgroundImage).shouldBe('/images/chat.png');
        tf1.autocorrect = false;
        valueOf(testRun, tf1.autocorrect).shouldBe(false);
        tf1.autocorrect = true;
        valueOf(testRun, tf1.autocorrect).shouldBe(true);
        tf1.clearOnEdit = false;
        valueOf(testRun, tf1.clearOnEdit).shouldBe(false);
        tf1.clearOnEdit = true;
        valueOf(testRun, tf1.clearOnEdit).shouldBe(true);
        tf1.passwordMask = false;
        valueOf(testRun, tf1.passwordMask).shouldBe(false);
        tf1.passwordMask = true;
        valueOf(testRun, tf1.passwordMask).shouldBe(true);
        tf1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE;
        valueOf(testRun, tf1.autocapitalization).shouldBe(Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE);
        tf1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_WORDS;
        valueOf(testRun, tf1.autocapitalization).shouldBe(Titanium.UI.TEXT_AUTOCAPITALIZATION_WORDS);
        tf1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_SENTENCES;
        valueOf(testRun, tf1.autocapitalization).shouldBe(Titanium.UI.TEXT_AUTOCAPITALIZATION_SENTENCES);
        tf1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_ALL;
        valueOf(testRun, tf1.autocapitalization).shouldBe(Titanium.UI.TEXT_AUTOCAPITALIZATION_ALL);
        tf1.clearButtonMode = Titanium.UI.INPUT_BUTTONMODE_ALWAYS;
        valueOf(testRun, tf1.clearButtonMode).shouldBe(Titanium.UI.INPUT_BUTTONMODE_ALWAYS);
        tf1.clearButtonMode = Titanium.UI.INPUT_BUTTONMODE_NEVER;
        valueOf(testRun, tf1.clearButtonMode).shouldBe(Titanium.UI.INPUT_BUTTONMODE_NEVER);
        tf1.clearButtonMode = Titanium.UI.INPUT_BUTTONMODE_ONFOCUS;
        valueOf(testRun, tf1.clearButtonMode).shouldBe(Titanium.UI.INPUT_BUTTONMODE_ONFOCUS);
        tf1.clearButtonMode = Titanium.UI.INPUT_BUTTONMODE_ONBLUR;
        valueOf(testRun, tf1.clearButtonMode).shouldBe(Titanium.UI.INPUT_BUTTONMODE_ONBLUR);
        tf1.textAlign = 'left';
        valueOf(testRun, tf1.textAlign).shouldBe('left');
        tf1.textAlign = 'center';
        valueOf(testRun, tf1.textAlign).shouldBe('center');
        tf1.textAlign = 'right';
        valueOf(testRun, tf1.textAlign).shouldBe('right');
        tf1.verticalAlign = 'top';
        valueOf(testRun, tf1.verticalAlign).shouldBe('top');
        tf1.verticalAlign = 'middle';
        valueOf(testRun, tf1.verticalAlign).shouldBe('middle');
        tf1.verticalAlign = 'bottom';
        valueOf(testRun, tf1.verticalAlign).shouldBe('bottom');
        tf1.minimumFontSize = 8;
        valueOf(testRun, tf1.minimumFontSize).shouldBe(8);
        tf1.minimumFontSize = 0;
        valueOf(testRun, tf1.minimumFontSize).shouldBe(0);
        tf1.editable = true;
        valueOf(testRun, tf1.editable).shouldBe(true);
        tf1.editable = false;
        valueOf(testRun, tf1.editable).shouldBe(false);

        finish(testRun);
	}
    
    this.test_KitchenSink_TextfieldKeyboard = function(testRun) {
		tf1.keyboardType = Titanium.UI.KEYBOARD_ASCII;
		valueOf(testRun, tf1.keyboardType).shouldBe(Titanium.UI.KEYBOARD_ASCII);
		tf1.appearance = Titanium.UI.KEYBOARD_APPEARANCE_ALERT;
		valueOf(testRun, tf1.appearance).shouldBe(Titanium.UI.KEYBOARD_APPEARANCE_ALERT);
		tf1.enableReturnKey = false;
		valueOf(testRun, tf1.enableReturnKey).shouldBe(false);
		tf1.returnKeyType = Titanium.UI.RETURNKEY_GO;
		valueOf(testRun, tf1.returnKeyType).shouldBe(Titanium.UI.RETURNKEY_GO);

		tf1.keyboardType = Titanium.UI.KEYBOARD_NUMBERS_PUNCTUATION;
		valueOf(testRun, tf1.keyboardType).shouldBe(Titanium.UI.KEYBOARD_NUMBERS_PUNCTUATION);

		tf1.enableReturnKey = true;
		valueOf(testRun, tf1.enableReturnKey).shouldBe(true);
		tf1.returnKeyType = Titanium.UI.RETURNKEY_DONE;
		valueOf(testRun, tf1.returnKeyType).shouldBe(Titanium.UI.RETURNKEY_DONE);

		tf1.keyboardType = Titanium.UI.KEYBOARD_URL;
		valueOf(testRun, tf1.keyboardType).shouldBe(Titanium.UI.KEYBOARD_URL);
		tf1.keyboardAppearance = Titanium.UI.KEYBOARD_APPEARANCE_DEFAULT;
		valueOf(testRun, tf1.keyboardAppearance).shouldBe(Titanium.UI.KEYBOARD_APPEARANCE_DEFAULT);
		tf1.returnKeyType = Titanium.UI.RETURNKEY_SEARCH;
		valueOf(testRun, tf1.returnKeyType).shouldBe(Titanium.UI.RETURNKEY_SEARCH);

		tf1.keyboardType = Titanium.UI.KEYBOARD_NUMBER_PAD;
		valueOf(testRun, tf1.keyboardType).shouldBe(Titanium.UI.KEYBOARD_NUMBER_PAD);
		tf1.keyboardType = Titanium.UI.KEYBOARD_PHONE_PAD;
		valueOf(testRun, tf1.keyboardType).shouldBe(Titanium.UI.KEYBOARD_PHONE_PAD);

		tf1.keyboardType = Titanium.UI.KEYBOARD_NAMEPHONE_PAD;
		valueOf(testRun, tf1.keyboardType).shouldBe(Titanium.UI.KEYBOARD_NAMEPHONE_PAD);
		tf1.returnKeyType = Titanium.UI.RETURNKEY_EMERGENCY_CALL;
		valueOf(testRun, tf1.returnKeyType).shouldBe(Titanium.UI.RETURNKEY_EMERGENCY_CALL);

		tf1.keyboardType = Titanium.UI.KEYBOARD_EMAIL;
		valueOf(testRun, tf1.keyboardType).shouldBe(Titanium.UI.KEYBOARD_EMAIL);
		tf1.returnKeyType = Titanium.UI.RETURNKEY_ROUTE;
		valueOf(testRun, tf1.returnKeyType).shouldBe(Titanium.UI.RETURNKEY_ROUTE);

		tf1.keyboardType = Titanium.UI.KEYBOARD_DECIMAL_PAD;
		valueOf(testRun, tf1.keyboardType).shouldBe(Titanium.UI.KEYBOARD_DECIMAL_PAD);
		
        finish(testRun);
	}
    this.test_KitchenSink_TextfieldBoarderStyle = function(testRun) {
        var tf6 = Titanium.UI.createTextField({
			hintText:'custom background image',
			height:32,
			top:235,
			backgroundImage:'/images/inputfield.png',
			paddingLeft:10,
			left:10,
			right:60,
			font:{fontSize:13},
			color:'#777',
			clearOnEdit:true
		});
        valueOf(testRun, tf6.hintText).shouldBe('custom background image');
        valueOf(testRun, tf6.height).shouldBe(32);
        valueOf(testRun, tf6.top).shouldBe(235);
        valueOf(testRun, tf6.backgroundImage).shouldBe('/images/inputfield.png');
        valueOf(testRun, tf6.paddingLeft).shouldBe(10);
        valueOf(testRun, tf6.left).shouldBe(10);
        valueOf(testRun, tf6.right).shouldBe(60);
        valueOf(testRun, tf6.font.fontSize).shouldBe(13);
        valueOf(testRun, tf6.color).shouldBe('#777');
        valueOf(testRun, tf6.clearOnEdit).shouldBe(true);
		
        finish(testRun);
	}
    
    this.test_KitchenSink_TextareaBasic = function(testRun) {
        var ta1 = Titanium.UI.createTextArea({
            editable : true,
            value : 'I am a textarea',
            height : 70,
            width : 300,
            top : 60,
            font : {
            	fontSize : 20,
            	fontFamily : 'Marker Felt',
            	fontWeight : 'bold'
            },
            color : '#888',
            textAlign : 'left',
            borderWidth : 2,
            borderColor : '#bbb',
            borderRadius : 5,
            suppressReturn : false
        });
        ta1.focus();
        ta1.blur();
        ta1.visible=true;
        valueOf(testRun, ta1.visible).shouldBe(true);
        ta1.visible=false;
        valueOf(testRun, ta1.visible).shouldBe(false);
        ta1.backgroundColor = '#336699';
        valueOf(testRun, ta1.backgroundColor).shouldBe('#336699');
        ta1.color = '#fff';
        valueOf(testRun, ta1.color).shouldBe('#fff');
        ta1.textAlign = 'center';
        valueOf(testRun, ta1.textAlign).shouldBe('center');
        ta1.suppressReturn = true;
        valueOf(testRun, ta1.suppressReturn).shouldBe(true);
        ta1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_ALL;
        valueOf(testRun, ta1.autocapitalization).shouldBe(Titanium.UI.TEXT_AUTOCAPITALIZATION_ALL);
        ta1.backgroundColor = '#fff';
        valueOf(testRun, ta1.backgroundColor).shouldBe('#fff');
        ta1.color = '#888';
        valueOf(testRun, ta1.color).shouldBe('#888');
        ta1.textAlign = 'left';
        valueOf(testRun, ta1.textAlign).shouldBe('left');
        ta1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE;
        valueOf(testRun, ta1.autocapitalization).shouldBe(Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE);
        ta1.suppressReturn = false;
        valueOf(testRun, ta1.suppressReturn).shouldBe(false);
        ta1.editable = true;
        valueOf(testRun, ta1.editable).shouldBe(true);
        ta1.editable = false;
        valueOf(testRun, ta1.editable).shouldBe(false);

        finish(testRun);
	}
    
    this.test_KitchenSink_PickerBasicPicker = function(testRun) {
		var picker = Ti.UI.createPicker();
		var data = [];
		data[0]=Ti.UI.createPickerRow({title:'Bananas',custom_item:'b'});
		data[1]=Ti.UI.createPickerRow({title:'Strawberries',custom_item:'s'});
		data[2]=Ti.UI.createPickerRow({title:'Mangos',custom_item:'m'});
		data[3]=Ti.UI.createPickerRow({title:'Grapes',custom_item:'g'});
		picker.add(data);
		picker.selectionIndicator = true;
		
		valueOf(testRun, picker.getColumns( )[0].children[0].title).shouldBe('Bananas');
		valueOf(testRun, picker.getColumns( )[0].children[1].title).shouldBe('Strawberries');
		valueOf(testRun, picker.getColumns( )[0].children[2].title).shouldBe('Mangos');
		valueOf(testRun, picker.getColumns( )[0].children[3].title).shouldBe('Grapes');
		valueOf(testRun, picker.selectionIndicator).shouldBe(true);
		
        finish(testRun);
	}
    
    this.test_KitchenSink_PickerBasicPicker1 = function(testRun) {
		var picker = Ti.UI.createPicker();
		var column = Ti.UI.createPickerColumn();
		column.addRow(Ti.UI.createPickerRow({title:'Bananas',custom_item:'b'}));
		column.addRow(Ti.UI.createPickerRow({title:'Strawberries',custom_item:'s'}));
		column.addRow(Ti.UI.createPickerRow({title:'Mangos',custom_item:'m'}));
		column.addRow(Ti.UI.createPickerRow({title:'Grapes',custom_item:'g'}));
		picker.add(column);
		picker.selectionIndicator = true;
		
		valueOf(testRun, picker.getColumns( )[0].children[0].title).shouldBe('Bananas');
		valueOf(testRun, picker.getColumns( )[0].children[1].title).shouldBe('Strawberries');
		valueOf(testRun, picker.getColumns( )[0].children[2].title).shouldBe('Mangos');
		valueOf(testRun, picker.getColumns( )[0].children[3].title).shouldBe('Grapes');
		valueOf(testRun, picker.selectionIndicator).shouldBe(true);
		
        finish(testRun);
	}
    
    this.test_KitchenSink_PickerBasicPicker3 = function(testRun) {
		var picker = Ti.UI.createPicker();
		picker.add(Ti.UI.createPickerRow({title:'Bananas',custom_item:'b'}));
		picker.add(Ti.UI.createPickerRow({title:'Strawberries',custom_item:'s'}));
		picker.add(Ti.UI.createPickerRow({title:'Mangos',custom_item:'m'}));
		picker.add(Ti.UI.createPickerRow({title:'Grapes',custom_item:'g'}));
		picker.selectionIndicator = true;
		
		valueOf(testRun, picker.getColumns( )[0].children[0].title).shouldBe('Bananas');
		valueOf(testRun, picker.getColumns( )[0].children[1].title).shouldBe('Strawberries');
		valueOf(testRun, picker.getColumns( )[0].children[2].title).shouldBe('Mangos');
		valueOf(testRun, picker.getColumns( )[0].children[3].title).shouldBe('Grapes');
		valueOf(testRun, picker.selectionIndicator).shouldBe(true);
		
        finish(testRun);
	}
    
    this.test_KitchenSink_PickerDatepicker = function(testRun) {
		var minDate = new Date();
		minDate.setFullYear(2009);
		minDate.setMonth(0);
		minDate.setDate(1);
		
		var maxDate = new Date();
		maxDate.setFullYear(2009);
		maxDate.setMonth(11);
		maxDate.setDate(31);

		var value = new Date();
		value.setFullYear(2009);
		value.setMonth(0);
		value.setDate(1);
		var picker = Ti.UI.createPicker({
			type:Ti.UI.PICKER_TYPE_DATE,
			minDate:minDate,
			maxDate:maxDate,
			value:value
		});
	
		valueOf(testRun, picker.type).shouldBe(Ti.UI.PICKER_TYPE_DATE);
		valueOf(testRun, picker.maxDate).shouldBe(maxDate);
		valueOf(testRun, picker.minDate).shouldBe(minDate);
		valueOf(testRun, picker.value).shouldBe(value);
		
        finish(testRun);
	}
    
    
    this.test_KitchenSink_PickerTimepicker = function(testRun) {
		var value = new Date();
		value.setMinutes(10);
		value.setHours(13);
		value.setSeconds(48);

		var picker = Ti.UI.createPicker({
				type : Ti.UI.PICKER_TYPE_TIME,
				value : value
		});

		valueOf(testRun, picker.type).shouldBe(Ti.UI.PICKER_TYPE_TIME);
		valueOf(testRun, picker.getValue( )).shouldBe(value);

		finish(testRun);
	}
    
    this.test_KitchenSink_UseSpinnettext = function(testRun) {
		var names = ['Joanie', 'Mickey', 'Jean-Pierre'];
		var verbs = ['loves', 'likes', 'visits'];
		var rows1 = [];
		for (var i = 0; i < names.length; i++) {
			rows1.push(Ti.UI.createPickerRow({
					title : names[i]
				}));
		}

		var rows2 = [];
		for (i = 0; i < verbs.length; i++) {
			rows2.push(Ti.UI.createPickerRow({
					title : verbs[i]
				}));
		}

		var rows3 = [];
		for (i = (names.length - 1); i >= 0; i--) {
			rows3.push(Ti.UI.createPickerRow({
					title : names[i]
				}));
		}

		var column1 = Ti.UI.createPickerColumn({
				rows : rows1,
				font : {
					fontSize : "12"
				}
		});
		var column2 = Ti.UI.createPickerColumn({
				rows : rows2,
				font : {
					fontSize : "12"
				}
		});
		var column3 = Ti.UI.createPickerColumn({
				rows : rows3,
				font : {
					fontSize : "12"
				}
		});

		var picker = Ti.UI.createPicker({
				useSpinner : true,
				visibleItems : 7,
				type : Ti.UI.PICKER_TYPE_PLAIN,
				top : 150,
				height : 200,
				columns : [column1, column2, column3]
		});
	
		valueOf(testRun, picker.useSpinner).shouldBe(true);
		valueOf(testRun, picker.visibleItems).shouldBe(7);
		valueOf(testRun, picker.type).shouldBe(Ti.UI.PICKER_TYPE_PLAIN);
		valueOf(testRun, picker.top).shouldBe(150);
		valueOf(testRun, picker.height).shouldBe(200);
		
		valueOf(testRun, picker.getColumns( )[0].children[0].title).shouldBe('Joanie');
		valueOf(testRun, picker.getColumns( )[0].children[1].title).shouldBe('Mickey');
		valueOf(testRun, picker.getColumns( )[0].children[2].title).shouldBe('Jean-Pierre');
		valueOf(testRun, picker.getColumns( )[1].children[0].title).shouldBe('loves');
		valueOf(testRun, picker.getColumns( )[1].children[1].title).shouldBe('likes');
		valueOf(testRun, picker.getColumns( )[1].children[2].title).shouldBe('visits');
		valueOf(testRun, picker.getColumns( )[2].children[0].title).shouldBe('Jean-Pierre');
		valueOf(testRun, picker.getColumns( )[2].children[1].title).shouldBe('Mickey');
		valueOf(testRun, picker.getColumns( )[2].children[2].title).shouldBe('Joanie');
		
		
		picker.columns[0].addRow(Ti.UI.createPickerRow({
				title : 'Manny'
		}));
		valueOf(testRun, picker.getColumns( )[0].children[3].title).shouldBe('Manny');
		picker.columns[2].addRow(Ti.UI.createPickerRow({
				title : 'Manny'
		}));
		valueOf(testRun, picker.getColumns( )[2].children[3].title).shouldBe('Manny');
		picker.columns[0].removeRow(picker.columns[0].rows[3]);
		picker.columns[2].removeRow(picker.columns[2].rows[3]);
		valueOf(testRun, picker.getColumns( )[0].children[3]).shouldBeUndefined();
		valueOf(testRun, picker.getColumns( )[2].children[3]).shouldBeUndefined();
		
		finish(testRun);
		}
    
    this.test_KitchenSink_UseSpinnettext2 = function(testRun) {
		function makeNameRows() {
			var names = ['Joanie', 'Mickey', 'Jean Pierre'];
			var rows = [];
			for (var i = 0; i < names.length; i++) {
				rows.push(Ti.UI.createPickerRow({
						title : names[i]
					}));
			}
			return rows;
		}

		function makeVerbRows() {
			var verbs = ['loves', 'likes', 'visits'];
			var rows = [];
			for (var i = 0; i < verbs.length; i++) {
				rows.push(Ti.UI.createPickerRow({
						title : verbs[i]
					}));
			}
			return rows;
		}

		function makeNameColumn() {
			return Ti.UI.createPickerColumn({
				rows : makeNameRows()
			});
		}

		function makeVerbColumn() {
			return Ti.UI.createPickerColumn({
				rows : makeVerbRows()
			});
		}

		var picker = Ti.UI.createPicker({
				top : 80,
				columns : [makeNameColumn(), makeVerbColumn(), makeNameColumn()],
				useSpinner : true
		});
		
		valueOf(testRun, picker.top).shouldBe(80);
		valueOf(testRun, picker.useSpinner).shouldBe(true);

		picker.visibleItems = 3;
		valueOf(testRun, picker.visibleItems).shouldBe(3);
		picker.visibleItems = 5;
		valueOf(testRun, picker.visibleItems).shouldBe(5);

		var nameColumn1 = makeNameColumn();
		nameColumn1.width = 100;
		valueOf(testRun, nameColumn1.width).shouldBe(100);
		var nameColumn2 = makeNameColumn();
		nameColumn2.width = 100;
		valueOf(testRun, nameColumn2.width).shouldBe(100);
		var verbColumn = makeVerbColumn();
		verbColumn.width = 75;
		valueOf(testRun, verbColumn.width).shouldBe(75);
		
		var picker1 = Ti.UI.createPicker({
				top : 240,
				useSpinner : true,
				columns : [nameColumn1, verbColumn, nameColumn2],
				visibleItems : 3,
				selectionIndicator : false
		});
		
		valueOf(testRun, picker1.top).shouldBe(240);
		valueOf(testRun, picker1.useSpinner).shouldBe(true);
		valueOf(testRun, picker1.visibleItems).shouldBe(3);
		valueOf(testRun, picker1.selectionIndicator).shouldBe(false);

		nameColumn1 = makeNameColumn();
		nameColumn1.font = {
			fontSize : 10,
			fontFamily : 'serif'
		};
		nameColumn1.color = "red";
        
        valueOf(testRun, nameColumn1.font.fontSize).shouldBe(10);
		valueOf(testRun, nameColumn1.font.fontFamily).shouldBe('serif');
		valueOf(testRun, nameColumn1.color).shouldBe("red");
        
		nameColumn2 = makeNameColumn();
		nameColumn2.font = {
			fontSize : 10,
			fontFamily : 'sans-serif',
			fontWeight : 'bold'
		};
		nameColumn2.color = "purple";
        
        valueOf(testRun, nameColumn2.font.fontSize).shouldBe(10);
		valueOf(testRun, nameColumn2.font.fontFamily).shouldBe('sans-serif');
		valueOf(testRun, nameColumn2.color).shouldBe("purple");
        
		verbColumn = makeVerbColumn();
		verbColumn.font = {
			fontSize : 10,
			fontFamily : 'serif',
			fontWeight : 'bold'
		};
		verbColumn.color = "blue";
		
		valueOf(testRun, verbColumn.font.fontSize).shouldBe(10);
		valueOf(testRun, verbColumn.font.fontFamily).shouldBe('serif');
		valueOf(testRun, verbColumn.font.fontWeight).shouldBe('bold');
		valueOf(testRun, verbColumn.color).shouldBe("blue");
		
		var picker2 = Ti.UI.createPicker({
				top : 340,
				useSpinner : true,
				columns : [nameColumn1, verbColumn, nameColumn2]
		});
		
		valueOf(testRun, picker2.top).shouldBe(340);
		valueOf(testRun, picker2.useSpinner).shouldBe(true);
	
		
        finish(testRun);
	}
    
    this.test_KitchenSink_UseSpinnetdate = function(testRun) {
		var minDate = new Date();
		minDate.setFullYear(2009);
		minDate.setMonth(0);
		minDate.setDate(1);

		var maxDate = new Date();
		maxDate.setFullYear(2009);
		maxDate.setMonth(11);
		maxDate.setDate(31);

		var value = new Date();
		value.setFullYear(2009);
		value.setMonth(0);
		value.setDate(1);

		var picker = Ti.UI.createPicker({
				useSpinner : true,
				type : Ti.UI.PICKER_TYPE_DATE,
				minDate : minDate,
				maxDate : maxDate,
				value : value
		});
		picker.selectionIndicator = true;
		
		valueOf(testRun, picker.type).shouldBe(Ti.UI.PICKER_TYPE_DATE);
		valueOf(testRun, picker.maxDate).shouldBe(maxDate);
		valueOf(testRun, picker.minDate).shouldBe(minDate);
		valueOf(testRun, picker.value).shouldBe(value);
		valueOf(testRun, picker.selectionIndicator).shouldBe(true);
		
		picker.setLocale('ru');
		valueOf(testRun, picker.getLocale( )).shouldBe('ru');
		picker.setLocale(Titanium.Platform.locale);
		valueOf(testRun, picker.getLocale( )).shouldBe(Titanium.Platform.locale);
		
		finish(testRun);
	}
	
	this.test_KitchenSink_UseSpinnettime = function(testRun) {
		var value = new Date();
		value.setMinutes(10);
		value.setHours(13);
		value.setSeconds(48);

		var picker = Ti.UI.createPicker({
				useSpinner : true,
				type : Ti.UI.PICKER_TYPE_TIME,
				value : value
		});
		valueOf(testRun, picker.getUseSpinner( )).shouldBe(true);
		valueOf(testRun, picker.type).shouldBe(Ti.UI.PICKER_TYPE_TIME);
        valueOf(testRun, picker.getValue( )).shouldBe(value);
		
		finish(testRun);
	}
    
    this.test_KitchenSink_UseSpinnettime2 = function(testRun) {
		var value = new Date();
		value.setMinutes(10);
		value.setHours(13);
		value.setSeconds(48);

		var picker = Ti.UI.createPicker({
				useSpinner : true,
				type : Ti.UI.PICKER_TYPE_TIME,
				value : value,
				minuteInterval : 15
		});
		           
        valueOf(testRun, picker.getUseSpinner( )).shouldBe(true);
		valueOf(testRun, picker.type).shouldBe(Ti.UI.PICKER_TYPE_TIME);
        valueOf(testRun, picker.value).shouldBe(value);
		valueOf(testRun, picker.minuteInterval).shouldBe(15);
       
		finish(testRun);
	}
}
