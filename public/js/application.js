/*jshint undef:true browser:true*/
/*global d3 _*/

window.Musicline = window.Musicline || {};
(function(e) {
  var HILIGHT_COLOR = '#f0f0f0';

  var Application = function(params) {
    var body    = d3.select('body').node();
    this.width  = body.clientWidth;
    this.height = body.clientHeight;

    this.root = params.root || {
      name: params.rootName || "Tool",
      spent: true,
      lit: false,
      color: 'hsl(' + Math.random() * 360 + ",75%,55%)"
    };

    this.familiarityRange = params.familiarityRange || [0, 100];

    this.nodes = [this.root];
    this.links = [];

    this.force  = d3.layout.force()
      .nodes(this.nodes)
      .links(this.links)
      .linkDistance(function(d) { return 75 + Math.random() * 95;})
      .charge(-400)
      .size([this.width, this.height]);

    this.vis = d3.select('body')
      .append('svg:svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.linkGroup = this.vis.append('svg:g');
    this.nodeGroup = this.vis.append('svg:g');

    this.updateVisualization();

    this.addSimilar(this.root);
  };

  Application.prototype.updateVisualization = function() {
    var app = this;


    this.updateNodes();
    this.updateLinks();

    var node = this.nodeGroup.selectAll('g.node')
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
        return 'translate(' + d.x + ',' + d.y + ')';
      });

    });

    this.force.start();
 };

  Application.prototype.addSimilar = function(from) {
    var app = this;
    var args = 'fMmin='  + app.familiarityRange[0] +
               '&fMax=' + app.familiarityRange[1];

    d3.json('/artists/' + from.name + '/similar?' + args, function(similar) {

      _(similar).each(function(artistName){
        var newNode = _(app.nodes).find(function(n) {
          return n.name == artistName;
        });

        if (!newNode) {
          newNode = {
            name: artistName,
            spent: false,
            lit: false,
            x: from.x,
            y: from.y,
            color: 'hsl(' + Math.random() * 360 + ",75%,55%)"
          };
          app.nodes.push(newNode);
        }

        app.links.push({
          source: from,
          target: newNode
        });

      });
      app.updateVisualization();
    });

  };

  Application.prototype.updateLinks = function() {
    var link = this.linkGroup.selectAll('.link')
      .data(this.links, function(d) {
        return d.source.name + "-" + d.target.name;
      });

    link
      .enter()
      .append('svg:line')
      .attr('class', 'link');

    link.exit().remove();

    link.style('stroke', function(d) {
      return d.lit ? HILIGHT_COLOR : "#808080";
    });
  };

  Application.prototype.updateNodes = function() {
    var app = this;

    var node = this.nodeGroup.selectAll('g.node')
      .data(this.nodes, function(d) { return d.name; });

    var nodeEnter = node.enter().append('svg:g')
        .attr('class', 'node')
        .on('mouseup', function(d, i) {
          if (!d.spent) {
            d.spent = true;
            app.addSimilar(d);
          }
        })
        .on('mouseover', function(d) {
          if (!d.spent) {
            d3.select(this).select('text')
              .style('text-decoration', 'underline');

            d3.select(this).select('circle')
              .style('fill', d3.rgb(d.color).brighter(1.50));
          }

          app.showConnected(d);
        })
        .on('mouseout', function(d) {
          d3.select(this).select('text')
            .style('fill', '#a0a0a0')
            .style('text-decoration', 'none');

          d3.select(this).select('circle')
            .style('fill', d.color);

          app.dimConnected(d);

        })
        .call(this.force.drag);

    nodeEnter.append('svg:circle')
      .attr('class', 'node')
      .attr('r', 4)
      .style('fill', function(d) {
        return d.color;
      });

    nodeEnter.append('svg:text')
      .attr('class', 'node')
      .attr('dx', 8)
      .attr('dy', 4)
      .text(function(d) { return d.name; });

    node.selectAll('text')
      .style('fill', function(d) {
        return d.lit ? HILIGHT_COLOR : '#a0a0a0';
      });

    node.exit().remove();
  };

  Application.prototype.showConnected = function(d) {
    _(this.links).each(function(link) {
      link.lit = (d.name == link.source.name) || (d.name == link.target.name);
      link.source.lit = link.source.lit || link.lit;
      link.target.lit = link.target.lit || link.lit;
    });

    this.updateLinks();
    this.updateNodes();
  };

  Application.prototype.dimConnected = function(d) {
    _(this.links).each(function(link) {
      link.lit = false;
      link.source.lit = link.target.lit = false;
    });

    this.updateLinks();
    this.updateNodes();
  };


  e.Application = Application;
})(window.Musicline);
