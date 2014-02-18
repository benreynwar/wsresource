define(
  ['protocol', 'q'],
  function(Protocol, Q) {

    var Collection = function(repository, resource, items) {
      this.repository = repository;
      this.resource = resource;
      this.items = items;
    };

    Collection.load = function(repository, resource) {
      console.log('in load');
      var ItemClass = repository.ItemClass;
      console.log(ItemClass);
      console.log(resource);
      var action = new Protocol.Action(resource, 'subscribe');
      console.log('action is');
      console.log(action);
      console.log(repository.protocol);
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
