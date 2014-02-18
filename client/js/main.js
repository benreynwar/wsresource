require.config({
  paths: {
    q: 'lib/q'
  }
});

require(
  ['wsresource', 'config', 'protocol', 'item_repository', 'collection'],
  function(wsresource, config, Protocol, ItemRepository, Collection) {

    var action = new Protocol.Action('fish', 'add', {color: 'brown'}); 
    var protocol = new Protocol(config.wsAddress);

    var Fish = function(data) {
      this.resource = data.resource;
      this.color = data.color;
    }
    Fish.prototype.toJson = function() {
      var data = {
        resource: this.resource,
        color: this.color
      };
      return data;
    };
    Fish.prototype.update = function(data) {
      console.log('updating');
      if ('color' in data) {
        this.color = data.color;
      }
      if ('resource' in data) {
        this.resource = data.resource;
      }
    };
    Fish.prototype.destroy = function() {
    };

    var fishRepository = new ItemRepository(protocol, Fish, 'fish');

    var fishCollectionPromise = Collection.load(fishRepository, 'fish');

    var fishes = null;

    fishCollectionPromise.then(function(rcvdFishes) {
      fishes = rcvdFishes;
    });
    
    var addFishPromise = fishCollectionPromise.then(function() {
      var newFish = new Fish({color: 'blue'});
      fishRepository.add(newFish);
    });
    
    addFishPromise.then(function(fish) {
      console.log('new fish is ');
      console.log(fish);
    });
    
  });
