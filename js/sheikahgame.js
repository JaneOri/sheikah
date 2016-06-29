
var acceptCharsRx = /^[a-pr-z0-9 ]+$/gi; // font also has '/' and '_' buuuut not using for now
var rxTest = function ( rx, val ) {
  rx.lastIndex = 0; //fix stupid regexp caveat with global flag
  return rx.test( val );
};
var fcs = function ( fn ) { //functionalCommentString
  /*!Function By James Atherton - http://geckocodes.org/?hacker=James0x57 */
  /*!You are free to copy and alter however you'd like so long as you leave the credit intact! =)*/
  return fn.toString().replace( /^(\r?\n|[^\/])*\/\*!?(\r?\n)*|\s*\*\/(\r|\n|.)*$/gi, "" );
};

var termCache = new can.Map();

can.Component.extend({
  tag: "game-bg",
  template: can.stache( "" ),
  viewModel: {
    define: {
      randomBg: {
        get: function () {
          var bgs = this.attr( "backgrounds" );
          var rand = ~~( Math.random() * bgs.length );
          return bgs[ rand ];
        }
      }
    },
    backgrounds: [
      "images/0.jpg",
      "images/1.jpg",
      "images/2.jpg",
      "images/3.jpg",
      "images/4.jpg",
      "images/5.jpg",
      "images/6.jpg",
      "images/7.jpg"
    ]
  },
  events: {
    init: function ( $el ) {
      var vm = this.viewModel;
      vm.attr( "$el", $el );
      $el.css({
        backgroundImage: 'url( "' + vm.attr( "randomBg" ) + '" )'
      });
    }
  }
});


var gameItemTemplate = fcs(function(){/*!

  {{#is display "sheikah"}}
    <div class="hylianSymbols-sheikah"></div>
  {{else}}
    <div class="learn">{{display}}</div>
  {{/is}}

  {{#if reveal}}
    <div class="reveal">{{display}}</div>
  {{/if}}

  {{#if streak}}
    <div title="streak" class="streak {{#if streakIsNegative}}negative{{/if}}">{{streak}}</div>
  {{/if}}

*/});

can.Component.extend({
  tag: "game-item",
  template: can.stache( gameItemTemplate ),
  viewModel: {
    define: {
      streakIsNegative: {
        get: function () {
          return ( this.attr( "streak" ) + "" ).indexOf( "-" ) === 0;
        }
      }
    }
  },
  events: {
    init: function ( $el ) {
      var vm = this.viewModel;
    }
  }
});


var gameTemplate = fcs(function(){/*!

  <i class="top-left hylianSymbols-sheikah"></i>
  <i class="top-right hylianSymbols-sheikah-pirates-ww"></i>
  <i class="bottom-left hylianSymbols-sheikah-impa-ww"></i>
  <div class="learn-container">
    {{#each termLetters}}
      <span class="{{^is gameState "won"}}learn{{/is}} {{letterState( @index )}}">{{.}}</span>
    {{/each}}
  </div>
  <game-item
    class="{{gameItemDisplayState}}"
    {display}="currentLetter"
    {reveal}="revealLetter"
    {streak}="currentLetterStreak"
  ></game-item>
  <div class="info-box">
    <div class="knob-container">
      <input id="round-timer" type="text" value="0">
    </div>
    <div class="term-streak">
      Term Streak: <span class="streak {{#if isNegative( currentTermStreak )}}negative{{/if}}">{{currentTermStreak}}</span>
    </div>
    <div class="game-count">
      Game Count: <span class="streak">{{gameCount}}</span>
    </div>
    <div class="running-score">
      Running score: <span class="streak">{{score}}</span>
    </div>
    <div class="instruction">
      Type the current letter shown on the left.
    </div>
  </div>
  <div class="options-link">Options <i class="hylianSymbols-hylian"></i></div>

*/});

