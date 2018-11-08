// *********************************************
// NETWORK FUNCTIONS
// *********************************************
function getGraph(nodes,links,p) {
  document.getElementById("loader").style.display = "none";
  campaign = campaign_lookup[cid]

  svg = d3.select("#graphs").append("svg")
    .attr("id","cidgraph")
    .attr("width", width)
    .attr("height", height);

  //title
/*  svg.append("text")
      .attr("x", (width / 2))
      .attr("y", 15)
      .attr("text-anchor", "middle")  
      .style("font-size", "16px") 
      .style("font-weight", "bold")  
      .text(campaign);*/

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

  if(p==.05){s=-10};
  if(p==.15){s=-8};
  if(p==.25){s=-5};
  if(p>=.5){s=-2};
  console.log(p)
  var simulation = d3.forceSimulation()
      .force("charge", d3.forceManyBody().strength(s))
      .force("link", d3.forceLink().id(d=>d.id).distance(10))
      .force("forceX", d3.forceX().strength(.1).x(width * .5))
      .force("forceY", d3.forceY().strength(.1).y(height * .5))
      .force("center", d3.forceCenter().x(width*.5).y(height *.5));

  simulation
      .nodes(nodes)
      .on("tick", tickActions);

  simulation.force("link")
      .links(links);


  function tickActions() {
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
  } 

}
// *********************************************
// NETWORK SETUP
// *********************************************
var width = 1200;
var height = 680;

//Campaigns
campaigns = [{cid:57,name:"AFSCME Minnesota"},{cid:96,name:"Sean Casten for Congress"},{cid:104,name:"Tom Malinowski for Congress"},{cid:108,name:"Mike Levin for Congress"},{cid:119,name:"Susan Wild for Congress"},{cid:131,name:"Katie Hill for Congress"},{cid:138,name:"Abigail Spanberger for Congress"}]
campaign_lookup = {57:"AFSCME Minnesota",96:"Sean Casten for Congress",104:"Tom Malinowski for Congress",108:"Mike Levin for Congress",119:"Susan Wild for Congress",131:"Katie Hill for Congress",138:"Abigail Spanberger for Congress"}
percents = ["5%","15%","25%","50%","75%","100%"]

//dropdown menu
dd = d3.select("#select1").append("select").style("display", "inline")
dd.selectAll("option")
    .data(campaigns)
    .enter().append("option")
    .attr("value", (d)=>d.cid)
    .text((d)=>d.name);

dd2 = d3.select("#select2").append("select").style("display", "inline");
dd2.selectAll("option")
    .data(percents)
    .enter().append("option")
    .attr("value", (d)=>d)
    .text((d)=>d);

//button to select campaign
d3.select("#select2").append("button")
    .attr("onclick", "selectCID()")
    .text("Update graph")

//gets CID when the drop down changes and intializes graph
function selectCID() {
    cid=dd.node().value;
    p=dd2.node().value;
    p=Number(p.replace("%",""));
    p=p/100;
    intializeGraph(cid,p);
}

//loads data and starts network graph
function intializeGraph(cid,p) {
  document.getElementById("loader").style.display = "inline";
  d3.select("#cidgraph").remove()
  d3.json("data/net"+cid+"data.json", function(error, data) {
      nodesMap = d3.map();
      nodes = data.nodes
      nodes = nodes.slice(0, parseInt(p*nodes.length));
      console.log(nodes.length)
      nodes.forEach(n => nodesMap.set(n.id, n));
      links = []
      data.links.forEach(function(l) {
        l.source=nodesMap.get(l.source); 
        l.target=nodesMap.get(l.target)
        if(l.source!=undefined & l.target!=undefined){
          links.push(l)
        }
      })
      console.log(links);
      getGraph(nodes,links,p)
  })
}