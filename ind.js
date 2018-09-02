function toggle(source,nm) {
  if(nm=='all') {
  	checkboxes = document.getElementsByClassName('myCheckbox');
  	checkboxes2 = document.getElementsByName('subtog');
	for(var i=0, n=checkboxes2.length;i<n;i++) {
	  checkboxes2[i].checked = source.checked;
	}  	
  }
  else {checkboxes = document.getElementsByName(nm);}
  for(var i=0, n=checkboxes.length;i<n;i++) {
    checkboxes[i].checked = source.checked;
  }
  selectIndustries()
}

function selectIndustries(){
	var cutoff = document.getElementById("cutoffbox").value;
	var choices = [];
	d3.selectAll(".myCheckbox").each(function(d){
	  cb = d3.select(this);
	  if(cb.property("checked")){
	    choices.push('polemp_'+cb.property("value"));
	  }
	});
	dataMaps(choices, cutoff)
}

function updateData(ind) {
	var zoom = d3.zoom()
	    .scaleExtent([1 << 11, 1 << 20])
	    .on("zoom", zoomed);
	svg
	  //.call(zoom)
	  .call(zoom.transform, d3.zoomIdentity
	      .translate(width/2, (height/2))
	      .scale(5 << 11)
	      .translate(-center[0], -center[1]));

	function zoomed() {
	  var transform = d3.event.transform;
	  projection
	      .scale(transform.k / tau)
	      .translate([transform.x, transform.y]);
	   d3.selectAll("circle").remove()
	   d3.selectAll("line.link").remove()
	   d3.selectAll("path").remove()
	   d3.selectAll("marker").remove()
	   setupMap();
	   selectIndustries();
	}
}

// Run update function when dropdown selection changes
function setupMap() {
	d3.json("data/states.geojson", (error, stgeo) => {
		if (error) throw error;

		//add polygons	
		polys = map.selectAll("path")
			.attr("class", "states")
			.data(stgeo.features)
			.enter()
			.append("path")
			.style("fill", "white")
			.style("stroke", "#5c5c5c")
			.style("stroke-width", 1.2)
			.style("fill-opacity",0)
			.attr("d", path);
	});
}

//!!!!! THIS IS WHERE YOU UPDATE THE DATA SOURCES
function dataMaps(choices,cutoff) {
	d3.queue()
	  .defer(d3.csv, "data/ind_town_points.csv")
	  .defer(d3.csv, "data/industrial_88_latlongs.csv")
	  .await(drawMaps);

	function drawMaps(error, data, ind88) {
		if (error) throw error;

		//prepare data
	    var summed = d3.nest()
	        .key(d=>d.statetownid)
	        .rollup( function(v) { 
	        	return {
			        "x" : v[0]["x"],
			        "y" : v[0]["y"],
			        "total": d3.sum(v, function(d) { 
			        	var s = 0;
			        	for (var c in choices) {s = s + (+d[choices[c]]);};
			        	return s
			    	})
		    	};
		    })
	        .entries(data);
	    
		points = summed.filter(d=>d.value["total"]>cutoff & d.value.x!='NA');

	
		// add triangles to svg
		map.selectAll("image")
		.data(ind88).enter().append("svg:image")
			.attr("x", d=> projection([d.x,d.y])[0])
			.attr("y", d=> projection([d.x,d.y])[1])
			.attr('width', 16)
			.attr('height', 16)
			.attr('fill',"red")
			.attr("xlink:href", "static/star.svg");

		// add circles to svg
		d3.selectAll("circle").remove()
	    map.selectAll("circle")
		.data(points).enter().append("circle")
			.attr("id",d=>"n"+d.statetownid)
			.attr("cx", function (d) {return projection([d.value.x,d.value.y])[0]; })
			.attr("cy", function (d) { return projection([d.value.x,d.value.y])[1]; })
			.attr("r", "3px")
			.style("stroke", "#400000")
			.style("fill", "red");
	};
}


var pi = Math.PI,
    tau = 2 * pi;

var width = Math.max(1200, window.innerWidth),
    height = Math.max(1000, window.innerHeight);

// Initialize the projection to fit the world in a 1×1 square centered at the origin.
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

var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

var raster = svg.append("g");
var map = svg.append("g");
var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

var center = projection([78, 21]);

d3.selectAll(".myCheckbox").on("change",selectIndustries);
selectIndustries();
setupMap();
updateData("pollution_emp_all",1000);
