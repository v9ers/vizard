var twitter = require('./twitter-client');
var vizard  = require('./vizard-client');

// Config stuff.
var interval = 35;
var vizardNames = {
	error:    'bjarke-error',
	response: 'bjarke-twitter-response',
	result:   'twitter-irene'
};

var ANSI_NORMAL = '\u001B[0m';
var ANSI_BOLD   = '\u001B[1m';
var ANSI_YELLOW = '\u001B[1;33m';

var query = process.argv.slice(2).join(' ').trim();
if (!query) {
	console.log('You need to specify a twitter search query as command-line argument.');
	process.exit(1);
}
console.log(ANSI_NORMAL + 'Searching for "' + ANSI_BOLD + query + ANSI_NORMAL
	+ '" every ' + interval + ' seconds... and posting to Vizard!\n');

var searchTwitterAndPostToVizard = (function() {
	var oldResultIds = {};
	var badWords = { 'the': 1, 'and': 1, 'you': 1, 'http': 1 };

	var messageCount = 0;

	return function() {
		twitter.search(query, function(err, response) {
			if (err) {
				console.log('Twitter error:', err);
				vizard.post(vizardNames.error, err);
				return;
			}

			var results = response.results.filter(function(result) {
				var isNew = !oldResultIds[result.id_str];
				oldResultIds[result.id_str] = true;
				return isNew;
			});
			delete response.results;
			response.searchInterval = interval;

			results.forEach(function(result) {
				console.log(ANSI_YELLOW + result.from_user + ': ' + ANSI_NORMAL + result.text);
			});
			vizard.post(vizardNames.response, response);
			results.forEach(function(result) {
				messageCount++;

				var text = result.text.replace(/('|http:\/\/\S+)/g, '');

				var words = text.split(/\W+/g).filter(function(word) {
					return !!word && word.length > 2 && !(word.toLowerCase() in badWords);
				}).map(function(word) {
					return word.toLowerCase();
				});

				words.forEach(function(word) {
					vizard.post(vizardNames.result, {
						language: result.iso_language_code,
						word: word,
						"word count": 1
					});
				});
			});
		});
	};
}());

searchTwitterAndPostToVizard();
setInterval(searchTwitterAndPostToVizard, interval * 1000);
