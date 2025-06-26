// Decoy's Dilemma module
Object.assign(globalThis, require("kolmafia"));
var utils = require("./gameUtils.js");

var state = {
  active: false,
  host: null,
  prize: 0,
  participants: [],
  fakeAnswers: {},
  guesses: {},
  question: "",
  realAnswer: "",
  answers: [],
  ticketItem: null,
  timer: null,
  chatGames: null,
  chatPrivate: null,
  sendKmail: null,
  globalObj: null,
  phase: "none" // none, entry, answering, voting, finished
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
  state.participants = [];
  state.fakeAnswers = {};
  state.guesses = {};
  state.question = "";
  state.realAnswer = "";
  state.answers = [];
  state.ticketItem = null;
  state.timer = null;
  state.chatGames = null;
  state.chatPrivate = null;
  state.sendKmail = null;
  state.globalObj = null;
  state.phase = "none";
}

function startDecoy(host, prize, globalObj, chatGames, chatPrivate, sendKmail, fetchQnA) {
  try {
    if (state.active) {
      chatPrivate(host, "A Decoy's Dilemma is already running.");
      return false;
    }

    if (!prize || prize <= 0) {
      chatPrivate(host, "Invalid prize amount.");
      return false;
    }

    state.active = true;
    state.host = host;
    state.prize = prize;
    state.globalObj = globalObj;
    state.chatGames = chatGames;
    state.chatPrivate = chatPrivate;
    state.sendKmail = sendKmail;
    state.participants = [];
    state.fakeAnswers = {};
    state.guesses = {};
    state.phase = "entry";

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

    chatGames("Decoy's Dilemma by " + host + ": buy tickets for next " + utils.GAME_TIME + "m. Prize: " + utils.numberWithCommas(prize) + " meat!");

    // schedule collectPlayers with 5s buffer after entry
    state.timer = new utils.Timer();
    state.timer.schedule(new utils.TimerTask({
      run: function() { 
        try {
          collectPlayers(fetchQnA);
        } catch(e) {
          handleGameError("collectPlayers", e);
        }
      }
    }), utils.GAME_TIME * 60 * 1000 + 5000);

    return true;
  } catch(e) {
    utils.reportError("startDecoy", e, "ggar");
    resetState();
    return false;
  }
}

function collectPlayers(fetchQnA) {
  try {
    state.participants = utils.getUniqueBuyers();
    try { 
      takeShop(state.ticketItem); 
    } catch(e) {
      // Shop cleanup error is non-fatal
    }

    if (state.participants.length < 3) {
      state.chatGames("Decoy's Dilemma cancelled - need at least 3 players. Only " + state.participants.length + " bought tickets.");
      cleanup();
      return;
    }

    state.phase = "answering";

    // fetch Q&A
    var qa = fetchQnA();
    if (!qa || !qa.question || !qa.realAnswer) {
      throw new Error("Invalid question/answer from API");
    }
    
    state.question = qa.question;
    state.realAnswer = qa.realAnswer.toLowerCase().trim();

    state.chatGames("QUESTION (" + state.participants.length + " players): " + state.question);
    
    for (var i = 0; i < state.participants.length; i++) {
      state.chatPrivate(state.participants[i], "Please PM me your FAKE answer within 2 minutes for: " + state.question);
    }

    // schedule voting with 5s buffer after fake phase
    state.timer.schedule(new utils.TimerTask({
      run: function() {
        try {
          beginVoting();
        } catch(e) {
          handleGameError("beginVoting", e);
        }
      }
    }), 2 * 60 * 1000 + 5000);
  } catch(e) {
    handleGameError("collectPlayers", e);
  }
}

function handleKmail(sender, body) {
  try {
    var lc = sender.toLowerCase();
    if (!state.active || state.phase !== "answering") return;
    
    if (state.participants.indexOf(lc) === -1) return;
    
    if (state.fakeAnswers[lc]) {
      state.chatPrivate(sender, "You already submitted your answer.");
      return;
    }
    
    var answer = body.trim();
    if (!answer || answer.length === 0) {
      state.chatPrivate(sender, "Empty answer not allowed. Please send a fake answer.");
      return;
    }
    
    if (answer.length > 200) {
      state.chatPrivate(sender, "Answer too long. Please keep it under 200 characters.");
      return;
    }
    
    state.fakeAnswers[lc] = answer;
    state.chatPrivate(sender, "Got your fake answer: " + answer);
  } catch(e) {
    utils.reportError("decoy handleKmail", e, "ggar");
  }
}

