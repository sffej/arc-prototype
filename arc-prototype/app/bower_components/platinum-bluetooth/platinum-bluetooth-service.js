(function() {
    'use strict';

    /** The `<platinum-bluetooth-service>` element is used in conjuction with
     * the `<platinum-bluetooth-characteristic>` element to [read and write
     * characteristics on nearby bluetooth devices][1] thanks to the young [Web
     * Bluetooth API][2]. It is currently partially implemented
     * behind the experimental flag
     * `chrome://flags/#enable-web-bluetooth`. It is also now
     * available in Chrome 53 as an [origin trial][3] for Chrome OS,
     * Android M, and Mac.
     *
     * `<platinum-bluetooth-service>` needs to be a child of a
     * `<platinum-bluetooth-device>` element.
     *
     * For instance, here's how to read battery level from a nearby bluetooth
     * device advertising Battery service:
     *
     * ```html
     * <platinum-bluetooth-device services-filter='["battery_service"]'>
     *   <platinum-bluetooth-service service='battery_service'>
     *     <platinum-bluetooth-characteristic characteristic='battery_level'>
     *     </platinum-bluetooth-characteristic>
     *   </platinum-bluetooth-service>
     * </platinum-bluetooth-device>
     * ```
     * ```js
     * var bluetoothDevice = document.querySelector('platinum-bluetooth-device');
     * var batteryLevel = document.querySelector('platinum-bluetooth-characteristic');
     *
     * button.addEventListener('click', function() {
     *   bluetoothDevice.request().then(function() {
     *     return batteryLevel.read().then(function(value) {
     *       console.log('Battery Level is ' + value.getUint8(0) + '%');
     *     });
     *   })
     *   .catch(function(error) { });
     * });
     * ```
     *
     * [1]: https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web
     * [2]: https://github.com/WebBluetoothCG/web-bluetooth
     * [3]: https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web#available-for-origin-trials
     *
     * @hero hero.svg
     * @demo demo/
     */

    Polymer({

      is: 'platinum-bluetooth-service',

      properties: {

        /**
         * Required Bluetooth GATT primary service. You may provide either the
         * full Bluetooth UUID as a string or a short 16- or 32-bit form as
         * integers like 0x180d.
         */
        service: {
          type: String,
          observer: '_serviceChanged'
        },

        /**
         * Internal variable used that represents the Bluetooth device.
         */
        _device: {
          type: BluetoothDevice,
          observer: '_deviceChanged'
        }

      },

      /**
       * Set the service string on each characteristic child.
       */
      _serviceChanged: function() {
        this._characteristics = Polymer.dom(this.$.characteristics).getDistributedNodes();
        for (var i = 0; i < this._characteristics.length; i++) {
          this._characteristics[i].service = this.service;
        }
      },

      /**
       * Set the internal device object on each characteristic child.
       */
      _deviceChanged: function() {
        this._characteristics = Polymer.dom(this.$.characteristics).getDistributedNodes();
        for (var i = 0; i < this._characteristics.length; i++) {
          this._characteristics[i]._device = this._device;
        }
      },

      /**
       * Disconnect GATT Server instances on each characteristic child.
       */
      _disconnectGattServer: function() {
        this._characteristics = Polymer.dom(this.$.characteristics).getDistributedNodes();
        for (var i = 0; i < this._characteristics.length; i++) {
          this._characteristics[i]._disconnectGattServer();
        }
      },

      created: function() {
        this._characteristics = [];
      }

    });
  })();