can.Component.extend({
  tag: "game-container",
  template: can.stache( gameTemplate ),
  viewModel: {
    define: {
      gameCount: {
        value: function () {
          var gameCount = parseInt( localStorage && localStorage.getItem( "gameCount" ) || "0", 10 );

          return gameCount;
        }
      },
      currentTerm: {
        get: function ( lastSet ) {
          return lastSet || this.attr( "randomTerm" );
        }
      },
      termLetters: {
        get: function () {
          return this.attr( "currentTerm" ).split( "" );
        }
      },
      currentLetter: {
        get: function () {
          var currentLetterIndex = this.attr( "currentLetterIndex" );
          if ( currentLetterIndex < 0 ) {
            return "sheikah";
          }
          return this.attr( "termLetters" )[ currentLetterIndex ];
        }
      },
      currentTermStreak: {
        get: function () {
          var termInfo = this.getTermInfo( this.attr( "currentTerm" ) );
          return termInfo.attr( "streak" );
        }
      },
      currentLetterStreak: {
        get: function () {
          var currentLetterIndex = this.attr( "currentLetterIndex" );
          var currentLetter = this.attr( "currentLetter" );

          if ( currentLetterIndex < 0 || currentLetter === " " || !currentLetter ) {
            return null;
          }

          var termInfo = this.getTermInfo( currentLetter );
          return termInfo.attr( "streak" );
        }
      },
      revealLetter: {
        get: function () {
          var letter = this.attr( "currentLetter" );
          var gs = this.attr( "gameState" );
          var currentLetterIndex = this.attr( "currentLetterIndex" );

          if ( currentLetterIndex > -1 && gs === "won" || gs === "failed" && letter !== " " ) {
            return letter;
          }
          return null;
        }
      },
      gameItemDisplayState: {
        get: function () {
          var state = "";
          var gameState = this.attr( "gameState" );

          if ( this.attr( "currentLetter" ) === " " ) {
            state = "empty";
          }
          if ( gameState === "failed" ) {
            state = "bad";
          } else if ( gameState === "won" ) {
            state = "active";
          }

          return state;
        }
      },
      score: {
        value: function () {
          var score = parseInt( localStorage && localStorage.getItem( "score" ) || "0", 10 );

          return score;
        }
      },
      customTerms: {
        value: function () {
          var termString = localStorage && localStorage.getItem( "customTerms" ) || "";
          var termList = termString.split( "`" );
          if ( !termList[ 0 ] ) {
            termList = [];
          }
          return termList;
        }
      },
      disabledTerms: {
        value: function () {
          var termString = localStorage && localStorage.getItem( "disabledTerms" ) || "";
          var termList = termString.toLowerCase().split( "`" );
          if ( !termList[ 0 ] ) {
            termList = [];
          }
          return termList;
        }
      },
      randomTerm: {
        get: function () {
          var terms = this.attr( "terms" );
          var termsLen = terms.length;
          var customTerms = this.attr( "customTerms" );
          var customTermsLen = customTerms.length;
          var pick = -1;
          var term = "";
          var validPick = false;
          var infLoopCatch = 0;
          // bind randomness to the gameCount
          var gameCount = this.attr( "gameCount" );

          do {
            if ( infLoopCatch > 90 ) {
              return "Enable More Terms";
            }

            pick = ~~( Math.random() * ( termsLen + customTermsLen ) );

            if ( pick >= termsLen ) {
              pick = pick - termsLen;
              term = customTerms[ pick ];
            } else {
              term = terms[ pick ];
            }

            validPick = this.validTerm( term );

            infLoopCatch++;
          } while ( !validPick );

          return term;
        }
      },

      roundTimeLimit: {
        get: function () {
          var currentTerm = this.attr( "currentTerm" );
          var baseTime = 25000;
          var timeLimit = baseTime + 250 * currentTerm.length;
          return timeLimit;
        }
      }
    },

    terms: terms, //global array in listofterms.js
    gameState: 0, // "won", "failed", "paused", 0 ( normal )
    currentLetterIndex: 0,

    isNegative: function ( val ) {
      return parseInt( val, 10 ) < 0;
    },

    getStreak: function ( term ) {
      var termLC = term.toLowerCase();
      var streak = localStorage.getItem( "streak_" + termLC ) || "0";
      return parseInt( streak, 10 );
    },

    updateStreak: function ( term, correct ) {
      var termInfo = this.getTermInfo( term );
      var streak = termInfo.attr( "streak" );

      if ( correct && streak > -1 ) {
        streak++;
      } else if ( correct ) {
        streak = 1;
      } else if ( !correct && streak < 1 ) {
        streak--;
      } else if ( !correct ) {
        streak = -1;
      }

      localStorage.setItem( "streak_" + termInfo.attr( "termLC" ), streak );
      termInfo.attr( "streak", streak );

      return streak;
    },

    getTermInfo: function ( term ) {
      var termLC = term.toLowerCase();
      if ( termCache.attr( termLC ) ) {
        return termCache.attr( termLC );
      }
      var termInfo = {
        term: term.length === 1 ? term.toUpperCase() : term,
        termLC: termLC,
        streak: this.getStreak( term ),
        enabled: true
      };
      if ( this.attr( "disabledTerms" ).indexOf( termLC ) !== -1 ) {
        termInfo.enabled = false;
      }
      termCache.attr( termLC, termInfo );
      return termCache.attr( termLC );
    },

    termValidRxCheck: function ( term ) {
      return rxTest( acceptCharsRx, term );
    },

    termValidLetterCheck: function ( term ) {
      var termLetters = term.split( "" );
      var termInfo, i;
      for ( i = 0; i < termLetters.length; i++ ) {
        termInfo = this.getTermInfo( termLetters[ i ] );
        if ( !termInfo.enabled ) {
          return false;
        }
      }
      return true;
    },

    validTerm: function ( term ) {
      var termInfo = this.getTermInfo( term );

      if ( !termInfo.enabled ) {
        return false;
      }

      if ( !this.termValidRxCheck( term ) ) {
        return false;
      }

      return this.termValidLetterCheck( term );
    },

    letterState: function ( loopIndex ) {
      var state = "";
      var x = this.attr( "currentLetterIndex" );
      var gameState = this.attr( "gameState" );

      if ( gameState === "won" || loopIndex < x ) {
        state = "correct";
      } else if ( gameState === "failed" ) {
        state = "incorrect";
      } else if ( loopIndex === x ) {
        state = "current";
      }

      return state;
    },

    checkInput: function ( inputChar ) {
      if ( this.attr( "gameState" ) ) {
        return;
      }

      var currentTerm = this.attr( "currentTerm" );
      var currentLetter = this.attr( "currentLetter" );
      var gotItRight = currentLetter.toLowerCase() === inputChar.toLowerCase();
      var currentLetterIndex = this.attr( "currentLetterIndex" );
      var isLastLetter = ( currentTerm.length - 1 ) === currentLetterIndex;

      var score = this.attr( "score" );
      score += gotItRight ? 1 : -1;
      localStorage.setItem( "score", score );
      this.attr( "score", score );

      if ( gotItRight ) {
        this.updateStreak( currentLetter, gotItRight );
      }

      if ( gotItRight && isLastLetter ) {
        this.attr( "gameState", "won" );
        if ( currentTerm.length > 1 ) {
          this.updateStreak( currentTerm, gotItRight );
        }
        this.winSequenceStart();
      }

      if ( gotItRight && !isLastLetter ) {
        this.attr( "currentLetterIndex", currentLetterIndex + 1 );
      }

      if ( !gotItRight ) {
        this.attr( "gameState", "failed" );
        this.updateStreak( currentLetter, gotItRight );
        if ( currentTerm.length > 1 ) {
          this.updateStreak( currentTerm, gotItRight );
        }

        setTimeout( this.newGame.bind( this ), 2000 );
      }
    },

    winSequenceStart: function () {
      this.attr( "currentLetterIndex", 0 );
      setTimeout( this.winSequence.bind( this ), 175 );
    },
    winSequence: function () {
      var currentLetterIndex = this.attr( "currentLetterIndex" );
      var isLastLetter = ( this.attr( "currentTerm" ).length - 1 ) === currentLetterIndex;
      if ( isLastLetter ) {
        this.attr( "currentLetterIndex", -1 );
        setTimeout( this.newGame.bind( this ), 1000 );
      } else {
        this.attr( "currentLetterIndex", currentLetterIndex + 1 );
        setTimeout( this.winSequence.bind( this ), 175 );
      }
    },

    previousGameState: 0,
    togglePause: function () {
      var gs = this.attr( "gameState" );
      var previousGameState = this.attr( "previousGameState" );

      if ( gs === "paused" ) {
        this.attr( "gameState", previousGameState );
        this.attr( "$el" ).removeClass( "paused" );
      } else {
        this.attr( "gameState", "paused" );
        this.attr( "$el" ).addClass( "paused" );
      }
    },

    newGame: function () {
      var gameCount = parseInt( this.attr( "gameCount" ), 10 );
      this.attr( "gameCount", ++gameCount );
      localStorage.setItem( "gameCount", gameCount );
      this.attr({
        currentLetterIndex: 0,
        currentTerm: this.attr( "randomTerm" ),
        gameState: 0
      });
      this.startTimer();
    },

    startTimer: function () {
      var knob = $( "#round-timer" );
      var maxTime = this.attr( "roundTimeLimit" );

      var config = {
        min: 0,
        max: maxTime,
        readOnly: true,
        displayInput: false,
        fgColor: "#000000",
        bgColor: "#01AF47",
        width: "100%",
        thickness: 0.6
      };

      knob.trigger( "configure", config );

      knob.val( 0 ).trigger('change');
    }
  },

  events: {
    init: function ( $el ) {
      var vm = this.viewModel;
      vm.attr( "$el", $el );
      vm.attr( "functions", {
        togglePause: vm.togglePause.bind( vm ),
        getTermInfo: vm.getTermInfo.bind( vm ),
        termValidRxCheck: vm.termValidRxCheck.bind( vm ),
        termValidLetterCheck: vm.termValidLetterCheck.bind( vm )
      });
    },
    inserted: function () {
      var vm = this.viewModel;
      var knob = $( "#round-timer" );
      knob.knob({
        min: 0,
        max: 30000,
        readOnly: true,
        displayInput: false,
        fgColor: "#000000",
        bgColor: "#01AF47",
        width: "100%",
        thickness: 0.6
      });

      var interval = 50;
      setInterval( function () {
        var gameState = vm.attr( "gameState" );
        if ( gameState ) {
          //gameState is 0 when not paused/won/failed/etc
          return;
        }

        var maxTime = vm.attr( "roundTimeLimit" ) || 30000;
        var val = parseInt( knob.val(), 10 );

        val += interval;
        if ( val < 0 ) {
          val = 0;
        } else if ( val > maxTime ) {
          val = maxTime;
          //foce failure
          vm.checkInput( "`" );
        }

        knob.val( val ).trigger('change');
      }, interval );
    },
    "{document} keypress": function ( $doc, $ev ) {
      var vm = this.viewModel;
      var key = String.fromCharCode( $ev.which );
      var validGameInput = rxTest( acceptCharsRx, key );

      if ( validGameInput ) {
        vm.checkInput( key );
      }

      if ( key === "`" ) {
        vm.togglePause();
      }
    },
    ".options-link click": function () {
      var vm = this.viewModel;
      vm.togglePause();
    }
  }
});


