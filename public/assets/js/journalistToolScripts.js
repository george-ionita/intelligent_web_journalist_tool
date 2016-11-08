// ************************************************************************** //
// ************************************************************************** //

/*
 * journalistToolScripts.js
 *
 * Authors: Laimonas Andriejauskas and George-Andrei Ionita
 *
 * Description: This javascript file manages all functionality for the
 * journalistTool.
 *
 * Contents:
 * - Form validation functions
 * - Data preparation functionality (for sending to the server)
 * - Functions for rendering match information on the page
 * - Functions for rendering player information on the page
 *
 */

// ************************************************************************** //
// ************************************************************************** //

// Initialise all global variables

var loading;
var error_row;

var myform;

var search_form_row;
var new_search_row;
var back_to_match_row;

var results_row;
var weather_row;
var player_row;

var team1_players = {};
var team2_players = {};
var input_data = {};

// ************************************************************************** //
// ************************************************************************** //

// Once document is ready, assign variables and wait for buttons to be clicked

$(document).ready(function() {

    loading = $('#loading-row');
    error_row = $('#error-row');
    myform = $('#myForm');
    search_form_row = $('#search-form-row');
    new_search_row = $('#new-search-row');
    back_to_match_row = $('#back-to-match-row');
    results_row = $('#results-row');
    weather_row = $('#weather-information');
    player_row = $('#player-info-row');

    // Send data to server
    var sendMatchButton = $('#sendMatchButton');
	sendMatchButton.click(sendToolData);

	// Hide general match information and show detailed player information
	$(document).on('click', '.get-player-info', showPlayer);

	// Hide player information and show information on all players
	var showMatchButton = $('#show-match-button');
	showMatchButton.click(function() {

		player_row.hide();
		back_to_match_row.hide();
		new_search_row.show();
		results_row.show();
	});
});

// ************************************************************************** //
// ************************************************************************** //

/**
 * Function to convert the search data from the journalistTool, into a JSON
 * structure and send it to the server to be processed.
 *
 */
