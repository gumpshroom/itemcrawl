Object.assign(globalThis, require("kolmafia"));
const raffle = require("./modules/raffleGame.js");
const decoy  = require("./modules/decoyGame.js");
const utils  = require("./modules/gameUtils.js");

// load or init globalObj
var oldData = fileToBuffer("./ggamesGlobalObj.json");
var auth = fileToBuffer("./auth.json")
auth = auth ? JSON.parse(auth) : {};
var globalObj = oldData ? JSON.parse(oldData) : {};
globalObj.gamesCount      = globalObj.gamesCount || 0;
globalObj.donorTable      = globalObj.donorTable || {};
globalObj.publicPool      = globalObj.publicPool || 0;
globalObj.publicPoolUsage = globalObj.publicPoolUsage || {};
globalObj.jackpotStreak   = globalObj.jackpotStreak || 0;
globalObj.jackpot         = globalObj.jackpot || 0;

importPackage(java.net);
importPackage(java.io);

function postJSON(urlString, dataObj) {
  // Convert data object to JSON
  let jsonData = JSON.stringify(dataObj);

  // Open connection
  let url = new URL(urlString);
  let connection = url.openConnection();
  connection.setRequestMethod("POST");

  // Set headers
  connection.setRequestProperty("Content-Type", "application/json");
  connection.setDoOutput(true);

  // Write the JSON data
  let writer = new OutputStreamWriter(connection.getOutputStream(), "UTF-8");
  writer.write(jsonData);
  writer.flush();
  writer.close();

  // Read response
  let reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), "UTF-8"));
  let response = "";
  let line;
  while ((line = reader.readLine()) != null) {
    response += line + "\n";
  }
  reader.close();

  return response;
}

function todayStr() {
  var d = new Date();
  var year = d.getFullYear();
  var month = String(d.getMonth() + 1);
  if (month.length === 1) month = "0" + month;
  var day = String(d.getDate());
  if (day.length === 1) day = "0" + day;
  return year + "-" + month + "-" + day;
}

function fetchQnA() {
  try {
    // Replace with your actual Gemini API endpoint and key
    var prompt = "Return only valid JSON in this exact format: {\"question\":\"your trivia question here\", \"realAnswer\":\"the correct answer here\"} for an obscure trivia question. No other text."
    
    var apiKey = auth.gemini; // Replace with actual key
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
    var result = postJSON(url, {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
    try {
      JSON.parse(result)
      return JSON.parse(result)
    } catch (e) {
      utils.reportError("fetchQnA", e, "ggar")
      //wasn't json, try again
      fetchQnA()
    }
    // For now, return fallback since we need real API setup
    return { question: "What is the rarest element on Earth's crust?", realAnswer: "astatine" };
  } catch(e) {
    utils.reportError("fetchQnA", e, "ggar");
    return { question: "What color is the sky at noon?", realAnswer: "blue" };
  }
}

function sendKmail(to, msg, meat, note) {
  try {
    return kmail(to, msg, meat, note || "");
  } catch(e) {
    utils.reportError("sendKmail to " + to, e, "ggar");
    return false;
  }
}

function chatGames(msg) {
  try {
    chatMacro("/games " + msg);
  } catch(e) {
    utils.reportError("chatGames", e, "ggar");
  }
}

function emergencyReset() {
  try {
    chatGames("Game system error - all games cancelled. Sorry for the inconvenience!");
    
    // Reset both game states
    raffle.emergencyCleanup();
    decoy.emergencyCleanup();
    
    // Save state
    bufferToFile(JSON.stringify(globalObj), "./ggamesGlobalObj.json");
  } catch(e) {
    utils.reportError("emergencyReset", e, "ggar");
  }
}

function main(sender, message) {
  try {
    // 1) KMail handling
    if (message.includes("New message received from")) {
      var fromMatch = message.match(/New message received from ([^\s]+)/);
      if (!fromMatch) return;
      var from = fromMatch[1];
      
      var bodyMatch = visitUrl("messages.php").match(/<blockquote>([\s\S]*?)<\/blockquote>/);
      var body = bodyMatch ? bodyMatch[1].replace(/<br>/g, "\n").replace(/<[^>]*>/g, "").trim() : "";
      
      raffle.handleKmail(from, body);
      decoy.handleKmail(from, body);
      
      // persist donor/public usage
      bufferToFile(JSON.stringify(globalObj), "./ggamesGlobalObj.json");
      return;
    }

    // 2) Public chat
    var text = message.replace(/^<[^>]+>/, "").trim();
    if (!text) return;
    
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
        var prizeStr = parts[0] || "0";
        var prize = utils.parsePrize(prizeStr);
        if (prize <= 0) {
          chatPrivate(sender, "Invalid prize amount. Use format like: 50k, 1m, or 50000");
          return;
        }
        if (!raffle.startRaffle(sender, prize, globalObj, chatGames, sendKmail)) {
          chatPrivate(sender, "Failed to start raffle. Check your funding.");
        }
        break;

      case "decoy":
        var prizeStr = parts[0] || "0";
        var prize = utils.parsePrize(prizeStr);
        if (prize <= 0) {
          chatPrivate(sender, "Invalid prize amount. Use format like: 50k, 1m, or 50000");
          return;
        }
        if (!decoy.startDecoy(sender, prize, globalObj, chatGames, chatPrivate, sendKmail, fetchQnA)) {
          chatPrivate(sender, "Failed to start Decoy's Dilemma. Check your funding.");
        }
        break;

      case "roll":
        var spec = parts[0] || "";
        var m = spec.match(/^(\d+)\s*[dDxX]\s*(\d+)$/);
        if (m) {
          var count = parseInt(m[1], 10);
          var sides = parseInt(m[2], 10);
          if (count > 20 || sides > 1000) {
            chatPrivate(sender, "Roll too large. Max 20 dice, 1000 sides each.");
            return;
          }
          var rolls = [], total = 0;
          for (var i = 0; i < count; i++) {
            var r = Math.floor(Math.random() * sides) + 1;
            rolls.push(r);
            total += r;
          }
          chatPrivate(sender, "Rolled: [" + rolls.join(",") + "] = " + total);
        } else {
          chatPrivate(sender, "Usage: roll NdM or NxM (case-insensitive), e.g. 2d6 or 3x4");
        }
        break;

      case "emergency":
        if (sender === "ggar") {
          emergencyReset();
        }
        break;

      default:
        // no-op
        break;
    }
  } catch(e) {
    utils.reportError("main function", e, "ggar");
    emergencyReset();
  }
}

module.exports = { main };
