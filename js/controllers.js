'use strict'

angular.module('kaizokuOnline')

.controller('NavController', ['$rootScope', '$scope', '$location', '$state', 'Auth',
    function($rootScope, $scope, $location, $state, Auth) {
        $scope.user = Auth.user
        $scope.userRoles = Auth.userRoles
        $scope.accessLevels = Auth.accessLevels

        $scope.logout = function() {
            Auth.logout(function() {
                $state.go('public.home', {}, {
                    reload: true
                })
            }, function() {
                $rootScope.error = "Failed to logout"
            })
        }
    }
])

.controller('LoginController', ['$rootScope', '$scope', '$location', '$state', '$window', '$http', 'Auth',
    function($rootScope, $scope, $location, $state, $window, $http, Auth) {

        $scope.rememberme = true
        $scope.login = function(provider) {
            Auth.login({
                    username: $scope.username,
                    password: $scope.password,
                    rememberme: $scope.rememberme
                }, provider,
                function(res) {
                    $state.go('user.home', {}, {
                        reload: true
                    })
                },
                function(err) {
                    $rootScope.error = "Failed to login"
                })
        }
    }
])

.controller('AuthController', ['$rootScope', '$scope', '$location', '$state', '$window', '$http', 'Auth',
    function($rootScope, $scope, $location, $state, $window, $http, Auth) {

        $scope.rememberme = true
        $scope.login = function(provider) {
            Auth.login({
                    username: $scope.username,
                    password: $scope.password,
                    rememberme: $scope.rememberme
                }, provider,
                function(res) {
                    $state.go('user.home', {}, {
                        reload: true
                    })
                },
                function(err) {
                    $rootScope.error = "Failed to login"
                })
        }
    }
])

.controller('RegisterController', ['$rootScope', '$scope', '$location', '$state', 'Auth',
    function($rootScope, $scope, $location, $state, Auth) {
        $scope.role = Auth.userRoles.user
        $scope.userRoles = Auth.userRoles

        $scope.register = function() {
            Auth.register({
                    username: $scope.username,
                    password: $scope.password,
                    role: $scope.role
                },
                function() {
                    $state.go('user.home', {}, {
                        reload: true
                    })
                },
                function(err) {
                    $rootScope.error = err
                })
        }
    }
])

.controller('AdminController', ['$rootScope', '$scope', 'Users', 'Auth',
    function($rootScope, $scope, Users, Auth) {
        $scope.loading = true
        $scope.userRoles = Auth.userRoles

        Users.getAll(function(res) {
            $scope.users = res
            $scope.loading = false
        }, function(err) {
            $rootScope.error = "Failed to fetch users."
            $scope.loading = false
        })

    }
])