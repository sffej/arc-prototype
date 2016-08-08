suite('basic', function() {

      var toast;

      test('is hidden', function() {
        toast = fixture('basic');
        assert.isFalse(toast.opened, '`opened` is false');
      });

      test('is visible', function() {
        toast = fixture('show');
        assert.isTrue(toast.opened, '`opened` is true');
      });

      test('show() will open toast', function() {
        toast = fixture('basic');
        toast.show();
        assert.isTrue(toast.opened, '`opened` is true');
      });

      test('hide() will close toast', function() {
        toast = fixture('show');
        toast.hide();
        assert.isFalse(toast.opened, '`opened` is false');
      });

      test('toast auto-close after 10ms', function(done) {
        toast = fixture('basic');
        toast.duration = 10;
        toast.show();
        setTimeout(function() {
          assert.isFalse(toast.opened, '`opened` is false');
          done();
        }, 12);
      });

      test('toast fires opened event', function(done) {
        toast = fixture('show');
        toast.addEventListener('iron-overlay-opened', function() {
          done();
        });
      });

      test('toast does not get focused', function(done) {
        toast = fixture('show');
        var spy = sinon.spy(toast, 'focus');
        assert.isTrue(toast.noAutoFocus, 'no-auto-focus is true');
        toast.addEventListener('iron-overlay-opened', function() {
          assert.isFalse(spy.called, 'toast is not focused');
          done();
        });
      });

      test('toast fires closed event', function(done) {
        toast = fixture('basic');
        toast.show({duration: 350});
        toast.addEventListener('iron-overlay-closed', function() {
          done();
        });
      });

      test('show() accepts valid properties', function() {
        toast = fixture('basic');
        toast.show({text: 'hello world', duration: 20});
        assert.isTrue(toast.opened, '`opened` is true');
        assert.equal(toast.text, 'hello world', '`text` is correct');
        assert.equal(toast.duration, 20, '`duration` is correct');
      });

      test('show() does not accept invalid properties', function() {
        toast = fixture('basic');
        toast.show({foo: 'bar'});
        assert.isUndefined(toast.foo, '`foo` is not a valid property and will not be set');
        assert.isTrue(toast.opened, '`opened` is true');
      });

      test('show() does not accept private properties', function() {
        toast = fixture('basic');
        var temp = toast._manager;
        toast.show({_manager: 'bar'});
        assert.equal(toast._manager, temp, '`_manager` is a private property and will not be set');
        assert.isTrue(toast.opened, '`opened` is true');
      });

      test('show() accepts a string argument as the text parameter', function() {
        toast = fixture('basic');
        toast.show('hello world 2');
        assert.equal(toast.text, 'hello world 2', '`text is correct`');
      });

      suite('disable auto-close', function() {
        var spy;
        setup(function() {
          toast = fixture('basic');
          spy = sinon.spy(toast, 'async');
        });
        test('duration = Infinity', function() {
          toast.duration = Infinity;
          toast.show();
          assert.isFalse(spy.calledWith(toast.close), '`async` was not called with `close()`');
          assert.isFalse(spy.calledWith(toast.hide), '`async` was not called with `hide()`');
        });

        test('duration = 0', function() {
          toast.duration = 0;
          toast.show();
          assert.isFalse(spy.calledWith(toast.close), '`async` was not called with `close()`');
          assert.isFalse(spy.calledWith(toast.hide), '`async` was not called with `hide()`');
        });

        test('duration = -10', function() {
          toast.duration = -10;
          toast.show();
          assert.isFalse(spy.calledWith(toast.close), '`async` was not called with `close()`');
          assert.isFalse(spy.calledWith(toast.hide), '`async` was not called with `hide()`');
        });
      });

      test('there is only 1 toast opened', function() {
        var toast1 = fixture('basic');
        var toast2 = fixture('show');
        toast2.open();
        toast1.open();
        assert.isTrue(toast1.opened, 'toast1 is opened');
        assert.isFalse(toast2.opened, 'toast2 is not opened');
        toast2.open();
        assert.isFalse(toast1.opened, 'toast1 is now not opened');
        assert.isTrue(toast2.opened, 'toast2 is now opened');
      });

      test('auto-close is correctly reset', function(done) {
        toast = fixture('basic');
        toast.duration = 10;
        toast.show();
        // a bit later (before the auto-close), toast is reset
        setTimeout(function() {
          toast.hide();
          // keep toast opened
          toast.duration = 0;
          toast.show();
          setTimeout(function() {
            assert.isTrue(toast.opened, 'toast is still open');
            done();
          }, 10);
        }, 5);
      });

      test('toast is positioned according at the bottom left of its fitInto', function(done) {
        var f = fixture('contained');
        var toast = f[0];
        var container = f[1];
        toast.fitInto = container;
        toast.open();
        // Wait for it to be opened, so it will be sized correctly.
        toast.addEventListener('iron-overlay-opened', function() {
          var rect = toast.getBoundingClientRect();
          assert.equal(rect.left, 50, 'left ok');
          // 150px from top, (100px of height + 50px of margin-top)
          assert.equal(rect.bottom, 150, 'bottom');
          done();
        });
      });

      suite('a11y', function() {
        test('show() will announce text', function() {
          toast = fixture('basic');
          var spy = sinon.spy(toast, 'fire');
          toast.text = 'announce!';
          toast.show();
          assert.isTrue(spy.calledWith('iron-announce', {
            text: 'announce!'
          }), 'text announced');
        });

        test('hide() will not announce text', function() {
          toast = fixture('show');
          var spy = sinon.spy(toast, 'fire');
          toast.hide();
          assert.isFalse(spy.calledWith('iron-announce'), 'text not announced');
        });
      });

    });