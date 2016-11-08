// ************************************************************************** //
// ************************************************************************** //

/*
 * functions_journalist.js
 *
 * This file stores the application's more complex functionality regarding the journalist functionality
 *
 * Authors: George Ionita & Laimonas Andriejauskas
 *
 */

// ************************************************************************** //
// ************************************************************************** //

var weather_api = '1dd916f0519c4483ad9163358162105';
var request = require('request');

// Error return function
var returnError = require('./functions').returnError;

// ************************************************************************** //
// ************************************************************************** //

/**
* Function containing the SPARQL query to retrieve team information about a given team.
*
* @param {string} team - Input team name to retrieve information about
*
* @return {string} query - Variable containing the SPARQL query.
*
*/ 
function query_team(team) {

	var query = [
		"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
		"SELECT str(?c) ",
		"WHERE {",
		" <http://dbpedia.org/resource/" + team + "> rdfs:comment ?c.",
		"FILTER (langMatches(lang(?c),'en'))",
		"}"
	].join(" ");

	return query;
}

exports.query_team = query_team;

// ************************************************************************** //
// ************************************************************************** //

/**
* Function containing the SPARQL query to retrieve information about players that are part of a given team.
*
* @param {string} team - Team name to retrieve player information about.
*
* @return {string} query - Variable containing the SPARQL query.
*
*/ 
function query_players(team) {

	var query = [
		"PREFIX p: <http://dbpedia.org/property/>  ",
		"PREFIX dbpedia-owl:<http://dbpedia.org/ontology/>    ",
		"PREFIX dc: <http://purl.org/dc/elements/1.1/>",
		"PREFIX dbpedia2: <http://dbpedia.org/property/>  ",
		"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>  ",
		"SELECT  ?player ?name (group_concat(distinct ?full; separator = ','  ) as ?fullname)  (group_concat(distinct ?pos_txt; separator = ',') as ?position) ?thumbnail ?birthDate ?height ?number ?comment   ",
		"WHERE {  ",
		"?player p:currentclub  <http://dbpedia.org/resource/" + team+ ">.  ",  
		"?player rdfs:label ?name.  ",
		"?player p:fullname ?full .   ", 
		"?player dbpedia-owl:position ?pos .   ",
		"?pos rdfs:label ?pos_txt .  ",
		"?player dbpedia-owl:thumbnail ?thumbnail .   ",
		"?player dbpedia2:birthDate ?birthDate .    ",			
		" ?player dbpedia-owl:height ?height .   ",
		"?player dbpedia-owl:number ?number .   ",
		"?player rdfs:comment ?comment.   ",
		"FILTER (langMatches(lang(?comment),'en')).   ",
		"FILTER (langMatches(lang(?name),'en')). FILTER (langMatches(lang(?pos_txt),'en')). }  ",
		"GROUP BY ?player ?name ?thumbnail ?birthDate ?height ?number ?comment     ",
		"ORDER BY ?position  ",
	].join(" ");

	return query;
}

exports.query_players = query_players;

// ************************************************************************** //
// ************************************************************************** //

/**
* Function containing the SPARQL query to retrieve information about a manager of a team.
*
* @param {string} team - Team name to retrieve the associated manager information
*
* @return {string} query - Variable containing the SPARQL query.
*
*/ 
function query_manager(team) {

	var query = [
		"prefix dbpedia-owl:<http://dbpedia.org/ontology/>",
		"PREFIX dbpedia2: <http://dbpedia.org/property/>",
		"SELECT ?name ?label ?thumbnail",
		"WHERE {",
		"	 <http://dbpedia.org/resource/" + team + "> dbpedia-owl:manager ?c.",
		"?c dbpedia2:name ?name.",
		"?c foaf:depiction ?thumbnail.",
		"?c rdfs:label ?label.",
		"FILTER (langMatches(lang(?label),'en')). ",
		"}",
		"LIMIT 1"
	].join(" ");

	return query;
}

exports.query_manager = query_manager;

// ************************************************************************** //
// ************************************************************************** //

/**
* Function containing the SPARQL query to retrieve information about a team's stadium.
*
* @param {string} team - The team name to retrieve ground information about.
*
* @return {string} query - Variable containing the SPARQL query.
*
*/ 
function query_stadium(team) {

	var query = [
		"PREFIX p: <http://dbpedia.org/property/> ",
		"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
		"PREFIX dbpedia2: <http://dbpedia.org/property/>",
		"SELECT ?label str(?com) ?thumbnail ?opened ?lat ?long",
		"WHERE { ",
		"<http://dbpedia.org/resource/" + team + "> p:ground ?c. ",
		"?c rdfs:label ?label.",
		"?c rdfs:comment ?com." ,
		"?c foaf:depiction ?thumbnail.",
		"?c dbpedia2:opened ?opened.",
		"?c <http://www.w3.org/2003/01/geo/wgs84_pos#lat>  ?lat.",
		"?c <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?long.",
		"FILTER (langMatches(lang(?com),'en')). ",
		"FILTER (langMatches(lang(?label),'en')) ",
		"}"
	].join(" ");

	return query;
}

