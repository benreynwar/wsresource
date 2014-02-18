define(
  ['protocol', 'q'],
  function(Protocol, Q) {

    //Item Interface
    // - constructor(json)
    // - toJson();
    // - update(data);
    // - resource
    // - destroy() - takes care of cleaning from collections

    var ItemRepository = function(protocol, ItemClass, resource) {
      this.resource = resource
      this.protocol = protocol;
      this.ItemClass = ItemClass;
      this.resources = {};
    };

    ItemRepository.prototype.add = function(item) {
      var action = new Protocol.Action(this.resource, 'add', item.toJson());
      var actionPromise = this.protocol.sendAction(action);
      var deferred = Q.defer();
      actionPromise.then(function(actionResponse) {
        if (actionResponse.status === 'ok') {
          item.update(actionResponse.data);
          deferred.resolve(item);
        } else {
          deferred.reject(actionResponse);
        }
      });
      return deferred.promise;
    };

    ItemRepository.prototype.update = function(item) {
      var action = new Protocol.Action(item.resource, 'update', item.toJson());
      var actionPromise = this.protocol.sendAction(action);
      var deferred = Q.defer();
      actionPromise.then(function(actionResponse) {
        if (actionResponse.status === 'ok') {
          item.update(response.data);
          deferred.resolve(item);
        } else {
          deferred.reject(actionResponse);
        }
      });
      return deferred.promise;
    };

    ItemRepository.prototype.destroy = function(item) {
      var _this = this;
      var action = new Protocol.Action(item.resource, 'delete');
      var actionPromise = this.protocol.sendAction(action);
      var deferred = Q.defer();
      actionPromise.then(function(actionResponse) {
        if (actionResponse.status === 'ok') {
          _this.resources[item.resource] = null;
          deferred.resolve();
        } else {
          deferred.reject(actionResponse);
        }
      });
      return deferred.promise;
    };

    ItemRepository.prototype.read = function(resource) {
      var _this = this;
      var action = new Protocol.Action(resource, 'read');
      var actionPromise = this.protocol.sendAction(action);
      var deferred = Q.defer();
      actionPromise.then(function(actionResponse) {
        if (actionResponse.status === 'ok') {
          var item = new _this.ItemClass(actionResponse.data);
          _this.resources[item.resource] = item;
          deferred.resolve(item);
        } else {
          deferred.reject(actionResponse);
        }
      });
      return deferred.promise;      
    };

    ItemRepository.prototype.subscribe = function(resource) {
      var _this = this;
      var action = new Protocol.Action(resource, 'subscribe');
      var actionPromise = this.protocol.sendAction(action);
      var deferred = Q.defer();
      actionPromise.then(function(actionResponse) {
        if (actionResponse.status === 'ok') {
          var item = new _this.ItemClass(actionResponse.data);
          _this.resources[item.resource] = item;
          deferred.resolve(item);
        } else {
          deferred.reject(actionResponse);
        }
      });
      return deferred.promise;
    };

    return ItemRepository;
  });
