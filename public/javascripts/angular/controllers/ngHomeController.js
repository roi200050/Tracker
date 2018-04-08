/**
 * Created by avihay on 20/06/2015.
 */
app.controller('HomeController', ['$scope', '$http', function ($scope, $http) {
  $scope.marks = [];
  marks = $scope.marks;

  $scope.unsavedMarks = [];

  $scope.changedConfig = {};

  $scope.configuredMarks = [];

  //alert box stuff
  $scope.isAlert = false;

  $scope.changeMark = function () {
    markValue = $scope.selectedMark;
    if (g.mark && g.mark.text)
      g.mark.text.text(markValue.label);
  }

  $scope.setConfiguredMarks = function () {
    marks = $scope.marks;
    $scope.configuredMarks = marks.filter(function (mark) {
      return mark.configuration;
    });

    if ($scope.selectedMark) {
      var needChange = !$scope.configuredMarks.some(function (mark) {
        return mark.label === $scope.selectedMark.label;
      });

      if (needChange) {
        $scope.selectedMark = $scope.configuredMarks.length ? $scope.configuredMarks[0] : null;
        $scope.changeMark();
      }
    }
  };

  $scope.changeConfiguration = function () {
    var mark = $scope.configuringMark;
    var nothingChanged = $scope.marks[indexFromLabel(mark.label)].configuration === mark.configuration;

    console.log(nothingChanged, $scope.marks[indexFromLabel(mark.label)].configuration, $scope.marks[indexFromLabel(mark.label)].label, mark.configuration, mark.label);

    if (nothingChanged) {
      delete $scope.changedConfig[mark.label];
    } else {
      $scope.changedConfig[mark.label] = mark.configuration;

      if (mark.configuration === '') {
        $scope.changedConfig[mark.label] = null;
      }

      if (mark.configuration) {
        //change according to changed
        angular.forEach($scope.changedConfig, function (config, label) {
          if (config === mark.configuration && label !== mark.label) {
            $scope.changedConfig[label] = null;
          }
        });
      }
    }

    console.log($scope.changedConfig);

    $scope.noSave = angular.equals({}, $scope.changedConfig);
  }

  $scope.configureMark = function (mark, i, noApply) {
    $scope.configuringMark = {
      label: mark.data.label,
      configuration: $scope.changedConfig[mark.data.label] || mark.data.configuration
    };

    angular.forEach($scope.changedConfig, function (config, label) {
      if (config === $scope.configuringMark.configuration && label !== $scope.configuringMark.label) {
        $scope.configuringMark.configuration = '';
      }
    });

    configuringMarkAngular = $scope.configuringMark;

    if (!noApply)
      $scope.$apply();

    d3.selectAll(".markG").classed("configuring", function (d) {
      return d.data.label === mark.data.label;
    });
  }

  $scope.saveConfig = function () {
    angular.forEach($scope.changedConfig, function (config, label) {
      $scope.marks.forEach(function (m) {
        if (m.configuration === config && m.label !== label) {
          $scope.changedConfig[m.label] = null;
        }
      });
    });

    $http.post('/setMarksConfig', {
      config: $scope.changedConfig
    }).then(function () {
      angular.forEach($scope.changedConfig, function (config, label) {
        $scope.marks[indexFromLabel(label)].configuration = config;
      });
      $scope.setConfiguredMarks();

      updateMarksGraph($scope.changedConfig);

      $scope.changedConfig = {};
      $scope.noSave = true;
    });
  }

  configureMarkAngular = $scope.configureMark;

  $http.get('/getMarksConfig').then(function (response) {
    var data = response.data;
    for (var major = 1; major <= 20; major++) {
      for (var minor = 0; minor <= 15; minor++) {
        if (minor === 0) {
          $scope.marks.push({
            label: '' + major,
            configuration: data['' + major] || undefined,
          });
        } else {
          $scope.marks.push({
            label: major + '.' + minor,
            configuration: data[major + '-' + minor] || undefined,
          });
        }
      }
    }

    $scope.setConfiguredMarks();
    $scope.selectedMark = markValue = $scope.configuredMarks.length ? $scope.configuredMarks[0] : null;

    $scope.changedConfig = {};
    $scope.noSave = true;

    drawMarks();

    $scope.configureMark({
      data: {
        label: marks[0].label,
        configuration: marks[0].configuration
      }
    }, 0, true);
  });

  $('#mark_modal').on('hide.bs.modal', function () {
    $scope.changedConfig = {};
    $scope.noSave = true;
    $scope.configuringMark.configuration = marks[indexFromLabel($scope.configuringMark.label)].configuration;
  });

  $scope.operationCancelTimeoutEnabled = false;
  $scope.operationCancelMin = 0;
  $scope.operationCancelSec = 0;

  $scope.toggleOperationCancelTimeout = function () {
    if (!$scope.operationCancelTimeoutEnabled) {
      $scope.operationCancelMin = 0;
      $scope.operationCancelSec = 0;
    }
  }
}]);



function indexFromLabel(label) {
  var split = label.split('.');
  if (split.length === 1)
    split.push(0);

  split[0] = +split[0];
  split[1] = +split[1];

  var index = (split[0] - 1) * 16 + split[1];
  return index;
}