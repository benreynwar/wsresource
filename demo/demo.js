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
      this.selected = false;
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

    var dummyData = [];
    var drag = d3.behavior.drag();

    var dummyCircle = {};

    drag.on('drag', function(d) {
      dummyCircle.dragged = true;
      var dummyCircles = svg.selectAll('.dummycircle');
      var dummyDatified = dummyCircles.data(dummyData, function(d) {return d.id;});
      dummyDatified.attr('transform', function(d, i) {
        d.shift.x += d3.event.dx;
        d.shift.y += d3.event.dy;
        var transform = 'translate(' + [d.shift.x, d.shift.y] + ')'
        return transform;
      });
      
    });
    drag.on('dragend', function(d) {
      dummyData = [];
      var dummyCircles = svg.selectAll('.dummycircle');
      var dummyDatified = dummyCircles.data(dummyData, function(d) {return d.id;});
      dummyDatified.exit().transition().duration(500).style('fill-opacity', 0).style('stroke-opacity', 0).remove();
      if (!dummyCircle.dragged) {
        onCircleClick(d);
      }
      var newPosition = {x: d.position.x + dummyCircle.shift.x,
                         y: d.position.y + dummyCircle.shift.y}
      circleRepository.update(d, {
        id: d.id,
        resource: d.resource,
        position: newPosition 
      });
    });
    drag.on('dragstart', function(d) {
      dummyCircles = svg.selectAll('.dummycircle');
      dummyCircle = new Circle({
        id: 0,
        position: {x: d.position.x,
                   y: d.position.y},
        color: 'blue',
        radius: 30});
      dummyCircle.dragged = false;
      dummyCircle.shift = {};
      dummyCircle.shift.x = 0;
      dummyCircle.shift.y = 0;
      dummyData.push(dummyCircle);
      var dummyDatified = dummyCircles.data(dummyData, function(d) {return d.id;});
      var enter = dummyDatified.enter();
      enter.append('circle').attr('r', 30)
        .attr('cx', function(d) {return d.position.x;})
        .attr('cy', function(d) {return d.position.y;})
      applyCircle(dummyDatified);
      dummyDatified.classed('dummycircle', true);
      dummyDatified.style('fill-opacity', 0.5);
    });

    var circles = svg.selectAll(".datacircle");
    var rectangle = svg.selectAll("rect");
    var selectedCircle = null;

    var onCircleClick = function(d, i) {
      if (selectedCircle) {
        selectedCircle.selected = false;
      }
      selectedCircle = d;
      d.selected = true;
      update();
    };
    
    var applyCircle = function(selection) {
      /*selection.attr('cx', function(d) {
        var x = d.position.x;
        return x;
      });
      selection.attr('cy', function(d) {
        return d.position.y;
      });*/
      selection.style('fill', function(d) {
        return d.color;
      });
      selection.style('stroke', function(d) {
        return 'black';
      });
      selection.style('stroke-width', function(d) {
        var width;
        if (d.selected) {
          width = 6;
        } else {
          width = 2;
        }
        return width;
      });      
    };

    var update = function() {
      circles = svg.selectAll(".datacircle");
      var items = circleRepository.itemArray();
      var datified = circles.data(items, function(d) {
        ident = d.id.toString();
        return ident;
      });

      var entered = datified.enter().append('circle')
        .attr("r", 0)
        .attr('cy', function(d) {return d.position.y;})
        .attr('cx', function(d) {return d.position.x;})
        .transition().duration(500)
        .attr("r", function(d) {return d.radius;})
      applyCircle(entered);

      var updated = datified.transition().duration(500)
        .attr('cy', function(d) {return d.position.y;})
        .attr('cx', function(d) {return d.position.x;})
        .attr("r", function(d) {return d.radius;})
      applyCircle(updated);

      datified.exit()
        .transition().duration(500)
        .attr('r', 0)
        .remove();

      datified.classed('datacircle', true)
        .on('click', onCircleClick)
        .call(drag);
      
    };
    circleRepository.onChange = update;

    rectangle.on(
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
    d3.select('body').on(
      'keydown',
      function(d) {
        d3.event.preventDefault();
        if (d3.event.keyIdentifier === 'U+0008') {
          if (selectedCircle) {
            circleRepository.destroy(selectedCircle);
          }
        }
      });
  });
