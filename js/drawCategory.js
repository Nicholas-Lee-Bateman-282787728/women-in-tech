function plotByCategory(canvasId, groupData, options) {

    // Select correct category variable
    var category = 'program';
    if (typeof groupData[0].score !== 'undefined') {
      category = 'score';
    } else if (typeof groupData[0].shortOccupation !== 'undefined') {
      category = 'shortOccupation';
    }

    // Nest data
    var nestedData = d3.nest()
      .key(function(d) { return d[category]; })
      .rollup(function(leaves) {
        return {
          'male': d3.sum(leaves, function(l) {
            return l.sex == 'M' ? l.count : 0;
          }),
          'female': d3.sum(leaves, function(l) {
            return l.sex == 'F' ? l.count : 0;
          })
        };
      })
      .entries(groupData);

  // Set graph options
  var defaults = {
    'graphWidth': 500,
    'graphHeight': 300,
    'marginLeft': 50,
    'marginRight': 50,
    'marginTop': 15,
    'marginBottom': 20,
    'gutter': 4,
    'labels': 'even'
  };
  for (var option in defaults) {
    if (!options[option]) {
      options[option] = defaults[option];
    }
  }

  if (options.labels != 'even') {
    options.marginBottom += 15;
  }

  var graphWallWidth = options.graphWidth - options.marginLeft - options.marginRight;
  var graphWallHeight = options.graphHeight - options.marginTop - options.marginBottom;

  // Create width & height scales
  var scaleWidth = function(rawValue) { return rawValue * graphWallWidth; };
  var translateX = function(i) {
    return options.marginLeft + (i * barWidth * 2) + (options.gutter * (i+1));
  };
  var maxValue = d3.max(nestedData, function(d) {
    return d3.max([d.value.female, d.value.male]);
  });
  var scaleHeight = d3.scaleLinear().domain([0, maxValue]).nice()
    .range([0, graphWallHeight]);

  // Create transition
  var barTransition = d3.transition().duration(1000);

  // Set up canvas variables
  var canvas = d3.select('#'+canvasId);
  var svg = canvas.append('svg')
    .attr('viewBox', '0 0 '+options.graphWidth+' '+ options.graphHeight)
    .classed('svg-content', 'true');
  var barWidth = (graphWallWidth - (options.gutter * nestedData.length)) /
                  (nestedData.length * 2);


  // Create category groups
  var categoryJoin = svg.selectAll('.categories')
    .data(nestedData, function(d) { return d.key; });

  categoryJoin.exit().remove();

  var categories = categoryJoin.enter()
    .append('g')
    .classed('categories', 'true')
    .attr('transform', function(d,i) { return 'translate('+ translateX(i) +')'; });

  // Add category label
  var label = categories.append('text').text(function(d) { return d.key; })
    .classed('small-label', true)
    .attr('x', barWidth)
    .attr('text-anchor', 'middle')
    .attr('y', function(d,i) {
      var defaultY = options.graphHeight - options.gutter;
      if ((options.labels == 'staggered') && (i % 2 === 0)) {
         return defaultY - 15;
      }
      return defaultY;
    });
  if (options.labels == 'rotate') {
    // Wrap text labels
    label.attr('transform', 'rotate(45)')
      .attr('text-anchor', 'start')
      .attr('dx', 4);
  }

  // Add female bar
  var fBar = categories.append('rect')
    .classed('female', true).classed('bar', true)
    .attr('x', 0).attr('width', barWidth)
    .attr('y', function(d) { return options.marginTop + graphWallHeight; })
    .attr('height', 0);

  fBar.transition(barTransition)
    .attr('y', function(d) {
      return options.marginTop + graphWallHeight - scaleHeight(d.value.female);
    })
    .attr('height', function(d) { return scaleHeight(d.value.female); });

  // Add female label
  categories.append('text').attr('text-anchor', 'middle')
    .text(function(d) {
      if (category == 'shortOccupation') {
        return Math.floor(d.value.female / 1000);
      }
      return d.value.female;
    })
    .attr('x', barWidth/2)
    .attr('y', function(d) {
      return options.marginTop + graphWallHeight - scaleHeight(d.value.female) - options.gutter;
    })
    .classed('tiny-label', true);

  // Add male bar
  var mBar = categories.append('rect')
    .classed('male', true).classed('bar', true)
    .attr('x', barWidth).attr('width', barWidth)
    .attr('y', function(d) { return options.marginTop + graphWallHeight; })
    .attr('height', 0);

  mBar.transition(barTransition)
    .attr('y', function(d) {
      return options.marginTop + graphWallHeight - scaleHeight(d.value.male);
    })
    .attr('height', function(d) { return scaleHeight(d.value.male); });

  // Add male label
  categories.append('text').attr('text-anchor', 'middle')
     .text(function(d) {
       if (category == 'shortOccupation') {
         return Math.floor(d.value.male / 1000);
       }
       return d.value.male;
     })
     .attr('x', barWidth + barWidth/2)
     .attr('y', function(d) {
       return options.marginTop + graphWallHeight - scaleHeight(d.value.male) - options.gutter;
     })
     .classed('tiny-label', true);

  // Add hover handlers
  svg.on('mousemove', function(d) {
    // Remove existing lines/labels
    svg.selectAll('.line-highlight').remove();
    svg.selectAll('.label-highlight').remove();

    // Save current mouse height (snap to graph wall)
    var coordinates = d3.mouse(this);
    var mouseY = coordinates[1];
    if (mouseY > options.marginTop + graphWallHeight) {
      mouseY = options.marginTop + graphWallHeight;
    } else if (mouseY < options.marginTop) {
      mouseY = options.marginTop;
    }

    // Add line at current mouse height
    svg.append('line')
      .attr('x1', options.marginLeft)
      .attr('x2', options.marginLeft + graphWallWidth)
      .attr('y1', mouseY)
      .attr('y2', mouseY)
      .classed('line-highlight', true);
  })
  .on('mouseout', function(d) {
    svg.selectAll('.line-highlight').remove();
    svg.selectAll('.label-highlight').remove();
  });
}
