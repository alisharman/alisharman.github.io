// *********************************************
// TOP ZIPCODES BY MATCHES BETWEEN VOLUNTEERS AND VOTERS BASED ON ZIPCODE.
// UNDERLYING CHLOROPLETH MAP IS THE # VOTER MATCHES BY STATEWIDE/CONGRESSIONAL CAMPAIGNS IN EACH STATE.
//    COLORS ARE QUANTILES OF COUNTS.
// *********************************************
// main source: https://bl.ocks.org/sjengle/2e58e83685f6d854aa40c7bc546aeb24



// *********************************************
// FUNCTIONS
// *********************************************

// Draws basemap
function drawMap(error, data, map) {

  // Get table of state counts of matching voters
  var st_counts = {};
  for (var i = 0; i < data.length; i++) {
    st_counts[Number(data[i].state_id)] = Number(data[i].voter_person);
  }

  var color_scale = d3.scaleQuantile().domain(Object.values(st_counts)).range(["#00aeef", "#0288c9", "#0664a2", "#05427b", "#002355"]);

  states = topojson.feature(map, map.objects.states);
  projection.fitSize([width, height], states);
  var path = d3.geoPath(projection);

  // draw base map with state borders and shading based on counts
  var base = plot.append("g").attr("id", "basemap");
  st_matches=base.append("g")
        .attr("class", "states2").selectAll("path")
        .data(states.features).enter().append("path")
          .attr("d", path)
          .attr("fill",function(d){
            c = color_scale(st_counts[Number(d.properties.GEOID)]);
            if(c==undefined){c="#f1f1f1";};
            return c
          });

  st_matches.append("title").text(d=>d.id);

  // draw interior and exterior borders differently 
  var isInterior = function(a, b) { return a !== b; };
  var isExterior = function(a, b) { return a === b; };

  base.append("path")
      .datum(topojson.mesh(map, map.objects.states, isInterior))
      .attr("class", "border interior")
      .attr("d", path);

  base.append("path")
      .datum(topojson.mesh(map, map.objects.states, isExterior))
      .attr("class", "border exterior")
      .attr("d", path)


  // trigger connections drawing
  d3.queue()
    .defer(d3.csv, data_sources.zipcentroids, initCentroid)
    .defer(d3.csv, data_sources.match_connections, initLink)
    .await(filterData);
}

function initCentroid(d) {
  d.longitude = +d.longt;
  d.latitude = +d.lat;
  d.degree = 0;
  return d;
}

function initLink(d) {
  d.count = +d.all;
  return d;
}


// Draws volunteer-voter zipcode connections
function drawConnections(zipcodes, voter_matches) {
  // setup and start edge bundling
  var bundle = generateSegments(zipcodes, voter_matches);

  // draw lines
  var line = d3.line()
    .curve(d3.curveBundle)
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

  var links = plot.append("g").attr("id", "voter_matches")
    .selectAll("path.flight")
    .data(bundle.paths)
    .enter()
    .append("path")
    .attr("d", line)
    .style("fill", "none")
    .style("stroke", "#EF4635")
    .style("stroke-width", 0.5)
    .style("stroke-opacity", 0.2);

  
  var layout = d3.forceSimulation()
    .alphaDecay(0.1) // faster layout
    .force("charge", d3.forceManyBody().strength(10).distanceMax(radius.max * 2))
    .force("link", d3.forceLink().strength(0.8).distance(0))
    .on("tick", d=>links.attr("d", line));

  layout.nodes(bundle.nodes).force("link").links(bundle.links);

  // draw zipcode nodes
  var scale = d3.scaleSqrt()
    .domain(d3.extent(zipcodes, d=>d.degree))
    .range([radius.min, radius.max]);

  plot.append("g").attr("id", "zipcodes")
    .selectAll("circle.zipcentroidsport")
    .data(zipcodes)
    .enter()
    .append("circle")
    .attr("r", function(d) { return scale(d.degree); })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .style("fill", "white")
    .style("opacity", 0.6)
    .style("stroke", "#252525");
}

 // Filter nodes/links for better display
