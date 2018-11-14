There are three D3 visualizations: 
1. Network of matching/messaged voters-volunteers ["network"] 
2. Map of voter matches count by zipcode ["zipmap"]
3. Map of top zipcodes by number of matches between volunteers and voters in all zipcodes ["zipnet"]


To update the data underlying any of these, section "II. Visualization Setup And Export" of the python code exports the data
	and the dictionary needed to create the dropdown menu. 
	
To update the scripts, the .js scripts in folder "visualizations" contain the code.


Notes:
1. Network
For the network graphs: If you add CID groups (eg, "All Texas), you must choose the name that you want for the group in the python code (where it says "!ADD GROUPS HERE").
For network_all graphs, you can specify the top share% of volunteers (by number of messaged) of the network you want to include (due to size contraints, this is necessary).
Color is defined in the Python file. You can update the color attributes of the nodes to be by a different metric (where it says "!CHANGE COLOR ATTRIBUTES HERE").
	Right now it is by non-messaged voter, messaged-voter, volunteer.
If the graph looks weird for some reason, adjust the "simulation" variable to spread/shrink, etc.

2. Zipmap
Counts are by voter_person. This can be changed in the javascript by modifying the variable "countvar" to be something else (eg, volunteer_person).
Colors are defined in the Javascript. Change the range of the variable "color_scale" to increase/decrease or change colors.

3. Zipnet
Change the number of zipcode nodes to include by changing the variable "keep_top_number" in the javascript.
Again, the variable "color_scale" controls the colors. Change the range to increase/decrease or change colors.


OUTPUTS:
I have stored the outputs in the data_science/graphs/d3 folder.

	