function sendToolData() {

    var data = {};
    data.raw = {};

    data.raw.date = $('#Date').val();
    data.raw.team1 = $('#Team1').val();
    data.raw.team2 = $('#Team2').val();

    // Remove any validation errors if present
    removeToolValidations();

    // Get data validation information
    validated = validateToolData(data);

    if (validated.valid) {

        // All data is valid so send to server in JSON format
        sendAjaxMatchQuery('http://localhost:3001', JSON.stringify(validated.data));

    } else {

        // Display validation errors
        displayToolValidations(validated.err);
    }
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function removes all validation messages present in the journalistTool
 * search form.
 *
 */
function removeToolValidations() {

    myform.removeClass('has-error');
    $('span#form-help').remove();

    $('#date-group').removeClass('has-error');
    $('span#date-help').remove();

    $('#team1-group').removeClass('has-error');
    $('span#team1-help').remove();

    $('#team2-group').removeClass('has-error');
    $('span#team2-help').remove();
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function pre-processes the data (from the journalistTool), ready to be
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
function validateToolData(data) {

    var v = true;
    var no_data = true;
    var errors = {};

    // Check if there is any data entered
    for (indx in data.raw) {
        if (data.raw[indx].trim() != "") { no_data = false };
    };

    // Add form error if no data sent
    if (no_data) {
        errors.form = "Form cannot contain blank fields!";
        v = false;
    };

    // ********************************************************************** //

    // Validate date
    date = data.raw.date.trim()

    if (date == "") {
        errors.date = "Date field cannot be blank!";
        v = false;
    }

    var m = moment(date, 'DD-MM-YYYY', true);

    if (! (m.isValid())) {
        errors.date = "Date entered is not valid!";
        v = false;
    }

    // ********************************************************************** //

    // Team names must be at least 3 characters

    team1 = data.raw.team1.trim();

    if (team1 == "") {
        errors.team1 = "Team 1 field cannot be blank!";
        v = false;
    } else if (team1.length < 3) {
        errors.team1 = "Team 1 name must be at least 3 characters long!";
        v = false;
    } else {
        data.team1 = team1.replace(/ /g,"_");
    }

    team2 = data.raw.team2.trim();

    if (team2 == "") {
        errors.team2 = "Team 2 field cannot be blank!";
        v = false;
    } else if (team2.length < 3) {
        errors.team2 = "Team 2 name must be at least 3 characters long!";
        v = false;
    } else {
        data.team2 = team2.replace(/ /g,"_");
    }

    // ********************************************************************** //

    return { valid:v, err:errors, data:data }
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in an error object and renders the appropriate error
 * messages on the journalistTool form.
 *
 * @param {object} errors - The object containing error data.
 *
 */
function displayToolValidations(errors) {

    if (errors.form != null) {
        myform.addClass('has-error');

        myform.append('<span id="form-help" class="help-block text-center">' + errors.form + '</span>');

    } else {

        if (errors.date != null) {
            $('#date-group').addClass('has-error');
            $('#date-group').append('<span id="date-help" class="help-block">' + errors.date + '</span>');
        }

        if (errors.team1 != null) {
            $('#team1-group').addClass('has-error');
            $('#team1-group').append('<span id="team1-help" class="help-block">' + errors.team1 + '</span>');
        }

        if (errors.team2 != null) {
            $('#team2-group').addClass('has-error');
            $('#team2-group').append('<span id="team2-help" class="help-block">' + errors.team2 + '</span>');
        }
    }
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in an object of the input data entered into the
 * journalistTool form and renders it on the page.
 *
 * @param {object} data - The input data object containing the date and teams entered.
 *
 */
function listInputData(data) {

	// Input data
    $('#date-input').text(data.raw.date);
    $('#team1-input').text(data.raw.team1);
    $('#team2-input').text(data.raw.team2);

    // Team names
    $('#team1-name').text(data.team1.replace(/_/g, ' '));
    $('#team2-name').text(data.team2.replace(/_/g, ' '));
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in the data returned from the server and displays the
 * stadium information (if present), along with it's RDFa information.
 *
 * @param {object} data - The data object returned from the server.
 *
 */
function displayStadiumInfo(data) {

	// If undefined then display place-holders
    if (data.home_stadium === undefined) {

        $('#stadium-name').text("N/A");
        $('#stadium-description').text("Could not find the home team's ground.");
        $('#stadium-opening').text("N/A");

    } else {

    	var g = data.home_stadium;

    	// Stadium information
        $('#stadium-img').attr("src", g.thumbnail.value);
        $('#stadium-name').text(g.label.value);
        $('#stadium-description').text(g['callret-1'].value);
        $('#stadium-opening').text(g.opened.value);

        // Add URI to stadium information
        $('#team1-stadium-uri').attr('about', 'http://dbpedia.org/resource/' + input_data.team1);
        stadium_uri = g.label.value.trim().replace(/ /g,"_");
        $('#stadium-uri').attr('about', 'http://dbpedia.org/resource/' + stadium_uri);
    }
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in the date string entered into the journalistTool form
 * and the weather data retrieved for the home team's ground to check if the
 * date is within the next 10 days. If so, the weather for that day is rendered.
 *
 * @param {string} date - The date entered into the form by the user.
 *
 * @param {object} weather - The object storing all weather data for the ground's location.
 *
 */
function displayWeather(date, weather) {

	// Assume the weather is not present
	var weather_display = false;

	// If weather is present then render weather
	for (day in weather) {
		if (moment(weather[day].date).isSame(moment(date, "DD-MM-YYYY", true))) {

			$('#weather-date-input').text(date);
			$('#weather-temperature').text(weather[day].hourly[0].tempC);
			$('#weather-feels-like').text(weather[day].hourly[0].FeelsLikeC);
			$('#weather-sunshine-chance').text(weather[day].hourly[0].chanceofsunshine);
			$('#weather-rain-chance').text(weather[day].hourly[0].chanceofrain);

			weather_display = true;
		}
	}

	// If weather is present then render next to ground information, otherwise render just ground
    if (weather_display) {

        weather_row.attr('style', 'display: block;');
        $('#venue-column').removeClass('col-md-offset-3');

    } else {

        weather_row.hide();
        $('#venue-column').addClass('col-md-offset-3');
    }

}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in the data returned from the server and renders the
 * general match information such as team descriptions and manager information.
 *
 * @param {object} data - The data object returned from the server.
 *
 */
function displayTeamInformation(data) {

    // Team descriptions
    $('#team1-description').text(data.description_1);
    $('#team2-description').text(data.description_2);

    // Manager images
    $('#team1-manager-img').attr("src", data.manager_1.thumbnail.value);
    $('#team2-manager-img').attr("src", data.manager_2.thumbnail.value);

    // Manager names
    $('#team1-manager').text(data.manager_1.name.value);
    $('#team2-manager').text(data.manager_2.name.value);
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in the data returned from the server along with the data
 * extracted from the search from and proceeds to insert the correct RDFa data
 * in the HTML document.
 *
 * @param {object} input_data - The data extracted from the search form.
 *
 * @param {object} data - The data object returned from the server.
 *
 */
function displayRDFaData(input_data, data) {

    // Team URIs
    $('#team1-uri').attr('about', 'http://dbpedia.org/resource/' + input_data.team1);
    $('#team2-uri').attr('about', 'http://dbpedia.org/resource/' + input_data.team2);

    man1_uri = data.manager_1.label.value.trim().replace(/ /g,"_");
    man2_uri = data.manager_2.label.value.trim().replace(/ /g,"_");

    // Team URIs for each manager
    $('#team1-uri-for-manager').attr('about', 'http://dbpedia.org/resource/' + input_data.team1);
    $('#team2-uri-for-manager').attr('about', 'http://dbpedia.org/resource/' + input_data.team2);

    // Manager URIs
    $('#team1-manager-uri').attr('about', 'http://dbpedia.org/resource/' + man1_uri);
    $('#team2-manager-uri').attr('about', 'http://dbpedia.org/resource/' + man2_uri);
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in the array of players for two teams along with their
 * team names, the input data is then rendered on the page.
 *
 * @param {array} team1 - The array containing a team's player data.
 *
 * @param {string} team1_name - The string name for a team.
 *
 * @param {array} team2 - The array containing a team's player data.
 *
 * @param {string} team2_name - The string name for a team.
 *
 */
function listPlayerInfo(team1, team1_name, team2, team2_name) {

    var t1_name = team1_name.trim().replace(/ /g,"_");
    var t2_name = team2_name.trim().replace(/ /g,"_");

    var t1_len = team1.length;
    var t2_len = team2.length;

    // Find the total number of rows that will be required
    var total_rows = Math.max(t1_len, t2_len);

    var player_list = $('#player-list-row');

    var new_html = "";

    var row_html = '<div class="row">';
    var row_close_html = '</div>';

    // Html code for displaying a player
    var team1_html_1 = '<div class="col-md-4 col-md-offset-1" about="http://dbpedia.org/resource/' + t1_name;

    var team2_html_1 = '<div class="col-md-4 col-md-offset-2" about="http://dbpedia.org/resource/' + t2_name;
    var team2_html_more_offset = '<div class="col-md-4 col-md-offset-7" about="http://dbpedia.org/resource/' + t2_name;

    var team_html_0 = '"><div class="panel panel-default" rel="dbo:currentclub"><div class="panel-body panel-player text-center" about="http://dbpedia.org/resource/';
    var team_html_1 = '"><div class="panel-player-row"><strong class="vcenter" rel="dbo:position"><a class="no-link-styling" href="http://dbpedia.org/resource/';
    var team_html_2 = '</a></strong></div><div class="panel-player-row"><div class="vcenter" rel="dbo:thumbnail"><img src="';
    var team_html_3 = '" class="img-thumbnail img-responsive get-player-info" alt=""></img></div></div><div class="panel-player-row"><div class="vcenter text-center"><p><strong property="rdfs:label">';
    var team_html_4 = '</strong></p><p>D.O.B: <span property="dbp:birthDate">';
    var team_html_5 = '</span></p><p><span class="btn btn-default get-player-info">More Info</span></p></div></div></div></div></div>';

    // Iterate through the number of rows that are required rendering each team's player
    for (row = 0; row < total_rows; row++) {

        // Create a new row
        new_html = row_html;

        // If team1 has a player that should be displayed on that row
        if (row < t1_len) {

        	// Get player information
        	var p_info = assignValues(team1[row]);

        	// Build the HTML with appropriate data
            new_html += team1_html_1 + team_html_0 + p_info.uri + '" id="' + p_info.uri + team_html_1 + p_info.pos + '">' + p_info.pos_readable + team_html_2 + p_info.thumb + team_html_3 + p_info.name + team_html_4 + p_info.bd + team_html_5;

            if (row < t2_len) {

            	// Get player information
            	var p_info = assignValues(team2[row]);

            	// Build the HTML with appropriate data
                new_html += team2_html_1 + team_html_0 + p_info.uri + '" id="' + p_info.uri + team_html_1 + p_info.pos + '">' + p_info.pos_readable + team_html_2 + p_info.thumb + team_html_3 + p_info.name + team_html_4 + p_info.bd + team_html_5;
            }

         // Otherwise display the player from team2
        } else {

        	// Get player information
        	var p_info = assignValues(team2[row]);

        	// Build the HTML with appropriate data
            new_html += team2_html_more_offset + team_html_0 + p_info.uri + '" id="' + p_info.uri + team_html_1 + p_info.pos + '">' + p_info.pos_readable + team_html_2 + p_info.thumb + team_html_3 + p_info.name + team_html_4 + p_info.bd + team_html_5;
        }

        player_list.append(new_html + row_close_html);
    }
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in a player object and reorganises the structure of the
 * object and adds extra information such as the player's URI.
 *
 * @param {object} player - The player object storing data about themselves.
 *
 * @return {object} vals - The player object with all values easily accessible.
 *
 */
function assignValues(player) {

	var vals = {};

    vals.pos = player.position.value;
    vals.pos_readable = getPositionName(vals.pos);

    vals.label = player.name.value;
    vals.uri = vals.label.trim().replace(/ /g,"_");
    vals.name = getName(vals.label);

    vals.thumb = player.thumbnail.value;
    vals.bd = player.birthDate.value;

    return vals;
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in string resource value of the player's position, and
 * returns their position name.
 *
 * @param {string} positionValue - The url string of the player's position.
 *
 * @return {string} - The readable string for the player's position.
 *
 */
function getPositionName(positionValue) {

    var pos = positionValue

    // Get the end of the URL
    var endOfUrl = pos.lastIndexOf("/");
    pos = pos.substr(endOfUrl + 1);

    // If the player does not have a labelled position then return N/A
    if (pos != "Association football positions") {

    	// Remove underscores
        if (pos.indexOf("_") > -1) {
            var underscore = pos.indexOf("_");
            pos = pos.substr(0, underscore);
        }

        // Remove brackets
        if (pos.indexOf("(") > -1) {
            var bracket = pos.indexOf("(");
            pos = pos.substr(0, bracket);
        }
        

        // Remove "Association football positions,"
        if (pos.substr(0, 31) == "Association football positions,") {
            pos = pos.substr(31);
        }

    } else {
        pos = "N/A";
    }

    return pos.trim();
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in a string label of a player's name, and returns their
 * name with no extra words. E.g. Oscar (footballer born in 1989) is processed
 * to return just Oscar.
 *
 * @param {string} nameValue - The label string for the player's name.
 *
 * @return {string} name - The readable string for the player's name.
 *
 */
function getName(nameValue) {

    var name = nameValue;

    if (name.indexOf("(") > -1) {
        var bracket = name.indexOf("(");
        name = name.substr(0, bracket);
    }

    return name;
}

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function gets the id of the player selected and passes the player data
 * to the showInformationFor() function which renders that players information.
 *
 */
function showPlayer() {

	// If the element clicked is an image then get the id of the div 2 layers up
    if ($(this).is('img')) {

        p_clicked = $(this).parents().eq(2)[0].id.replace(/_/g, ' ');

    // Otherwise get the id of the div 3 layers up
    } else {

        p_clicked = $(this).parents().eq(3)[0].id.replace(/_/g, ' ');
    }

    // Search the global "team1_players" variable for the player name selected
    for (indx in team1_players) {
        if (team1_players[indx].name.value == p_clicked) {
            showInformationFor(team1_players[indx]);
        }
    }

    // Search the global "team2_players" variable for the player name selected
    for (indx in team2_players) {
        if (team2_players[indx].name.value == p_clicked) {
            showInformationFor(team2_players[indx]);
        }
    }

    // Hide the match information and show the player information page
    new_search_row.hide();
    results_row.hide();
    back_to_match_row.show();
    player_row.show();
};

// ************************************************************************** //
// ************************************************************************** //

/**
 * This function takes in a player object and displays all the relevant
 * information onto the page.
 *
 * @param {object} player - The object storing all data for a player.
 *
 */
function showInformationFor(player) {

    // Player URI
    player_uri = player.name.value.trim().replace(/ /g,"_");
    $('#player-info-row').attr('about', 'http://dbpedia.org/resource/' + player_uri);

    // Player description
    $('#player-description').text(player.comment.value);

    // Player image
    $('#player-image').attr("src", player.thumbnail.value);

    // Player label name and name
    $('#player-name').text(player.name.value);
    $('#player-full-name').text(player.fullname.value);

    // Player date of birth
    $('#player-dob').text(player.birthDate.value);

    // Player details
    $('#player-height').text(player.height.value);
    $('#player-position').attr('href', player.position.value);
    $('#player-position').text(getPositionName(player.position.value));
    $('#player-number').text(player.number.value);

}

// ************************************************************************** //
// ************************************************************************** //