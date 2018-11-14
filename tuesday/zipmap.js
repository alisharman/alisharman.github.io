// *******************************************************************
// ZIPCODE MAP BY CAMPAIGN (STATEWIDE or CONGRESSIONAL) or ALL CAMPAIGNS
// *******************************************************************



// *********************************************
// FUNCTIONS
// *********************************************

// MAIN FUNCTION TO DRAW MAP
function drawMaps(zips, us, data) {

  document.getElementById("loader").style.display = "none";
  
  var svg = d3.select("#graphs").append('svg')
      .attr("id","cidgraph")
      .attr("width", width)
      .attr("height", height)
      .call(zoom);
      
  const g = svg.append("g");

  var counts = {};
  for (var i = 0; i < data.length; i++) {
    counts[Number(data[i].zip)] = Number(data[i][countvar]);
  }

  var color_scale = d3.scaleQuantile()
    .domain(Object.values(counts).filter(d=>d>0)) //Don't include 0s when defining
    .range(["#00aeef", "#0288c9", "#0664a2", "#05427b", "#002355"]);

  // ALL MAP
  if(cid=="all"){
    stroke_w="0.1px"
    allzips = topojson.feature(zips, zips.objects.zipcodes)
    projection.fitSize([width, height], allzips);
    var path = d3.geoPath(projection);
    g.append("g").selectAll("path")
          .data(allzips.features)
        .enter().append("path")
          .attr("d", path)
          .attr("stroke","white")
          .attr("stroke-width",stroke_w)
          .attr("stroke-opacity",0.2)
          .attr("fill",function(d){
            z_count = counts[Number(d.properties.ZCTA5CE10)];
            if(z_count>0){c = color_scale(z_count)} //color by quantile
            else{c="#d8d8d8"}; //Here, we add 0s and undefined
            return c
          })
          .append("title").text(d=>counts[Number(d.properties.ZCTA5CE10)]);
  }

  // INDIVIDUAL MAPS w/ CROPPING
  else{
     stroke_w="0.1em"
     var states = topojson.feature(us, us.objects[geob]);
     state = states.features.filter(d=>d.properties.GEOID === geoid)[0]; // Filter to relevant area (state or CD) for cropping
     projection.fitSize([width, height], state);
     var path = d3.geoPath(projection);

     g.append("g").append("clipPath")
        .attr("id", "clip-land")
        .append("use")
        .attr("xlink:href", "#land");  

     g.append("g").selectAll("path")
          .data(topojson.feature(zips, zips.objects.zipcodes).features)
        .enter().append("path")
          .attr("d", path)
          .attr("clip-path", "url(#clip-land)")
          .attr("stroke","white")
          .attr("stroke-width",stroke_w)
          .attr("stroke-opacity",0.2)
          .attr("fill",function(d){
            z_count = counts[Number(d.properties.ZCTA5CE10)];
            if(z_count>0){c = color_scale(z_count)} //color by quantile
            else{c="#d8d8d8"}; //Here, we add 0s and undefined
            return c
          })
          .append("title").text(d=>counts[Number(d.properties.ZCTA5CE10)]);

      g.append("g").append("path")
          .datum(state)
          .attr("class", "outline")
          .attr("d", path)
          .attr('id', 'land');
   };

};


// Zooms all map elements
function zoomed(){
  d3.selectAll('g').attr("transform", d3.event.transform);
} 


// GRAPH FILTERING AND DATA SETUP FUNCTIONS

// Filters data to selected campaign
function filterGraph(error,zips,geo_shapes,data1) {
  
  if(cid=="all") {data = data1}
  else {data = data1.filter(d=>Number(d.campaign_id)==Number(cid));};
  if(race=="congress"){geob = "congdistricts"}
    else if(race=="statewide"){geob = "states"}
  drawMaps(zips,geo_shapes,data);
}

// Feeds relevant data to graph drawer
function intializeGraph(geo_data,count_data) {
  document.getElementById("loader").style.display = "inline";
  d3.select("#cidgraph").remove();
  d3.queue()
    .defer(d3.json, "data/zipcodes.topojson")
    .defer(d3.json, geo_data)
    .defer(d3.csv, count_data)
    .await(filterGraph);
}

// Gets CID when the drop down changes
function selectCID() {
    d = dd.node().value.split(',');
    cid=d[0], name=d[1], race=d[2], geoid=d[3]; 
    geo_data = "data/states.json";
    if(cid=="all"){count_data = "data/df_counts-all_zip.csv";}
    else {
      count_data = "data/df_counts-campaign_zip.csv";
      if(race=="congress"){geo_data = "data/congdistricts.json"}
    };
    intializeGraph(geo_data, count_data);
};



//MENUS FUNCTIONS

//Adds dropdown
function menu_campaigns() {
  //dropdown menu
  dd = d3.select("#select").append("select").style("display", "inline")
  dd.selectAll("option")
      .data(campaigns)
      .enter().append("option")
      .attr("value", (d)=>[d.cid,d.name,d.race,d.geoid])
      .text((d)=>d.name);

  //button to select campaign
  d3.select("#select").append("button")
      .attr("onclick", "selectCID()")
      .text("Update map")
};

//Adds campaigns to list for dropdown
function cid_campaigns() {
  d3.json("data/zipmap_cid-dict.json", function(error, cid_dict) {
    cid_dict.forEach(d=>campaigns.push(d));
    menu_campaigns();
  });
};





// *********************************************
// SETUP
// *********************************************

// Identifiers
cid=0, race="", geoid="", geob = "";

// For map
var width = 1200, height = 650;
var projection = d3.geoMercator();

// Add zoom
const zoom = d3.zoom()
  .scaleExtent([1, 40])
  .translateExtent([[0,0], [width, height]])
  .extent([[0, 0], [width, height]])
  .on("zoom", zoomed);

// Population dropdown menu
var campaigns = [{cid:"all",name:"All campaigns"}]
cid_campaigns();

//Export button
d3.select("#saveButton")
  .on('click', function(){
    saveSvgAsPng(document.getElementsByTagName("svg")[0], "d3_zipmap_"+name+".png");
  })

// Variable to use for the counts
var countvar = 'voter_person'; //!Change this if you want a different metric (other option is volunteer_person, or you can change the python code to include more)