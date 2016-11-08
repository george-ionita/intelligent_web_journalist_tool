// ************************************************************************** //
// ************************************************************************** //

/*
 * queryInterfaceScripts.js
 *
 * Authors: Laimonas Andriejauskas and George-Andrei Ionita
 *
 * Description: This javascript file manages all functionality for the
 * queryInterface.
 *
 * Contents:
 * - Form validation functions
 * - Data preparation functionality (for sending to the server)
 * - Functions for rendering information on the page
 *
 */

// ************************************************************************** //
// ************************************************************************** //

// Initialise all global variables

var loading;
var error_row;

var search_form_row;
var new_search_row;
var no_tweets_row;

var results_row;
var map_row;
var outputUl;
var word_out;
var auth_out;

// ************************************************************************** //
// ************************************************************************** //

// Once document is ready, assign variables and wait for a form submission

$(document).ready(function() {

    loading = $('#loading-row');
    error_row = $('#error-row');
    outputUl = $('#dataOutput');
    word_out = $('#wordsOutput');
    auth_out = $('#authOutput');
    search_form_row = $('#search-form-row');
    map_row = $('#map-row');
    no_tweets_row = $('#no-tweets-row');
    new_search_row = $('#new-search-row');
    results_row = $('#results-row');

    var sendQueryButton = $('#sendQueryButton');
    sendQueryButton.click(sendQueryData);
});

// ************************************************************************** //
// ************************************************************************** //

/**
 * Function to convert the search data from the queryInterface, into a JSON
 * structure and send it to the server to be processed.
 *
 */
