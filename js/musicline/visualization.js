/*jshint undef:true browser:true devel:true*/
/*global d3 _ Spotify*/

window.Musicline = window.Musicline || {};

(function(ml) {
  var HILIGHT_COLOR = '#f0f0f0';
  var TEXT_COLOR    = '#999999';
  var LINE_COLOR    = '#999999';

  var Visualization = function(params) {
    var body    = d3.select('body').node();

    this.width  = body.clientWidth;
    this.height = body.clientHeight;
    this.nodes  = [];
    this.links  = [];

    this.clickHandler = params.nodeClick || function() {};


    this.createForce();
    this.createElements();
    this.redraw();

    window.addEventListener('resize', function(e) {
      var body = d3.select('body').node();
      this.width  = body.clientWidth;
      this.height = body.clientHeight;
      this.svg.attr('width', this.width);
      this.svg.attr('height', this.height);
      this.force.size([this.width, this.height]).start();

    }.bind(this), false);
  };

  Visualization.prototype.pulseOn = function(n) {
    this.nodeGroup.selectAll('.pulse').remove();
    var g = this.nodeGroup.select('#' + n.id);

    for(var i = 1; i <= 3; ++i) {
      var c = g.append('svg:circle')
        .attr('r', 0)
        .attr('class', 'pulse')
        .style('stroke', d3.rgb(n.color).brighter(0.75));

      c.append('svg:animate')
        .attr('from', '0')
        .attr('to', 6 * i)
        .attr('dur', '1s')
        .attr('attributeName', 'r')
        .attr('repeatCount', 'indefinite');

      c.append('svg:animate')
        .attr('from', 1.0)
        .attr('to', 0.10)
        .attr('dur', '1s')
        .attr('attributeName', 'stroke-opacity')
        .attr('repeatCount', 'indefinite');
    }
    this.redraw();
  };

  Visualization.prototype.pulseOff = function() {
    this.nodeGroup.selectAll('.pulse').remove();
    this.redraw();
  };

  Visualization.prototype.clear = function() {
    this.nodes = [];
    this.links = [];
    this.force.nodes(this.nodes).links(this.links);
    this.redraw();
  };

  Visualization.prototype.createForce = function() {
    this.force = d3.layout.force()
      .nodes(this.nodes)
      .links(this.links)
      .linkDistance(function(d) { return 75 + Math.random() * 95;})
    .linkStrength(0.5)
      .charge(-10)
      .gravity(0)
      .size([this.width, this.height]);
  };

  Visualization.prototype.createElements = function() {
    this.svg = d3.select('body')
      .append('svg:svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('id', 'musicline-svg');

    this.linkGroup = this.svg.append('svg:g');
    this.nodeGroup = this.svg.append('svg:g');
  };

  Visualization.prototype.redraw = function() {
    this.updateNodes();
    this.updateLinks();
    var app = this;

    var node = this.nodeGroup.selectAll('.node')
      .data(this.nodes, function(d) { return d.name; });

    var link = this.linkGroup.selectAll('.link')
      .data(this.links, function(d) {
        return d.source.name + "-" + d.target.name;
      });

    this.force.on('tick', function() {

      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node.attr('transform', function(d) {
        var box = d3.select(this).node().getBBox();

        d.x = Math.max(box.height, Math.min(app.width - box.width, d.x));
        d.y = Math.max(box.height, Math.min(app.height - box.height, d.y));
        return 'translate(' + d.x + ',' + d.y + ')';
      });

    });

    this.force.start();
 };

  Visualization.prototype.updateLinks = function() {
    var link = this.linkGroup.selectAll('.link')
      .data(this.links, function(d) {
        return d.source.name + "-" + d.target.name;
      });

    link.enter()
      .append('svg:line')
      .attr('class', 'link');

    link.exit().remove();

    link.style('stroke', function(d) {
      return d.lit ? HILIGHT_COLOR : LINE_COLOR;
    });
  };

  Visualization.prototype.updateNodes = function() {
    var vis = this;

    var node = this.nodeGroup.selectAll('.node')
      .data(this.nodes, function(d) { return d.name; });

    var nodeEnter = node.enter().append('svg:g')
        .attr('class', 'node')
        .attr('id', function(d) { return d.id; })
        .on('mouseup', this.clickHandler)
        .on('mouseover', function(d) {
          if (!d.spent) {
            d3.select(this).select('.label')
              .style('text-decoration', 'underline');

            d3.select(this).select('.point')
              .style('fill', d3.rgb(d.color).brighter(1.50));
          }

          vis.showConnected(d);
        })
        .on('mouseout', function(d) {
          d3.select(this).select('text')
            .style('fill', TEXT_COLOR)
            .style('text-decoration', 'none');

          d3.select(this).select('.point')
            .style('fill', d.color);

          vis.dimConnected();
        })
        .call(this.force.drag);

    nodeEnter.append('svg:circle')
      .attr('class', 'point')
      .attr('r', 4)
      .style('fill', function(d) {
        return d.color;
      });

    nodeEnter.append('svg:text')
      .attr('class', 'label')
      .attr('dx', 8)
      .attr('dy', 4)
      .text(function(d) { return d.name; });

    node.selectAll('.label')
      .style('fill', function(d) {
        return d.lit ? HILIGHT_COLOR : TEXT_COLOR;
      });

    node.exit().remove();
  };

  Visualization.prototype.showConnected = function(d) {
    _(this.links).each(function(link) {
      link.lit = (d.name == link.source.name) || (d.name == link.target.name);
      link.source.lit = link.source.lit || link.lit;
      link.target.lit = link.target.lit || link.lit;
    });

    this.updateLinks();
    this.updateNodes();
  };

  Visualization.prototype.dimConnected = function(d) {
    _(this.links).each(function(link) {
      link.lit = false;
      link.source.lit = link.target.lit = false;
    });

    this.updateLinks();
    this.updateNodes();
  };

  Visualization.prototype.findNode = function(artist) {
    return _(this.nodes).find(function(n) {
      return n.name.toLowerCase() == artist.decodeForText().toLowerCase();
    });
  };

  Visualization.prototype.createNode = function(artist, parent) {
    var id = 'id_' + artist.decodeForText().replace(/[^A-Za-z0-9_]/g, '_').toLowerCase();
    var node = {
      name:  artist.decodeForText(),
      id:    id,
      spent: false,
      lit:   false,
      x:     parent ? parent.x + Math.random() * 100 - 50 : this.width  / 2,
      y:     parent ? parent.y + Math.random() * 100 - 50 : this.height / 2,
      color: 'hsl(' + Math.random() * 360 + ', 75%, 55%)'
    };

    this.nodes.push(node);
    return node;
  };

  Visualization.prototype.linkNodes = function(from, to) {
    this.links.push({
      source: from,
      target: to
    });
  };


  ml.Visualization = Visualization;
})(window.Musicline);
