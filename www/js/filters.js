/**
 * Created by Jack on 9/16/2015.
 */
angular.module('socialMuse.filters', [])
    .filter('Username', function(){
    return function(input) {
        var words = [];
        var result = ' ';
        words = input.split(' ');
        console.log(words);
        for(var i in words){
            var word = words[i]
          //  console.log(word.charAt(0));
            var first = word.charAt(0);
            word = word.replace(first, first.toUpperCase());
               result =  result.concat(word).concat(' ');
            console.log(result);
        }
        console.log(result + " Result ")
        return result;
    }});
