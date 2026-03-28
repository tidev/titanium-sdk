/**
 * Titanium SDK - Ti.UI Accessibility Properties Tests
 */

/* global describe, it, assert, Ti */

describe('Ti.UI Accessibility Properties', function () {

  it('accessibilityRole is stored and retrieved', function () {
    var label = Ti.UI.createLabel({ accessibilityRole: 'button' });
    assert.strictEqual(label.accessibilityRole, 'button', 'accessibilityRole should be "button"');
  });

  it('accessibilityRole can be set after creation', function () {
    var view = Ti.UI.createView({});
    view.accessibilityRole = 'header';
    assert.strictEqual(view.accessibilityRole, 'header', 'accessibilityRole should be "header"');
  });

  it('accessibilityState is stored and retrieved', function () {
    var view = Ti.UI.createView({ accessibilityState: { disabled: true } });
    assert.ok(view.accessibilityState, 'accessibilityState should exist');
    assert.strictEqual(view.accessibilityState.disabled, true, 'disabled state should be true');
  });

  it('accessibilityGroup is stored and retrieved', function () {
    var row = Ti.UI.createView({ accessibilityGroup: true });
    assert.strictEqual(row.accessibilityGroup, true, 'accessibilityGroup should be true');
  });

  it('accessibilityActions is stored and retrieved', function () {
    var view = Ti.UI.createView({ accessibilityActions: ['activate', 'increment'] });
    assert.ok(Array.isArray(view.accessibilityActions), 'accessibilityActions should be an array');
    assert.strictEqual(view.accessibilityActions[0], 'activate', 'first action should be "activate"');
  });

  it('accessibilityLiveRegion is stored and retrieved', function () {
    var view = Ti.UI.createView({ accessibilityLiveRegion: 'polite' });
    assert.strictEqual(view.accessibilityLiveRegion, 'polite', 'accessibilityLiveRegion should be "polite"');
  });

  it('existing accessibilityLabel still works', function () {
    var label = Ti.UI.createLabel({ accessibilityLabel: 'my label', text: 'Hello' });
    assert.strictEqual(label.accessibilityLabel, 'my label', 'accessibilityLabel should still work');
  });

  it('existing accessibilityHint still works', function () {
    var button = Ti.UI.createButton({ accessibilityHint: 'double tap to activate', title: 'Go' });
    assert.strictEqual(button.accessibilityHint, 'double tap to activate', 'accessibilityHint should still work');
  });

  it('existing accessibilityHidden still works', function () {
    var decorativeView = Ti.UI.createView({ accessibilityHidden: true });
    assert.strictEqual(decorativeView.accessibilityHidden, true, 'accessibilityHidden should still work');
  });

  it('Ti.Accessibility module is available', function () {
    // Only expected on iOS (TiAccessibilityModule). Android equivalent is not a separate module.
    if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
      var accessibility = require('Ti.Accessibility');
      assert.ok(accessibility, 'Ti.Accessibility module should exist on iOS');
      assert.strictEqual(typeof accessibility.announce, 'function', 'announce() should be a function');
      assert.strictEqual(typeof accessibility.focus, 'function', 'focus() should be a function');
    }
  });

});
