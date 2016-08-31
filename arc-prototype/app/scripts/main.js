(function(scope) {
  // Current screen
  scope.currentScreen = 'request';
  // scope.currentScreen = 'projectview';
  scope.raml = {};
  scope.urlPanelOpened = false;
  scope.request = {};
  /**
   * Navigation support.
   * The detail of the event must contain a 'screen' property with the screen name to display.
   */
  scope.addEventListener('navigate', (e) => {
    var d = e.detail;
    if (!d.screen) {
      return;
    }
    scope.currentScreen = d.screen;
  });

  // Initialize data
  fetch('scripts/mock-raml.json').then((r) => {
    r.json().then((data) => {
      scope.raml = data;
    });
  });

  document.body.addEventListener('navigate', (e) => {
    var data = e.detail;
    var screen = '';
    switch (data.section) {
      case 'raml':
        if (data.action === 'view') {
          screen = 'projectview';
        } else if (data.action === 'create') {
          screen = 'projectadd';
        } else if (data.action === 'edit') {
          screen = 'projectadd';
        } else if (data.action === 'run') {
          console.warn('TODO: run RAML request');
          screen = 'ramlrequest';
        }
      break;
      case 'request':
        screen = 'request';
        if (data.action === 'run') {
          scope.request = {
            'url': 'https://domain.com/api/endpoint',
            'method': 'POST',
            'headers': 'Content-Type: application/json\nX-custom-header: ya56gFasa75s7a9oh3/po8999',
            'body': '{"person":{"id": 123456, "name": "The person", "age": 32}}'
          };
        }
      break;
    }
    scope.currentScreen = screen;
    scope.urlPanelOpened = false;
  });

  scope._computeToolbarIcon = (urlPanelOpened, screen) => {
    if (urlPanelOpened) {
      return 'arrow-back';
    }
    if (screen === 'projectview') {
      return 'arrow-back';
    }
    if (screen === 'projectadd') {
      return 'arrow-back';
    }
    return 'menu';
  };

  scope.mainToolbarTriggerClick = () => {
    if (scope.urlPanelOpened) {
      scope.urlPanelOpened = false;
    } else if (scope.currentScreen !== 'request') {
      scope.currentScreen = 'request';
    } else {
      scope.$.drawer.togglePanel();
    }
  };
})(document.querySelector('#app'));
