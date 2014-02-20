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
      this.items = {};
      this.onChange = function() {};
    };

    ItemRepository.prototype.itemArray = function() {
      var arr =[];
      for (var i in this.items) {
        if (this.items.hasOwnProperty(i)){
          var item = this.items[i];
          if (item) {
            arr.push(this.items[i]);
          }
        }
      }
      return arr;
    };
    
    ItemRepository.prototype.localAddMany = function(items) {
      for (var i=0; i<items.length; i++) {
        var item = items[i];
        this.items[item.id] = item;
      }
      this.onChange();
    };

    ItemRepository.prototype.processActionReport = function(actionReport) {
      if (actionReport.action == 'add') {
        var item = new this.ItemClass(actionReport.data);
        this.items[item.id] = item;
      } else if (actionReport.action == 'update') {
        var ident = actionReport.data.id;
        var item = this.items[ident];
        if (item) {
          item.update(actionReport.data);
        }
      } else if (actionReport.action == 'delete') {
        var bits = actionReport.resource.split("/");
        if (bits.length == 2) {
          var ident = parseInt(bits[1]);
          var item = this.items[ident];
          if (item) {
            this.items[ident] = null;
            item.destroy();
          }
        }
      }
      this.onChange();
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

    ItemRepository.prototype.update = function(item, newData) {
      var action = new Protocol.Action(item.resource, 'update', newData);
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

    ItemRepository.prototype.destroy = function(item) {
      var _this = this;
      var action = new Protocol.Action(item.resource, 'delete');
      var actionPromise = this.protocol.sendAction(action);
      var deferred = Q.defer();
      actionPromise.then(function(actionResponse) {
        if (actionResponse.status === 'ok') {
          _this.items[item.resource] = null;
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
          _this.items[item.resource] = item;
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
          _this.items[item.resource] = item;
          deferred.resolve(item);
        } else {
          deferred.reject(actionResponse);
        }
      });
      return deferred.promise;
    };

    return ItemRepository;
  });
