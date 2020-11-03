# Titanium Mocha Suite

The unit testing app for [Axway Titanium](https://github.com/appcelerator/titanium_mobile), built using [TiMocha](https://github.com/tonylukasavage/ti-mocha).

## Example

```js
describe('Your test suite', function () {
  it('Your unit test', function () {
    should(Ti.Platform).have.readOnlyProperty('apiName').which.is.a.String();
    should(Ti.Platform.apiName).be.eql('Ti.Platform');
  });
});
```

## References

- [Mocha](https://github.com/mochajs/mocha)
- [Unit Testing in Titanium](https://github.com/appcelerator/titanium_mobile/#unit-tests)

## License

Apache 2
