// Shared utilities for raffle & Decoy games
Object.assign(globalThis, require("kolmafia"));

// Rhino Java timers
importPackage(java.util.Timer)
importPackage(java.util.TimerTask)

// Game duration (minutes)
var GAME_TIME = 5;

// Full list of ticket items
var ticketNames = [
  "red drunki-bear", "yellow drunki-bear", "green drunki-bear",
  "gnocchetti di Nietzsche", "glistening fish meat",
  "gingerbread nylons", "ghostly ectoplasm", "frozen danish",
  "frat brats", "expired MRE", "enticing mayolus", "eagle's milk",
  "crudles", "cream of pointy mushroom soup", "chaos popcorn",
  "candy carrot", "bowl of prescription candy", "bowl of maggots",
  "badass pie", "alien sandwich", "small box", "large box",
  "jumping horseradish", "perfect cosmopolitan", "perfect dark and stormy",
  "perfect mimosa", "perfect negroni", "perfect old-fashioned",
  "perfect paloma", "Sacramento wine", "hacked gibson",
  "red pixel potion", "octolus oculus", "spooky hi mein",
  "stinky hi mein", "hot hi mein", "cold hi mein", "sleazy hi mein",
  "zombie", "elemental caipiroska", "perfect ice cube",
  "golden gum", "snow berries", "Game Grid ticket",
  "scrumptious reagent", "milk of magnesium", "tiny bottle of absinthe",
  "Bloody Nora", "llama lama gong", "van key", "tattered scrap of paper"
];

function todayStr() {
  var d = new Date();
  var year = d.getFullYear();
  var month = String(d.getMonth() + 1);
  if (month.length === 1) month = "0" + month;
  var day = String(d.getDate());
  if (day.length === 1) day = "0" + day;
  return year + "-" + month + "-" + day;
}

