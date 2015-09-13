/**
 * Created by Jack on 8/11/2015.
 */
var http = require("http");
var firebase = require("firebase");
var express = require('express');
var request = require('request');
//var app = express();
var firebaseRef = new firebase("https://sizzling-inferno-387.firebaseio.com/");
var playlistRef = firebaseRef.child('playlist');
var lastTrack = {name: "a", score: 0, artist: 'a'};
var client_id = '6a404ac6414c4296abc2f00865735942'; // Your client id
var client_secret = '42ae53d261034919a93b1c414d29394c';
var counter = 1;
var spotAccessToken;
var tokenRefresher = function () {
    var spotifyTokens = firebaseRef.child('spotifyTokens');
    spotifyTokens.once('value', function (snapshot) {
        refreshToken = snapshot.val().refresh;
        request({
            url: "https://accounts.spotify.com/api/token",
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + ( new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            form: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            },
            json: true
        }, function (error, response, body) {
            if (error) {
                console.log(error + " Fuck")
            }
            else {
                spotifyTokens.set({
                    accessToken: body.access_token,
                    refresh: "AQDRqjix9hASgngtVV6Wd_8IjC6iXstLt_68HHewJce3v7LIfCFvJLmtxyfsQGMEX30iJzBhTRb5mmpI-AcXMGt_ntMUikYn0sitmcbUTT0cHYRKvBcsfAyLgOb58hgJTOA"

                });
                spotAccessToken = body.access_token;
            }
        })
    });
};
//app.get('/updateToken', function(req,res){
//  tokenRefresher();
//    res.send(spotAccessToken);
//});
var updateChart = function(song){
    var isOnChart = false;
    //console.log("artist: " + song.artist);

    var chartRef = firebaseRef.child("Chart");
    chartRef.once("value", function(snapshot){
        snapshot.forEach(function(chartSong){
            if(chartSong.val().name == song.name) {
                chartRef.child(chartSong.key()).update({score: chartSong.val().score + song.score});
                isOnChart = true;
                console.log("Pushed to Chart");
                return true;
            }
        });
        if(!isOnChart)
            chartRef.push(song);
    });


    //console.log("Pushed "  + song.name );
};

var autoPopulate = function(){
    request('http://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=cd9641bcd11c2c3c27c2fd14432e3e63&format=json', function(error,response,body) {
        var data = JSON.parse(body);
        var track = data.tracks.track[Math.floor(Math.random() * 50)];
        //console.log("Populate Track : " + track.name);
        var url = "https://api.spotify.com/v1/search?type=track&limit=1&q=".concat((track.name));
        request(url, function (err, res, track) {
            track = JSON.parse(track);
            //         addTrack(track.tracks.items[0]);
            //         console.log("Auto Populated : " + track.tracks.items[0].name);
            var fireSong = track.tracks.items[0];
            fireSong.score = -1;
            playlistRef.push(fireSong)
        });

    });
};
var removeTrack = function(song){
    updateChart(song.val());
    playlistRef.child(song.key()).remove();

};


var updateCurrentTrack = function(){
    var track, result ="A";
    playlistRef.orderByChild("score").limitToFirst(2).once("value", function (snapshot) {
        request('http://ws.audioscrobbler.com/2.0?user=socialmuse&method=user.getrecenttracks&api_key=cd9641bcd11c2c3c27c2fd14432e3e63&format=json', function (error, response, body) {
            var data = JSON.parse(body);
            var currentTrack = data.recenttracks.track[0];
            if(currentTrack.name != lastTrack.name){
                snapshot.forEach(function(song) {
                    track = song.val().name;
                    console.log(track + " " + currentTrack.name);
                    if (track.toLowerCase() == currentTrack.name.toLowerCase()) {
                        console.log("remove track attempt")
                        removeTrack(song);
                    }

                });
                lastTrack = currentTrack;
                firebaseRef.child("nowPlaying").set({name: currentTrack.name, artist: currentTrack.artist['#text']});
            }
            // console.log("Recent Track " + lastTrack.name + " Now " + data.recenttracks.track[0].name)
        })
    })
};
var deleteNegTrack = function(){
    playlistRef.once("value", function(snapshot){
        snapshot.forEach(function(song){
            //console.log(song.val().score);
            if(song.val().score > 0)
                removeTrack(song);

        })
    })
};

setInterval(updateCurrentTrack, 2000);
setInterval(deleteNegTrack, 3000);