exports.query_stadium = query_stadium;

// ************************************************************************** //
// ************************************************************************** //

/**
* This function assembles all queries and calls SPARQL to retrieve information about team info, players, etc. using mentioned queries.
*
* @param {string} team1 - name of first team
*
* @param {string} team2 - name of second team
*
* @param {string} date - date of the match
*
* @param {object} res - server response object
*
*/ 
function query_sparql(team1,team2,date,res) {

	// Initialise Sparql variables
	var output_data = {};
	var SparqlClient = require('sparql-client');
	var util = require('util');
	var endpoint = 'http://dbpedia.org/sparql';
	var client = new SparqlClient(endpoint);

	// Assemble all queries
	var query_team_1 = query_team(team1)
	var query_team_2 = query_team(team2)

	var query_players_1 = query_players(team1)
	var query_players_2 = query_players(team2)
	
	var query_manager_1 = query_manager(team1)
	var query_manager_2 = query_manager(team2)
	
	var query_stadium_1 = query_stadium(team1)

	// Call SPARQL with each query

	// First team's description
	client.query(query_team_1).execute(function(error, results) {

		if ((error != null) || (results.results.bindings.length < 1)) {
			returnError(res, " dbpedia: Retrieving information about team 1.");
		} else {

			output_data.description_1 = results.results.bindings[0]['callret-0'].value;

			// Second team's description
			client.query(query_team_2).execute(function(error, results) {

				if ((error != null) || (results.results.bindings.length < 1)) {
					returnError(res, " dbpedia: Retrieving information about team 2.");
				} else {

					output_data.description_2 = results.results.bindings[0]['callret-0'].value;

					// Players from the first team
					client.query(query_players_1).execute(function(error, results) {

						if ((error != null) || (results.results.bindings.length < 1)) {
							returnError(res, " dbpedia: Retrieving information about players from team 1.");
						} else {

							output_data.players_1 = results.results.bindings;

							// Players from the second team
							client.query(query_players_2).execute(function(error, results) {

								if ((error != null) || (results.results.bindings.length < 1)) {
									returnError(res, " dbpedia: Retrieving information about players from team 2.");
								} else {

									output_data.players_2 = results.results.bindings;

									// First team's manager	
									client.query(query_manager_1).execute(function(error, results) {

										if ((error != null) || (results.results.bindings.length < 1)) {
											returnError(res, " dbpedia: Retrieving information about team 1's manager.");
										} else {

											output_data.manager_1 = results.results.bindings[0];

											// Second team's manager 
											client.query(query_manager_2).execute(function(error, results) {

												if ((error != null) || (results.results.bindings.length < 1)) {
													returnError(res, " dbpedia: Retrieving information about team 2's manager.");
												} else {

													output_data.manager_2 = results.results.bindings[0];

													// Home stadium
													client.query(query_stadium_1).execute(function(error, results) {

														if ((error != null) || (results.results.bindings.length < 1)) {
															returnError(res, " dbpedia: Retrieving information about the home team's stadium.");
														} else {

															output_data.home_stadium = results.results.bindings[0];

															// Get the weather data for location of home ground
															lat = output_data.home_stadium.lat.value;
															long = output_data.home_stadium.long.value;

															// Slice the last character of lat/long so it only has 3 decimals
															lat = lat.slice(0, -1);
															long = long.slice(0, -1);

															// get_weather_info(lat, long, output_data, res); // Removed for deployment

															output_JSON = JSON.stringify(output_data); // These two lines added to shortcut out the weather call
															res.end(output_JSON);
														}
													});
												}
											});
										}
									});
								}
							});
						}
					});
				}
			});
		}
	
	});
}

exports.query_sparql = query_sparql;

// ************************************************************************** //
// ************************************************************************** //

/**
* This function retrieves the weather information based on the latitude and longitude of the stadium location for the match.
*
* @param {string} lat - parameter representing the latitude of the stadium's location
*
* @param {string} long - parameter representing the longitude of the stadium's location
*
* @param {object} output_data - the object containing all output information to be returned to the client
*
* @param {object} res - server response object
*
*/
function get_weather_info(lat,long,output_data,res){
	
	// Url to send the stadium's coordinates to
	var request_url = 'https://api.worldweatheronline.com/premium/v1/weather.ashx?q=' + lat + ',' + long + '&num_of_days=10&key=' + weather_api + '&tp=24&format=json';

	request(request_url, function(error, response, body) {

		if (!error && response.statusCode == 200) {

			// Parse the json result
			var result = JSON.parse(body);
			output_data.weather = result.data.weather;

		} else {
			returnError(res, " weather retrieval!");
		}

		// Convert to a JSON string to be sent to client
		output_JSON = JSON.stringify(output_data);

		// Send all data back to client once all callbacks are finished
		res.end(output_JSON);
	});
}

// ************************************************************************** //
// ************************************************************************** //