function numberWithCommas(x) {
  if (typeof x !== 'number') x = parseInt(x, 10) || 0;
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function reportError(context, error, adminUser) {
  try {
    var errorMsg = "ERROR in " + context + ": " + (error.message || error.toString());
    var stackTrace = error.stack || "No stack trace available";
    var fullReport = errorMsg + "\n\nStack Trace:\n" + stackTrace + "\n\nTime: " + new Date().toISOString();
    
    print("Game system error: " + errorMsg);
    
    // Send error report to admin
    kmail(adminUser, "Game Bot Error Report", 0, fullReport);
  } catch(e) {
    print("Failed to report error: " + e.message);
  }
}

// Pick a random ticket name
function getRandomTicketName() {
  return ticketNames[Math.floor(Math.random() * ticketNames.length)];
}

// Parse prize strings like "50k", "1m", "50000"
function parsePrize(str) {
  if (!str) return 0;
  var cleaned = str.toString().trim().toLowerCase();
  var m = cleaned.match(/^(\d+(?:\.\d+)?)([km]?)$/);
  if (!m) return 0;
  var num = parseFloat(m[1]);
  var suf = m[2];
  if (suf === "k") num *= 1000;
  if (suf === "m") num *= 1000000;
  return Math.floor(num);
}

// Check funding (public pool + personal) and deduct prize. Returns true if ok.
function checkAndDeductFunds(sender, prize, globalObj) {
  try {
    // admin bypass
    if (sender === "ggar") {
      return true;
    }
    
    if (!prize || prize <= 0) return false;
    
    // init usage
    globalObj.publicPoolUsage = globalObj.publicPoolUsage || {};
    var key = sender.toLowerCase();
    var today = todayStr();
    
    if (!globalObj.publicPoolUsage[key] || globalObj.publicPoolUsage[key].date !== today) {
      globalObj.publicPoolUsage[key] = { date: today, used: 0 };
    }
    
    var used = globalObj.publicPoolUsage[key].used || 0;
    
    // try public pool (300k/day per user)
    if (used + prize <= 300000 && (globalObj.publicPool || 0) >= prize) {
      globalObj.publicPool = (globalObj.publicPool || 0) - prize;
      globalObj.publicPoolUsage[key].used = used + prize;
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
  } catch(e) {
    reportError("checkAndDeductFunds", e, "ggar");
    return false;
  }
}

// Put a ticket for sale at 1 meat, qty quantity
// Returns the Item object used, or null on failure
function putTicketInStore(qty) {
  try {
    refreshShop();
    var name = getRandomTicketName();
    var item = Item.get(name);
    
    if (!item || item.toString() === "none") {
      throw new Error("Invalid item: " + name);
    }
    
    if (itemAmount(item) < qty) {
      if (!buy(qty, item)) {
        throw new Error("Failed to buy " + qty + " " + name);
      }
    }
    
    // clear previous listing if any
    try { 
      takeShop(item); 
    } catch(e) {
      // Not a problem if item wasn't in shop
    }
    
    if (!putShop(1, 0, qty, item)) {
      throw new Error("Failed to put item in shop");
    }
    
    return item;
  } catch(e) {
    reportError("putTicketInStore", e, "ggar");
    return null;
  }
}

// Parse shop log and return unique buyer list (lowercase)
function getUniqueBuyers() {
  try {
    var log = getShopLog();
    var seen = {};
    
    for (var i = 0; i < log.length; i++) {
      var line = log[i];
      var m = line.match(/\d\d:\d\d:\d\d (.*?) bought/);
      if (m) {
        var buyer = m[1].toLowerCase().trim();
        if (buyer && buyer !== "none") {
          seen[buyer] = true;
        }
      }
    }
    
    var result = [];
    for (var buyer in seen) {
      if (seen.hasOwnProperty(buyer)) {
        result.push(buyer);
      }
    }
    
    return result;
  } catch(e) {
    reportError("getUniqueBuyers", e, "ggar");
    return [];
  }
}

// Award prizes: winners = [{player,points},...], sorted desc by points
// Prize distribution: 60%, 20%, 10%, remainder to jackpot
function awardPrizes(winners, prize, chatGames, sendKmail, globalObj) {
  try {
    if (!winners || winners.length === 0) {
      chatGames("No winners this round.");
      return;
    }
    
    var shares = [0.60, 0.20, 0.10];
    var awarded = 0;
    var messages = [];
    
    // group by points for tie handling
    var pointGroups = {};
    for (var i = 0; i < Math.min(winners.length, 3); i++) {
      var w = winners[i];
      var pts = w.points;
      if (!pointGroups[pts]) pointGroups[pts] = [];
      pointGroups[pts].push(w.player);
    }
    
    var sortedPoints = [];
    for (var pts in pointGroups) {
      if (pointGroups.hasOwnProperty(pts)) {
        sortedPoints.push(parseInt(pts, 10));
      }
    }
    sortedPoints.sort(function(a, b) { return b - a; });
    
    var positionIndex = 0;
    
    // allocate top 3 positions
    for (var i = 0; i < sortedPoints.length && positionIndex < 3; i++) {
      var pts = sortedPoints[i];
      var players = pointGroups[pts];
      
      if (players && players.length > 0) {
        var share = Math.floor(prize * shares[positionIndex]);
        var perPlayer = Math.floor(share / players.length);
        
        for (var j = 0; j < players.length; j++) {
          var player = players[j];
          if (sendKmail(player, "You placed in the game! You receive " + numberWithCommas(perPlayer) + " meat.", perPlayer, "game prize")) {
            messages.push(player + " gets " + numberWithCommas(perPlayer));
            awarded += perPlayer;
          } else {
            messages.push(player + " prize failed - admin notified");
            reportError("Prize payment failed to " + player, new Error("kmail failed"), "ggar");
          }
        }
        
        positionIndex += players.length;
      }
    }
    
    // remainder to jackpot
    var remainder = prize - awarded;
    if (remainder > 0) {
      globalObj.jackpot = (globalObj.jackpot || 0) + remainder;
      globalObj.jackpotStreak = (globalObj.jackpotStreak || 0) + 1;
      messages.push(numberWithCommas(remainder) + " meat added to jackpot");
    }
    
    if (messages.length > 0) {
      chatGames(messages.join("; "));
    }
  } catch(e) {
    reportError("awardPrizes", e, "ggar");
    chatGames("Error distributing prizes - admin has been notified.");
  }
}

module.exports = {
  Timer: Timer,
  TimerTask: TimerTask,
  GAME_TIME: GAME_TIME,
  todayStr: todayStr,
  numberWithCommas: numberWithCommas,
  reportError: reportError,
  parsePrize: parsePrize,
  checkAndDeductFunds: checkAndDeductFunds,
  putTicketInStore: putTicketInStore,
  getUniqueBuyers: getUniqueBuyers,
  awardPrizes: awardPrizes
};