var optionsTemplate = fcs(function(){/*!

  <div class="title">
    Options<br>
    <span class="title-info">Press ` to toggle</span>
  </div>
  <div class="pannels">
    {{#each pannels}}
      <div class="option {{#is letter currentPannel}}showing{{/is}}" ($click)="showPannel( letter )">
        <span class="option-name">{{name}}</span>
        <span class="learn">{{letter}}</span>
      </div>
    {{/each}}
  </div>
  <div class="pannel">
    {{#switch currentPannel}}
      {{#case "L"}}
        <div class="letter-list">
          {{#each cachedLetters}}
            <game-item
              class="{{termState( term )}}"
              {display}="term"
              reveal="1"
              {streak}="streak"
              ($click)="toggleTermEnabled( . )"
            ></game-item>
          {{/each}}
          <game-item {display}="" class="empty"></game-item>
          <game-item {display}="" class="empty"></game-item>
          <game-item {display}="" class="empty"></game-item>
          <game-item {display}="" class="empty"></game-item>
        </div>
      {{/case}}

      {{#case "T"}}
        <div class="term-list">
          {{#each cachedTerms}}
            <div class="entry {{termState( term )}}" ($click)="toggleTermEnabled( . )">
              <div>{{term}}</div>
            </div>
          {{/each}}
        </div>
      {{/case}}

      {{#case "C"}}
        <div class="term-list">
          <div class="customTermInput">
            Add Your Own Term<br>
          </div>
          <div class="entry empty">
            <input type="text" {($value)}="customTermInput" ($change)="addCustomTerm()" maxlength="19">
          </div>
          <div class="entry doit"><span>ADD</span></div>
          {{#each cachedCustomTerms}}
            <div class="entry {{termState( term )}}" ($click)="toggleTermEnabled( . )">
              <div>{{term}}</div>
            </div>
          {{/each}}
        </div>
      {{/case}}

      {{#case "F"}}
        <div class="fonts">
          * Sheikah -- Breath of the Wild<br>
          * Twilight Era Hylian -- Twilight Princess ( GCN )<br>
          * Gerudo -- OoT<br>
          * Ancient Hylian -- Skyward Sterm --> 4 of the characters are used twice GQ, IX, OZ, PT
        </div>
      {{/case}}

      {{#case "S"}}
        <div class="save-data">
          * clear list of custom terms<br>
          * clear list of disabled terms<br>
          * clear all streaks and scores<br>
          * delete all localStorage data
        </div>
      {{/case}}

      {{#case "A"}}
        <div class="about">
          * Sheikah script decoded by [whoever] -- link to that thread found on reddit<br>
          * Sheikah font created by <a href="https://github.com/ophereon/sheikah">ophereon</a><br>
          * Other fonts found on <a href="http://zeldauniverse.net/media/fonts/">Zelda Universe</a><br>
          * This app created by <a href="https://github.com/James0x57/sheikah">James0x57</a>, for fun.
        </div>
      {{/case}}
    {{/switch}}
  </div>

*/});

