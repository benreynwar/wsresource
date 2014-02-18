require.config({
  baseUrl: '../client/js',
  paths: {
    q: 'lib/q',
    d3: '../../demo/d3'
  }
});

require(
  ['config', 'protocol', 'item_repository', 'collection', 'd3'],
  function(config, Protocol, ItemRepository, Collection, d3) {

    var Circle = function(data) {
      this.resource = data.resource;
      this.position = data.position;
      this.radius = data.radius;
      this.color = data.color;
      this.id = data.id;
    }
    Circle.prototype.toJson = function() {
      var data = {
        resource: this.resource,
        color: this.color,
        position: this.position,
        radius: this.radius,
        id: this.id
      };
      return data;
    };
    Circle.prototype.update = function(data) {
      if ('color' in data) {
        this.color = data.color;
      }
      if ('resource' in data) {
        this.resource = data.resource;
      }
      if ('position' in data) {
        this.position = data.position;
      }
      if ('radius' in data) {
        this.radius = data.radius;
      }
    };
    Circle.prototype.destroy = function() {
    };
    var repositories = {};
    var protocol = new Protocol(config.wsAddress, repositories);
    var circleRepository = new ItemRepository(protocol, Circle, 'circle');
    repositories[circleRepository.resource] = circleRepository;
    var circleCollectionPromise = Collection.load(circleRepository, 'circle');
    var circleCollection = null;
    circleCollectionPromise.then(function(rcvdCircles) {
      circleCollection = rcvdCircles;
    });

    var svg = d3.select('svg');
    var circles = svg.selectAll("circle");
    circleRepository.onChange = function() {
      var items = circleRepository.itemArray();
      var datified = circles.data(items);
      var enter = datified.enter().append('circle');
      enter.attr('cx', function(d) {
        var x = d.position.x;
        return x;
      });
      enter.attr('cy', function(d) {
        return d.position.y;
      });
      enter.attr('r', function(d) {
        return d.radius;
      });
      enter.style('fill', function(d) {
        return d.color;
      });
    };

    svg.on(
      'click',
      function(d, i) {
        var position = d3.mouse(this);
        if (position) {
          var newCircle = new Circle(
            {color: 'blue',
             position: {x:position[0], y:position[1]},
             radius: 30});
          circleRepository.add(newCircle);
        }
      });

    /*
    var addCirclePromise = circleCollectionPromise.then(function() {
      var newCircle = new Circle({color: 'blue', position: {x:50, y:50}, radius: 30});
      circleRepository.add(newCircle);
    });
    
    addCirclePromise.then(function(circle) {
      console.log('new circle is ');
      console.log(circle);
    });
    */
  });
