describe("iPhone.UI tests", {
	iphoneUIAPIs: function() {
		valueOf(Ti.UI.iPhone).shouldNotBeNull();
	},

   iosScrollableViewScrollingEvent_as_async: function (callback) {
      // functional test for [TC-827]: `scrolling` event for `ScrollableView`
      var win = Ti.UI.createWindow();

      var view1 = Ti.UI.createView({ backgroundColor:'#123', width: 250 });
      var view2 = Ti.UI.createView({ backgroundColor:'#246', width: 250 });
      var view3 = Ti.UI.createView({ backgroundColor:'#48b', width: 250 });

      var scrollableView = Ti.UI.createScrollableView({
        views: [view1,view2,view3],
        showPagingControl: true,
        width: 260,
        height: 430
      });

      win.add(scrollableView);
      win.open();

      var scrollingEvents = [];

      // Catch all scrolling events, then validate them
      scrollableView.addEventListener('scroll', function (e) {
         scrollingEvents.push(e);
      });

      scrollableView.scrollToView(1);

      // This is fired when the scrollToView has completed; time to validate
      // our events!
      scrollableView.addEventListener('scrollEnd', function (scrollEvent) {
         var numEvents = scrollingEvents.length;

         try {
            // Should be a hell of a lot more than 5 events
            valueOf(scrollingEvents.length).shouldBeGreaterThan(5);

            Ti.API.log(scrollingEvents[5].currentPageAsFloat);

            // Check the first and last events
            valueOf(scrollingEvents[0].currentPage).shouldBe(0);
            valueOf(scrollingEvents[numEvents - 1].currentPage).shouldBe(1);

            valueOf(scrollingEvents[0].currentPageAsFloat).shouldBeLessThan(0.5);
            valueOf(scrollingEvents[numEvents - 1].currentPageAsFloat).shouldBeGreaterThan(0.5);

            valueOf(scrollingEvents[numEvents - 1].currentPage).shouldBe(scrollEvent.currentPage);

            callback.passed();
         } catch (exception) {
            callback.failed(exception);
         }
      });
   }
});
