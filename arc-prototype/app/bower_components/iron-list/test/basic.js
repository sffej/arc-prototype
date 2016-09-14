suite('basic features', function() {
    var list, container;

    setup(function() {
      container = fixture('trivialList');
      list = container.list;
    });

    test('defaults', function() {
      assert.equal(list.items, null, 'items');
      assert.equal(list.as, 'item', 'as');
      assert.equal(list.indexAs, 'index', 'indexAs');
      assert.equal(list.selectedAs, 'selected', 'selectedAs');
      assert.equal(list.scrollTarget, list, 'scrollTarget');
      assert.isFalse(list.selectionEnabled, 'selectionEnabled');
      assert.isFalse(list.multiSelection, 'multiSelection');
    });

    test('check items length', function(done) {
      container.data = buildDataSet(100);

      flush(function() {
        assert.equal(list.items.length, container.data.length);
        done();
      });
    });

    test('check physical item heights', function(done) {
      container.data = buildDataSet(100);

      flush(function() {
        var rowHeight = list._physicalItems[0].offsetHeight;

        list._physicalItems.forEach(function(item) {
          assert.equal(item.offsetHeight, rowHeight);
        });

        done();
      });
    });

    test('check physical item size', function(done) {
      var setSize = 10;
      container.data = buildDataSet(setSize);

      flush(function() {
        assert.equal(list.items.length, setSize);
        done();
      });
    });

    test('first visible index', function() {
      container.data = buildDataSet(100);
      Polymer.dom.flush();
      assert.equal(list.firstVisibleIndex, 0);
      list.scroll(0, container.itemHeight * 10);
      list.fire('scroll');
      assert.equal(list.firstVisibleIndex, 10);
      list.scroll(0, container.itemHeight * 50);
      list.fire('scroll');
      assert.equal(list.firstVisibleIndex, 50);
      list.scrollToIndex(60);
      Polymer.dom.flush();
      assert.equal(list.firstVisibleIndex, 60);
      list.scrollToIndex(0);
      Polymer.dom.flush();
      assert.equal(list.firstVisibleIndex, 0);
    });

    test('last visible index', function() {
      container.data = buildDataSet(1);
      container.itemHeight = 1000;
      Polymer.dom.flush();
      assert.equal(list.lastVisibleIndex, 0);
      container.data = buildDataSet(2);
      container.itemHeight = 50;
      Polymer.dom.flush();
      assert.equal(list.lastVisibleIndex, 1);
      container.data = buildDataSet(10);
      Polymer.dom.flush();
      list.scrollToIndex(8);
      Polymer.dom.flush();
      assert.equal(list.lastVisibleIndex, 9);
      container.itemHeight = 50;
      container.data = buildDataSet(100);
      Polymer.dom.flush();
      list.scroll(0, 100);
      list.fire('scroll');
      assert.equal(list.lastVisibleIndex, ((list._scrollTop + container.listHeight) / container.itemHeight) - 1);
    });

    test('scroll to index', function(done) {
      list.items = buildDataSet(100);

      setTimeout(function() {
        list.scrollToIndex(30);
        assert.equal(list.firstVisibleIndex, 30);

        list.scrollToIndex(0);
        assert.equal(list.firstVisibleIndex, 0);

        var rowHeight = getFirstItemFromList(list).offsetHeight;
        var viewportHeight = list.offsetHeight;
        var itemsPerViewport = Math.floor(viewportHeight/rowHeight);

        list.scrollToIndex(99);
        assert.equal(list.firstVisibleIndex, list.items.length - itemsPerViewport);

        // make the height of the viewport same as the height of the row
        // and scroll to the last item
        list.style.height = list._physicalItems[0].offsetHeight + 'px';

        setTimeout(function() {
          list.scrollToIndex(99);
          assert.equal(list.firstVisibleIndex, 99);
          done();
        }, 100);
      }, 100);
    });

    test('scroll to index while not attached', function() {
      var tmpList = document.createElement('iron-list');
      Polymer.dom(tmpList).appendChild(document.createElement('template'));
      tmpList.items = buildDataSet(100);
      assert.equal(tmpList._virtualStart, 0);
      tmpList.scrollToIndex(50);
      assert.equal(tmpList._virtualStart, 0);
    });

    test('scroll to item', function(done) {
      list.items = buildDataSet(100);

      setTimeout(function() {
        list.scrollToItem(list.items[30]);
        assert.equal(list.firstVisibleIndex, 30);

        list.scrollToItem(list.items[0]);
        assert.equal(list.firstVisibleIndex, 0);

        var rowHeight = getFirstItemFromList(list).offsetHeight;
        var viewportHeight = list.offsetHeight;
        var itemsPerViewport = Math.floor(viewportHeight/rowHeight);

        list.scrollToItem(list.items[99]);
        assert.equal(list.firstVisibleIndex, list.items.length - itemsPerViewport);

        // make the height of the viewport same as the height of the row
        // and scroll to the last item
        list.style.height = list._physicalItems[0].offsetHeight + 'px';

        setTimeout(function() {
          list.scrollToItem(list.items[99]);
          assert.equal(list.firstVisibleIndex, 99);
          done();
        }, 100);
      }, 100);
    });

    test('scroll to top', function(done) {
      list.items = buildDataSet(100);
      Polymer.dom.flush();
      list.scrollToIndex(99);
      Polymer.dom.flush();
      list.scroll(0, 0);
      setTimeout(function() {
        assert.equal(list._scrollTop, 0, 'scrollTop = 0');
        done();
      }, 100);
    });

    test('scroll to a given scrollTop', function(done) {
      list.items = buildDataSet(100);
      Polymer.dom.flush();
      list.scrollToIndex(99);
      Polymer.dom.flush();
      list.scroll(0, 500);
      setTimeout(function() {
        assert.equal(list._scrollTop, 500, 'scrollTop = 500');
        done();
      }, 100);
    });

    test('reset items', function() {
      list.items = buildDataSet(100);
      Polymer.dom.flush();
      assert.equal(getFirstItemFromList(list).textContent, '0');
      list.items = null;
      Polymer.dom.flush();
      assert.notEqual(getFirstItemFromList(list).textContent, '0');
      list.items = buildDataSet(100);
      Polymer.dom.flush();
      assert.equal(getFirstItemFromList(list).textContent, '0');
    });

    test('visibility', function() {
      list.items = buildDataSet(100);
      Polymer.dom.flush();
      assert.isTrue(list._isVisible);
      list.style.display = 'none';
      assert.isFalse(list._isVisible);
      // Use main document scrolling
      list.style.display = '';
      list.scrollTarget = list.ownerDocument.documentElement;
      assert.isTrue(list._isVisible);
      list.style.display = 'none';
      assert.isFalse(list._isVisible);
      list.style.display = '';
      // what if the list is using document scroll, but no template has been stamped.
      list.style.height = '0px';
      assert.isTrue(list._isVisible);
    });

  });