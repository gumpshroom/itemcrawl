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

function startRaffle(host, prize, globalObj, chatGames, sendKmail) {
  if (state.active) {
    chatPrivate(host, "A raffle is already running.");
    return false;
  }
  state.active = true;
  state.host   = host;
  state.prize  = prize;

  if (!utils.checkAndDeductFunds(host, prize, globalObj)) {
    chatPrivate(host, "Insufficient hosting funds.");
    state.active = false;
    return false;
  }

  state.ticketItem = utils.putTicketInStore(10000);
  chatGames("/games Raffle by " + host + ": buy tickets (1 meat) for next " + utils.GAME_TIME + "m.");

  // schedule draw with 5s buffer
  state.timer = new utils.Timer();
  state.timer.schedule(new utils.TimerTask({
    run: function() {
      drawRaffle(globalObj, chatGames, sendKmail);
    }
  }), utils.GAME_TIME * 60 * 1000 + 5000);

  return true;
}

function drawRaffle(globalObj, chatGames, sendKmail) {
  var buyers = utils.getUniqueBuyers();
  try { takeShop(state.ticketItem); } catch(e){}
  state.timer.cancel();

  if (buyers.length === 0) {
    chatGames("/games No tickets sold. Raffle cancelled.");
  } else {
    var winner = buyers[Math.floor(Math.random() * buyers.length)];
    chatGames("/games " + winner + " wins " + numberWithCommas(state.prize) + " meat!");
    sendKmail(winner, "You won the raffle!", state.prize, '"raffle prize"');
  }

  // bump stats
  globalObj.gamesCount = (globalObj.gamesCount || 0) + 1;
  bufferToFile(JSON.stringify(globalObj), "./ggamesGlobalObj.json");

  state.active = false;
}

function handleKmail(sender, body) {
  // no KMail for raffle
}

function handleChat(sender, text) {
  // optional commands
}

module.exports = {
  isActive,
  startRaffle,
  handleKmail,
  handleChat
};