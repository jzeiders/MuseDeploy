
angular.module('socialMuse.controllers', [])

    .controller('AppCtrl', function($scope, $ionicModal, $timeout, $firebaseObject, userData, currentTrack, $location, $rootScope, $cookies) {
        var ref = new Firebase('https://sizzling-inferno-387.firebaseio.com');
        $scope.nowPlaying = "YOLO";
        $scope.nowPlaying = currentTrack.update();
        $scope.username = "Log in";
        $scope.loginButton = function(username) {
            if (username == "Log in") {
                $scope.loginModal.show();
                console.log("Opening Login");
            }
            else {
                $location.path('/app/profile');
                console.log("fuckers")
            }
        };
        var loginUser = function(email, password){
            console.log(email, password);
            ref.authWithPassword({
                email: email,
                password: password
            }, function(error, authData){
                if(error) {
                    $scope.error = true;
                    $scope.errorMessage = error;
                    console.log("Login Failed", error);
                }
                else {
                    console.log("Successful Login");
                    $cookies.putObject("loginData", {email: email, password:password});// {email: email, password: password});
                    ref.onAuth(function(authData){
                        console.log("Got logon");
                        if(authData != null) {
                            var blocking = userData.getData(authData.uid);
                            //         console.log(userData.data.info.username);
                            console.log(authData.uid);
                            userData.profile.$loaded(function (profile) {
                                console.log(userData.profile);
                                $scope.username = userData.profile.$getRecord('username').$value;
                                $scope.closeLogin();
                            });
                        }
                    console.log("Cookie: " + $cookies.getObject("logta"));
                   //     console.log(userData.data.info.username + "Username")
                    });
                }
            })
        };
        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //$scope.$on('$ionicView.enter', function(e) {
        //});
        if($cookies.getObject("loginData") != null)
            loginUser($cookies.getObject("loginData").email,$cookies.getObject("loginData").password);
        // Form data for the login modal
        $scope.loginData = {};
        $scope.signUpData = {};
        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/login.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.loginModal = modal;
        });
        $ionicModal.fromTemplateUrl('templates/signup.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.signupModal = modal;
        });
        // Triggered in the login modal to close it

        $scope.closeLogin = function() {
            $scope.loginModal.hide();
        };
        $scope.openSignUp = function() {
            $scope.closeLogin();
            $scope.signupModal.show();

};
        $scope.closeSignUp = function() {
            $scope.signupModal.hide();
        };

        // Open the login modal
        $scope.login = function() {
            $scope.loginModal.show();
            $scope.signupModal.hide();
        };

        // Perform the login action when the user submits the login form
        $scope.doLogin = function() {
            console.log('Doing login', $scope.loginData);
            loginUser($scope.loginData.email, $scope.loginData.password);
        };
        $scope.doSignUp = function(){
        console.log("Signing Up");
            if($scope.signUpData.password != $scope.signUpData.repeatPassword){
                $scope.error = true;
                $scope.errorMessage = "Passwords Don't Match"
            }
            else {
                ref.createUser({
                        email: $scope.signUpData.email,
                        password: $scope.signUpData.password
                    }, function (error, userData) {
                        if (error) {
                            console.log("User Creation Error :", error);
                            $scope.error = true;
                            $scope.errorMessage = error;
                        }
                        else {
                            console.log("Success creating User");
                            ref.child('user').child(userData.uid).child("info").set({username: $scope.signUpData.username});
                            loginUser($scope.signUpData.email, $scope.signUpData.password);
                            $scope.closeSignUp();
                        }
                    }
                )
            }
        };
        $scope.nowPlaying = '';
        $scope.nowPlaying = $firebaseObject(ref.child('nowPlaying'));
        //if(ref.getAuth() == null)
        //    $scope.loginModal.show();
        $rootScope.$on("Log Out", function(){
            $scope.username = 'Log in';
        });
    //loginUser('test@gmail.com', 'test');
    })

    .controller('PlaylistsCtrl', function($scope, $firebaseArray, userData) {

        var firebase = new Firebase('sizzling-inferno-387.firebaseio.com');
        var playlistRef = firebase.child("playlist");
        var playlist=  $firebaseArray(playlistRef);
        var songs = $firebaseArray(playlistRef.orderByChild("score"));
        $scope.songs = songs;
        var voteStatus = [];
        firebase.onAuth(function(authData){
            console.log("running vote data");
           if(authData != null) {
               var userRef = firebase.child('user').child(authData.uid).child('votes');
               userRef.once("value", function (votes) {
                   votes.forEach(function (track) {
                       voteStatus[track.val().name] = {
                           upvoteColor: track.val().upvoted ? '#ff8b60' : 'inherited',
                           downvoteColor: track.val().downvoted ? '#9494ff' : 'inherited'
                       }
                   });
                   $scope.voteStatus = voteStatus;
               })
           }
        });

        $scope.upvote = function(id) {
            var userRef = firebase.child('user').child(userData.uid).child('votes');
            var song = songs.$getRecord(id);
            console.log(id);
            userRef.once("value", function(tracks) {
                if (!tracks.hasChild(id)) {
                    userRef.child(id).set({name: song.name, upvoted: false, downvoted: false});
                }
            });
            userRef.child(id).once("value", function(votes){
                votes= votes.val();
                if(!votes.upvoted)
                    song.score = song.score -1;
                if(votes.downvoted)
                    song.score = song.score -1;

            });
            userRef.child(id).set({name: song.name, upvoted: true, downvoted: false});
            voteStatus[song.name] = {upvoteColor:'#ff8b60',downvoteColor:'inherited'};
            $scope.voteStatus = voteStatus;
            console.log(voteStatus + " Vote Status");
            index = songs.$indexFor(song.$id);
            songs.$save(index);
        };
        $scope.downvote = function(id){
            var userRef = firebase.child('user').child(userData.uid).child('votes');
            var song = songs.$getRecord(id);
            userRef.once("value", function(tracks) {
                if (!tracks.hasChild(id)) {
                    userRef.child(id).set({name: song.name, upvoted: false, downvoted: false});
                }
            });
            userRef.child(id).once("value", function(votes){
                votes= votes.val();
                console.log(votes);
                if(!votes.downvoted)
                    song.score = song.score +1;
                if(votes.upvoted)
                    song.score = song.score +1;
            });
            userRef.child(id).set({name: song.name, upvoted: false, downvoted: true});
            voteStatus[song.name] = {upvoteColor:'inherited', downvoteColor:'#9494ff'};
            $scope.voteStatus = voteStatus;
            index = songs.$indexFor(song.$id);
            songs.$save(index);
        }
    })

    .controller('SearchCtrl', function($scope, search, $q, $firebaseArray){
        var show = 3;
        var liveSearch = function(term) {
            $q(function (resolve, reject) {
                search.get({type: 'track', term: term, limit: show}, function (data) {
                    resolve(data);
                })
            }).then(function(result){
                $scope.tracks = result.tracks.items;
                console.log(result.tracks.items);
            })
        };
        $scope.liveSearch = liveSearch;
        $scope.showMore = function(term) {
            show = show + 3;
            console.log("HEY" + show);
            liveSearch(term);
        };
        var firebase = new Firebase('sizzling-inferno-387.firebaseio.com');
        var playlistRef = firebase.child("playlist");
        var playlist = $firebaseArray(playlistRef);
        $scope.addSong = function(track){
            track.score = -1;
            playlist.$add(track);
        };
    })
    .controller('chartsCtrl', function($scope, $firebaseArray){
        var firebase = new Firebase('sizzling-inferno-387.firebaseio.com');
        var chartRef = firebase.child("Chart");
        var chart = $firebaseArray(chartRef.orderByChild("score"));
        $scope.chart = chart;

    })
    .controller('profileCtrl', function($scope, userData, $rootScope){
        var ref = new Firebase('sizzling-inferno-387.firebaseio.com');

        var logOut = function(){
            ref.unauth();
            userData.clear();
            $rootScope.$emit("Log Out");
            console.log("Logged Out");
        };
        console.log("Welcome to the Profile")
        $scope.logOut = logOut;
});