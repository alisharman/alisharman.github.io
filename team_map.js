// *********************************************
// MAP FUNCTIONS
// *********************************************
function drawMaps(error, zips, cids, data) {
   //var geojson = topojson.feature(cids, cids.objects.cid_areas);
  if (error) throw error;
  var elems = {};
  for (var i = 0; i < data.length; i++)
  {elems[Number(data[i].zip)] = Number(data[i].group);}
 
  g.selectAll("path")
      .data(topojson.feature(zips, zips.objects.zipcodes).features)
    .enter().append("path")
      .attr("d", path)
      .attr("fill", d=>colors(elems[Number(d.properties.ZCTA5CE10)]))
      .attr("class", "feature");
    
   g2=svg.append("g")
        .attr("class", "states")
      .selectAll("path")
      .data(topojson.feature(cids, cids.objects.cid_areas).features)
      .enter().append("path")
        .attr("d", path)
        .on("click", clicked);

   g2.append("title").text(d=>d.properties.candidate);
};

function addcircle(go_on, cid) {
      if(go_on==1){
        intializeGraph(cid);
      }
      else{
        d3.select("#netw").remove();
      };
}

function clicked(d) {
  var x, y, k;
  cid = d.properties.cid
  if (d && centered !== d) {
    go_on=1
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    if(cid==57){k=2}
    else{k = 14};
    centered = d;
  } else {
    go_on=0
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  g.transition()
      .duration(400)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");

  g2.transition()
      .duration(400)
      .on("end",addcircle(go_on, cid))
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5/k + "px");
}


// *********************************************
// NETWORK FUNCTIONS
// *********************************************
function intializeGraph(cid) {
  console.log(cid);
  d3.json("data/net"+cid+"data.json", function(error, data) {
      nodesMap = d3.map();
      nodes = data.nodes;
      nodes.forEach(n => nodesMap.set(n.id, n));

      data.links.forEach(function(l) {
      l.source=nodesMap.get(l.source); 
      l.target=nodesMap.get(l.target)})

      getGraph(nodes,data.links)
  })
}

function getGraph(nodes,links) {

  var svg2 = d3.select("#netw").append("svg")
    .attr("id","netwsvg")
    .attr("width", width2)
    .attr("height", height2);

  var link = svg2.append("g")
                .selectAll("line")
                .data(links)
                .enter().append("line")
                .attr("class", "links");

  var node = svg2.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", d=>d.nodesize)
            .style("fill", d=>d.color)

  simulation
      .nodes(nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(links);

  function ticked() {
    link
        .attr("x1", d=>d.source.x)
        .attr("y1", d=>d.source.y)
        .attr("x2", d=>d.target.x)
        .attr("y2", d=>d.target.y);

    node
         .attr("cx", d=>d.x)
         .attr("cy", d=>d.y);
  }
}


// *********************************************
// MAP SETUP
// *********************************************
var width = 840,
    height = 420,
    centered;
var active = d3.select(null);

var svg = d3.select("#zipmap")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g");

// Color scale
colors = d3.scaleOrdinal().range(["lightgray","#85bcdb","#4292c6","#1361a9","#08306b"]).domain([null,1,2,3,4]);

// Map projection
var projection = d3.geoMercator() 
    .scale(800)
    .center([-96, 38])
    .translate([width/2,height/2]) //translate to center the map in view

// Generate paths based on projection
var path = d3.geoPath()
    .projection(projection);

d3.queue()
  .defer(d3.json, "data/zipcodes.topojson")
  .defer(d3.json, "data/cid_areas.json")
  .defer(d3.csv, "data/df_voters_zip.csv")
  .await(drawMaps);


// *********************************************
// NETWORK SETUP
// *********************************************
width2 = 500;
height2 = 500;

var simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody().strength(-20))
    .force("link", d3.forceLink().id(d=>d.id).distance(40))
    .force("forceX", d3.forceX().strength(.1).x(width2 * .5))
    .force("forceY", d3.forceY().strength(.1).y(height2 * .5))
    .force("center", d3.forceCenter().x(width2*.5).y(height2 *.5));