function beginVoting() {
  try {
    state.phase = "voting";
    
    // ensure every participant has an entry
    for (var i = 0; i < state.participants.length; i++) {
      var p = state.participants[i];
      if (!state.fakeAnswers[p]) {
        state.fakeAnswers[p] = "(no answer submitted)";
      }
    }

    // collect all fake answers
    var fakeAnswersList = [];
    for (var player in state.fakeAnswers) {
      if (state.fakeAnswers.hasOwnProperty(player)) {
        fakeAnswersList.push(state.fakeAnswers[player]);
      }
    }
    
    var allAnswers = [state.realAnswer].concat(fakeAnswersList);
    
    // remove exact duplicates but keep original
    var uniqueAnswers = [];
    var seen = {};
    for (var i = 0; i < allAnswers.length; i++) {
      var ans = allAnswers[i].toLowerCase().trim();
      if (!seen[ans]) {
        seen[ans] = true;
        uniqueAnswers.push(allAnswers[i]);
      }
    }
    
    // shuffle
    for (var i = uniqueAnswers.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = uniqueAnswers[i];
      uniqueAnswers[i] = uniqueAnswers[j];
      uniqueAnswers[j] = temp;
    }
    
    state.answers = uniqueAnswers;

    var msg = "VOTE! Type 'guess <#>' for the real answer: ";
    for (var i = 0; i < state.answers.length; i++) {
      msg += "[" + (i + 1) + "] " + state.answers[i] + "  ";
    }
    state.chatGames(msg);

    // schedule finalize with 5s buffer after voting
    state.timer.schedule(new utils.TimerTask({
      run: function() {
        try {
          finalizeDecoy();
        } catch(e) {
          handleGameError("finalizeDecoy", e);
        }
      }
    }), 2 * 60 * 1000 + 5000);
  } catch(e) {
    handleGameError("beginVoting", e);
  }
}

function handleChat(sender, text) {
  try {
    if (!state.active || state.phase !== "voting") return;
    
    var m = text.match(/^guess\s+(\d+)/i);
    var lc = sender.toLowerCase();
    
    if (!m || state.participants.indexOf(lc) === -1) return;
    
    var idx = parseInt(m[1], 10) - 1;
    if (idx >= 0 && idx < state.answers.length) {
      state.guesses[lc] = idx;
      state.chatPrivate(sender, "Registered guess #" + (idx + 1) + ": " + state.answers[idx]);
    } else {
      state.chatPrivate(sender, "Invalid guess number. Choose 1-" + state.answers.length);
    }
  } catch(e) {
    utils.reportError("decoy handleChat", e, "ggar");
  }
}

function finalizeDecoy() {
  try {
    state.phase = "finished";
    
    var pts = {};
    for (var i = 0; i < state.participants.length; i++) {
      pts[state.participants[i]] = 0;
    }
    
    // points for guessing correctly (2 points)
    for (var player in state.guesses) {
      if (state.guesses.hasOwnProperty(player)) {
        var idx = state.guesses[player];
        if (state.answers[idx] && state.answers[idx].toLowerCase().trim() === state.realAnswer) {
          pts[player] += 2;
        }
      }
    }
    
    // points for others guessing your fake answer (1 point each)
    for (var fakePlayer in state.fakeAnswers) {
      if (state.fakeAnswers.hasOwnProperty(fakePlayer)) {
        var fakeAnswer = state.fakeAnswers[fakePlayer];
        for (var voter in state.guesses) {
          if (state.guesses.hasOwnProperty(voter) && voter !== fakePlayer) {
            var voterIdx = state.guesses[voter];
            if (state.answers[voterIdx] === fakeAnswer) {
              pts[fakePlayer]++;
            }
          }
        }
      }
    }

    var winners = [];
    for (var i = 0; i < state.participants.length; i++) {
      var p = state.participants[i];
      winners.push({ player: p, points: pts[p] || 0 });
    }
    
    winners.sort(function(a, b) { return b.points - a.points; });

    state.chatGames("REAL ANSWER: " + state.realAnswer);
    
    utils.awardPrizes(winners, state.prize, state.chatGames, state.sendKmail, state.globalObj);

    // bump stats
    state.globalObj.gamesCount = (state.globalObj.gamesCount || 0) + 1;
    bufferToFile(JSON.stringify(state.globalObj), "./ggamesGlobalObj.json");

    cleanup();
  } catch(e) {
    handleGameError("finalizeDecoy", e);
  }
}

function handleGameError(phase, error) {
  try {
    utils.reportError("Decoy game error in " + phase, error, "ggar");
    if (state.chatGames) {
      state.chatGames("Decoy's Dilemma encountered an error and has been cancelled. Sorry!");
    }
    cleanup();
  } catch(e) {
    // Final fallback
    resetState();
  }
}

function cleanup() {
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

module.exports = {
  isActive: isActive,
  startDecoy: startDecoy,
  handleKmail: handleKmail,
  handleChat: handleChat,
  emergencyCleanup: emergencyCleanup
};