can.Component.extend({
  tag: "options-container",
  template: can.stache( optionsTemplate ),
  viewModel: {
    define: {
      cachedLetters: {
        get: function ( last ) {
          if ( last ) {
            return last;
          }
          var cachedLetters = new can.List( [] );
          if ( this.functions && typeof this.functions.getTermInfo === "function" ) {
            var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split( "" );
            for ( var i = 0; i < letters.length; i++ ) {
              cachedLetters.push( this.functions.getTermInfo( letters[ i ] ) );
            }
          }
          return cachedLetters;
        }
      },
      cachedTerms: {
        get: function ( last ) {
          if ( last ) {
            return last;
          }
          var cachedTerms = new can.List( [] );
          if ( this.functions && typeof this.functions.getTermInfo === "function" ) {
            // terms === global array in listofterms.js
            for ( var i = 0; i < terms.length; i++ ) {
              cachedTerms.push( this.functions.getTermInfo( terms[ i ] ) );
            }
          }
          return cachedTerms;
        }
      },
      cachedCustomTerms: {
        get: function ( last ) {
          if ( last ) {
            return last;
          }
          var cachedCustomTerms = new can.List( [] );
          if ( this.functions && typeof this.functions.getTermInfo === "function" ) {
            var terms = this.attr( "customTerms" );
            for ( var i = 0; i < terms.length; i++ ) {
              cachedCustomTerms.push( this.functions.getTermInfo( terms[ i ] ) );
            }
          }
          return cachedCustomTerms;
        }
      }
    },
    pannels: [
      { letter: "L", name: "Letters" },
      { letter: "T", name: "Terms" },
      { letter: "C", name: "Custom Terms" },
      { letter: "F", name: "Fonts" },
      { letter: "S", name: "Save Data" },
      { letter: "A", name: "About" }
    ],
    currentPannel: "L",
    showPannel: function ( pannelLetter ) {
      this.attr( "currentPannel", pannelLetter );
    },
    termState: function ( term ) {
      var state = ""; // "empty", "bad", "active", ""
      if ( !this.functions.termValidRxCheck( term ) ) {
        state = "bad";
      } else if ( term.length > 1 && !this.functions.termValidLetterCheck( term ) ) {
        state = "empty";
      } else if ( this.functions.getTermInfo( term ).attr( "enabled" ) ) {
        state = "active";
      }
      return state;
    },
    toggleTermEnabled: function ( termInfo ) {
      var disabledTerms = this.attr( "disabledTerms" );

      if ( termInfo.attr( "enabled" ) ) {
        termInfo.attr( "enabled", false );
        disabledTerms.push( termInfo.attr( "termLC" ) );
        localStorage.setItem( "disabledTerms", disabledTerms.join( "`" ) );
      } else {
        termInfo.attr( "enabled", true );
        disabledTerms.splice( disabledTerms.indexOf( termInfo.attr( "termLC" ) ), 1 );
        localStorage.setItem( "disabledTerms", disabledTerms.join( "`" ) );
      }
    },
    addCustomTerm: function () {
      var val = this.attr( "customTermInput" );
      this.attr( "customTermInput", "" );
      if ( val.length > 1 && this.functions.termValidRxCheck( val ) ) {
        this.attr( "customTerms" ).push( val );
        this.attr( "cachedCustomTerms" ).push( this.functions.getTermInfo( val ) );
        localStorage.setItem( "customTerms", this.attr( "customTerms" ).join( "`" ) );
      } else {
        //TODO: give user feedback
      }
    }
  },
  events: {
    init: function ( $el ) {
      var vm = this.viewModel;
    },
    ".title click": function () {
      var vm = this.viewModel;
      if ( vm.functions && typeof vm.functions.togglePause === "function" ) {
        vm.functions.togglePause();
      }
    },
    ".term-list .entry > :first-child mouseenter": function ( $el ) {
      $el.addClass( "learn" );
    },
    ".term-list .entry > :first-child mouseleave": function ( $el ) {
      $el.removeClass( "learn" );
    }
  }
});

