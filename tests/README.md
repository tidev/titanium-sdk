# Titanium Mocha Suite

The unit testing app for [Titanium](https://github.com/tidev/titanium_mobile), built using [TiMocha](https://github.com/tonylukasavage/ti-mocha).

## Example

```js
describe('Your test suite', function () {
  it('Your unit test', function () {
    should(Ti.Platform).have.readOnlyProperty('apiName').which.is.a.String();
    should(Ti.Platform.apiName).be.eql('Ti.Platform');
  });
});
```

## Match images
If you want to use `matchImage` to visually compare an UI element with an image you use the method and take the image from `/data/user/0/com.appcelerator.testApp.testing/app_appdata/snapshots` from the emulator after the first run. It will put the images in that folder you can match against in the next run.

## References

- [Mocha](https://github.com/mochajs/mocha)
- [Unit Testing in Titanium](https://github.com/tidev/titanium-sdk/#unit-tests)

## License

Apache 2
