var Xbox = require('xbox-onoff');
var inherits = require('util').inherits;
var Service, Characteristic;

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-xbox-onoff", "Xbox", XboxAccessory);
}

function XboxAccessory(log, config) {
  this.log = log;
  this.config = config;
  this.name = config['name'] || 'Xbox';
  this.ip_address = config['ipAddress'];
  this.liveId = config['liveId'];
  this.xbox = new Xbox({
    ip: this.ip_address,
    id: this.liveId,
    name: this.name
    });
  this.tries = config['tries'] || 5;
  this.tryInterval = config['tryInterval'] || 1000;
  
  this.service = new Service.Switch(this.name);

  this.service
        .getCharacteristic(Characteristic.On)
        .on('get', this._getOn.bind(this))
        .on('set', this._setOn.bind(this));
}

XboxAccessory.prototype.getInformationService = function() {
    var informationService = new Service.AccessoryInformation();
    informationService
        .setCharacteristic(Characteristic.Name, this.name)
        .setCharacteristic(Characteristic.SerialNumber, this.ip_address);
    return informationService;
};

XboxAccessory.prototype.getServices = function() {
    return [this.service, this.getInformationService()];
};

XboxAccessory.prototype._setOn = function(powerOn, callback) {
    var self = this;
    this.log("Sending on command to '" + this.name + "'...");

    // Queue tries times at tryInterval
    for (var i = 0; i < this.tries; i++) {
      setTimeout(function() {
        self.xbox.powerOn();
      }, i * this.tryInterval);
    }

    // Don't really care about powerOn errors, and don't want more than one callback
    callback();
};

XboxAccessory.prototype._getOn = function(callback) {
    var accessory = this;
    this.xbox.isAlive(function(err) {
        if (err) {
             callback(null, false);
             accessory.log('Xbox is offline');
        } else {
            accessory.log('Xbox is On!');
            callback(null, true);
        }
    });
};