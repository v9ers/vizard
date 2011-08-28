var http = require('http');

var ANSI_SAVE_CURSOR_POS    = '\u001B[s';
var ANSI_RESTORE_CURSOR_POS = '\u001B[u';
var ANSI_GOTO_END_MINUS_12  = '\u001B[999G\u001B[11D';
var ANSI_ERASE_REST_OF_LINE = '\u001B[K'
var ANSI_NORMAL = '\u001B[0m';
var ANSI_RED    = '\u001B[1;31m'

var updatePercentage = (function() {
	var prolog = ANSI_SAVE_CURSOR_POS + ANSI_GOTO_END_MINUS_12;
	var epilog = ANSI_RESTORE_CURSOR_POS;
	var print = function(text) {
		process.stdout.write(prolog + text + epilog);
		process.stdout.flush();
	};

	return function(percentage) {
		if (percentage < 0 || percentage >= 100) {
			print(ANSI_ERASE_REST_OF_LINE);
		} else {
			if (percentage === 0) {
				percentage = 'msg'
			} else {
				percentage = ('  ' + percentage).substr(-2) + '%';
			}
			print(ANSI_RED + '(Vizard ' + percentage + ')\r' + ANSI_NORMAL);
		}
	};
}());

var updateConnections = (function() {
	var connections = 0;
	var maxConnections = 1;

	return function(delta) {
		connections += delta;
		if (connections <= 0) {
			connections = 0;
			maxConnections = 1;
		}
		if (connections > maxConnections) {
			maxConnections = connections;
		}
		var percentage = (connections / maxConnections * 100) | 0;
		updatePercentage(100 - percentage);
	};
}());

exports.post = function(name, data) {
	var json = JSON.stringify(data);

	http.request({
		method: 'POST',
		host: '109.74.206.232',
		path: '/r/' + name,
		headers: {
			'Content-Length': '' + Buffer.byteLength(json)
		}
	}, function(response) {
		setTimeout(function() { updateConnections(-1); }, 500);

		if (response.statusCode !== 200) {
			console.log('Vizard post error: HTTP ' + response.statusCode);
			// TODO: Also print actual response body.
		}
	}).on('error', function(err) {
		setTimeout(function() { updateConnections(-1); }, 500);

		console.log('Vizard post error: ' + err.message);
	}).end(json, 'utf8');

	updateConnections(1);
};
