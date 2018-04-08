/**
 * Created by avihay on 20/06/2015.
 */
app.factory('dataService', ['$http', function($http) {
	return $http.get('/graph/data')
		.success(function(data) {
			return data;
		})
		.error(function(err) {
			return err;
		});
}]);