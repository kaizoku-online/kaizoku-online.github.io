'use strict'

angular.module('kaizokuOnline')

.factory('Auth', ['$http', '$cookieStore', '$location', '$window', 'jwtHelper',
    function($http, $cookieStore, $location, $window, jwtHelper) {

        var accessLevels = routingConfig.accessLevels,
            userRoles = routingConfig.userRoles,
            currentUser = $cookieStore.get('user') || {
                username: '',
                role: userRoles.public
            };

        function changeUser(user) {
            angular.extend(currentUser, user);
        }

        var login = function(user, provider, success, error) {
            if (provider == 'local') {
                $http.post(config.server.url + '/auth/' + provider, user).success(function(data) {
                    localStorage.setItem('id_token', data.token);
                    var tokenPayload = jwtHelper.decodeToken(data.token);
                    var user = tokenPayload.user;
                    changeUser(user);
                    $cookieStore.put('user', user);
                    success(user);
                }).error(error);
            } else {
                $window.location.href = 'http://localhost:64137/auth/' + provider;
            }
        }

        return {
            authorize: function(accessLevel, role) {
                if (role === undefined) {
                    role = currentUser.role;
                }

                return accessLevel.bitMask & role.bitMask;
            },
            isLoggedIn: function(user) {
                if (user === undefined) {
                    user = currentUser;
                }
                return user.role.title === userRoles.user.title || user.role.title === userRoles.admin.title;
            },
            oauthCallback: function() {
                if (window.facebookCode) {
                    var code = window.facebookCode.substr(6);
                    /*login({

                    });*/
                }
            },
            register: function(user, success, error) {
                $http.post(config.server.url + '/register', user).success(function(res) {
                    changeUser(res);
                    $cookieStore.put('user', res)
                    success();
                }).error(error);
            },
            logout: function(success, error) {
                localStorage.removeItem('id_token');
                changeUser({
                    username: '',
                    role: userRoles.public
                });
                $cookieStore.remove('user')
                success();
            },
            login: login,
            accessLevels: accessLevels,
            userRoles: userRoles,
            user: currentUser
        };
    }
])

.factory('Users', ['$http',
    function($http) {
        return {
            getAll: function(success, error) {
                $http.get(config.server.url + '/users').success(success).error(error);
            }
        };
    }
])

.factory('TokenInterceptor', ['$q', '$window',
    function($q, $window) {
        return {
            request: function(config) {
                config.headers = config.headers || {}
                if ($window.sessionStorage.token) {
                    config.headers['X-Access-Token'] = $window.sessionStorage.token
                    config.headers['X-Key'] = $window.sessionStorage.user
                    config.headers['Content-Type'] = "application/json"
                }
                return config || $q.when(config)
            },

            response: function(response) {
                return response || $q.when(response)
            }
        }
    }
])