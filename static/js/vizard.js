(function(exports) {
		exports.create = function(id, type) {
			var chart;
			var firstData = {
				categories: [],
				values: []
			};
			
			$(function() {
				chart = new Highcharts.Chart({
					chart: {
						renderTo: id,
						defaultSeriesType: type
					},
					credits: {
						enabled: false
					},
					legend: {
						enabled: false
					},
					title: {
						text: ''
					},
					xAxis: {
						categories: firstData.categories,
						labels: {
							step: (type === 'line' ? 4 : null)
						}
					},
					yAxis: {
						min: 0,
						title: {
							text: ''
						}
					},
					plotOptions: {
						column: {
							pointPadding: 0.2,
							borderWidth: 0
						}
					},
					tooltip: {
						formatter: function() {
							return this.x + ' : <b>' + this.y + '</b>';
						}
					},
					series: [{
						data: firstData.values
					}]
				});
			});
			
			return {
				set: function(data) {
					if (!chart) {
						firstData = data;
						return;
					}

					var mustRedraw = false;
					var series = chart.series[0];
					var xs = chart.xAxis[0].categories;
					var numberOfBars = xs.length;
					var modifiedBars = [];

					for (var i=0; i<data.length; i++) {
						var x = data[i].x;
						var y = data[i].y;
						
						if (i >= numberOfBars) {
							xs.push(x);
							series.addPoint(y, false, false, true);
							mustRedraw = true;
						} else {
							var bar = series.data[i];
							if (xs[i] !== x || bar.y !== y) {

								if (xs[i] !== x && x !== 'Others') {
									bar.graphic.css({ 'fill-opacity': 0.75 });
									modifiedBars.push(bar);
								}

								xs[i] = x;
								bar.update(y, false, true);
								mustRedraw = true;
							}
						}
					}

					for (var i=data.length; i<numberOfBars; i++) {
						series.data[i].remove(false, true);
						mustRedraw = true;
					}
					
					xs.length = data.length;

					if (mustRedraw) {
						chart.redraw();
						
						(function(modifiedBars) {
							setTimeout(function() {
								modifiedBars.forEach(function(bar) {
									bar.graphic.css({'fill-opacity': 1});
								});
							}, 750);
						}(modifiedBars));
					}
				}
			};
		};
})(window.vizard = {});
