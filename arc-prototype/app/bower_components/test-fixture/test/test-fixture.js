(function() {
      var proto = Object.create(HTMLElement.prototype);

      proto.onDetached = function() {};

      proto.detachedCallback = function() {
        this.onDetached();
      };

      document.registerElement('x-custom', {
        prototype: proto
      });
    })();
describe('test-fixture import', function() {
  it('loads from test-fixture import', function() {
    var importNode = document.getElementById('test-fixture-import');
    expect(importNode.import).to.not.be.null;
  });
});
describe('<test-fixture>', function () {
  var trivialFixture;
  var complexDomFixture;
  var multiTemplateFixture;
  var commentedSingleChildFixture;
  var commentedMultiChildFixture;

  beforeEach(function () {
    trivialFixture = document.getElementById('TrivialFixture');
    complexDomFixture = document.getElementById('ComplexDomFixture');
    multiTemplateFixture = document.getElementById('MultiTemplateFixture');
    commentedSingleChildFixture = document.getElementById('CommentedSingleChildFixture');
    commentedMultiChildFixture = document.getElementById('CommentedMultiChildFixture');
  });

  afterEach(function () {
    trivialFixture.restore();
    complexDomFixture.restore();
    multiTemplateFixture.restore();
    commentedSingleChildFixture.restore();
    commentedMultiChildFixture.restore();
  });

  describe('an stamped-out fixture', function () {
    var attachedFixture;
    var element;

    beforeEach(function () {
      attachedFixture = document.getElementById('AttachedFixture');
      element = attachedFixture.create();
    });

    afterEach(function () {
      attachedFixture.restore();
    });

    it('detaches the fixtured DOM when it is restored', function () {
      var detached = false;

      element.onDetached = function () {
        detached = true;
      };

      attachedFixture.restore();
      expect(detached).to.be.eql(true);
    });
  });

  describe('when create is called', function () {
    var el;

    beforeEach(function () {
      el = trivialFixture.create();
    });

    it('clones all template fragments within itself', function () {
      expect(el).to.be.ok;
      expect(document.getElementById('Foo')).to.be.ok;
    });

    it('detaches all fixture templates from itself', function () {
      expect(trivialFixture.querySelectorAll('template').length).to.be.equal(0);
    });

    describe('and then restore is called', function () {
      beforeEach(function () {
        trivialFixture.restore();
      });

      it('re-attaches all fixture templates', function () {
        expect(trivialFixture.querySelectorAll('template').length).to.be.equal(1);
      });

      it('removes all cloned elements from itself', function () {
        expect(document.getElementById('Foo')).to.not.be.ok;
      });
    });

    describe('for a dom with a single root element', function () {
      it('returns a reference to the root element', function () {
        expect(el).to.be.instanceOf(HTMLElement);
      });
    });

    describe('for a complex dom', function () {
      var els;

      beforeEach(function () {
        els = complexDomFixture.create();
      });

      it('fixtures all the dom elements in the template', function () {
        expect(document.getElementById('Bar')).to.be.ok;
        expect(document.getElementById('BarSibling')).to.be.ok;
        expect(document.getElementById('BarChild')).to.be.ok;
      });

      it('returns an array of root elements', function () {
        expect(els).to.be.instanceOf(Array);
        expect(els[0]).to.be.instanceOf(HTMLElement);
        expect(els[1]).to.be.instanceOf(HTMLElement);
      });
    });

    describe('when there are multiple templates', function () {
      var groups;

      beforeEach(function () {
        groups = multiTemplateFixture.create();
      });

      it('fixtures elements from all of the templates', function () {
        expect(document.getElementById('Baz')).to.be.ok;
        expect(document.getElementById('Qux')).to.be.ok;
      });

      it('returns an array with elements grouped by template', function () {
        expect(groups).to.be.instanceOf(Array);
        expect(groups[0]).to.be.instanceOf(HTMLElement);
        expect(groups[1]).to.be.instanceOf(Array);
        expect(groups[1][0]).to.be.instanceOf(HTMLElement);
        expect(groups[1][1]).to.be.instanceOf(HTMLElement);
      });
    });

    describe('when there are comments in the template', function() {
      var el;
      var els;

      beforeEach(function () {
        el = commentedSingleChildFixture.create();
        els = commentedMultiChildFixture.create();
      });

      it('returns a single element if the template has a single child', function() {
        expect(el).to.be.instanceOf(HTMLElement);
      });

      it('returns multiple elements if the template has multiple children', function() {
        expect(els).to.be.instanceOf(Array);
        expect(els.length).to.equal(3);
      });
    });
  });

  describe('when the fixture global is called', function () {
    var el;

    beforeEach(function () {
      el = fixture('TrivialFixture');
    });

    it('generates a DOM fragment from the associated fixture', function () {
      expect(el).to.be.equal(document.getElementById('Foo'));
    });
  });
});