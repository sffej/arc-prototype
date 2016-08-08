function runAfterOpen(overlay, callback) {
        overlay.addEventListener('iron-overlay-opened', callback);
        overlay.open();
      }

      function runAfterClose(overlay, callback) {
        overlay.addEventListener('iron-overlay-closed', callback);
        overlay.close();
      }

      suite('basic overlay', function() {
        var overlay;

        setup(function() {
          overlay = fixture('basic');
        });

        test('overlay starts hidden', function() {
          assert.isFalse(overlay.opened, 'overlay starts closed');
          assert.equal(getComputedStyle(overlay).display, 'none', 'overlay starts hidden');
        });

        test('_renderOpened called only after is attached', function(done) {
          var overlay = document.createElement('test-overlay');
          // The overlay is ready at this point, but not yet attached.
          var spy = sinon.spy(overlay, '_renderOpened');
          // This triggers _openedChanged.
          overlay.opened = true;
          // Wait long enough for requestAnimationFrame callback.
          overlay.async(function() {
            assert.isFalse(spy.called, '_renderOpened not called');
            // Because not attached yet, overlay should not be the current overlay!
            assert.isNotOk(overlay._manager.currentOverlay(), 'currentOverlay not set');
            done();
          }, 100);
        });

        test('overlay open/close events', function(done) {
          var nevents = 0;

          overlay.addEventListener('iron-overlay-opened', function() {
            nevents += 1;
            overlay.opened = false;
          });

          overlay.addEventListener('iron-overlay-closed', function() {
            nevents += 1;
            assert.equal(nevents, 2, 'opened and closed events fired');
            done();
          });

          overlay.opened = true;
        });

        test('open() refits overlay only once', function(done) {
          var spy = sinon.spy(overlay, 'refit');
          runAfterOpen(overlay, function() {
            assert.equal(spy.callCount, 1, 'overlay did refit only once');
            done();
          });
        });

        test('open overlay refits on iron-resize', function(done) {
          runAfterOpen(overlay, function() {
            var spy = sinon.spy(overlay, 'refit');
            overlay.fire('iron-resize');
            Polymer.dom.flush();
            requestAnimationFrame(function() {
              assert.isTrue(spy.called, 'overlay did refit');
              done();
            });
          });
        });

        test('closed overlay does not refit on iron-resize', function(done) {
          var spy = sinon.spy(overlay, 'refit');
          overlay.fire('iron-resize');
          Polymer.dom.flush();
          requestAnimationFrame(function() {
            assert.isFalse(spy.called, 'overlay should not refit');
            done();
          });
        });

        test('open() triggers iron-resize', function(done) {
          var callCount = 0;
          // Ignore iron-resize triggered by window resize.
          window.addEventListener('resize', function() { callCount--; }, true);
          overlay.addEventListener('iron-resize', function() { callCount++; });
          runAfterOpen(overlay, function() {
            assert.equal(callCount, 1, 'iron-resize called once before iron-overlay-opened');
            done();
          });
        });

        test('close() triggers iron-resize', function(done) {
          runAfterOpen(overlay, function() {
            var spy = sinon.stub();
            overlay.addEventListener('iron-resize', spy);
            runAfterClose(overlay, function() {
              assert.equal(spy.callCount, 1, 'iron-resize called once before iron-overlay-closed');
              done();
            });
          });
        });

        test('closed overlay does not trigger iron-resize when its content changes', function() {
          // Ignore iron-resize triggered by window resize.
          var callCount = 0;
          window.addEventListener('resize', function() { callCount--; }, true);
          overlay.addEventListener('iron-resize', function() { callCount++; });
          Polymer.dom(overlay).appendChild(document.createElement('div'));
          Polymer.dom.flush();
          assert.equal(callCount, 0, 'iron-resize should not be called');
        });

        test('open overlay triggers iron-resize when its content changes', function(done) {
          runAfterOpen(overlay, function() {
            var spy = sinon.stub();
            overlay.addEventListener('iron-resize', spy);
            Polymer.dom(overlay).appendChild(document.createElement('div'));
            Polymer.dom.flush();
            assert.equal(spy.callCount, 1, 'iron-resize should be called once');
            done();
          });
        });

        test('close an overlay quickly after open', function(done) {
          // first, open the overlay
          overlay.open();
          overlay.async(function() {
            // during the opening transition, close the overlay
            this.close();
            // wait for any exceptions to be thrown until the transition is done
            this.async(function() {
              done();
            }, 300);
          });
        });

        test('clicking an overlay does not close it', function(done) {
          runAfterOpen(overlay, function() {
            var spy = sinon.stub();
            overlay.addEventListener('iron-overlay-closed', spy);
            MockInteractions.tap(overlay);
            overlay.async(function() {
              assert.isFalse(spy.called, 'iron-overlay-closed should not fire');
              done();
            }, 10);
          });
        });

        test('open overlay on mousedown does not close it', function(done) {
          var btn = document.createElement('button');
          btn.addEventListener('mousedown', overlay.open.bind(overlay));
          document.body.appendChild(btn);
          // It triggers mousedown, mouseup, and click.
          MockInteractions.tap(btn);
          document.body.removeChild(btn);

          assert.isTrue(overlay.opened, 'overlay opened');
          overlay.async(function() {
            assert.isTrue(overlay.opened, 'overlay is still open');
            done();
          }, 10);
        });

        test('clicking outside fires iron-overlay-canceled', function(done) {
          runAfterOpen(overlay, function() {
            overlay.addEventListener('iron-overlay-canceled', function(event) {
              assert.equal(event.detail.target, document.body, 'detail contains original click event');
              done();
            });
            MockInteractions.tap(document.body);
          });
        });

        test('clicking outside closes the overlay', function(done) {
          runAfterOpen(overlay, function() {
            overlay.addEventListener('iron-overlay-closed', function(event) {
              assert.isTrue(event.detail.canceled, 'overlay is canceled');
              done();
            });
            MockInteractions.tap(document.body);
          });
        });

        test('iron-overlay-canceled event can be prevented', function(done) {
          runAfterOpen(overlay, function() {
            overlay.addEventListener('iron-overlay-canceled', function(event) {
              event.preventDefault();
            });
            var spy = sinon.stub();
            overlay.addEventListener('iron-overlay-closed', spy);
            MockInteractions.tap(document.body);
            Polymer.Base.async(function() {
              assert.isTrue(overlay.opened, 'overlay is still open');
              assert.isFalse(spy.called, 'iron-overlay-closed not fired');
              done();
            }, 10);
          });
        });

        test('cancel an overlay with esc key', function(done) {
          runAfterOpen(overlay, function() {
            overlay.addEventListener('iron-overlay-canceled', function(event) {
              assert.equal(event.detail.type, 'keydown');
              done();
            });
            MockInteractions.pressAndReleaseKeyOn(document, 27);
          });
        });

        test('close an overlay with esc key', function(done) {
          runAfterOpen(overlay, function() {
            overlay.addEventListener('iron-overlay-closed', function(event) {
              assert.isTrue(event.detail.canceled, 'overlay is canceled');
              done();
            });
            MockInteractions.pressAndReleaseKeyOn(document, 27);
          });
        });

        test('no-cancel-on-outside-click property', function(done) {
          overlay.noCancelOnOutsideClick = true;
          runAfterOpen(overlay, function() {
            var spy = sinon.stub();
            overlay.addEventListener('iron-overlay-closed', spy);
            MockInteractions.tap(document.body);
            Polymer.Base.async(function() {
              assert.isFalse(spy.called, 'iron-overlay-closed should not fire');
              done();
            }, 10);
          });
        });

        test('no-cancel-on-esc-key property', function(done) {
          overlay.noCancelOnEscKey = true;
          runAfterOpen(overlay, function() {
            var spy = sinon.stub();
            overlay.addEventListener('iron-overlay-closed', spy);
            MockInteractions.pressAndReleaseKeyOn(document, 27);
            Polymer.Base.async(function() {
              assert.isFalse(spy.called, 'iron-overlay-cancel should not fire');
              done();
            }, 10);
          });
        });

        test('with-backdrop sets tabindex=-1 and removes it', function() {
          overlay.withBackdrop = true;
          assert.equal(overlay.getAttribute('tabindex'), '-1', 'tabindex is -1');
          overlay.withBackdrop = false;
          assert.isFalse(overlay.hasAttribute('tabindex'), 'tabindex removed');
        });

        test('with-backdrop does not override tabindex if already set', function() {
          overlay.setAttribute('tabindex', '1');
          overlay.withBackdrop = true;
          assert.equal(overlay.getAttribute('tabindex'), '1', 'tabindex is 1');
          overlay.withBackdrop = false;
          assert.equal(overlay.getAttribute('tabindex'), '1', 'tabindex is still 1');
        });

      });

      suite('keyboard event listener', function() {
        var overlay;

        var preventKeyDown = function(event) {
          event.preventDefault();
          event.stopPropagation();
        }

        suiteSetup(function() {
          // Worst case scenario: listener with useCapture = true that prevents & stops propagation
          // added before the overlay is initialized.
          document.addEventListener('keydown', preventKeyDown, true);
        });

        setup(function() {
          overlay = fixture('basic');
        });

        suiteTeardown(function() {
          document.removeEventListener('keydown', preventKeyDown, true);
        });

        test('cancel an overlay with esc key even if event is prevented by other listeners', function(done) {
          runAfterOpen(overlay, function() {
            overlay.addEventListener('iron-overlay-canceled', function(event) {
              done();
            });
            MockInteractions.pressAndReleaseKeyOn(document, 27);
          });
        });
      });

      suite('opened overlay', function() {
        var overlay;

        setup(function() {
          overlay = fixture('opened');
        });

        test('overlay open by default', function(done) {
          overlay.addEventListener('iron-overlay-opened', function() {
            assert.isTrue(overlay.opened, 'overlay starts opened');
            assert.notEqual(getComputedStyle(overlay).display, 'none', 'overlay starts showing');
            done();
          });
        });

        test('overlay positioned & sized properly', function(done) {
          overlay.addEventListener('iron-overlay-opened', function() {
            var s = getComputedStyle(overlay);
            assert.closeTo(parseFloat(s.left), (window.innerWidth - overlay.offsetWidth) / 2, 1, 'centered horizontally');
            assert.closeTo(parseFloat(s.top), (window.innerHeight - overlay.offsetHeight) / 2, 1, 'centered vertically');
            done();
          });
        });
      });

      suite('focus handling', function() {
        var overlay;

        setup(function() {
          // Ensure focus is set to document.body
          document.body.focus();
          overlay = fixture('autofocus');
        });

        test('node with autofocus is focused', function(done) {
          runAfterOpen(overlay, function() {
            assert.equal(Polymer.dom(overlay).querySelector('[autofocus]'), document.activeElement, '<button autofocus> is focused');
            done();
          });
        });

        test('no-auto-focus will not focus node with autofocus', function(done) {
          overlay.noAutoFocus = true;
          runAfterOpen(overlay, function() {
            assert.notEqual(Polymer.dom(overlay).querySelector('[autofocus]'), document.activeElement, '<button autofocus> not focused after opened');
            done();
          });
          // In Safari the element with autofocus will immediately receive focus when displayed for the first time http://jsbin.com/woroci/2/
          // Ensure this is not the case for overlay.
          assert.notEqual(Polymer.dom(overlay).querySelector('[autofocus]'), document.activeElement, '<button autofocus> not immediately focused');
        });

        test('no-cancel-on-outside-click property; focus stays on overlay when click outside', function(done) {
          overlay.noCancelOnOutsideClick = true;
          runAfterOpen(overlay, function() {
            MockInteractions.tap(document.body);
            Polymer.Base.async(function() {
              assert.equal(Polymer.dom(overlay).querySelector('[autofocus]'), document.activeElement, '<button autofocus> is focused');
              done();
            }, 10);
          });
        });

        test('with-backdrop traps the focus within the overlay', function(done) {
          var focusSpy = sinon.stub();
          var button = document.createElement('button');
          document.body.appendChild(button);
          button.addEventListener('focus', focusSpy, true);

          overlay.withBackdrop = true;
          runAfterOpen(overlay, function() {
            // Try to steal the focus
            MockInteractions.focus(button);
            assert.equal(Polymer.dom(overlay).querySelector('[autofocus]'), document.activeElement, '<button autofocus> is focused');
            assert.equal(focusSpy.callCount, 0, 'button in body did not get the focus');
            document.body.removeChild(button);
            done();
          });
        });

        test('overlay with-backdrop and 1 focusable: prevent TAB and trap the focus', function(done) {
          overlay.withBackdrop = true;
          runAfterOpen(overlay, function() {
            // 1ms timeout needed by IE10 to have proper focus switching.
            Polymer.Base.async(function() {
              // Spy keydown.
              var tabSpy = sinon.spy();
              document.addEventListener('keydown', tabSpy);
              // Simulate TAB.
              MockInteractions.pressAndReleaseKeyOn(document, 9);
              assert.equal(Polymer.dom(overlay).querySelector('[autofocus]'), document.activeElement, 'focus stays on button');
              assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
              assert.isTrue(tabSpy.getCall(0).args[0].defaultPrevented, 'keydown default prevented');
              // Cleanup.
              document.removeEventListener('keydown', tabSpy);
              done();
            }, 1);
          });
        });

        test('empty overlay with-backdrop: prevent TAB and trap the focus', function(done) {
          overlay = fixture('basic');
          overlay.withBackdrop = true;
          runAfterOpen(overlay, function() {
            // 1ms timeout needed by IE10 to have proper focus switching.
            Polymer.Base.async(function() {
              // Spy keydown.
              var tabSpy = sinon.spy();
              document.addEventListener('keydown', tabSpy);
              // Simulate TAB.
              MockInteractions.pressAndReleaseKeyOn(document, 9);
              assert.equal(overlay, document.activeElement, 'focus stays on overlay');
              assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
              assert.isTrue(tabSpy.getCall(0).args[0].defaultPrevented, 'keydown default prevented');
              // Cleanup.
              document.removeEventListener('keydown', tabSpy);
              done();
            }, 1);
          });
        });

      });

      suite('focusable nodes', function() {
        var overlay, overlayWithTabIndex, overlayFocusableNodes;

        setup(function() {
          var f = fixture('focusables');
          overlay = f[0];
          overlayWithTabIndex = f[1];
          overlayFocusableNodes = f[2];
        });

        test('_focusableNodes returns nodes that are focusable', function() {
          var focusableNodes = overlay._focusableNodes;
          assert.equal(focusableNodes.length, 3, '3 nodes are focusable');
          assert.equal(focusableNodes[0], Polymer.dom(overlay).querySelector('.focusable1'));
          assert.equal(focusableNodes[1], Polymer.dom(overlay).querySelector('.focusable2'));
          assert.equal(focusableNodes[2], Polymer.dom(overlay).querySelector('.focusable3'));
        });

        test('_focusableNodes includes overlay if it has a valid tabindex', function() {
          overlay.setAttribute('tabindex', '0');
          var focusableNodes = overlay._focusableNodes;
          assert.equal(focusableNodes.length, 4, '4 focusable nodes');
          assert.notEqual(focusableNodes.indexOf(overlay), -1, 'overlay is included');
        });

        test('_focusableNodes respects the tabindex order', function() {
          var focusableNodes = overlayWithTabIndex._focusableNodes;
          assert.equal(focusableNodes.length, 6, '6 nodes are focusable');
          assert.equal(focusableNodes[0], Polymer.dom(overlayWithTabIndex).querySelector('.focusable1'));
          assert.equal(focusableNodes[1], Polymer.dom(overlayWithTabIndex).querySelector('.focusable2'));
          assert.equal(focusableNodes[2], Polymer.dom(overlayWithTabIndex).querySelector('.focusable3'));
          assert.equal(focusableNodes[3], Polymer.dom(overlayWithTabIndex).querySelector('.focusable4'));
          assert.equal(focusableNodes[4], Polymer.dom(overlayWithTabIndex).querySelector('.focusable5'));
          assert.equal(focusableNodes[5], Polymer.dom(overlayWithTabIndex).querySelector('.focusable6'));
        });

        test('_focusableNodes can be overridden', function() {
          // It has 1 focusable in the light dom, and 2 in the shadow dom.
          var focusableNodes = overlayFocusableNodes._focusableNodes;
          assert.equal(focusableNodes.length, 2, 'length ok');
          assert.equal(focusableNodes[0], overlayFocusableNodes.$.first, 'first ok');
          assert.equal(focusableNodes[1], overlayFocusableNodes.$.last, 'last ok');
        });

        test('with-backdrop: TAB & Shift+TAB wrap focus', function(done) {
          overlay.withBackdrop = true;
          var focusableNodes = overlay._focusableNodes;
          runAfterOpen(overlay, function() {
            // 1ms timeout needed by IE10 to have proper focus switching.
            Polymer.Base.async(function() {
              // Go to last element.
              focusableNodes[focusableNodes.length-1].focus();
              // Spy keydown.
              var tabSpy = sinon.spy();
              document.addEventListener('keydown', tabSpy);
              // Simulate TAB.
              MockInteractions.pressAndReleaseKeyOn(document, 9);
              assert.equal(focusableNodes[0], document.activeElement, 'focus wrapped to first focusable');
              assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
              assert.isTrue(tabSpy.getCall(0).args[0].defaultPrevented, 'keydown default prevented');
              // Simulate Shift+TAB.
              MockInteractions.pressAndReleaseKeyOn(document, 9, ['shift']);
              assert.equal(focusableNodes[focusableNodes.length-1], document.activeElement, 'focus wrapped to last focusable');
              assert.isTrue(tabSpy.calledTwice, 'keydown spy called again');
              assert.isTrue(tabSpy.getCall(1).args[0].defaultPrevented, 'keydown default prevented again');
              // Cleanup.
              document.removeEventListener('keydown', tabSpy);
              done();
            }, 1);
          });
        });

        test('with-backdrop: TAB & Shift+TAB wrap focus respecting tabindex', function(done) {
          overlayWithTabIndex.withBackdrop = true;
          var focusableNodes = overlayWithTabIndex._focusableNodes;
          runAfterOpen(overlayWithTabIndex, function() {
            // 1ms timeout needed by IE10 to have proper focus switching.
            Polymer.Base.async(function() {
              // Go to last element.
              focusableNodes[focusableNodes.length-1].focus();
              // Simulate TAB.
              MockInteractions.pressAndReleaseKeyOn(document, 9);
              assert.equal(focusableNodes[0], document.activeElement, 'focus wrapped to first focusable');
              // Simulate Shift+TAB.
              MockInteractions.pressAndReleaseKeyOn(document, 9, ['shift']);
              assert.equal(focusableNodes[focusableNodes.length-1], document.activeElement, 'focus wrapped to last focusable');
              done();
            }, 1);
          });
        });

        test('with-backdrop: Shift+TAB after open wrap focus', function(done) {
          overlay.withBackdrop = true;
          var focusableNodes = overlay._focusableNodes;
          runAfterOpen(overlay, function() {
            // 1ms timeout needed by IE10 to have proper focus switching.
            Polymer.Base.async(function() {
              // Spy keydown.
              var tabSpy = sinon.spy();
              document.addEventListener('keydown', tabSpy);
              // Simulate Shift+TAB.
              MockInteractions.pressAndReleaseKeyOn(document, 9, ['shift']);
              assert.equal(focusableNodes[focusableNodes.length-1], document.activeElement, 'focus wrapped to last focusable');
              assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
              assert.isTrue(tabSpy.getCall(0).args[0].defaultPrevented, 'keydown default prevented');
              // Cleanup.
              document.removeEventListener('keydown', tabSpy);
              done();
            }, 1);
          });
        });

        test('with-backdrop: Shift+TAB wrap focus in shadowDOM', function(done) {
          overlayFocusableNodes.withBackdrop = true;
          runAfterOpen(overlayFocusableNodes, function() {
            // 1ms timeout needed by IE10 to have proper focus switching.
            Polymer.Base.async(function() {
              // Spy keydown.
              var tabSpy = sinon.spy();
              document.addEventListener('keydown', tabSpy);
              // Simulate Shift+TAB.
              MockInteractions.pressAndReleaseKeyOn(document, 9, ['shift']);
              assert.equal(overlayFocusableNodes.$.last, Polymer.IronOverlayManager.deepActiveElement, 'focus wrapped to last focusable in the shadowDOM');
              assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
              assert.isTrue(tabSpy.getCall(0).args[0].defaultPrevented, 'keydown default prevented');
              // Cleanup.
              document.removeEventListener('keydown', tabSpy);
              done();
            }, 1);
          });
        });

      });

      suite('Polymer.IronOverlayManager.deepActiveElement', function() {

        test('handles document.body', function () {
          document.body.focus();
          assert.equal(Polymer.IronOverlayManager.deepActiveElement, document.body);
        });

        test('handles light dom', function () {
          var focusable = document.getElementById('focusInput');
          focusable.focus();
          assert.equal(Polymer.IronOverlayManager.deepActiveElement, focusable, 'input is handled');
          focusable.blur();
        });

        test('handles shadow dom', function () {
          var focusable = document.getElementById('buttons').$.button0;
          focusable.focus();
          assert.equal(Polymer.IronOverlayManager.deepActiveElement, focusable);
          focusable.blur();
        });

      });

      suite('restore-focus-on-close', function() {

        var overlay;
        setup(function () {
          overlay = fixture('autofocus');
          overlay.restoreFocusOnClose = true;
        });

        teardown(function () {
          // No matter what, return the focus to body!
          document.body.focus();
        });

        test('does not return focus on close by default (restore-focus-on-close=false)', function(done) {
          overlay.restoreFocusOnClose = false;
          var focusable = document.getElementById('focusInput');
          focusable.focus();
          runAfterOpen(overlay, function() {
            runAfterClose(overlay, function() {
              assert.notEqual(Polymer.IronOverlayManager.deepActiveElement, focusable, 'focus is not restored to focusable');
              done();
            });
          });
        });

        test('overlay returns focus on close', function(done) {
          var focusable = document.getElementById('focusInput');
          focusable.focus();
          runAfterOpen(overlay, function() {
            runAfterClose(overlay, function() {
              assert.equal(Polymer.IronOverlayManager.deepActiveElement, focusable, 'focus restored to focusable');
              done();
            });
          });
        });

        test('overlay returns focus on close (ShadowDOM)', function(done) {
          var focusable = document.getElementById('buttons').$.button0;
          focusable.focus();
          runAfterOpen(overlay, function() {
            runAfterClose(overlay, function() {
              assert.equal(Polymer.IronOverlayManager.deepActiveElement, focusable, 'focus restored to focusable');
              done();
            });
          });
        });

      });

      suite('overlay with backdrop', function() {
        var overlay;

        setup(function() {
          overlay = fixture('backdrop');
        });

        test('backdrop is opened when overlay is opened', function(done) {
          assert.isOk(overlay.backdropElement, 'backdrop is defined');
          runAfterOpen(overlay, function() {
            assert.isTrue(overlay.backdropElement.opened, 'backdrop is opened');
            assert.isOk(overlay.backdropElement.parentNode, 'backdrop is inserted in the DOM');
            done();
          });
        });

        test('backdrop appears behind the overlay', function(done) {
          runAfterOpen(overlay, function() {
            styleZ = parseInt(window.getComputedStyle(overlay).zIndex, 10);
            backdropStyleZ = parseInt(window.getComputedStyle(overlay.backdropElement).zIndex, 10);
            assert.isTrue(styleZ > backdropStyleZ, 'overlay has higher z-index than backdrop');
            done();
          });
        });

        test('backdrop is removed when overlay is closed', function(done) {
          runAfterOpen(overlay, function() {
            runAfterClose(overlay, function() {
              assert.isFalse(overlay.backdropElement.opened, 'backdrop is closed');
              assert.isNotOk(overlay.backdropElement.parentNode, 'backdrop is removed from the DOM');
              assert.lengthOf(document.querySelectorAll('iron-overlay-backdrop'), 0, 'no backdrop elements on body');
              done();
            });
          });
        });

        test('backdrop is removed when the element is removed from DOM', function(done) {
          runAfterOpen(overlay, function() {
            Polymer.dom(overlay).parentNode.removeChild(overlay);
            // Ensure detached is executed.
            Polymer.dom.flush();
            assert.isFalse(overlay.backdropElement.opened, 'backdrop is closed');
            assert.isNotOk(overlay.backdropElement.parentNode, 'backdrop is removed from the DOM');
            assert.lengthOf(document.querySelectorAll('iron-overlay-backdrop'), 0, 'no backdrop elements on body');
            assert.isNotOk(overlay._manager.currentOverlay(), 'currentOverlay ok');
            done();
          });
        });

        test('manager.getBackdrops() updated on opened changes', function(done) {
          runAfterOpen(overlay, function() {
            assert.equal(Polymer.IronOverlayManager.getBackdrops().length, 1, 'overlay added to manager backdrops');
            runAfterClose(overlay, function() {
              assert.equal(Polymer.IronOverlayManager.getBackdrops().length, 0, 'overlay removed from manager backdrops');
              done();
            });
          });
        });

        test('updating with-backdrop to false closes backdrop', function(done) {
          runAfterOpen(overlay, function() {
            overlay.withBackdrop = false;
            assert.isFalse(overlay.backdropElement.opened, 'backdrop is closed');
            assert.isNotObject(overlay.backdropElement.parentNode, 'backdrop is removed from document');
            done();
          });
        });

        test('backdrop is removed when toggling overlay opened', function(done) {
          overlay.open();
          runAfterClose(overlay, function() {
            assert.isFalse(overlay.backdropElement.opened, 'backdrop is closed');
            assert.isNotOk(overlay.backdropElement.parentNode, 'backdrop is removed from document');
            done();
          });
        });

        test('withBackdrop = false does not prevent click outside event', function(done) {
          overlay.withBackdrop = false;
          runAfterOpen(overlay, function() {
            overlay.addEventListener('iron-overlay-canceled', function(event) {
              assert.isFalse(event.detail.defaultPrevented, 'click event not prevented');
              done();
            });
            MockInteractions.tap(document.body);
          });
        });
      });

      suite('multiple overlays', function() {
        var overlay1, overlay2;

        setup(function() {
          var f = fixture('multiple');
          overlay1 = f[0];
          overlay2 = f[1];
        });

        test('new overlays appear on top', function(done) {
          runAfterOpen(overlay1, function() {
            runAfterOpen(overlay2, function() {
              var styleZ = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
              var styleZ1 = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
              assert.isTrue(styleZ1 > styleZ, 'overlay2 has higher z-index than overlay1');
              done();
            });
          });
        });

        test('ESC closes only the top overlay', function(done) {
          runAfterOpen(overlay1, function() {
            runAfterOpen(overlay2, function() {
              MockInteractions.pressAndReleaseKeyOn(document, 27);
              assert.isFalse(overlay2.opened, 'overlay2 was closed');
              assert.isTrue(overlay1.opened, 'overlay1 is still opened');
              done();
            });
          });
        });

        test('close an overlay in proximity to another overlay', function(done) {
          // Open and close a separate overlay.
          overlay1.open();
          overlay1.close();

          // Open the overlay we care about.
          overlay2.open();

          // Immediately close the first overlay.
          // Wait for infinite recursion, otherwise we win.
          runAfterClose(overlay2, function() {
            done();
          })
        });

      });

      suite('Manager overlays in sync', function() {
        var overlay1, overlay2;
        var overlays;

        setup(function() {
          var f = fixture('multiple');
          overlay1 = f[0];
          overlay2 = f[1];
          overlays = Polymer.IronOverlayManager._overlays;
        });

        test('no duplicates after attached', function(done) {
          overlay1 = document.createElement('test-overlay');
          runAfterOpen(overlay1, function() {
            assert.equal(overlays.length, 1, 'correct count after open and attached');
            document.body.removeChild(overlay1);
            done();
          });
          document.body.appendChild(overlay1);
        });

        test('call open multiple times handled', function(done) {
          overlay1.open();
          overlay1.open();
          runAfterOpen(overlay1, function() {
            assert.equal(overlays.length, 1, '1 overlay after open');
            done();
          })
        });

        test('close handled', function(done) {
          runAfterOpen(overlay1, function() {
            runAfterClose(overlay1, function() {
              assert.equal(overlays.length, 0, '0 overlays after close');
              done();
            });
          });
        });

        test('open/close brings overlay on top', function(done) {
          overlay1.open();
          runAfterOpen(overlay2, function() {
            assert.equal(overlays.indexOf(overlay1), 0, 'overlay1 at index 0');
            assert.equal(overlays.indexOf(overlay2), 1, 'overlay2 at index 1');
            overlay1.close();
            runAfterOpen(overlay1, function() {
              assert.equal(overlays.indexOf(overlay1), 1, 'overlay1 moved at index 1');
              assert.isAbove(parseInt(overlay1.style.zIndex), parseInt(overlay2.style.zIndex), 'overlay1 on top of overlay2');
              done();
            });
          });
        });
      });

      suite('z-ordering', function() {

        var originalMinimumZ;
        var overlay1, overlay2;

        setup(function() {
          var f = fixture('multiple');
          overlay1 = f[0];
          overlay2 = f[1];
          originalMinimumZ = Polymer.IronOverlayManager._minimumZ;
        });

        teardown(function() {
          Polymer.IronOverlayManager._minimumZ = originalMinimumZ;
        });

        // for iframes
        test('default z-index is greater than 100', function(done) {
          runAfterOpen(overlay1, function() {
            var styleZ = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
            assert.isTrue(styleZ > 100, 'overlay1 z-index is <= 100');
            done();
          });
        });

        test('ensureMinimumZ() effects z-index', function(done) {
          Polymer.IronOverlayManager.ensureMinimumZ(1000);

          runAfterOpen(overlay1, function() {
            var styleZ = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
            assert.isTrue(styleZ > 1000, 'overlay1 z-index is <= 1000');
            done();
          });
        });

        test('ensureMinimumZ() never decreases the minimum z-index', function(done) {
          Polymer.IronOverlayManager.ensureMinimumZ(1000);
          Polymer.IronOverlayManager.ensureMinimumZ(500);

          runAfterOpen(overlay1, function() {
            var styleZ = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
            assert.isTrue(styleZ > 1000, 'overlay1 z-index is <= 1000');
            done();
          });
        });

      });

      suite('multiple overlays with backdrop', function() {
        var overlay1, overlay2, overlay3;

        setup(function() {
          var f = fixture('multiple');
          overlay1 = f[0];
          overlay2 = f[1];
          overlay3 = f[2];
          overlay1.withBackdrop = overlay2.withBackdrop = overlay3.withBackdrop = true;
        });

        test('multiple overlays share the same backdrop', function() {
          assert.isTrue(overlay1.backdropElement === overlay2.backdropElement, 'overlay1 and overlay2 have the same backdrop element');
          assert.isTrue(overlay1.backdropElement === overlay3.backdropElement, 'overlay1 and overlay3 have the same backdrop element');
        });

        test('only one iron-overlay-backdrop in the DOM', function(done) {
          // Open them all.
          overlay1.opened = true;
          overlay2.opened = true;
          runAfterOpen(overlay3, function() {
            assert.lengthOf(document.querySelectorAll('iron-overlay-backdrop'), 1, 'only one backdrop element in the DOM');
            done();
          });
        });

        test('iron-overlay-backdrop is removed from the DOM when all overlays with backdrop are closed', function(done) {
          // Open & close them all.
          overlay1.opened = true;
          overlay2.opened = true;
          runAfterOpen(overlay3, function() {
            overlay1.opened = overlay2.opened = false;
            runAfterClose(overlay3, function() {
              assert.lengthOf(document.querySelectorAll('iron-overlay-backdrop'), 0, 'backdrop element removed from the DOM');
              done();
            });
          });
        });

        test('newest overlay appear on top', function(done) {
          runAfterOpen(overlay1, function() {
            runAfterOpen(overlay2, function() {
              var styleZ = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
              var style1Z = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
              var bgStyleZ = parseInt(window.getComputedStyle(overlay1.backdropElement).zIndex, 10);
              assert.isTrue(style1Z > styleZ, 'overlay2 has higher z-index than overlay1');
              assert.isTrue(styleZ > bgStyleZ, 'overlay1 has higher z-index than backdrop');
              done();
            });
          });
        });

        var clickEvents = ['click', 'tap'];
        for (var i = 0; i < clickEvents.length; i++) {
          var eventName = clickEvents[i];
          test(eventName + ' event handled only by top overlay', function(done) {
            runAfterOpen(overlay1, function() {
              runAfterOpen(overlay2, function() {
                var btn = Polymer.dom(overlay2).querySelector('button');
                btn.addEventListener(eventName, overlay2.close.bind(overlay2));
                MockInteractions.tap(btn);
                assert.isFalse(overlay2.opened, 'overlay2 closed');
                assert.isTrue(overlay1.opened, 'overlay1 opened');
                overlay2.addEventListener('iron-overlay-closed', function() {
                  assert.isTrue(overlay1.opened, 'overlay1 still opened');
                  done();
                });
              });
            });
          });
        }

        test('updating with-backdrop updates z-index', function(done) {
          runAfterOpen(overlay1, function() {
            runAfterOpen(overlay2, function() {
              overlay1.withBackdrop = false;
              var styleZ = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
              var style1Z = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
              var bgStyleZ = parseInt(window.getComputedStyle(overlay1.backdropElement).zIndex, 10);
              assert.isTrue(style1Z > bgStyleZ, 'overlay2 has higher z-index than backdrop');
              assert.isTrue(styleZ < bgStyleZ, 'overlay1 has lower z-index than backdrop');
              done();
            });
          });
        });

      });

      suite('overlay in composed tree', function() {
        var composed, overlay, trigger;
        setup(function(done) {
          composed = fixture('composed');
          overlay = composed.$.overlay;
          trigger = composed.$.trigger;
          overlay.withBackdrop = true;
          overlay.addEventListener('iron-overlay-opened', function() {
            done();
          });
          // Opens the overlay.
          MockInteractions.tap(trigger);
        });

        test('click on overlay content does not close it', function(done) {
          // Tap on button inside overlay.
          MockInteractions.tap(Polymer.dom(overlay).querySelector('button'));
          Polymer.Base.async(function(){
            assert.isTrue(overlay.opened, 'overlay still opened');
            done();
          }, 1);
        });

        test('with-backdrop wraps the focus within the overlay', function(done) {
          // 1ms timeout needed by IE10 to have proper focus switching.
          Polymer.Base.async(function(){
            var buttons = Polymer.dom(overlay).querySelectorAll('button');
            // Go to last element.
            buttons[buttons.length-1].focus();
            // Spy keydown.
            var tabSpy = sinon.spy();
            document.addEventListener('keydown', tabSpy);
            // Simulate TAB.
            MockInteractions.pressAndReleaseKeyOn(document, 9);
            assert.equal(buttons[0], Polymer.IronOverlayManager.deepActiveElement, 'focus wrapped to first focusable');
            assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
            assert.isTrue(tabSpy.getCall(0).args[0].defaultPrevented, 'keydown default prevented');
            // Simulate Shift+TAB.
            MockInteractions.pressAndReleaseKeyOn(document, 9, ['shift']);
            assert.equal(buttons[buttons.length-1], Polymer.IronOverlayManager.deepActiveElement, 'focus wrapped to last focusable');
            assert.isTrue(tabSpy.calledTwice, 'keydown spy called again');
            assert.isTrue(tabSpy.getCall(1).args[0].defaultPrevented, 'keydown default prevented again');
            // Cleanup.
            document.removeEventListener('keydown', tabSpy);
            done();
          }, 1);
        });

      });

      suite('always-on-top', function() {
        var overlay1, overlay2;

        setup(function() {
          var f = fixture('multiple');
          overlay1 = f[0];
          overlay2 = f[1];
          overlay1.alwaysOnTop = true;
        });

        test('stays on top', function(done) {
          runAfterOpen(overlay1, function() {
            runAfterOpen(overlay2, function() {
              var zIndex1 = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
              var zIndex2 = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
              assert.isAbove(zIndex1, zIndex2, 'overlay1 on top');
              assert.equal(Polymer.IronOverlayManager.currentOverlay(), overlay1, 'currentOverlay ok');
              done();
            });
          });
        });

        test('stays on top also if another overlay is with-backdrop', function(done) {
          overlay2.withBackdrop = true;
          runAfterOpen(overlay1, function() {
            runAfterOpen(overlay2, function() {
              var zIndex1 = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
              var zIndex2 = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
              assert.isAbove(zIndex1, zIndex2, 'overlay1 on top');
              assert.equal(Polymer.IronOverlayManager.currentOverlay(), overlay1, 'currentOverlay ok');
              done();
            });
          });
        });

        test('last overlay with always-on-top wins', function(done) {
          overlay2.alwaysOnTop = true;
          runAfterOpen(overlay1, function() {
            runAfterOpen(overlay2, function() {
              var zIndex1 = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
              var zIndex2 = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
              assert.isAbove(zIndex2, zIndex1, 'overlay2 on top');
              assert.equal(Polymer.IronOverlayManager.currentOverlay(), overlay2, 'currentOverlay ok');
              done();
            });
          });
        });

      });

      suite('animations', function() {

        test('overlay animations correctly triggered', function(done) {
          var overlay = fixture('basic');
          overlay.animated = true;
          overlay.open();
          overlay.addEventListener('simple-overlay-open-animation-start', function() {
            // Since animated overlay will transition center + 300px to center,
            // we should not find the element at the center when the open animation starts.
            var centerElement = document.elementFromPoint(window.innerWidth/2, window.innerHeight/2);
            assert.notEqual(centerElement, overlay, 'overlay should not be centered already');
            done();
          });
        });

      });

      suite('a11y', function() {

        test('overlay has aria-hidden=true when opened', function() {
          var overlay = fixture('basic');
          assert.equal(overlay.getAttribute('aria-hidden'), 'true', 'overlay has aria-hidden="true"');
          overlay.open();
          assert.isFalse(overlay.hasAttribute('aria-hidden'), 'overlay does not have aria-hidden attribute');
          overlay.close();
          assert.equal(overlay.getAttribute('aria-hidden'), 'true', 'overlay has aria-hidden="true"');
        });

      });