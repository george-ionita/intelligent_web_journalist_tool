// ************************************************************************** //
// ************************************************************************** //

/*
 * server.js
 *
 * Main file containing all server functionality
 *
 * Authors: George Ionita & Laimonas Andriejauskas
 *
 */

// ************************************************************************** //
// ************************************************************************** //

// Assign required functions from their associated modules

// Twitter client
var client = require('./init').client;

// Twitter callback handler function
var main_callback = require('./twitter_handler').main_callback;

// DB only callback
var db_only_callback = require('./twitter_handler').db_only_callback;

// Query builder from functions module
var build_query = require('./functions').build_query;

// Is empty function from functions module
var isEmpty = require('./functions').isEmpty;

// Main sparql query
var query_sparql = require('./functions_journalist').query_sparql;

// Manager query
var query_manager = require('./functions_journalist').query_manager;

// Stadium query
var query_stadium = require('./functions_journalist').query_stadium;

// Players query
var query_players = require('./functions_journalist').query_players;

// Error return function
var returnError = require('./functions').returnError;

// ************************************************************************** //
// ************************************************************************** //

// Functionality and variables for a server

var protocol = require('http');
var static = require('node-static');
var util = require('util');
var url = require('url');
var mysql = require('mysql');
var file = new static.Server('./public');

// ************************************************************************** //
// ************************************************************************** //

// Create server instance
var app = protocol.createServer(function (req, res) {
	var pathname = url.parse(req.url).pathname;

	if ((req.method == 'POST') && (pathname == '/postQuery.html')) {
		var body = '';
		req.on('data', function (data) {
			body += data;
			// Kill request if data received is too large
			if (body.length > 1e6) {
				res.writeHead(413, { 'Content-Type': 'text/plain'}).end();
				req.connection.destroy();
			};
		});
		
		// Once all data is received
		req.on('end', function () {

			body = JSON.parse(body);

			// Build query string from input data
			var query = build_query(body);
			
			// If blank form do not process
			if (query == "") {
				res.writeHead(200, { "Content-Type": "text/plain" });
				res.end();
			} else {

				if (body.db) {
					// QUERY DB ONLY
					db_only_callback(query,res);
				} else {
					// AS NORMAL					
					// retrieve_max_id(query,res); // Disabled for deploy

					// =========================================================
					// These lines added for deploy to skip DB
					var new_query = {};
					new_query = {
						q:query,
						count:100,
						lang:'en'
					}
					call_twitter(new_query, query, res);
					// =========================================================
				}
			};
		});

	// If POST to the JournalistTool then
	} else if ((req.method == 'POST') && (pathname == '/postJournalistTool.html')) {

		var body = '';
		req.on('data', function (data) {
			body += data;
			// Kill request if data received is too large
			if (body.length > 1e6) {
				res.writeHead(413, { 'Content-Type': 'text/plain'}).end();
				req.connection.destroy();
			};
		});

		// Once all data is received
		req.on('end', function () {
			body = JSON.parse(body);
			team1 = body.team1 
			team2 = body.team2 
			date = body.date
		
			query_sparql(team1,team2,date,res);	
	});
		
	// If not a POST request to postQuery.html
	} else {

		// Try and serve the file requested
		file.serve(req, res, function (err, result) {

			// If there is an error then serve an error page
			if (err != null) {
				console.error('Error serving %s - %s', req.url, err.message);
				if (err.status === 404 || err.status === 500) {
					file.serveFile(util.format('%d.html', err.status), err.status, {}, req, res);
				} else {
					res.writeHead(err.status, err.headers);
					res.end();
				};
			// If the file exists then serve it
			} else {
				res.writeHead(200, { "Content-Type": "text/plain", 'Access-Control-Allow-Origin': '*' });
			};
		});
	};
}).listen(process.env.PORT || 8080); // Changed for deploy

// ************************************************************************** //
// ************************************************************************** //

/**
* This function deals with retrieving tweets from the DB and the Twitter API.
* It will only retrieve  the latest tweets from Twitter (based on twitter id) and fetch the rest from DB.
* If it is a new query and no tweets are present in the DB, it will retrieve them from twitter API.
* If there are no new tweets, it will just fetch them from the DB.
*
* @param {string} input_text - the user query
*
* @param {object} res - the server response object 
*
*/
function retrieve_max_id(input_text, res){

	var connection = mysql.createConnection({
		host	 : 'stusql.dcs.shef.ac.uk',
		port	 : '3306',
		user	 : 'team051',
		password : 'e60a08bf',
		database : 'team051'
	});

	var twitter_id = "";

	connection.connect();
	
	// Retrieve the max twitter id for that query
	query_info = "SELECT (t.tweet_id) as id FROM tweets t JOIN queries q ON q.id = t.query_id AND q.input_text = '" + input_text + "' ORDER BY id desc LIMIT 1";

	connection.query(query_info, function(err, result) {

		if (err != null) {

			returnError(res, "the database!");

		} else {

			var new_query = {};

			// If query already exists in DB (there is a max id) , only retrieve new tweets from twitter and fetch rest from DB
			if (!isEmpty(result)) {

				twitter_id = result[0].id;	
				new_query = {
					q:input_text,
					lang:'en',
					since_id:twitter_id
				}		
				call_twitter(new_query,input_text,res)
			} else {
				new_query = {
					q:input_text,
					count:100,
					lang:'en'
				}
				call_twitter(new_query, input_text, res);
			}

		}

	});

	connection.end();
}

// ************************************************************************** //
// ************************************************************************** //

/**
* This function calls the main twitter callback function with the appropriate parameters.
*
* @param {string} twitter_query - twitter query containing the twitter params like "input text", "count", "since id" etc.
*
* @param {string} user_query - the user input from the main page
*
* @param {object} res - server response object
*
*/ 
function call_twitter(twitter_query, user_query, res) {

	// Query Twitter search API
	client.get('search/tweets',  twitter_query , function (err, data, response) {

		if (err != null) {

			returnError(res, "Twitter: " + err.message);

		} else {

			// Handle the data received from Twitter
			main_callback(data, res, user_query);
		}
	});	
}

console.log('Server running on 127.0.0.1:3001');


// ************************************************************************** //
// ************************************************************************** //