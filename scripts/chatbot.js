Object.assign(globalThis, require("kolmafia"));
const raffle = require("../modules/raffleGame.js");
const decoy  = require("../modules/decoyGame.js");
const utils  = require("../modules/gameUtils.js");

// load or init globalObj
var oldData = fileToBuffer("./ggamesGlobalObj.json");
var globalObj = oldData ? JSON.parse(oldData) : {};
globalObj.gamesCount      = globalObj.gamesCount || 0;
globalObj.donorTable      = globalObj.donorTable || {};
globalObj.publicPool      = globalObj.publicPool || 0;
globalObj.publicPoolUsage = globalObj.publicPoolUsage || {};
globalObj.jackpotStreak   = globalObj.jackpotStreak || 0;
globalObj.jackpot         = globalObj.jackpot || 0;

function todayStr() {
  var d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function fetchQnA() {
  var prompt = encodeURIComponent(
    "Return JSON {question:'...', realAnswer:'...'} for an obscure trivia question."
  );
  var raw = visitUrl("https://api.your-gemini-endpoint?prompt=" + prompt);
  try { return JSON.parse(raw); }
  catch(e) {
    return { question:"What color is the sky at noon?", realAnswer:"blue" };
  }
}

function sendKmail(to, msg, meat, note) {
  return kmail(to, msg, meat, note);
}

function chatGames(msg) {
  // KoLmafia method to send to /games
  chatGamesMacro(msg);
}

function main(sender, message) {
  // 1) KMail handling
  if (message.includes("New message received from")) {
    var from = message.match(/New message received from ([^\s]+)/)[1];
    var bodyMatch = visitUrl("messages.php").match(/<blockquote>([\s\S]*?)<\/blockquote>/);
    var body = bodyMatch ? bodyMatch[1].replace(/<br>/g,"\n").trim() : "";
    raffle.handleKmail(from, body);
    decoy.handleKmail(from, body);
    // persist donor/public usage
    bufferToFile(JSON.stringify(globalObj), "./ggamesGlobalObj.json");
    return;
  }

  // 2) Public chat
  var text = message.replace(/^<[^>]+>/,"").trim();
  raffle.handleChat(sender, text);
  decoy.handleChat(sender, text);

  // 3) Commands
  var parts = text.split(" ");
  var cmd = parts.shift().toLowerCase();

  // central one-game-at-a-time guard
  if ((cmd === "host" || cmd === "decoy") && (raffle.isActive() || decoy.isActive())) {
    chatPrivate(sender, "Another game is already running. Please wait.");
    return;
  }

  switch(cmd) {
    case "host":
      var prize = utils.parsePrize(parts[0]);
      raffle.startRaffle(sender, prize, globalObj, chatGames, sendKmail);
      break;

    case "decoy":
      var prize = utils.parsePrize(parts[0]);
      decoy.startDecoy(sender, prize, globalObj, chatGames, chatPrivate, sendKmail, fetchQnA);
      break;

    case "roll":
      var spec = parts[0] || "";
      var m = spec.match(/^(\d+)\s*[dDxX]\s*(\d+)$/);
      if (m) {
        var count = parseInt(m[1],10), sides = parseInt(m[2],10);
        var rolls = [], total = 0;
        for (var i=0;i<count;i++){
          var r = Math.floor(Math.random()*sides)+1;
          rolls.push(r); total += r;
        }
        chatPrivate(sender, "Rolled: ["+rolls.join(",")+"] = " + total);
      } else {
        chatPrivate(sender, "Usage: roll NdM or NxM (case-insensitive), e.g. 2d6 or 3x4");
      }
      break;

    default:
      // no-op or other commands
      break;
  }
}

module.exports = { main };