function sendQueryData() {

    var data = {};

    data.author = $('#Author').val();
    data.players = $('#Players').val();
    data.hashtags = $('#Hashtags').val();
    data.keywords = $('#Keywords').val();
    data.db = $('#Database').is(':checked');
    data.connector = $('#Connector2').is(':checked');

    // Remove any validation errors if present
    removeQueryValidations();

    // Get data validation information
    validated = validateQueryData(data);

    if (validated.valid) {

        // All data is valid so send to server in JSON format
        sendAjaxQuery('http://localhost:3001', JSON.stringify(validated.data));

    } else {

        // Display validation errors
        displayQueryValidations(validated.err);
    }
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function removes all validation messages present in the queryInterface
 * search form.
 *
 */
function removeQueryValidations() {
    
    $('#myform').removeClass('has-error');
    $('span#form-help').remove();

    $('#author-group').removeClass('has-error');
    $('span#author-help').remove();

    $('#players-group').removeClass('has-error');
    $('span#players-help').remove();

    $('#hashtags-group').removeClass('has-error');
    $('span#hashtags-help').remove();

    $('#keywords-group').removeClass('has-error');
    $('span#keywords-help').remove();
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function pre-processes the data (from the queryInterface), ready to be
 * sent to the server to ensure all information is correctly entered and valid.
 * The object returned contains a boolean to say if the data is valid, an object
 * of information containing any associated errors and an object storing the
 * validated data.
 *
 * @param {object} data - The object containing all data from the form.
 *
 * @return {object} - An object of three properties: valid (boolean), errors
 *                    (object) and data (object).
 *
 */
function validateQueryData(data) {

    var v = true;
    var no_data = true;
    var errors = {};

    // Check if there is any data entered
    for (indx in data) {
        if ((indx != "db") && (indx != "connector") && data[indx].trim() != "") { no_data = false };
    };

    // Add form error if no data sent
    if (no_data) {
        errors.form = "Form cannot be blank!";
        v = false;
    };

    // ********************************************************************** //

    // Validate author (only one word + no @)
    author = data.author.trim()

    if (author.split(' ').length > 1) {
        errors.author = "You can only search for 1 author at a time!";
        v = false;
    }

    if (author[0] == "@") {
        data.author = author.substring(1);
    }

    // ********************************************************************** //

    // Players must be at least 3 characters
    players_string = data.players.trim();
    
    if (players_string != "") {
        players = players_string.split(' ');
        new_players = "";

        for (indx in players) {
            player = players[indx].trim();
            if (player.length < 3) {
                errors.players = "Player names must be at least 3 characters long!";
                v = false;
            }
        }
    }

    // ********************************************************************** //

    // Hashtags must begin with a hashtag
    hashtag_string = data.hashtags.trim();
    
    if (hashtag_string != "") {
        hashtags = hashtag_string.split(' ');
        new_hashes = "";

        for (indx in hashtags) {
            word = hashtags[indx].trim();
            if (word.length < 2) {
                errors.hashtags = "Hashtags must be at least 2 characters long!";
                v = false;
            }
            if (word[0] != "#") {
                new_hashes += '#' + word + ' ';
            } else {
                new_hashes += word + ' ';
            }
        }
        data.hashtags = new_hashes;
    }

    // ********************************************************************** //

    // Keywords must be at least 2 characters
    keywords_string = data.keywords.trim();
    
    if (keywords_string != "") {
        keywords = keywords_string.split(' ');
        new_players = "";

        for (indx in keywords) {
            word = keywords[indx].trim();
            if (word.length < 2) {
                errors.keywords = "Keywords must be at least 2 characters long!";
                v = false;
            }
        }
    }

    // ********************************************************************** //

    return { valid:v, err:errors, data:data }
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in an error object and renders the appropriate error
 * messages on the queryInterface form.
 *
 * @param {object} errors - The object containing error data.
 *
 */
function displayQueryValidations(errors) {

    if (errors.form != null) {
        myform.addClass('has-error');

        myform.append('<span id="form-help" class="help-block text-center">' + errors.form + '</span>');

    } else {

        if (errors.author != null) {
            $('#author-group').addClass('has-error');
            $('#author-group').append('<span id="author-help" class="help-block">' + errors.author + '</span>');
        }

        if (errors.hashtags != null) {
            $('#hashtags-group').addClass('has-error');
            $('#hashtags-group').append('<span id="hashtags-help" class="help-block">' + errors.hashtags + '</span>');
        }

        if (errors.players != null) {
            $('#players-group').addClass('has-error');
            $('#players-group').append('<span id="players-help" class="help-block">' + errors.players + '</span>');
        }

        if (errors.keywords != null) {
            $('#keywords-group').addClass('has-error');
            $('#keywords-group').append('<span id="keywords-help" class="help-block">' + errors.keywords + '</span>');
        }
    }
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function displays the query information along with how many tweets were
 * returned from the database and how many were returned from Twitter. The
 * function then leads onto listing each tweet from the array provided.
 *
 * @param {string} query - The query string entered into the search form.
 *
 * @param {array} tweets - The array of tweets to be listed.
 *
 * @param {integer} db_count - The integer value of tweets retrieved from the database.
 *
 * @param {integer} t_count - The integer value of tweets retrieved from Twitter.
 *
 */
function listTweets(query, tweets, db_count, t_count) {

    // Html code for displaying query information
    var html_1 = '<li class="list-group-item disabled text-center"><strong>Input:</strong> ';
    var db_html = '<br/><strong>From Database: </strong>'
    var t_html = ' Tweets<br/><strong>From Twitter: </strong>'
    var html_2 = ' Tweets</li>';

    // Add the query information to result list
    outputUl.append(html_1 + query + db_html + db_count + t_html + t_count + html_2);

    var t = "";

    var t_date = "";
    var screen_name = "";
    var user_url = "";
    var user_handle = "";
    var retweet_handle = "";
    var retweet_url = "";
    var t_tweet = "";
    var t_link = "";

    html_1 = '<li class="list-group-item">';

    // Html code for displaying a tweet
    var screen_html = '<p><strong>Screen Name: </strong>';
    var handle_html = '</p><p><strong>Handle: </strong><a href="';
    var retweet_html = '</a></p><p><strong>Retweet: </strong><a href="';
    var date_html = '</a></p><p><strong>Date: </strong>';
    var tweet_html = '</p><p><strong>Tweet: </strong>';
    var link_html = '</p><p><strong>Link: </strong><a href="';

    html_2 = '">Link to Tweet</a></p></li>';

    // Iterate through the tweets appending them to the output list
    for (indx in tweets) {

        t = tweets[indx]
    
        t_date = t.tweet_date_created;
        screen_name = t.user_name.replace(/\\/g, '');
        user_handle = t.user_screen_name.replace(/\\/g, '');
        user_url = t.user_url;
        retweet_handle = t.retweeted_screen_name;
        retweet_url = t.retweeted_user;
        t_tweet = t.tweet_text.replace(/\\/g, '');
        t_link = t.original_link;

        // If retweeted then include original author
        if ((typeof(retweet_handle) == 'undefined') || (retweet_handle == "")) {

            outputUl.append(html_1 + screen_html + screen_name + handle_html +
                            user_url + '">@' + user_handle + date_html + t_date +
                            tweet_html + t_tweet + link_html + t_link + html_2);
        } else {
            outputUl.append(html_1 + screen_html + screen_name + handle_html +
                        user_url + '">@' + user_handle + retweet_html + retweet_url + '">@' +
                        retweet_handle.replace(/\\/g, '') + date_html + t_date + tweet_html +
                        t_tweet + link_html + t_link + html_2);
        }
    }
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function lists the most frequently used words from the tweets retrieved
 * (based on the query).
 *
 * @param {array} words - The array of most frequently used words.
 *
 */
function listWords(words) {

    for (indx in words) {

        word = words[indx][0];
        count = words[indx][1];

        word_out.append('<li class="list-group-item text-center"><strong>' +
                word + ': </strong>' + count + '</li>');

    }
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function displays the most active authors along with a listing of their
 * most frequently used words.
 *
 * @param {array} authors - The array of author objects to be listed.
 *
 */
function listAuthors(authors) {

    var author = "";
    var num_tweets = "";
    var words = {};

    // Iterate through each other in the array
    for (indx in authors) {

        // Assign the author to a variable
        author = authors[indx];

        name = author.name;
        num_tweets = author.number_tweets;
        words = author.freq_words;

        auth_out.append('<li class="list-group-item text-center"><strong>' +
                name + ': </strong>' + num_tweets + ' tweet(s)</li>');

        // If the author has a list of frequent words then display the words
        if (words.length > 0) {

            var words_counts = "";

            for (word_no in words) {
                word = words[word_no][0];
                count = words[word_no][1];

                words_counts += word + ' (' + count + '). ';
            }

            // Append the most frequent words
            auth_out.append('<li class="list-group-item  text-center disabled"><strong>Most Frequent Words: </strong><br/>' +
                    words_counts + '</li>');
        }
    }
}

// ************************************************************************** //
// ************************************************************************** //