var addTrack = function(track) {
    var spotUrl = "https://api.spotify.com/v1/users/1245755678/playlists/13XfDGy0z0N58zpJ7OSgD5/tracks?uris=".concat(track.uri);
    request({
        url: spotUrl,
        method: "POST",
        headers: {
            Authorization: "Bearer " + spotAccessToken,
            Accept: "application/json"

        }
    }, function(err, res, body){
        if(err)
            console.log("Add Track Error" + err);
        else
            console.log("Added Track " + track.name)
    });
    //console.log("Added " + track.name )
};
var deleteTrack = function(track) {
    request({
        url: "https://api.spotify.com/v1/users/1245755678/playlists/13XfDGy0z0N58zpJ7OSgD5/tracks",
        method: "DELETE",
        headers: {
            Authorization: "Bearer " + spotAccessToken,
            Accept: "application/json"

        },
        json: {
            tracks:[{uri: track.uri}]
        }
    }, function(err, res, body){
        if(err)
            console.log(err);
        else {
            console.log("Deleted Track " + track.name + " " );
        }
    })
};
//app.get('/spotifyManager', function(req,res) {
var sortTrack = function(start, end) {
    request ({
            url: "https://api.spotify.com/v1/users/1245755678/playlists/13XfDGy0z0N58zpJ7OSgD5/tracks",
            method: "PUT",
            headers: {
                Authorization: "Bearer " + spotAccessToken
            },
            json: {
                range_start: start,
                insert_before: end + 1
            }
        }, function(err, res, body) {
            if(err)
                console.log(err);
            else {
                console.log(body);
            }
        }
    )
};

playlistRef.orderByChild("score").on("value", function(snapshot){
    tokenRefresher();
    if(snapshot.numChildren() < 2) {
        //console.log("Tried to Auto Populate");
        autoPopulate();
    }
    firebaseRef.child('spotifyTokens').once("value", function(token){
        spotAccessToken = token.val().accessToken;
        console.log("syncing tracks");
        request({
            url: "https://api.spotify.com/v1/users/1245755678/playlists/13XfDGy0z0N58zpJ7OSgD5/tracks",
            method: "GET",
            headers: {
                Authorization: "Bearer " + spotAccessToken
            }
        }, function(error, response, body){
            console.log("Started Sorting");
            if(error)
                console.log(error);
            var spotTracks= [], spotTracksSorted = [], fireTracks = [], fireTracksSorted = [];
            var data = JSON.parse(body);
            var spotPlaylist = data.items;
            for(i = 0; i < spotPlaylist.length; i++){
                spotTracks.push(spotPlaylist[i].track.name);
            }
            var count = 0;
            snapshot.forEach(function(song){
                count++;
                fireTracks.push(song.val().name);
                if(count == 1)
                    return true;
            });
            console.log(fireTracks + " Fire Track");
            for(var i = 0; i < fireTracks.length; i++) {
                var hasTrack = false;
                for (var j = 0; j < spotTracks.length; j++)
                    if (fireTracks[i] == spotTracks[j]) {
                        hasTrack = true;

                    }
                console.log(i +' ' +hasTrack);
                if (!hasTrack) {
                    //console.log(fireTracks[i]);
                    snapshot.forEach(function(song){
                        if(song.val().name == fireTracks[i]) {
                            console.log(song.val().name + "Fire ADD");
                            addTrack(song.val())
                        }
                    });
                    spotTracks.splice(j,1,fireTracks[i]);
                    console.log('tried to add' + fireTracks[i])
                }
            }
            for(i = 0; i < spotTracks.length; i++){
                var extraTrack = true;
                for(j = 0; j <fireTracks.length; j++)
                    if(spotTracks[i] == fireTracks[j])
                        extraTrack = false;
                if(extraTrack) {
                    for(k = 0; k < spotPlaylist.length; k++)
                        if(spotPlaylist[k].track.name == spotTracks[i]) {
                            console.log("called delete function");
                            console.log(spotPlaylist[k].track.name);
                            deleteTrack(spotPlaylist[k].track);
                        }
                    spotTracks.splice(i, 1);
                }
            }
            var changes = [];
            for(i = 0; i < fireTracks.length; i++)
                console.log(spotTracks[i] + " "+ fireTracks[i] + ' Sort Check');
                if(spotTracks[i] == fireTracks[i]) {
                    console.log("Flipped");
                    sortTrack(0, 1);
                }
            //}
            console.log("Finished");
        })

    });
});

process.on('uncaughtException', function (err) {
    console.log(err);
});

var server = http.createServer(function(req,res){
    res.send("Server Starting")

});
server.listen(process.env.PORT || 5000, function(){
    tokenRefresher();

    console.log("Server Running")
});
