// ************************************************************************** //
// ************************************************************************** //

/*
 * twitter_handler.js
 *
 * File to manage Twitter functionality.
 *
 * Authors: George Ionita & Laimonas Andriejauskas
 *
 */

// ************************************************************************** //
// ************************************************************************** //

// Import needed functions

// Function to check if object is empty
var isEmpty = require('./functions').isEmpty;

// MySQL
var mysql = require('mysql');

// Import complex functions
var funcs = require('./functions');

// SQL string escape function
var escape_str = funcs.escape_string;

// Error return function
var returnError = require('./functions').returnError;

var count_words = funcs.count_words;
var authors_and_tweets = funcs.authors_and_tweets;
var insert_query = funcs.insert_query;

var geocoderProvider = 'google';
var httpAdapter = 'https';

var extra = { apiKey: 'AIzaSyBJwA8zKhwJwIi08tNTWo7j8fnGdUuV8dk' };
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

// ************************************************************************** //
// ************************************************************************** //

// Initialise variables

var query_info = [];
var tweets = '';
var tweets_by_author_array = [];
var tweets_text = "";
var retweeted_user = ""
var retweeted_screen_name = ""
var tweets_tweeter_counter = 0;
var tweets_db_counter = 0;

var output_data = {
	tweets:[],
	author_info:[],
	words:[],
	count_tweeter:[],
	count_db:[],
	query:[]
};

// ************************************************************************** //
// ************************************************************************** //

/**
* This function takes a twit result and builds the JSON twit from it.
*
* @param {object} result - this parameter represents a twit result.
*
*/
function build_tweet_data(result) {

	for (var i in result) {

		var build_tweet = {};
		tweets_db_counter++;
		build_tweet.tweet_date_created = result[i].tweet_date_created;
		build_tweet.user_url = result[i].user_url;
		build_tweet.user_name = result[i].user_name;
		build_tweet.user_screen_name = result[i].user_screen_name;
		build_tweet.retweeted_user = result[i].retweeted_user_url;
		build_tweet.retweeted_screen_name = result[i].retweeted_screen_name;
		build_tweet.tweet_text = result[i].tweet_text;
		build_tweet.original_link = result[i].original_link;
		build_tweet.latitude = result[i].latitude;
		build_tweet.longitude = result[i].longitude;
		
		tweets_text += result[i].tweet_text + " ";
		tweets_by_author_array.push([result[i].user_screen_name, result[i].tweet_text]);
		
		output_data.tweets.push(build_tweet);
	}
}

// ************************************************************************** //
// ************************************************************************** //

/**
* This function prepares the MySQL query and calls the function to retrieve information from database.
*
* @param {string} query - represents the original use query
*
* @param {object} res - represents the server response object
*
*/
function db_only_callback(query,res) {
	
	var retrieve_tweets_query = "SELECT * FROM tweets t JOIN queries q ON q.input_text = '" + query + "' AND q.id = t.query_id";

	res.writeHead(200, { "Content-Type": "text/plain" });

	db_callback(query,retrieve_tweets_query,res);
}

// ************************************************************************** //
// ************************************************************************** //

