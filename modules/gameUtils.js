// Shared utilities for raffle & Decoy games
Object.assign(globalThis, require("kolmafia"));

// Rhino Java timers
var Timer     = Packages.java.util.Timer;
var TimerTask = Packages.java.util.TimerTask;

// Game duration (minutes)
var GAME_TIME = 5;

// Full list of ticket items (same as original chatbot.js ticketList)
var ticketNames = [
  "red drunki-bear", "yellow drunki-bear", "green drunki-bear",
  "gnocchetti di Nietzsche", "glistening fish meat",
  "gingerbread nylons", "ghostly ectoplasm", "frozen danish",
  "frat bra", "frat bro", "frat brah", "vampyric workshed item",
  "solid asbestos box", "solid linoleum box", "solid chrome box",
  "cryptic puzzle box", "refrigerated biohazard container",
  "miniature coffin", "black velvet box"
];

// Pick a random ticket name
function getRandomTicketName() {
  return ticketNames[Math.floor(Math.random() * ticketNames.length)];
}

// Parse prize strings like "50k", "1m", "50000"
function parsePrize(str) {
  if (!str) return 0;
  var m = str.trim().match(/^(\d+)([kKmM]?)$/);
  if (!m) return 0;
  var num = parseInt(m[1], 10);
  var suf = m[2].toLowerCase();
  if (suf === "k") num *= 1000;
  if (suf === "m") num *= 1000000;
  return num;
}

// Check funding (public pool + personal) and deduct prize. Returns true if ok.
function checkAndDeductFunds(sender, prize, globalObj) {
  // admin bypass
  if (sender === "ggar") {
    return true;
  }
  // init usage
  globalObj.publicPoolUsage = globalObj.publicPoolUsage || {};
  var key = sender.toLowerCase();
  if (!globalObj.publicPoolUsage[key] || globalObj.publicPoolUsage[key].date !== todayStr()) {
    globalObj.publicPoolUsage[key] = { date: todayStr(), used: 0 };
  }
  var used = globalObj.publicPoolUsage[key].used || 0;
  // try public pool (300k/day)
  if (used + prize <= 300000 && (globalObj.publicPool || 0) >= prize) {
    globalObj.publicPool -= prize;
    globalObj.publicPoolUsage[key].used += prize;
    return true;
  }
  // try personal allocation
  globalObj.donorTable = globalObj.donorTable || {};
  var donor = globalObj.donorTable[key] || { total: 0, allocated: 0 };
  if (donor.allocated >= prize) {
    donor.allocated -= prize;
    globalObj.donorTable[key] = donor;
    return true;
  }
  return false;
}

// Put a ticket for sale at 1 meat, qty quantity
// Returns the Item object used
function putTicketInStore(qty) {
  refreshShop();
  var name = getRandomTicketName();
  var item = Item.get(name);
  if (itemAmount(item) < qty) {
    buy(qty, item);
  }
  // clear previous listing
  try { takeShop(item); } catch(e) {}
  putShopConfirm(1, 0, qty, item);
  return item;
}

// Parse shop log and return unique buyer list (lowercase)
function getUniqueBuyers() {
  var log = getShopLog();
  var seen = {};
  log.forEach(function(line) {
    var m = line.match(/\d\d:\d\d:\d\d (.*?) bought/);
    if (m) seen[m[1].toLowerCase()] = true;
  });
  return Object.keys(seen);
}

// Award prizes: winners = [{player,points},...], sorted desc by points
// Prize distribution: 60%, 20%, 10%, remainder to jackpot
// On tie, split that share evenly among tied players.
function awardPrizes(winners, prize, chatGames, sendKmail, globalObj) {
  if (!winners || winners.length === 0) {
    chatGames("/games No winners.");
    return;
  }
  var shares = [0.60, 0.20, 0.10];
  var awarded = 0;
  // group by points
  var byPoints = {};
  winners.forEach(function(w, idx) {
    if (idx < 3) {
      byPoints[w.points] = byPoints[w.points] || [];
      byPoints[w.points].push(w.player);
    }
  });
  var ptsSorted = Object.keys(byPoints).map(Number).sort(function(a,b){return b-a;});
  var messages = [];
  // allocate top 3
  for (var i = 0; i < ptsSorted.length && i < 3; i++) {
    var pts = ptsSorted[i];
    var players = byPoints[pts];
    var share = Math.floor(prize * shares[i]);
    var per = Math.floor(share / players.length);
    players.forEach(function(p){
      sendKmail(p, "You placed in the game! You receive " + numberWithCommas(per) + " meat.", per, '"game prize"');
      messages.push(p + " gets " + numberWithCommas(per));
    });
    awarded += per * players.length;
  }
  // remainder to jackpot
  var remainder = prize - awarded;
  globalObj.jackpot = (globalObj.jackpot || 0) + remainder;
  globalObj.jackpotStreak = (globalObj.jackpotStreak || 0) + 1;
  messages.push(numberWithCommas(remainder) + " meat added to jackpot");
  chatGames("/games " + messages.join("; "));
}

module.exports = {
  Timer,
  TimerTask,
  GAME_TIME,
  parsePrize,
  checkAndDeductFunds,
  putTicketInStore,
  getUniqueBuyers,
  awardPrizes
};