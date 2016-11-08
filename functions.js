// ************************************************************************** //
// ************************************************************************** //

/*
 * functions.js
 *
 * This file stores the application's more complex functionality
 *
 * Authors: George Ionita & Laimonas Andriejauskas
 *
 */

// ************************************************************************** //
// ************************************************************************** //

// Import querystring module
var querystring = require('querystring');

// Import MySQL module for DB
var mysql = require('mysql');

// Import stop list from initialiser module
var stop_list = require('./init').stop_list;

// ************************************************************************** //
// ************************************************************************** //

/**
* This function takes in a server response object and sends the error message given.
*
* @param {object} res - The server response object.
* 
* @param {string} - The error message to be sent to the client.
*
*/
function returnError(res, error_data) {

	res.writeHead(400, error_data, {'content-type' : 'text/plain'});
	res.end();
}

exports.returnError = returnError;

// ************************************************************************** //
// ************************************************************************** //

/**
* This function checks if an object is empty (or null).
*
* @param {object} obj - Object to be tested
* 
* @return {boolean} - Returns true if the given object is empty
*
*/
function isEmpty(obj) {

	if (obj == null) return true;
	if (obj.length && obj.length > 0)    return false;
	if (obj.length === 0)  return true;

	return true;
}

exports.isEmpty = isEmpty;

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in the parsed data from the search form and creates an
 * appropriate query string for the Twitter API to accept.
 *
 * @param {object} body - An object of { 'field' : 'data' } elements.
 *
 * @return {string} The query ready to be sent to the Twitter API.
 *			
 */
function build_query(body) {

	var connector;

	// Assign the appropriate query connector
	if (body.connector) {
		connector = " AND "
	} else {
		connector = " OR "
	}
	q = "";

	// Add 'from:' if author is specified
	if (body.author.length != 0) {
		q += "from:" + body.author;
	}

	// Append connector and the data if there is already data present
	if (q.length == 0 && body.players.length != 0) {
		q += body.players
	} else if (q.length != 0 && body.players.length != 0) {
		q += connector + body.players;
	}

	// Append connector and the data if there is already data present
	if (q.length == 0 && body.hashtags.length != 0) {
		q += body.hashtags
	} else if (q.length != 0 && body.hashtags.length != 0) {
		q += connector + body.hashtags;
	}

	// Append connector and the data if there is already data present
	if (q.length == 0 && body.keywords.length != 0) {
		q += body.keywords
	} else if (q.length != 0 && body.keywords.length != 0) {
		q += connector + body.keywords;
	}

	return q;
}

exports.build_query = build_query;

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in a tweet and replaces special characters (if any) with
 * MySQL safe characters.
 *
 * @param {string} str - A tweet to be escaped.
 *
 * @return {string} The escaped string.
 *			
 */
function escape_string(str) {
	return str.replace(/[\0\x08\x09\x1a\r"'\\\%]/g, function (char) {
		switch (char) {
			case "\0":
				return "\\0";
			case "\x08":
				return "\\b";
			case "\x09":
				return "\\t";
			case "\x1a":
				return "\\z";
			case "\r":
				return "\\r";
			case "\"":
			case "'":
			case "\\":
			case "%":
				return "\\" + char;	// Prepends a backslash to backslash,
									// percent and double/single quotes
		}
	});
}

exports.escape_string = escape_string;

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in an array of tweets and performs the following: removes
 * punctuation, splits into individual words, removes non-content words, counts
 * occurrences of each word, sorts words by occurrences (DESC) and then returns
 * an object of the 10 most popular words along with their counts.
 *
 * @param {array} tweets- An array of tweets.
 *
 * @return {object} An object of { 'word' : 'count' } elements sorted by count.
 *			
 */
function count_words(tweets) {

	var old_tweets = tweets;
	var words_array = {};

	if (typeof tweets != 'undefined') {

		tweets = tweets.replace(/\bhttp\S+/g, ""); // Remove URLS
		tweets = tweets.replace(/[^\w\s]|_/g, " "); // Remove punctuation
		tweets = tweets.replace(/\s+/g, " "); // Remove > 1 spaces

		var words = tweets.split(/\b/); // Split words at spaces

		for (var i = 0; i < words.length; i++) {

			// Boolean to check if the word is in the stop list array
			var in_stop_list = stop_list.indexOf(words[i].toLowerCase()) > -1;

			// If it is not a space or in the stop list then count the word
			if (words[i] != " " && !in_stop_list) {

				// Increment counter for each word e.g. words_array['goal'] += 1
				if (typeof(words_array[words[i].toLowerCase()]) == 'undefined') {
					words_array[words[i].toLowerCase()] = 1;
				} else {
					// Use toLowerCase to count both upper and lower case
					words_array[words[i].toLowerCase()] += 1;
				}
			}
		}
	}

	var sortable = [];
	for (var word in words_array) {
		sortable.push([word, words_array[word]]);
	}

	sortable.sort(function(a, b) { return b[1] - a[1] });

	return sortable.slice(0, 20);
}

