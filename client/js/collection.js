define(
  ['protocol', 'q'],
  function(Protocol, Q) {

    var Collection = function(repository, resource, items) {
      this.repository = repository;
      this.resource = resource;
      this.items = items;
      this.onChange = function() {};
    };

    Collection.load = function(repository, resource) {
      var ItemClass = repository.ItemClass;
      var action = new Protocol.Action(resource, 'subscribe');
      var actionPromise = repository.protocol.sendAction(action);
      var deferred = Q.defer();
      actionPromise.then(function(actionResponse) {
        if (actionResponse.status === 'ok') {
          var itemsdata = actionResponse.data;
          var items = [];
          for (var i=0; i<itemsdata.length; i++) {
            var item = new ItemClass(itemsdata[i]);
            items.push(item);
          }
          repository.localAddMany(items);
          var collection = new Collection(repository, resource, items);
          deferred.resolve(collection);
        } else {
          deferred.reject(actionResponse);
        }
      });
      return deferred.promise;
    };

    return Collection;
  });