/**
*
* This function establishes a connection to the database, queries the database and retrieves the appropriate tweets.
*
* @param {string} query - represents the original user query for Twitter
*
* @param {string} retrieve_tweets_query - represents the MySQL SELECT query.
*
* @param {object} res - represents the response passed in
*
*/
function db_callback(query, retrieve_tweets_query, res) {

	var connection = mysql.createConnection({
		host	 : 'stusql.dcs.shef.ac.uk',
		port	 : '3306',
		user	 : 'team051',
		password : 'e60a08bf',
		database : 'team051' }
	);
	
	connection.connect();

	connection.query(retrieve_tweets_query, function(err, result) {

		if (err != null) {

			returnError(res, "the database: Retrieving tweets.");

		} else {

			if (!isEmpty(result)) { build_tweet_data(result); }

			most_common_words = count_words(tweets_text);
			output_data.words = most_common_words;
			display_authors = authors_and_tweets(tweets_by_author_array);

			output_data.author_info = display_authors;
			output_data.query = query;
			output_data.count_tweeter = tweets_tweeter_counter;
			output_data.count_db = tweets_db_counter;

			connection.end();

			output_JSON = JSON.stringify(output_data);
			res.end(output_JSON);

			// Re-initialise variables
			tweets_tweeter_counter = 0;
			tweets_db_counter = 0;
			tweets = '';
			tweets_by_author_array = {};
			tweets_text = "";
			retweeted_user = "";
			retweeted_screen_name = "";

			output_data = {
				tweets:[],
				author_info:[],
				words:[],
				count_tweeter:[],
				count_db:[],
				query:[]
			};
		}
	});
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function is called once Twitter has responded. The data is processed and
 * the results are sent back to the given response object. 
 *
 * @param {object} data - The data returned from Twitter.
 *
 * @param {object} res - An object containing the server response.
 *
 * @param {string} query - The query string entered by the user.
 *			
 */
function main_callback(data, res, query) {

	// The current date and time
	query_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

	var retrieve_tweets_query = "SELECT * FROM tweets t JOIN queries q ON q.input_text = '" + query + "' AND q.id = t.query_id AND t.id not in (0,";
	
	// If no tweets are returned, return them from db
	if (data.statuses.length == 0) {
		res.writeHead(200, { "Content-Type": "text/plain" });
		retrieve_tweets_query = retrieve_tweets_query.slice(0, -1);
		retrieve_tweets_query += ");"
		//console.log("Retrieve query:" + retrieve_tweets_query)
		
		db_callback(query,retrieve_tweets_query,res)
		
	// Otherwise there are new tweets
	} else {

		geolocation_callback(0);

		// Recursive function that calls itself until there are no more tweets to read
		function geolocation_callback(indx) {

			//If it is not the last element of the array
			if (indx < data.statuses.length) {

				// Count tweets so we can display their number on the page
				tweets_tweeter_counter++;
				var tweet = data.statuses[indx];

				// Concatenate all tweets so we can find the most common words
				tweets_text += tweet.text + " ";
				
				// Put authors and their tweets in an array
				screen_name = '@' + tweet.user.screen_name;
				tweets_by_author_array.push([screen_name, tweet.text]);
				
				// Parse the Twitter date
				tweet_date = new Date(tweet.created_at).toISOString().slice(0, 19).replace('T', ' ');
				
				// If Retweet
				if (tweet.retweeted_status) {
					retweeted_user = (tweet.retweeted_status.user.url);
					retweeted_screen_name = escape_str(tweet.retweeted_status.user.screen_name);
				}
				
				// Generate link for the original tweet 
				original_link = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
				
				//Call the geolocation function
				geocoder.geocode(tweet.user.location, function(err, georesponse) {

					// If location is not available
					if (georesponse === undefined || isEmpty(georesponse)) {
						latitude = "";
						longitude = "";
					} else {
						latitude = georesponse[0].latitude;
						longitude = georesponse[0].longitude;
					}
					
					// Build the tweet 
					var build_tweet = {};

					build_tweet.tweet_date_created = tweet_date;
					build_tweet.user_url = tweet.user.url;
					build_tweet.user_name = tweet.user.name;
					build_tweet.user_screen_name = tweet.user.screen_name;
					build_tweet.retweeted_user = retweeted_user;
					build_tweet.retweeted_screen_name = retweeted_screen_name;
					build_tweet.tweet_text = escape_str(tweet.text);
					build_tweet.original_link = original_link;
					build_tweet.latitude = latitude;
					build_tweet.longitude = longitude;
					
					retrieve_tweets_query += tweet.id_str + ",";
					
					output_data.tweets.push(build_tweet);
		
					// Add tweet to query string
					query_string =  "" + tweet.id_str +
									" , ? " + ",'" +  tweet_date +
									"','"  + tweet.user.url +
									"','"  + escape_str(tweet.user.name) +
									"','"  + escape_str(tweet.user.screen_name) +
									"','" +  (retweeted_user) +
									"','" +  (retweeted_screen_name) + 
									"','" + escape_str(tweet.text) +
									"','"+ original_link +
									"','" + latitude +
									"','" + longitude +
									"'" + ");";
									
					query_info.push(query_string);

					// Tweets from Twitter API have finished iterating, now retrieve rest of the tweets from DB (if any left)
					if (query_info.length == data.statuses.length) {

						retrieve_tweets_query = retrieve_tweets_query.slice(0, -1);
						retrieve_tweets_query += ");"

						// =====================================================
						// Commented out for deployment
						// =====================================================
						
						//var connection = mysql.createConnection({
						//	host	 : 'stusql.dcs.shef.ac.uk',
						//	port	 : '3306',
						//	user	 : 'team051',
						//	password : 'e60a08bf',
						//	database : 'team051' }
						//);
						
						// connection.connect();

						// connection.query(retrieve_tweets_query, function(err, result) {

						//	if (err != null) {

						//		returnError(res, "the database: Retrieving tweets.");

						//	} else {

								// If any tweets in the DB other than retrieved ones, build them 
						//		if (!isEmpty(result)) { build_tweet_data(result); }

						// =====================================================
						// =====================================================

								most_common_words = count_words(tweets_text);
								output_data.words = most_common_words;

								// Escape and insert the new query and its associated tweets if query does not already exist
								// insert_query(escape_str(query),query_info); // Commented out for deployment

								// Once inserted into DB ensure query is empty
								query_info = [];

								// Get all the info in the output data array
								display_authors = authors_and_tweets(tweets_by_author_array);
								output_data.author_info = display_authors;
								output_data.query = query;
								output_data.count_tweeter = tweets_tweeter_counter;
								output_data.count_db = tweets_db_counter;

								// connection.end(); // Commented out for deployment

								output_JSON = JSON.stringify(output_data);

								res.writeHead(200, { "Content-Type": "application/JSON" });
								res.end(output_JSON);

								// Re-initialise variables
								tweets_tweeter_counter = 0;
								tweets_db_counter = 0;
								tweets = '';
								tweets_by_author_array = [];
								tweets_text = "";
								retweeted_user = "";
								retweeted_screen_name = "";

								output_data = {
									tweets:[],
									author_info:[],
									words:[],
									count_tweeter:[],
									count_db:[],
									query:[]
								};
							// } // Commented out for deployment
						// }); // Commented out for deployment
					}

					// Call itself with increased index 
					geolocation_callback(indx + 1);
				});
			}
		}
	}
}

exports.main_callback = main_callback;
exports.db_only_callback = db_only_callback;

// ************************************************************************** //
// ************************************************************************** //