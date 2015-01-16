var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var inflection = require('inflection');
var Twit = require('twit');
var T = new Twit(require('./config.js'));
var wordfilter = require('wordfilter');
var fs = require('fs');
var pos = require('pos');


Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
};

Array.prototype.pickRemove = function() {
  var index = Math.floor(Math.random()*this.length);
  return this.splice(index,1)[0];
};

function generate() {
  var dfd = new _.Deferred();
  fs.readFile('marx.txt', 'utf8', function(error, data) {
    var sentences = data.match( /[^\.!\?]+[\.!\?]+/g );
    //console.log(sentences.length);
    sentences = _.filter(sentences, function(el) {
      el = el.trim();
      return el.length < 120
             && el.length > 20
             && (el.split("'").length -1 < 2)
             && el.indexOf('"') === -1
             && el.indexOf('*') === -1;

    });
   
    sentences = _.filter(sentences, function(el) {
      var words = new pos.Lexer().lex(el);
      var taggedWords = new pos.Tagger().tag(words);
      taggedWords = _.map(taggedWords, function(el) {
        return el[1];
      });
      var NNP = !_.isNull(_.flatten(taggedWords).join(' ').match(/NN/));
      var NN_VB = !_.isNull(_.flatten(taggedWords).join(' ').match(/(NN.?|PRP) VB[ZP]/));
      //if (NNP & NN_VB) 
      //console.log(el, taggedWords.join(' '))
      return NNP & NN_VB;
    });
    sentences = _.map(sentences, function(el) {
      return el.replace(/ +/g, ' ').replace(/\[.*\]/g,'').trim();
    });
    console.log(sentences.length);
    //console.log(sentences);
    dfd.resolve('Startup idea: ' + _.sample(sentences, 1));
   
  });
  return dfd.promise();
}

function tweet() {
  generate().then(function(myTweet) {
    if (!wordfilter.blacklisted(myTweet)) {
      console.log(myTweet);
      T.post('statuses/update', { status: myTweet }, function(err, reply) {
        if (err) {
          console.log('error:', err);
        }
        else {
          console.log('reply:', reply);
        }
      });
    }
  });
}

tweet();
