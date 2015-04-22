angular.module('starter.controllers', ['ngCordova', 'elasticsearch'])

.controller('DashCtrl', function($scope, $cordovaGeolocation, $http, recipeService) {
	var exampleNS = {};

	exampleNS.getRendererFromQueryString = function() {
		var obj = {}, queryString = location.search.slice(1),
			re = /([^&=]+)=([^&]*)/g, m;

		while (m = re.exec(queryString)) {
			obj[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
		}
		if ('renderers' in obj) {
			return obj['renderers'].split(',');
		} else if ('renderer' in obj) {
			return [obj['renderer']];
		} else {
			return undefined;
		}
	};

	var view = new ol.View({
		center: [0, 0],
		zoom: 2
	});

	var content = document.getElementById('popup-content');

	var map = new ol.Map({
		layers: [
			new ol.layer.Tile({
				source: new ol.source.BingMaps({
					key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
					imagerySet: 'Road'
				})
			})
		],
		renderer: exampleNS.getRendererFromQueryString(),
		target: 'map',
		view: view
	});

	var posOptions = {timeout: 10000, enableHighAccuracy: false};
	$cordovaGeolocation
		.getCurrentPosition(posOptions)
		.then(function (position) {
			view.setCenter(ol.proj.transform([position.coords.longitude, position.coords.latitude], 'EPSG:4326', 'EPSG:3857'));
			view.setResolution(1000.0);
		}, function (err) {
			console.log(err)
		});

	recipeService.search("", 0).then(function(results){
		var vectorSource = new ol.source.Vector({ });
		$.each(results, function(index, result){
			var position = result.location.split(",");
			var pos = ol.proj.transform([parseFloat(position[1]), parseFloat(position[0])], 'EPSG:4326', 'EPSG:3857');


			var iconFeature = new ol.Feature({
					geometry: new ol.geom.Point(pos),
					name: result.title,
					phone: result.phone_number,
					population: 4000,
					rainfall: 500
			});
			vectorSource.addFeature(iconFeature);
		});

		var iconStyle = new ol.style.Style({
			image: new ol.style.Icon(({
				anchor: [0.5, 46],
				anchorXUnits: 'fraction',
				anchorYUnits: 'pixels',
				opacity: 0.75,
				src: 'img/icon.png'
			}))
		});

		var vectorLayer = new ol.layer.Vector({
			source: vectorSource,
			style: iconStyle
		});
		map.addLayer(vectorLayer);

		var element = document.getElementById('popup');

		var popup = new ol.Overlay({
			element: element,
			positioning: 'bottom-center',
			stopEvent: false
		});
		map.addOverlay(popup);

		map.on('click', function(evt) {
			var feature = map.forEachFeatureAtPixel(evt.pixel,
				function(feature, layer) {
					return feature;
				});

			if (feature) {
				var geometry = feature.getGeometry();
				var coord = geometry.getCoordinates();
				popup.setPosition(coord);
				$(element).popover({
					'placement': 'top',
					'html': true,
					'content': "商品:" + feature.get('name') + "<br/>" + "联系方式:" + feature.get('phone')
				});
				$(element).popover('show');
			} else {
				$(element).popover('destroy');
			}
		});
	});
})

.controller('ChatsCtrl', function($scope, $http, recipeService) {
	$scope.results = [];
	recipeService.search("", 0).then(function(results){
		console.log(results);
		$scope.results = results;
	});
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