exports.count_words = count_words;

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function iterates through the data provided, counting each author's
 * tweets, then gets the most common words out of all the author's tweets and
 * then finally the data in HTML ready to be rendered.
 *
 * @param {array} array - An object of { 'author' : 'tweet' } elements.
 *
 * @return {array} output_data - An array of objects containing the most active authors and their most frequent words.
 *			
 */
function authors_and_tweets(array) {

	var authors_array = new Array();
	var authors_array_tweets = new Array();
	
	var output_data = [];

	for (var i=0; i < array.length; i++) {

		var author = array[i][0];
		var tweet = array[i][1];
		
		// Count the number of tweets an author has made
		if (authors_array[author] === undefined) {
			authors_array[author] = 1;
		} else {
			authors_array[author] += 1;
		};
		
		// Concatenate the tweet with author's previous tweets
		if (authors_array_tweets[author] === undefined) {
			authors_array_tweets[author] = tweet;
		} else {
			authors_array_tweets[author] += " " + tweet;
		};
	};

	// Sort authors by number of tweets
	var sortable = [];
	for (var author in authors_array) {
		sortable.push([author, authors_array[author]]);
	};

	sortable.sort(function(a, b) { return b[1] - a[1] });
	authors_array = sortable.slice(0, 10);

	var most_freq = "";

	for (author in authors_array) {
		
		var build_author = {};
		
		var author_name = authors_array[author][0]
		var author_tweets = authors_array[author][1]

		var tweets_concat = authors_array_tweets[author_name];

		most_freq = count_words(tweets_concat);
		
		if (author_name.charAt(0) == '@'){
			build_author['name'] = author_name.substring(1);
		} else {
			build_author['name'] = author_name	
		}
		build_author['number_tweets'] = author_tweets
		build_author['freq_words'] =  most_freq
		
		output_data.push(build_author);
	}

	return output_data;
}

exports.authors_and_tweets = authors_and_tweets;

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function connects to the database and sends it a given query.
 *
 * @param {string} input_text - The query information to be sent to the database.
 *
 * @param {string} tweets_query - The tweets returned from twitter.
 *			
 */
function insert_query(input_text, tweets_query) {

	var connection = mysql.createConnection({
		host	 : 'stusql.dcs.shef.ac.uk',
		port	 : '3306',
		user	 : 'team051',
		password : 'e60a08bf',
		database : 'team051' }
	);

	connection.connect();

	// ********************************************************************** //
	
	query_info = "SELECT * FROM queries WHERE `input_text` LIKE (" + "'"  + input_text + "'" + ");";

	connection.query(query_info, function(err, result) {

		if (err != null) {

			returnError(res, "the database: Retrieving similar queries.");

		} else {

	// ********************************************************************** //

			// If query doesn't already exist in DB insert it
			if (!result.length) {

				insert = "INSERT INTO queries (`input_text`) VALUES (" + "'"  + input_text + "'" + ");";
				connection.query(insert, function(err) {

					if (err != null) { returnError(res, "the database: Inserting the query."); }

				});

	// ********************************************************************** //

				// Insert the tweets associated with the query
				
				// Get the query id first
				select = "SELECT id from queries WHERE `input_text` LIKE (" + "'"  + input_text + "'" + ");";
				var query_id;

				connection.query(select,function(err, result) {

					if (err != null) {

						returnError(res, "the database: Retrieving the query ID.");

					} else {

	// ********************************************************************** //

						query_id = result[0].id;

						// Insert tweets one by one
						for(var i in tweets_query) {

							// Add the "INSERT INTO" part here
							updated_query = "INSERT INTO tweets(tweet_id,query_id,tweet_date_created,user_url,user_name,user_screen_name,retweet_user_url,retweet_user_screen_name,tweet_text,original_link,latitude,longitude)" +
												" VALUES ("  + tweets_query[i];

							connection.query(updated_query,[query_id]);
						}
					}
					connection.end();
				});

	// ********************************************************************** //

			// Otherwise only insert missing records
			} else {
				
				// Get the query id first
				select = "SELECT id from queries WHERE `input_text` LIKE (" + "'"  + input_text + "'" + ");";
				var query_id;

				connection.query(select,function(err, result) {

					if (err != null) {

						returnError(res, "the database: Retrieving the query ID.");

					} else {

	// ********************************************************************** //

						query_id = result[0].id;

						// Insert tweets one by one
						for(var i in tweets_query) {

							// Add the "INSERT IGNORE INTO" part here
							updated_query = "INSERT IGNORE INTO tweets(tweet_id,query_id,tweet_date_created,user_url,user_name,user_screen_name,retweet_user_url,retweet_user_screen_name,tweet_text,original_link,latitude,longitude)" +
												" VALUES ("  + tweets_query[i];

							connection.query(updated_query,[query_id]);
						}
					}
					connection.end();
				});
			}
		}
	});
}

exports.insert_query = insert_query;

// ************************************************************************** //
// ************************************************************************** //