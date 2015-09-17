/**
 * Created by Jack on 8/8/2015.
 */
angular.module('socialMuse.services', [])
    .factory("search", function($resource){
        return $resource("https://api.spotify.com/v1/search?q=:term&type=:type&limit=:limit",{term: '@term', type:'@type', limit: '@limit'},{});
    })
    .factory("userData", function($firebaseArray, $firebaseObject) {
        var ref = new Firebase('https://sizzling-inferno-387.firebaseio.com');
        var user = {};
        user.data = {};
        user.getData = function (uid) {
            user.uid = uid;
            user.data.votes = $firebaseArray(ref.child("user").child(uid).child("votes"));
            user.profile = $firebaseArray(ref.child("user").child(uid).child("info"));
            user.profile.$loaded(function(profile){
                console.log(profile.$getRecord('username').$value + "Service User Data");
                user.profile.username = {username: profile.$getRecord('username').$value}
            });

        };
        user.hasTrack = function(id){
            var ref = new Firebase('https://sizzling-inferno-387.firebaseio.com');
            ref.child("user").child(user.uid).once("value", function(tracks){
                console.log(tracks.hasChild(id) + "MuthaFucka");
                return tracks.hasChild(id);
            })

        };
        user.clear = function(){
            user.data = {};
            user.profile = {};
        };
        return user;

})
.factory("currentTrack", function($resource, $firebaseArray){
    var factory = {};
    factory.nowPlaying = "FUCK";
        factory.update = function() {
            var ref = new Firebase('https://sizzling-inferno-387.firebaseio.com');
            var fm = $resource('http://ws.audioscrobbler.com/2.0?user=socialmuse&method=user.getrecenttracks&api_key=cd9641bcd11c2c3c27c2fd14432e3e63&format=json&limit=1');
            ref.child("playlist").once("value", function (data) {
                var body = fm.get(function () {
                    var currentTrack = {name: "Photograph"};// body.recenttracks.track[0];
                    console.log(currentTrack);
                    data.forEach(function (song) {
                        console.log(song.val().name);
                        if (song.val().name == currentTrack.name) {
                            console.log("Found Match");
                            factory.nowPlaying = currentTrack.name;
                            console.log(song.val().name);
                            return factory.nowPlaying;
                        }
                    })
                })
            });
        };
            return factory;
        });



