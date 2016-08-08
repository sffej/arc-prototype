HTMLImports.whenReady(function() {
      Polymer({ is: 'focus-drawer' });
    });
suite('basic features', function() {
      var drawer, scrim, contentContainer, transformSpy;

      function fireKeydownEvent(target, keyCode, shiftKey) {
        var e = new CustomEvent('keydown', {
          bubbles: true,
          cancelable: true          
        });
        e.keyCode = keyCode;
        e.shiftKey = !!shiftKey;
        target.dispatchEvent(e);
        return e;
      }

      function assertDrawerStyles(translateX, opacity, desc) {
        assert.equal(transformSpy.lastCall.args[0], 'translate3d(' + translateX + 'px,0,0)', desc);
        assert.equal(parseFloat(scrim.style.opacity).toFixed(4), opacity.toFixed(4), desc);
      }

      function assertDrawerStylesReset() {
        assert.equal(scrim.style.opacity, '');
        assert.equal(transformSpy.lastCall.args[0], '');
      }

      function assertTransitionDuration(duration) {
        assert.equal(contentContainer.style.transitionDuration, duration);
        assert.equal(scrim.style.transitionDuration, duration);
      }

      function assertTransitionDurationAbove(d) {
        assert.isAbove(parseFloat(contentContainer.style.transitionDuration), d);
        assert.isAbove(parseFloat(scrim.style.transitionDuration), d);
      }

      function assertTransitionTimingFunction(timingFunction) {
        assert.equal(contentContainer.style.transitionTimingFunction, timingFunction);
        assert.equal(scrim.style.transitionTimingFunction, timingFunction);
      }

      setup(function() {
        drawer = fixture('testDrawer');
        scrim = drawer.$.scrim;
        contentContainer = drawer.$.contentContainer;
        transformSpy = sinon.spy(drawer, 'transform');
      });

      test('default values', function() {
        assert.isFalse(drawer.opened);
        assert.isFalse(drawer.persistent);
        assert.equal(drawer.align, 'left');
        assert.isFalse(drawer.swipeOpen);
        assert.isFalse(drawer.noFocusTrap);
      });

      test('set scroll direction', function() {
        assert.equal(drawer['__polymerGesturesTouchAction'], 'pan-y');
      });

      test('transitions are enabled after attached', function(done) {
        assertTransitionDuration('0s');

        window.setTimeout(function() {
          assertTransitionDuration('');
          done();
        }, 350);
      });

      test('computed position', function() {
        rtlDrawer.align = 'start';

        assert.equal(drawer.position, 'left');

        drawer.align = 'end';

        assert.equal(drawer.position, 'right');

        drawer.align = 'left';

        assert.equal(drawer.position, 'left');

        drawer.align = 'right';

        assert.equal(drawer.position, 'right');
      });

      test('computed position for RTL', function() {
        var rtlDrawer = fixture('rtlDrawer');
        rtlDrawer.align = 'start';

        assert.equal(rtlDrawer.position, 'right');

        rtlDrawer.align = 'end';

        assert.equal(rtlDrawer.position, 'left');

        rtlDrawer.align = 'right';

        assert.equal(rtlDrawer.position, 'right');

        rtlDrawer.align = 'left';

        assert.equal(rtlDrawer.position, 'left');
      });

      test('left drawer opens and closes', function() {
        drawer.align = 'left';

        var contentContainerClientRect = contentContainer.getBoundingClientRect();
        assert.isTrue(contentContainerClientRect.right <= 0);

        drawer.opened = true;

        contentContainerClientRect = contentContainer.getBoundingClientRect();
        assert.equal(contentContainerClientRect.left, 0);

        drawer.opened = false;

        contentContainerClientRect = contentContainer.getBoundingClientRect();
        assert.isTrue(contentContainerClientRect.right <= 0);
      });

      test('right drawer opens and closes', function() {
        drawer.align = 'right';

        var contentContainerClientRect = contentContainer.getBoundingClientRect();
        assert.isTrue(contentContainerClientRect.left >= window.innerWidth);

        drawer.opened = true;

        contentContainerClientRect = contentContainer.getBoundingClientRect();
        assert.equal(contentContainerClientRect.right, window.innerWidth);

        drawer.opened = false;

        contentContainerClientRect = contentContainer.getBoundingClientRect();
        assert.isTrue(contentContainerClientRect.left >= window.innerWidth);
      });

      test('open(), close(), and toggle()', function() {
        assert.isFalse(drawer.opened);

        drawer.open();

        assert.isTrue(drawer.opened);

        drawer.close();

        assert.isFalse(drawer.opened);

        drawer.toggle();

        assert.isTrue(drawer.opened);

        drawer.toggle();

        assert.isFalse(drawer.opened);
      });

      test('getWidth()', function() {
        assert.equal(drawer.getWidth(), contentContainer.offsetWidth);
      });

      test('app-drawer-reset-layout', function(done) {
        var listenerSpy = sinon.spy();
        drawer.addEventListener('app-drawer-reset-layout', listenerSpy);
        drawer.align = 'right';

        window.setTimeout(function() {
          assert.isTrue(listenerSpy.called);
          done();
        }, 1);
      });

      test('app-drawer-transitioned', function(done) {
        window.setTimeout(function() {
          var listenerSpy = sinon.spy();
          drawer.addEventListener('app-drawer-transitioned', listenerSpy);
          drawer.persistent = true;

          assert.isFalse(listenerSpy.called,
            'should not fire after toggling persistent when closed');

          drawer.opened = true;

          window.setTimeout(function() {
            assert.equal(listenerSpy.callCount, 1, 'should fire after toggling opened state');

            drawer.persistent = false;

            window.setTimeout(function() {
              assert.equal(listenerSpy.callCount, 2,
                'should fire after toggling persistent when opened');

              drawer.fire('track', { state: 'start' });
              drawer.fire('track', { state: 'track', dx: 0, ddx: 0 });
              drawer.fire('track', { state: 'end', dx: -200, ddx: -200 });

              window.setTimeout(function() {
                assert.isFalse(drawer.opened);
                assert.equal(listenerSpy.callCount, 3, 'should fire after flinging');

                drawer.fire('track', { state: 'start' });
                drawer.fire('track', { state: 'track', dx: 10, ddx: 10 });
                drawer.fire('track', { state: 'end', dx: 10, ddx: 0 });

                window.setTimeout(function() {
                  assert.isFalse(drawer.opened);
                  assert.equal(listenerSpy.callCount, 4,
                    'should fire after swiping even if opened state unchanged');
                  
                  drawer.fire('track', { state: 'start' });
                  drawer.fire('track', { state: 'track', dx: 200, ddx: 200 });
                  drawer.fire('track', { state: 'end', dx: 200, ddx: 0 });

                  window.setTimeout(function() {
                    assert.isTrue(drawer.opened);
                    assert.equal(listenerSpy.callCount, 5, 'should fire after swiping');

                    drawer.fire('track', { state: 'start' });
                    drawer.fire('track', { state: 'track', dx: -1000, ddx: -1000 });
                    drawer.fire('track', { state: 'end', dx: -1000, ddx: 0 });

                    window.setTimeout(function() {
                      assert.isFalse(drawer.opened);
                      assert.equal(listenerSpy.callCount, 6,
                        'should fire after swiping beyond end state');
                      done();
                    }, 350);
                  }, 350);
                }, 350);
              }, 350);
            }, 350);
          }, 350);
        }, 100);
      });

      test('track events block user selection', function(done) {
        window.setTimeout(function() {
          var ev = drawer.fire('track', null /* detail */, { cancelable: true });

          assert.isTrue(ev.defaultPrevented);
          done();
        }, 350);
      });

      test('styles reset after swiping', function(done) {
        window.setTimeout(function() {
          drawer.fire('track', { state: 'start' });

          assert.equal(drawer.style.visibility, 'visible');
          assertTransitionDuration('0s');

          drawer.fire('track', { state: 'track', dx: 200, ddx: 200 });
          drawer.fire('track', { state: 'end', dx: 200, ddx: 0 });

          assert.equal(drawer.style.visibility, '');
          assertTransitionDuration('');
          assertDrawerStylesReset();
          done();
        }, 350);
      });

      test('styles reset after swiping beyond the end state', function(done) {
        window.setTimeout(function() {
          drawer.fire('track', { state: 'start' });

          assert.equal(drawer.style.visibility, 'visible');
          assertTransitionDuration('0s');

          drawer.fire('track', { state: 'track', dx: 1000, ddx: 1000 });
          drawer.fire('track', { state: 'end', dx: 1000, ddx: 0 });

          assert.equal(drawer.style.visibility, '');
          assertTransitionDuration('');
          assertDrawerStylesReset();
          done();
        }, 350);
      });

      test('left drawer swiping', function(done) {
        window.setTimeout(function() {
          var drawerWidth = drawer.getWidth();
          var halfWidth = drawerWidth / 2;
          drawer.align = 'left';
          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: -halfWidth, ddx: -halfWidth });

          assertDrawerStyles(-drawerWidth, 0, 'styles are lower bounded');

          drawer.fire('track', { state: 'track', dx: halfWidth, ddx: drawerWidth });

          assertDrawerStyles(-halfWidth, 0.5, 'style by track distance');

          drawer.fire('track', { state: 'track', dx: halfWidth + drawerWidth, ddx: drawerWidth });

          assertDrawerStyles(0, 1, 'styles are upper bounded');

          // Simulate break of track events.
          drawer._trackDetails = [];
          drawer.fire('track', { state: 'end', dx: halfWidth, ddx: -drawerWidth });

          assert.isFalse(drawer.opened, 'drawer stays closed when track distance is small');

          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: halfWidth + 1, ddx: halfWidth + 1 });
          drawer.fire('track', { state: 'end', dx: halfWidth + 1, ddx: 0 });

          assert.isTrue(drawer.opened, 'drawer opens when track distance is large');

          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: -halfWidth, ddx: -halfWidth });
          drawer.fire('track', { state: 'end', dx: -halfWidth, ddx: 0 });

          assert.isTrue(drawer.opened, 'drawer stays opened when track distance is small');

          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: -halfWidth - 1, ddx: -halfWidth - 1 });
          drawer.fire('track', { state: 'end', dx: -halfWidth - 1, ddx: 0 });

          assert.isFalse(drawer.opened, 'drawer closes when track distance is large');
          done();
        }, 350);
      });

      test('right drawer swiping', function(done) {
        window.setTimeout(function() {
          var drawerWidth = drawer.getWidth();
          var halfWidth = drawerWidth / 2;
          drawer.align = 'right';
          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: halfWidth, ddx: halfWidth });

          assertDrawerStyles(drawerWidth, 0, 'styles are lower bounded');

          drawer.fire('track', { state: 'track', dx: -halfWidth, ddx: -drawerWidth });

          assertDrawerStyles(halfWidth, 0.5, 'style by track distance');

          drawer.fire('track', { state: 'track', dx: -halfWidth - drawerWidth, ddx: -drawerWidth });

          assertDrawerStyles(0, 1, 'styles are upper bounded');

          // Simulate break of track events.
          drawer._trackDetails = [];
          drawer.fire('track', { state: 'end', dx: -halfWidth, ddx: drawerWidth });

          assert.isFalse(drawer.opened, 'drawer stays closed when track distance is small');

          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: -halfWidth - 1, ddx: -halfWidth - 1 });
          drawer.fire('track', { state: 'end', dx: -halfWidth - 1, ddx: 0});

          assert.isTrue(drawer.opened, 'drawer opens when track distance is large');

          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: halfWidth, ddx: halfWidth });
          drawer.fire('track', { state: 'end', dx: halfWidth, ddx: 0 });

          assert.isTrue(drawer.opened, 'drawer stays opened when track distance is small');

          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: halfWidth + 1, ddx: halfWidth + 1 });
          drawer.fire('track', { state: 'end', dx: halfWidth + 1, ddx: 0 });

          assert.isFalse(drawer.opened, 'drawer closes when track distance is large');
          done();
        }, 350);
      });

      test('styles reset after flinging', function(done) {
        window.setTimeout(function() {
          drawer.fire('track', { state: 'start' });

          assert.equal(drawer.style.visibility, 'visible');
          assertTransitionDuration('0s');

          drawer.fire('track', { state: 'track', dx: 0, ddx: 0 });
          drawer.fire('track', { state: 'end', dx: 200, ddx: 200 });

          window.setTimeout(function() {
            assert.equal(drawer.style.visibility, '');
            assertTransitionDuration('');
            assertTransitionTimingFunction('');
            assertDrawerStylesReset();
            done();
          }, 350);
        }, 350);
      });

      test('styles reset after flinging beyond the end state', function(done) {
        window.setTimeout(function() {
          drawer.fire('track', { state: 'start' });

          assert.equal(drawer.style.visibility, 'visible');
          assertTransitionDuration('0s');

          drawer.fire('track', { state: 'track', dx: 0, ddx: 0 });
          drawer.fire('track', { state: 'end', dx: 1000, ddx: 1000 });

          assert.equal(drawer.style.visibility, '');
          assertTransitionDuration('');
          assertTransitionTimingFunction('');
          assertDrawerStylesReset();
          done();
        }, 350);
      });

      test('left drawer flinging open', function(done) {
        window.setTimeout(function() {
          drawer.align = 'left';
          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: 0, ddx: 0 });
          drawer.fire('track', { state: 'end', dx: 0.1, ddx: 0.1 });

          assert.isFalse(drawer.opened, 'drawer stays closed when velocity is small');
          assertTransitionDuration('');
          assertTransitionTimingFunction('');
          assertDrawerStylesReset();

          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: 0, ddx: 0 });
          drawer.fire('track', { state: 'end', dx: 6, ddx: 6 });

          assert.isTrue(drawer.opened, 'drawer opens when velocity is large');
          assertTransitionDurationAbove(60);
          assertTransitionTimingFunction(drawer._FLING_TIMING_FUNCTION);
          assertDrawerStylesReset();
          done();
        }, 350);
      });

      test('left drawer flinging close', function(done) {
        window.setTimeout(function() {
          drawer.align = 'left';
          drawer.opened = true;
          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: 0, ddx: 0 });
          drawer.fire('track', { state: 'end', dx: -0.1, ddx: -0.1 });

          assert.isTrue(drawer.opened, 'drawer stays opened when velocity is small');
          assertTransitionDuration('');
          assertTransitionTimingFunction('');
          assertDrawerStylesReset();

          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: 0, ddx: 0 });
          drawer.fire('track', { state: 'end', dx: -6, ddx: -6 });

          assert.isFalse(drawer.opened, 'drawer closes when velocity is large');
          assertTransitionDurationAbove(60);
          assertTransitionTimingFunction(drawer._FLING_TIMING_FUNCTION);
          assertDrawerStylesReset();
          done();
        }, 350);
      });

      test('right drawer flinging open', function(done) {
        window.setTimeout(function() {
          drawer.align = 'right';
          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: 0, ddx: 0 });
          drawer.fire('track', { state: 'end', dx: -0.1, ddx: -0.1 });

          assert.isFalse(drawer.opened, 'drawer stays closed when velocity is small');
          assertTransitionDuration('');
          assertTransitionTimingFunction('');
          assertDrawerStylesReset();

          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: 0, ddx: 0 });
          drawer.fire('track', { state: 'end', dx: -6, ddx: -6 });

          assert.isTrue(drawer.opened, 'drawer opens when velocity is large');
          assertTransitionDurationAbove(60);
          assertTransitionTimingFunction(drawer._FLING_TIMING_FUNCTION);
          assertDrawerStylesReset();
          done();
        }, 350);
      });

      test('right drawer flinging close', function(done) {
        window.setTimeout(function() {
          drawer.align = 'right';
          drawer.opened = true;
          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: 0, ddx: 0 });
          drawer.fire('track', { state: 'end', dx: 0.1, ddx: 0.1 });

          assert.isTrue(drawer.opened, 'drawer stays opened when velocity is small');
          assertTransitionDuration('');
          assertTransitionTimingFunction('');
          assertDrawerStylesReset();

          drawer.fire('track', { state: 'start' });
          drawer.fire('track', { state: 'track', dx: 0, ddx: 0 });
          drawer.fire('track', { state: 'end', dx: 6, ddx: 6 });

          assert.isFalse(drawer.opened, 'drawer closes when velocity is large');
          assertTransitionDurationAbove(60);
          assertTransitionTimingFunction(drawer._FLING_TIMING_FUNCTION);
          assertDrawerStylesReset();
          done();
        }, 350);
      });

      test('doc scroll', function(done) {
        window.setTimeout(function() {
          drawer.opened = true;

          window.setTimeout(function() {
            assert.equal(document.body.style.overflow, 'hidden',
              'should block scrolling when opened');

            drawer.persistent = true;

            window.setTimeout(function() {
              assert.equal(document.body.style.overflow, '',
                'should not block scrolling when persistent');

              drawer.persistent = false;

              window.setTimeout(function() {
                assert.equal(document.body.style.overflow, 'hidden',
                  'should block scrolling when not persistent');

                drawer.opened = false;

                window.setTimeout(function() {
                  assert.equal(document.body.style.overflow, '',
                    'should not block scrolling when closed');
                  done();
                }, 350);
              }, 350);
            }, 350);
          }, 350);
        }, 100);
      });

      test('focus trap', function(done) {
        var focusDrawer = fixture('focusDrawer');
        var root = Polymer.dom(focusDrawer.root);
        var drawer = root.querySelector('app-drawer');
        var input = Polymer.dom(drawer).querySelector('input');
        var div = Polymer.dom(drawer).querySelector('div[tabindex]');
        var inputFocusSpy = sinon.spy(input, 'focus');
        var divFocusSpy = sinon.spy(div, 'focus');
        drawer.opened = true;

        window.setTimeout(function() {
          assert.isTrue(inputFocusSpy.called);

          var e = fireKeydownEvent(input, 9);

          assert.isFalse(e.defaultPrevented, 'should not prevent default');

          input.focus();
          inputFocusSpy.reset();
          e = fireKeydownEvent(input, 9, true /* shiftKey */);

          assert.isTrue(divFocusSpy.called);
          assert.isTrue(e.defaultPrevented, 'should prevent default');

          e = fireKeydownEvent(div, 9, true /* shiftKey */);

          assert.isFalse(e.defaultPrevented, 'should not prevent default');

          div.focus();
          e = fireKeydownEvent(div, 9);

          assert.isTrue(inputFocusSpy.called);
          assert.isTrue(e.defaultPrevented, 'should prevent default');
          done();
        }, 350);
      });

      test('focus trap with app-drawer tabindex set', function(done) {
        var focusDrawer = fixture('focusDrawer');
        var root = Polymer.dom(focusDrawer.root);
        var drawer = root.querySelector('app-drawer');
        var input = Polymer.dom(drawer).querySelector('input');
        var drawerFocusSpy = sinon.spy(drawer, 'focus');
        var inputFocusSpy = sinon.spy(input, 'focus');
        drawer.tabIndex = 0;
        drawer.opened = true;

        window.setTimeout(function() {
          assert.isTrue(drawerFocusSpy.called);
          assert.isFalse(inputFocusSpy.called);
          done();
        }, 350);
      });

      test('no focus trap', function(done) {
        var focusDrawer = fixture('focusDrawer');
        var root = Polymer.dom(focusDrawer.root);
        var drawer = root.querySelector('app-drawer');
        var input = Polymer.dom(drawer).querySelector('input');
        var inputFocusSpy = sinon.spy(input, 'focus');
        drawer.noFocusTrap = true;
        drawer.opened = true;
  
        window.setTimeout(function() {
          assert.isFalse(inputFocusSpy.called);
          done();
        }, 350);
      });

      test('esc key handler', function(done) {
        drawer.opened = true;

        window.setTimeout(function() {
          var e = fireKeydownEvent(document, 27);

          assert.isFalse(drawer.opened, 'should close drawer on esc');
          assert.isTrue(e.defaultPrevented, 'should prevent default');
          done();
        }, 350);
      });

      test('scrim', function() {
        scrim.style.transitionDuration = '0s';

        assert.equal(window.getComputedStyle(scrim)['opacity'], 0);

        drawer.opened = true;

        assert.equal(window.getComputedStyle(scrim)['opacity'], 1);

        drawer.persistent = true;

        assert.equal(window.getComputedStyle(scrim)['visibility'], 'hidden');
      });

      test('tap on scrim closes drawer', function() {
        drawer.opened = true;
        drawer.fire('tap', null /* detail */, { node: scrim });

        assert.isFalse(drawer.opened);
      });

      test('persistent drawer should not cover content', function() {
        drawer.opened = true;
        drawer.persistent = true;

        assert.notEqual(document.elementFromPoint(400, 10).tagName, 'APP-DRAWER');
      });

      test('right persistent drawer should be in the correct position', function() {
        drawer.align = 'right';
        drawer.opened = true;
        drawer.persistent = true;

        assert.equal(drawer.getBoundingClientRect().right, window.innerWidth);
      });
    });