var sum = function(data) {
	return data.reduce(function(last, val) {
		return last + val;
	});
};

// data = [{value:number,time:unixtime}]
var trend = function(data,time,period) {
	var last = data[data.length - 1];


	// dead trend

	if(time && time[time.length - 1] - time[time.length - 2] >= period) {
		return 0;
	}

	var mean = average(data);
	var deviation = std(data);

	if(mean == last) {
		return 0;
	}
	
	if(last >= deviation+mean) {
		return 1;
	}
	
	if(last <= mean-deviation ) {
		return -1;
	}
	
	if(last > mean) {
		return Math.abs(last - mean) / deviation;	
	} else {
		return -(Math.abs(last - mean) / deviation);
	}
};
exports.trend = trend;

var average = function(data) {
	return sum(data) / data.length;
};
exports.average = average;

var std = function(data) {
	var mean = average(data);
	
	var nominator = data.reduce(function(a,b) {
		return a + (b - mean) * (b - mean);
	}, 0);

	return Math.sqrt(nominator/data.length);
};
exports.std = std;

var min = function(data,time) {
	var index = 0;
	var last = data[0];
	for(var i = 0; i < data.length; i++) {
		if(data[i] < last) {
			index = i;
			last = data[i];
		}
	}
	return {value:data[index],time:time[index]};
};
exports.min = min;

var max = function(data,time) {
	var index = 0;
	var last = data[0];
	for(var i = 0; i < data.length; i++) {
		if(data[i] > last) {
			index = i;
			last = data[i];
		}
	}

	return {value:data[index],time:time[index]};
};
exports.max = max;

var bellify = function(data) {
	
};