'use strict'

angular.module('kaizokuOnline', ['ngCookies', 'ui.router', 'angular-jwt'])

.config(
    ['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', 'jwtInterceptorProvider',
        function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, jwtInterceptorProvider) {

            var access = routingConfig.accessLevels;

            $stateProvider

            // Public routes
                .state('public', {
                    abstract: true,
                    template: "<ui-view/>",
                    data: {
                        access: access.public
                    }
                })
                .state('public.home', {
                    url: '/',
                    controller: ['$scope', '$state', 'Auth', function($scope, $state, Auth) {
                        if (Auth.isLoggedIn()) {
                            $state.go('user.home');
                        } else {
                            $state.go('anon.home');
                        }
                    }]
                })
                .state('anon.auth', {
                    url: '/auth/facebook',
                    controller: 'AuthController'
                })
                .state('public.404', {
                    url: '/404/',
                    templateUrl: '/views/404.html'
                })

            // Anonymous routes
            .state('anon', {
                    abstract: true,
                    template: "<ui-view/>",
                    data: {
                        access: access.anon
                    }
                })
                .state('anon.home', {
                    url: '/',
                    templateUrl: '/views/anon/home.html'
                })
                .state('anon.check-login-state', {
                    url: '/redirect',
                    templateUrl: 'check-login-state',
                    controller: 'CheckLoginStateController'
                })
                .state('anon.login', {
                    url: '/login/',
                    templateUrl: '/views/anon/login.html',
                    controller: 'LoginController'
                })
                .state('anon.register', {
                    url: '/register/',
                    templateUrl: '/views/anon/register.html',
                    controller: 'RegisterController'
                })

            // Regular user routes
            .state('user', {
                    abstract: true,
                    template: "<ui-view/>",
                    data: {
                        access: access.user
                    }
                })
                .state('user.home', {
                    url: '/',
                    templateUrl: '/views/user/home.html'
                })
                .state('user.profile', {
                    abstract: true,
                    url: '/profile/',
                    templateUrl: '/views/user/_layout.html'
                })
                .state('user.profile.home', {
                    url: '',
                    templateUrl: '/views/user/home.html'
                })
                .state('user.profile.nested', {
                    url: 'nested/',
                    templateUrl: '/views/user/nested.html'
                })
                .state('user.profile.admin', {
                    url: 'admin/',
                    templateUrl: '/views/user/nestedAdmin.html',
                    data: {
                        access: access.admin
                    }
                })

            // Admin routes
            .state('admin', {
                    abstract: true,
                    template: "<ui-view/>",
                    data: {
                        access: access.user
                    }
                })
                .state('admin.admin', {
                    url: '/admin/',
                    templateUrl: '/views/admin/home.html',
                    controller: 'AdminController'
                })

            $urlRouterProvider
                .otherwise('/404/')
                // FIX for trailing slashes. Gracefully "borrowed" from https://github.com/angular-ui/ui-router/issues/50
                .rule(function($injector, $location) {
                    if ($location.protocol() === 'file')
                        return;

                    var path = $location.path()
                        // Note: misnomer. This returns a query object, not a search string
                        ,
                        search = $location.search(),
                        params;

                    // check to see if the path already ends in '/'
                    if (path[path.length - 1] === '/') {
                        return;
                    }

                    // If there was no search string / query params, return with a `/`
                    if (Object.keys(search).length === 0) {
                        return path + '/';
                    }

                    // Otherwise build the search string and return a `/?` prefix
                    params = [];
                    angular.forEach(search, function(v, k) {
                        params.push(k + '=' + v);
                    });
                    return path + '/?' + params.join('&');
                });

            $locationProvider.html5Mode(false);

            $httpProvider.interceptors.push(function($q, $location) {
                return {
                    'responseError': function(response) {
                        if (response.status === 401 || response.status === 403) {
                            $location.path('/login');
                        }
                        return $q.reject(response);
                    }
                };
            });

            jwtInterceptorProvider.tokenGetter = ['config', function(config) {
                // Skip authentication for any requests ending in .html
                if (config.url.substr(0,7) == '/views/' 
                    || config.url.substr(-5) == '.html') {
                  return null;
                }
                return localStorage.getItem('id_token');
            }];

            $httpProvider.interceptors.push('jwtInterceptor');
        }
    ])

.run(
    ['$rootScope', '$state', 'Auth',
        function($rootScope, $state, Auth) {
            $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
                Auth.oauthCallback();
                if (!('data' in toState) || !('access' in toState.data)) {
                    $rootScope.error = "Access undefined for this state";
                    event.preventDefault();
                } else if (!Auth.authorize(toState.data.access)) {
                    $rootScope.error = "Seems like you tried accessing a route you don't have access to...";
                    event.preventDefault();

                    if (fromState.url === '^') {
                        if (Auth.isLoggedIn()) {
                            $state.go('user.home');
                        } else {
                            $rootScope.error = null;
                            $state.go('anon.login');
                        }
                    }
                }
            });

        }
    ]);