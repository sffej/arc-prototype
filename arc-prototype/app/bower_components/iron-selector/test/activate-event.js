suite('activate event', function() {

      var s;

      setup(function () {
        s = fixture('test');
      });

      test('activates on tap', function() {
        assert.equal(s.selected, '0');

        // select Item 1
        s.children[1].dispatchEvent(new CustomEvent('tap', {bubbles: true}));
        assert.equal(s.selected, '1');
      });

      test('activates on tap and fires iron-activate', function(done) {
        assert.equal(s.selected, '0');

        // attach iron-activate listener
        s.addEventListener("iron-activate", function(event) {
          assert.equal(event.detail.selected, '1');
          assert.equal(event.detail.item, s.children[1]);
          done();
        });

        // select Item 1
        s.children[1].dispatchEvent(new CustomEvent('tap', {bubbles: true}));
      });

      test('tap on already selected and fires iron-activate', function(done) {
        assert.equal(s.selected, '0');

        // attach iron-activate listener
        s.addEventListener("iron-activate", function(event) {
          assert.equal(event.detail.selected, '0');
          assert.equal(event.detail.item, s.children[0]);
          done();
        });

        // select Item 0
        s.children[0].dispatchEvent(new CustomEvent('tap', {bubbles: true}));
      });

      test('activates on mousedown', function() {
        // set activateEvent to mousedown
        s.activateEvent = 'mousedown';
        // select Item 2
        s.children[2].dispatchEvent(new CustomEvent('mousedown', {bubbles: true}));
        assert.equal(s.selected, '2');
      });

      test('activates on mousedown and fires iron-activate', function(done) {
        // attach iron-activate listener
        s.addEventListener("iron-activate", function(event) {
          assert.equal(event.detail.selected, '2');
          assert.equal(event.detail.item, s.children[2]);
          done();
        });

        // set activateEvent to mousedown
        s.activateEvent = 'mousedown';
        // select Item 2
        s.children[2].dispatchEvent(new CustomEvent('mousedown', {bubbles: true}));
      });

      test('no activation', function() {
        assert.equal(s.selected, '0');
        // set activateEvent to null
        s.activateEvent = null;
        // select Item 2
        s.children[2].dispatchEvent(new CustomEvent('mousedown', {bubbles: true}));
        assert.equal(s.selected, '0');
      });

      test('activates on tap and preventDefault', function() {
        // attach iron-activate listener
        s.addEventListener("iron-activate", function(event) {
          event.preventDefault();
        });
        // select Item 2
        s.children[2].dispatchEvent(new CustomEvent('tap', {bubbles: true}));
        // shouldn't got selected since we preventDefault in iron-activate
        assert.equal(s.selected, '0');
      });

      test('activates after detach and re-attach', function() {
        // Detach and re-attach
        var parent = s.parentNode;
        parent.removeChild(s);
        parent.appendChild(s);
        
        // select Item 2
        s.children[2].dispatchEvent(new CustomEvent('tap', {bubbles: true}));
        assert.equal(s.selected, '2');
      });

    });