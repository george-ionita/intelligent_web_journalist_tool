// ************************************************************************** //
// ************************************************************************** //

/*
 * ajaxScripts.js
 *
 * Authors: Laimonas Andriejauskas and George-Andrei Ionita
 *
 * Description: This javascript file manages all Ajax functionality for the
 * whole application. The first function manages the Ajax request for the
 * queryInterface.html file, while the second function manages the Ajax request
 * for the journalistTool.html file.
 *
 */

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function sends data to the postQuery.html of a given URL and if a
 * successful response is returned it calls other functions to display the data
 * returned.
 *
 * @param {string} url - The path where the data needs to be sent.
 *
 * @param {object} data - An object storing data to be sent to the server.
 *
 */
function sendAjaxQuery(url, data) {

    // Hide the search form
    search_form_row.hide();

    // Display the loading animation while Ajax retrieves data from server
    loading.attr('style', 'display: block;');

    // Make sure output containers are empty
    outputUl.empty();
    outputUl.append('<li class="list-group-item list-group-item-info"><h4 class="text-center">Results</h4></li>');
    word_out.empty();
    word_out.append('<li class="list-group-item list-group-item-info"><h5 class="text-center">Frequent Words</h5></li>');
    auth_out.empty();
    auth_out.append('<li class="list-group-item list-group-item-info"><h5 class="text-center">Active Authors</h5></li>');

    // Post data to Ajax and render returned information on page
    $.ajax({
        type: 'POST',
        url: 'postQuery.html',
        data: data,
		dataType: 'json',
        success: function (data) {

            // Clear form
            $('#myform').trigger('reset');

            // Show the "New Search" button
            new_search_row.attr('style', 'display: block;');

            tweets = data.tweets;

            // Render data if tweets are returned from server
            if (tweets.length > 0) {
		
				// List tweets returned from server
		    	listTweets(data.query, tweets, data.count_db, data.count_tweeter);

		    	// List most common words
                listWords(data.words);

                // List most common authors and their most used words
                listAuthors(data.author_info);

                // Render the information on the page
                results_row.attr('style', 'display: block;');

                // To refresh and show the map with markers
                $(document).ajaxStop(initialize);
                map_row.attr('style', 'display: block;');

            } else {

                no_tweets_row.attr('style', 'display: block;');
            }

            // All information has rendered so hide loading animation
            loading.hide();
        },
        error: function (xhr, status, error) {

            loading.hide();

            $('#error-text').text(error);

            error_row.attr('style', 'display: block;');
        }
    });
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function sends data to the postJournalistTool.html of a given URL and if
 * a successful response is returned it calls other functions to display the
 * data returned.
 *
 * @param {string} url - The path where the data needs to be sent.
 *
 * @param {object} data - An object storing data to be sent to the server.
 *
 */
function sendAjaxMatchQuery(url, data) {

    // Hide the search form
    search_form_row.hide();

    // Display the loading animation while Ajax retrieves data from server
    loading.attr('style', 'display: block;');

    input_data = JSON.parse(data);

    // Render the information entered into the form
    listInputData(input_data);

    // Post data to Ajax and render returned information on page
    $.ajax({
        type: 'POST',
        url: 'postJournalistTool.html',
        data: data,
		dataType: 'json',
        success: function (data) {

            // Clear form
            myform.trigger('reset');

            // Display stadium information
            displayStadiumInfo(data);

            // If weather is available for the input day then display it
            displayWeather(input_data.raw.date, data.weather);

            // Fill in the RDFa information place-holders with the data returned
            displayRDFaData(input_data, data);

            // Display team descriptions and manager information
            displayTeamInformation(data);

            // List players in each team
            listPlayerInfo(data.players_1, input_data.team1, data.players_2, input_data.team2);

            // Global variable setting for players
            team1_players = data.players_1;
            team2_players = data.players_2;

            // Render the results and new search buttons
            results_row.attr('style', 'display: block;');
            new_search_row.attr('style', 'display: block;');

            // All information has rendered so hide loading animation
            loading.hide();
        },
        error: function (xhr, status, error) {

            loading.hide();

            $('#error-text').text(error);

            error_row.attr('style', 'display: block;');

            new_search_row.attr('style', 'display: block;');
        }
    });
}

// ************************************************************************** //
// ************************************************************************** //