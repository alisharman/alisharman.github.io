// *********************************************
// MAP FUNCTIONS
// *********************************************
function drawMaps(error, zips, cids, data) {
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

function clicked(d) {
  var x, y, k;
  cid = d.properties.cid
  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    if(cid==57){k=2}
    else{k = 14};
    centered = d;
  } else {
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
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5/k + "px");
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