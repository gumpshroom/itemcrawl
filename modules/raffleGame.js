// Raffle game module
Object.assign(globalThis, require("kolmafia"));
var utils = require("./gameUtils.js");

var state = {
  active: false,
  host: null,
  prize: 0,
  ticketItem: null,
  timer: null
};

function isActive() {
  return state.active;
}

function emergencyCleanup() {
  try {
    if (state.timer) {
      state.timer.cancel();
    }
    if (state.ticketItem) {
      takeShop(state.ticketItem);
    }
  } catch(e) {
    // Silent cleanup
  }
  resetState();
}

function resetState() {
  state.active = false;
  state.host = null;
  state.prize = 0;
  state.ticketItem = null;
  state.timer = null;
}

function startRaffle(host, prize, globalObj, chatGames, sendKmail) {
  try {
    if (state.active) {
      chatPrivate(host, "A raffle is already running.");
      return false;
    }

    if (!prize || prize <= 0) {
      chatPrivate(host, "Invalid prize amount.");
      return false;
    }

    state.active = true;
    state.host = host;
    state.prize = prize;

    if (!utils.checkAndDeductFunds(host, prize, globalObj)) {
      chatPrivate(host, "Insufficient hosting funds.");
      resetState();
      return false;
    }

    state.ticketItem = utils.putTicketInStore(10000);
    if (!state.ticketItem) {
      chatPrivate(host, "Failed to put tickets in store.");
      resetState();
      return false;
    }

    chatGames("Raffle by " + host + ": buy tickets (1 meat) for next " + utils.GAME_TIME + "m. Prize: " + utils.numberWithCommas(prize) + " meat!");

    // schedule draw with 5s buffer
    state.timer = new utils.Timer();
    state.timer.schedule(new utils.TimerTask({
      run: function() {
        try {
          drawRaffle(globalObj, chatGames, sendKmail);
        } catch(e) {
          handleRaffleError("drawRaffle", e, chatGames);
        }
      }
    }), utils.GAME_TIME * 60 * 1000 + 5000);

    return true;
  } catch(e) {
    utils.reportError("startRaffle", e, "ggar");
    resetState();
    return false;
  }
}

function drawRaffle(globalObj, chatGames, sendKmail) {
  try {
    var buyers = utils.getUniqueBuyers();
    
    try { 
      takeShop(state.ticketItem); 
    } catch(e) {
      // Shop cleanup error is non-fatal
    }
    
    if (state.timer) {
      state.timer.cancel();
    }

    if (buyers.length === 0) {
      chatGames("No tickets sold. Raffle cancelled.");
    } else {
      var winner = buyers[Math.floor(Math.random() * buyers.length)];
      chatGames(winner + " wins " + utils.numberWithCommas(state.prize) + " meat!");
      
      if (!sendKmail(winner, "You won the raffle!", state.prize, "raffle prize")) {
        chatGames("Error sending prize to " + winner + ". Admin will handle manually.");
        utils.reportError("Failed to send raffle prize to " + winner, new Error("kmail failed"), "ggar");
      }
    }

    // bump stats
    globalObj.gamesCount = (globalObj.gamesCount || 0) + 1;
    bufferToFile(JSON.stringify(globalObj), "./ggamesGlobalObj.json");

    resetState();
  } catch(e) {
    handleRaffleError("drawRaffle", e, chatGames);
  }
}

function handleRaffleError(phase, error, chatGames) {
  try {
    utils.reportError("Raffle error in " + phase, error, "ggar");
    if (chatGames) {
      chatGames("Raffle encountered an error and has been cancelled. Sorry!");
    }
    resetState();
  } catch(e) {
    // Final fallback
    resetState();
  }
}

function handleKmail(sender, body) {
  // no KMail handling for raffle
}

function handleChat(sender, text) {
  // no special chat handling for raffle
}

module.exports = {
  isActive: isActive,
  startRaffle: startRaffle,
  handleKmail: handleKmail,
  handleChat: handleChat,
  emergencyCleanup: emergencyCleanup
};