var Playlists = new Meteor.Collection("playlists"),
    PlaylistItems = new Meteor.Collection("playlist_items"),
    Player = new Player()

var query = PlaylistItems.find({});

var handle = query.observe({
  changed: function (playlistItem) {

  	var pli = playlistItem;
  	if (!pli.playing_since) return;

	var timeleft = pli.duration - pli.position;
	var timePassedSinceStart = Number(new Date()) - pli.playing_since;

	var fiber = Fiber(function() {
		checkForSkipping(pli._id);
	});

	setTimeout(function() { fiber.run() },
		timeleft - timePassedSinceStart + 1);

  }
});

function checkForSkipping(playlistItemId) {
	var pli = PlaylistItems.findOne(playlistItemId);
 
  	var isPastEnd = !!pli.playing_since &&
  					((Number(new Date()) - pli.playing_since + pli.position)) > pli.duration;
    if(isPastEnd) {
    	PlaylistItems.update(pli._id, { $set: { playing_since: null, position: null } });
		var nextSibling = findNextSibling(pli);
		if (nextSibling) Player.play(nextSibling);
		
    }
}

function findNextSibling(playlistItem) {
	var pli = playlistItem;
	var siblings = PlaylistItems.find({ playlist_id: pli.playlist_id}).fetch();
	var lastHasReachedEnd = false;
	for (var i=0;i<siblings.length;i++) {
		var s = siblings[i];

		if(lastHasReachedEnd)
			return s;
		
		if (s._id == pli._id)
			lastHasReachedEnd = true;
	}
	return null;
}



