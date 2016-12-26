/**
 * This part is responsible for loading and saving player state.
 * State includes:
 * - Current time
 * - Playback rate
 * - Volume
 * - Muted
 *
 * State is loaded after VideoJs player is fully initialized.
 * State is saved at certain events.
 */

/** Run a callback when DOM is fully loaded */
var domReady = function(callback) {
  if (document.readyState === "interactive" || document.readyState === "complete") {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback);
  }
};

var player_state = {
  'volume': {{ player_state.volume }},
  'currentTime': {{ player_state.current_time }},
  'playbackRate': {{ player_state.playback_rate }},
  'muted': {{ player_state.muted | yesno:"true,false" }},
};

var xblockUsageId = window.location.hash.slice(1);

/** Restore default or previously saved player state */
var setInitialState = function (player, state) {
    var stateCurrentTime = state.currentTime;
    var videoXblockState = localStorage.getItem('videoXblockState');
    if (videoXblockState){
        videoXblockState=JSON.parse(videoXblockState);
        if (videoXblockState['{{ video_player_id }}'] && videoXblockState[
            '{{ video_player_id }}'] > stateCurrentTime) {
            stateCurrentTime = videoXblockState['{{ video_player_id }}'];
        }
    }
    if (stateCurrentTime > 0) {
        player.currentTime(stateCurrentTime);
    }
    player
        .volume(state.volume)
        .muted(state.muted)
        .playbackRate(state.playbackRate);
};

/**
 * Save player state by posting it in a message to parent frame.
 * Parent frame passes it to a server by calling VideoXBlock.save_state() handler.
 */
var saveState = function(){
  var player = this;
  var new_state = {
    'volume': player.volume(),
    'currentTime': player.ended()? 0 : Math.floor(player.currentTime()),
    'playbackRate': player.playbackRate(),
    'muted': player.muted(),
  };

  if (JSON.stringify(new_state) !== JSON.stringify(player_state)) {
    console.log('Starting saving player state');
    player_state = new_state;
      parent.postMessage({'action': 'save_state', 'state': new_state, 'xblockUsageId': xblockUsageId},
          document.location.protocol + "//" + document.location.host);
  }
};

/**
 *  Save player progress in browser's local storage.
 *  We need it when user is switching between tabs.
 */
var saveProgressToLocalStore = function(){
  var player = this;
  var videoXblockState = localStorage.getItem('videoXblockState');
  if(videoXblockState == undefined){
      videoXblockState = '{}';
  }
  videoXblockState = JSON.parse(videoXblockState);
  videoXblockState['{{ video_player_id }}'] = player.ended() ? 0 : Math.floor(player.currentTime());
  localStorage.setItem('videoXblockState',JSON.stringify(videoXblockState));
};

domReady(function() {
  videojs('{{ video_player_id }}').ready(function() {
    var player = this;

    // Restore default or previously saved player state
    setInitialState(player, player_state);

    player
      .on('timeupdate', saveProgressToLocalStore)
      .on('volumechange', saveState)
      .on('ratechange', saveState)
      .on('play', saveState)
      .on('pause', saveState)
      .on('ended', saveState);




  });

});
