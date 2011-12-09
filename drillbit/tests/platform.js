describe("Ti.Platform tests", {
    apiPoints: function() {
       valueOf(Ti.Platform.createUUID).shouldBeFunction();
       valueOf(Ti.Platform.openURL).shouldBeFunction();
       valueOf(Ti.Platform.is24HourTimeFormat).shouldBeFunction();
       valueOf(Ti.Platform.is24HourTimeFormat()).shouldBeBoolean();
       valueOf(Ti.Platform.BATTERY_STATE_CHARGING).shouldBeNumber();
       valueOf(Ti.Platform.BATTERY_STATE_FULL).shouldBeNumber();
       valueOf(Ti.Platform.BATTERY_STATE_UNKNOWN).shouldBeNumber();
       valueOf(Ti.Platform.BATTERY_STATE_UNPLUGGED).shouldBeNumber();
       valueOf(Ti.Platform.address).shouldBeString();
       valueOf(Ti.Platform.architecture).shouldBeString();
       valueOf(Ti.Platform.availableMemory).shouldBeNumber();
       valueOf(Ti.Platform.batteryMonitoring).shouldBeBoolean();
       valueOf(Ti.Platform.displayCaps).shouldBeObject();
       valueOf(Ti.Platform.displayCaps).shouldNotBeNull();
       valueOf(Ti.Platform.displayCaps.dpi).shouldBeNumber();
       valueOf(Ti.Platform.displayCaps.density).shouldBeString();
       valueOf(Ti.Platform.displayCaps.platformHeight).shouldBeNumber();
       valueOf(Ti.Platform.displayCaps.platformWidth).shouldBeNumber();
       valueOf(Ti.Platform.id).shouldBeString();
       valueOf(Ti.Platform.locale).shouldBeString();
       valueOf(Ti.Platform.macaddress).shouldBeString();
       valueOf(Ti.Platform.model).shouldBeString();
       valueOf(Ti.Platform.name).shouldBeString();
       valueOf(Ti.Platform.netmask).shouldBeString();
       valueOf(Ti.Platform.osname).shouldBeString();
       valueOf(Ti.Platform.ostype).shouldBeString();
       valueOf(Ti.Platform.processorCount).shouldBeNumber();
       valueOf(Ti.Platform.version).shouldBeString();
       valueOf(Ti.Platform.runtime).shouldBeString();
       if (Ti.Platform.osname === 'android') {
              valueOf(Ti.Platform.runtime === 'rhino' || Ti.Platform.runtime === 'v8').shouldBeTrue();
       } else if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
              valueOf(Ti.Platform.runtime).shouldBe("javascriptcore");
       } else {
              valueOf(Ti.Platform.runtime.length).shouldBeGreaterThan(0);
       }
    }

});