function filterData(error, zipcodes, voter_matches1) {
  if(error) throw error;

  // get map of zip centroid objects
  var byzip = d3.map(zipcodes, function(d) {return d.ZCTA5CE10;});

  // convert links into better format and track node degree
  voter_matches = []
  voter_matches1.forEach(function(d) {
    d.source = byzip.get(d.volunteer_zip_code);
    d.target = byzip.get(d.voter_zip_code);
    if(d.source!=undefined & d.target!=undefined){
      d.source.degree = d.source.degree + 1;
      d.target.degree = d.target.degree + 1;
      voter_matches.push(d)
    }
  });

  // function to sort zipcodes by degree
  var bydegree = function(a, b) {
    return d3.descending(a.degree, b.degree);
  };

  // sort zipcodes by degree and keep top no.
  zipcodes.sort(bydegree);
  zipcodes = zipcodes.slice(0, keep_top_number);

  // calculate projected x, y pixel locations
  zipcodes.forEach(function(d) {
    var coords = projection([d.longitude, d.latitude]);
    d.x = coords[0];
    d.y = coords[1];
  });

  // reset map to only contain zipcodes post filter
  byzip = d3.map(zipcodes, function(d) { return d.ZCTA5CE10; });

  // filter out voter_matches that do not go between remaining zipcodes
  old = voter_matches.length;
  voter_matches = voter_matches.filter(function(d) {
    return byzip.has(d.source.ZCTA5CE10) && byzip.has(d.target.ZCTA5CE10);
  });
  console.log("Removed " + (old - voter_matches.length) + " voter_matches.");
  console.log("Currently " + zipcodes.length + " zipcodes remaining.");
  console.log("Currently " + voter_matches.length + " voter_matches remaining.");

  // start drawing everything
  drawConnections(byzip.values(), voter_matches);
}


//Turns a single edge into several segments for simple edge bundling.
function generateSegments(nodes, links) {

  // calculate distance between two nodes
  var distance = function(source, target) {
    // sqrt( (x2 - x1)^2 + (y2 - y1)^2 )
    var dx2 = Math.pow(target.x - source.x, 2);
    var dy2 = Math.pow(target.y - source.y, 2);
    return Math.sqrt(dx2 + dy2);
  };

  var hypotenuse = Math.sqrt(width * width + height * height);  // max distance any two nodes can be apart is the hypotenuse
  var inner = d3.scaleLinear().domain([0, hypotenuse]).range([1, 15]);   // no. of inner nodes depends on how far nodes are apart

  // generate separate graph for edge bundling
  var bundle = {nodes: [], links: [], paths: []};

  // make existing nodes fixed
  bundle.nodes = nodes.map(function(d, i) {
    d.fx = d.x;
    d.fy = d.y;
    return d;
  });

  links.forEach(function(d, i) {
    
    var length = distance(d.source, d.target); // calculate the distance between the source and target
    var total = Math.round(inner(length)); // calculate total number of inner nodes for this link

    // create scales from source to target
    var xscale = d3.scaleLinear().domain([0, total + 1]).range([d.source.x, d.target.x]); 
    var yscale = d3.scaleLinear().domain([0, total + 1]).range([d.source.y, d.target.y]);

    // initialize source node
    var source = d.source;
    var target = null;

    // add all points to local path
    var local = [source];

    for (var j = 1; j <= total; j++) {
      // calculate target node
      target = {
        x: xscale(j),
        y: yscale(j)
      };

      local.push(target);
      bundle.nodes.push(target);

      bundle.links.push({
        source: source,
        target: target
      });

      source = target;
    }

    local.push(d.target);

    // add last link to target node
    bundle.links.push({
      source: target,
      target: d.target
    });

    bundle.paths.push(local);
  });

  return bundle;
}



// *********************************************
// SETUP
// *********************************************

// Map specifications
var width = 960, height = 500;
var svg = d3.select("#zipnet").append('svg')
    .attr("width", width)
    .attr("height", height);
var plot = svg.append("g").attr("id", "plot");
var projection = d3.geoAlbers();
var radius = {min: 6, max: 12}; // for link drawing
var states = null; // placeholder for state data once loaded


// Define datasources
var data_sources = {
  zipcentroids:"data/zipcode_centroids.csv",
  match_connections:"data/netmap_all.csv",
  us_states: "data/states.json"
};

var keep_top_number = 500; // Top # of nodes to keep

// Draw map
d3.queue()
  .defer(d3.csv, 'data/matches_by_campaign-state.csv')
  .defer(d3.json, data_sources.us_states)
  .await(drawMap);
