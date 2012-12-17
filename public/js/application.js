/*jshint undef:true browser:true*/
/*global d3 _*/

window.Musicline = window.Musicline || {};
(function(e) {

  var Application = function(params) {
    var body    = d3.select('body').node();
    this.width  = body.clientWidth;
    this.height = body.clientHeight;

    this.root = params.root || {
      name: params.rootName || "Tool",
      spent: false
    };

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
        .call(this.force.drag);

    nodeEnter.append('svg:circle')
      .attr('class', 'node')
      .attr('r', 4)
      .style('fill', function(d) {
        return 'hsl(' + Math.random() * 360 + ",75%,55%)";
      });

    nodeEnter.append('svg:text')
      .attr('class', 'node')
      .attr('dx', 8)
      .attr('dy', 4)
      .text(function(d) { return d.name; })
      .on('mouseover', function(d) {
        d3.select(this).style('fill', '#f0f0f0');
      })
      .on('mouseout', function(d) {
        d3.select(this).style('fill', '#e0e0e0');
      });

    node.exit().remove();

    var link = this.linkGroup.selectAll('.link')
      .data(this.links, function(d) {
        return d.source.name + "-" + d.target.name;
      });

    link
      .enter()
      .append('svg:line')
      .attr('class', 'link');

    link.exit().remove();

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
    d3.json('/artists/' + from.name + '/similar', function(similar) {

      _(similar).each(function(artistName){
        var newNode = _(app.nodes).find(function(n) {
          return n.name == artistName;
        });

        if (!newNode) {
          newNode = {
            name: artistName,
            spent: false,
            x: from.x,
            y: from.y
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


  e.Application = Application;
})(window.Musicline);
