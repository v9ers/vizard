// data = [{value:number,time:unixtime}]
var trend = function(data,time,period) {
	
	// dead trend
	if(time[time.length] - time[time.length -1] >= period) {
		return 0;
	}

	
};
exports.trend = trend;

var average = function(data) {
	return sum(data) / data.length;
};
exports.avergae = arverage;

var std = function(data) {
	return 
};
exports.std = std;

var sum = function(data) {
	return data.reduce(0, function(last, val) {
		return last + val;
	});
};