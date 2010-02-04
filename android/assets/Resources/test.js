// General testing stuff.

Ti.myprop = "My Property";
Ti.API.info("Ti.myprop: " + Ti.myprop);

Ti.API.info("readOnly property: " + Ti.Test.readOnly);
Ti.API.info("getReadOnly method: " + Ti.Test.getReadOnly());

Ti.API.info("Initial value for stringProp: " + Ti.Test.stringProp);
Ti.API.info("Initial value for numberProp: " + Ti.Test.numberProp);

Ti.Test.stringProp = "The new value";
Ti.Test.numberProp = 100;

Ti.API.info("Value for stringProp: " + Ti.Test.stringProp);
Ti.API.info("Value for numberProp: " + Ti.Test.numberProp);

Ti.Test.setStringProp("New value 2").setNumberProp(300);

Ti.API.info("Value for stringProp: " + Ti.Test.stringProp);
Ti.API.info("Value for numberProp: " + Ti.Test.numberProp);
