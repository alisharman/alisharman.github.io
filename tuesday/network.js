// *********************************************
// DRAWS VOLUNTEER-VOTER MATCH CONNECTIONS
//  COLORS BASED ON DARK BLUE-- VOLUNTEER; LIGHT BLUE-- NON-MESSAGED VOTER; RED-- MESSAGED VOTER
// *********************************************



// *********************************************
// FUNCTIONS
// *********************************************

// Draw graph
function getGraph(nodes,links,p) {
  document.getElementById("loader").style.display = "none";

  svg = d3.select("#graphs").append("svg")
    .attr("id","cidgraph")
    .attr("width", width)
    .attr("height", height);

  var link = svg.append("g")
                .selectAll("line")
                .data(links)
                .enter().append("line")
                .attr("class", "links");

  var node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", d=>d.nodesize)
            .style("fill", d=>d.color)

  // Define simulation
  size = nodes.length // Use a different, faster simulation if network size is large
  
  if(size>=8000) {
  	  console.log("Loading large version");
	  var simulation = d3.forceSimulation()
	      .force("charge", d3.forceManyBody().strength(-10))
	      .force("link", d3.forceLink().id(d=>d.id).distance(30))
	      .force("forceX", d3.forceX().strength(.99).x(width * .5))
	      .force("forceY", d3.forceY().strength(.99).y(height * .5));
      simulation.force("link")
      	.links(links);
  }
  else {
  	  if(p==.05){s=-10}; // Don't want nodes too spread out for smaller lengths, this adjusts
	  if(p==.15){s=-8};
	  if(p>=.25){s=-6};
	  var simulation = d3.forceSimulation()
	      .force("charge", d3.forceManyBody().strength(s))
	      .force("link", d3.forceLink().id(d=>d.id).distance(30))
	      .force("forceX", d3.forceX().strength(.2).x(width * .5))
	      .force("forceY", d3.forceY().strength(.2).y(height * .5))
	      .force("center", d3.forceCenter().x(width*.5).y(height *.5));

	  simulation.force("link")
	      .links(links);
	};
 
  // Adds data to the simulations
  simulation
      .nodes(nodes)
      .on("tick", tickActions);


  // Set a timer on simulations so that they stop
  const simulationDurationInMs = 60000; // 1 minute
  startTime = Date.now();
  endTime = startTime + simulationDurationInMs;
  function tickActions() {
  	 if (Date.now() < endTime) {
      
      var radius = 1;  
      //constrains the nodes to be within a box
      node
          .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
          .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
          
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

    } else {
        simulation.stop();
    }
  } 
}


//MENUS

//Campaigns
function menu_campaigns() {
  //dropdown menu
  dd = d3.select("#select1").append("select").style("display", "inline")
  dd.selectAll("option")
      .data(campaigns)
      .enter().append("option")
      .attr("value", (d)=>d.cid+"|"+d.name)
      .text((d)=>d.name);
};

// Populations dropdown menu
function cid_campaigns() {
  d3.json("data/netdata_cid-dict.json", function(error, cid_dict) {
    for (var key in cid_dict){
      x = {cid:key,name:cid_dict[key]};
      campaigns.push(x)
    }
    menu_campaigns();
  });
};

//gets CID when the drop down changes and intializes graph
function selectCID() {
  splt = dd.node().value.split("|");
  cid= splt[0];
  name=splt[1];
  p1=dd2.node().value;
  p=Number(p1.replace("%",""));
  p=p/100;
  intializeGraph(cid,p);
}

//loads data and starts network graph
function intializeGraph(cid,p) {
  document.getElementById("loader").style.display = "inline";
  d3.select("#cidgraph").remove()
  d3.json("data/netdata_"+cid+".json", function(error, data) {
      nodesMap = d3.map();
      nodes = data.nodes
      nodes = nodes.slice(0, parseInt(p*nodes.length));
      nodes.forEach(n => nodesMap.set(n.id, n));
      links = []
      data.links.forEach(function(l) {
        l.source=nodesMap.get(l.source); 
        l.target=nodesMap.get(l.target)
        if(l.source!=undefined & l.target!=undefined){
          links.push(l)
        }
      })
      console.log(nodes.length);
      getGraph(nodes,links,p)
  })
};

// *********************************************
// FUNCTIONS
// *********************************************

// Setups dropdown menu
// dropdown # 1 (campaigns)
var campaigns = []
d3.json("data/netdata_all-dict.json", function(error, cid_dict) {
	for (var key in cid_dict){
		x = {cid:key,name:cid_dict[key]};
		campaigns.push(x)
	}
	cid_campaigns();
});

 // dropdown #2 (percents)
percents = ["5%","15%","25%","50%","75%","100%"]
dd2 = d3.select("#select2").append("select").style("display", "inline");
dd2.selectAll("option")
    .data(percents)
    .enter().append("option")
    .attr("value", (d)=>d)
    .text((d)=>d);

// button to update graph
d3.select("#select2").append("button")
    .attr("onclick", "selectCID()")
    .text("Update graph")

//Export button
d3.select("#saveButton")
  .on('click', function(){
      // from http://exupero.org/saveSvgAsPng/src/saveSvgAsPng.js
      saveSvgAsPng(document.getElementsByTagName("svg")[0], "d3_network_"+name+"-"+p1+".png");
  })

// Globals
var width = 1200, height = 680, cid = 0, name="", p1 = 0;