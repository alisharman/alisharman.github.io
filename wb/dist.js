
function updateData(linksdata) {
	//ZOOM FUNCTION
	function zoomed() {
		var transform = d3.event.transform;

		var tiles = tile
		    .scale(transform.k)
		    .translate([transform.x, transform.y])
		    ();

		projection
		    .scale(transform.k / tau)
		    .translate([transform.x, transform.y]);
		
		//MAPBOX
		var image = raster
		    .attr("transform", stringify(tiles.scale, tiles.translate))
		    .selectAll("image")
		    .data(tiles, function(d) { return d; });

		image.exit().remove();

		image.enter().append("image")
		    .attr("xlink:href", function(d) {return "http://" + "abc"[d[1] % 3] + ".tiles.mapbox.com/v3/mapbox.blue-marble-topo-jan/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
		    .attr("x", function(d) { return d[0] * 256; })
		    .attr("y", function(d) { return d[1] * 256; })
		    .attr("width", 256)
		    .attr("height", 256);

		var image = raster
		    .attr("transform", stringify(tiles.scale, tiles.translate))
		  .selectAll("image")
		  .data(tiles, function(d) { return d; });

		image.exit().remove();

		image.enter().append("image")
		    .attr("xlink:href", function(d) {return "http://" + "abc"[d[1] % 3] + ".tiles.mapbox.com/v3/mapbox.blue-marble-topo-jan/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
		    .attr("x", function(d) { return d[0] * 256; })
		    .attr("y", function(d) { return d[1] * 256; })
		    .attr("width", 256)
		    .attr("height", 256);


		 d3.selectAll("circle").remove()
		 d3.selectAll("line.link").remove()
		 d3.selectAll("path").remove()
		 d3.selectAll("marker").remove()

		dataMaps(linksdata, nodesdata);
	}

	//STRINGING FUNCTION
	function stringify(scale, translate) {
		var k = scale / 256, r = scale % 1 ? Number : Math.round;
		return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
	} 

	// UPDATE MAP DATA SOURCE BASED ON WHICH BUTTON IS CLICKED  !!!!! THIS IS WHERE YOU DEFINE THE DATA SOURCES !!!!!
	d3.selectAll(".selbutton").style("background-color", "#ddd");
	if (linksdata=="links_current.csv") {d3.select("#option1").style("background-color", "#d95430");}
	else if (linksdata=="links_aug23.csv") {d3.select("#option4").style("background-color", "#d95430");}
	else if (linksdata=="links_aug23_100.csv") {d3.select("#option5").style("background-color", "#d95430");} 
	else if (linksdata=="links_aug16.csv") {d3.select("#option2").style("background-color", "#d95430");}
	else if (linksdata=="links_aug16_100.csv") {d3.select("#option3").style("background-color", "#d95430");}
	else if (linksdata=="links_june28_mean.csv") {d3.select("#option0mn").style("background-color", "#d95430");}
	else if (linksdata=="links_june28_median.csv") {d3.select("#option0md").style("background-color", "#d95430");}


	if (linksdata=="links_current.csv") {nodesdata = "nodes_current.csv"}
	else {nodesdata = "nodes_fertdist.csv"}
	dataMaps(linksdata, nodesdata);

	var zoom = d3.zoom()
	  .scaleExtent([1 << 11, 1 << 20])
	  .on("zoom", zoomed);

	svg
	.call(zoom)
	.call(zoom.transform, d3.zoomIdentity
	    .translate(width / 2, height / 2)
	    .scale(3 << 12)
	    .translate(-center[0], -center[1]));
}

function dataMaps(linkdata, nodedata) {
	d3.queue()
		.defer(d3.csv, "data/"+nodedata)
		.defer(d3.csv, "data/"+linkdata)
		.defer(d3.json, "data/fertdist.json")
		.await(drawMaps);

	function drawMaps(error, nodes, linksm, topology) {
	  if (error) throw error;
	  	var geojson = topojson.feature(topology, topology.objects.fertdist);
	  	console.log("geojson",geojson)

	  	//FUNCTION TO DRAW LINKS
		function addLinks(links) {
		    function marker(color) {
				defs.append("svg:marker")
					.attr("id", color.replace("#", ""))
					.attr("viewBox", "0 -5 10 10")
					.attr("refX", 10) // This sets how far back it sits
					.attr("refY", 0)
					.attr("markerWidth", 12)
					.attr("markerHeight", 12)
					.attr("orient", "auto")
					.attr("markerUnits", "userSpaceOnUse")
					.append("svg:path")
					.attr("d", "M0,-5L10,0L0,5")
					.style("fill", d3.hsl(color).brighter(0.75))
					.style("stroke", d3.hsl(color).darker(1.5));
		          
		        return "url(" + color + ")";
			};

		    links = map.selectAll( "line.link" )
		        .data(links)
		        .enter().append( "path" )//append path
					.attr("class", "link")
					.style("fill", "none")
					.style("opacity", "1")
					.style("stroke-width", "2.5")
					.each(function(d) {
						var color = colorScale(d.id_to);
					  	d3.select(this).style("stroke", d3.hsl(color).brighter(0.75))
					    	.attr("marker-end", marker(color));
		          });
		    links
		        .attr("d", d=>"M" + 
		        	projection([d.x_to,d.y_to])[0] + "," + 
		        	projection([d.x_to,d.y_to])[1] + ", " + 
		        	projection([d.x_from,d.y_from])[0] + "," + 
		        	projection([d.x_from,d.y_from])[1]);   
		}

	  // DRAW NODES (CENTROIDS)
	    map.selectAll("circle")
	  	.data(nodes).enter().append("circle")
		    .attr("id",d=>"n"+d.id)
		    .attr("cx", function (d) {return projection([d.x,d.y])[0]; })
		    .attr("cy", function (d) { return projection([d.x,d.y])[1]; })
		    .attr("r", "3px")
		    .style("stroke", d=>d3.hsl(colorScale(d.id)).darker(2))
		    .style("fill", d=>colorScale(d.id));

	  // DRAW POLYGON SHAPES
	  	polys = map.selectAll("path")
		    .attr("class", "districts")
		    .data(geojson.features)
		    .enter()
		    .append("path")
		    .style("fill", d=>colorScale(d.properties.DISTCODE))
		    .style("stroke", d=>d3.hsl(colorScale(d.properties.DISTCODE)).darker(2))
		    .style("stroke-width", 1.4)
		    .style("fill-opacity",0.2)
		    .attr("d", path)
		    .attr("id",d=>"id"+d.properties.DISTCODE)
	        .on("mouseover", function(d) {
	          d3.select(this).style("stroke-width", 3.2);
	        div.transition()    
	            .duration(200)    
	            .style("opacity", .8);
	        div.html("<b>" + d.properties.FIRST_NA_1 + "</b><br>"+ d.properties.FIRST_NAME)
	            .style("left", (d3.event.pageX) + "px")   
	            .style("top", (d3.event.pageY - 28) + "px")
	            .style("background", d3.hsl(colorScale(d.properties.DISTCODE)).brighter(1));  
	        })          
		    .on("mouseout", function(d) {
		      d3.select(this).style("stroke-width", 1.4);
		        div.transition()    
		            .duration(500)
		            .style("opacity", 0);
		    });
	  
		polys.on("click", function(d) {
			nodelinks = linksm.filter(n=>n.id_from==d.properties.DISTCODE);
			if (d3.select('#n'+d.properties.DISTCODE).attr("r")==7) {
			 	d3.select('#n'+d.properties.DISTCODE).attr("r",3);
			    for (n of nodelinks) {
			    	d3.select('#id'+n.id_to).style("fill-opacity", 0.2);
			    }     
			} else {
			  	d3.select('#n'+d.properties.DISTCODE).attr("r",7);
			    	for (n of nodelinks) {d3.select('#id'+n.id_to).style("fill-opacity", 1);}
			}
		});

		//DRAW LINKS
	  	var defs = map.append("svg:defs");
	  	addLinks(linksm)
	};
}


// MAP PROJECTION INITIALIZATION
var pi = Math.PI, 
	tau = 2 * pi;
var width = Math.max(1200, window.innerWidth),
    height = Math.max(1000, window.innerHeight);

var projection = d3.geoMercator()
    .scale(1 / tau)
    .translate([0, 0]);

var path = d3.geoPath()
    .projection(projection);

var tile = d3.tile()
    .size([width, height]);

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

// MAP ORIGIN
var center = projection([78, 19]);

// COLORS
var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// ADD HTML PLACEHOLDERS
var raster = svg.append("g");
var map = svg.append("g");
var div = d3.select("body").append("div") 
    .attr("class", "tooltip")       
    .style("opacity", 0);

// STARTING VIEW (CURRENT)
updateData("links_current.csv");
