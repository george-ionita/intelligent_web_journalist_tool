// ************************************************************************** //
// ************************************************************************** //

/*
 * init.js
 *
 * File to store all functionality for initialisation
 *
 * Authors: George Ionita & Laimonas Andriejauskas
 *
 */

// ************************************************************************** //
// ************************************************************************** //

// Create new Twitter client instance

var Twit = require('twit');
var client = new Twit({
	consumer_key: 'y4oiRAOgXeMnJbF7ug9jWee5w',
	consumer_secret: 'TSIN2Z0pIZ1np34rhvSConrh0NInTyWtHBo9cEN1JsNTNm3K7O',
	access_token: '703226048008343552-SolDMtOh0TCwJTsMJa0eW5rIom4cXKR',
	access_token_secret: '4qrCoMr6CgJxJVwz8FR9kjeoiha8ltkNSyl3dTIyPCOyn'
});

exports.client = client;

// ************************************************************************** //
// ************************************************************************** //

// Read the stop list file to get an array of non-content words

// stop_list.txt from COM3110 - Text Processing (Mark Hepple)

var stop_list = [];

var lineReader = require('line-reader');

// For each line in the file, add the word to the array
lineReader.eachLine('stop_list.txt', function(line, last) {

	stop_list.push(line);

	if (last) { console.log("stop_list.txt loaded successfully") }
});

exports.stop_list = stop_list;

// ************************************************************************** //
// ************************************************************************** //