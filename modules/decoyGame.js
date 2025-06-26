// Decoy’s Dilemma module
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
  globalObj: null
};

function isActive() {
  return state.active;
}

function startDecoy(host, prize, globalObj, chatGames, chatPrivate, sendKmail, fetchQnA) {
  if (state.active) {
    chatPrivate(host, "A Decoy’s Dilemma is already running.");
    return false;
  }
  state.active      = true;
  state.host        = host;
  state.prize       = prize;
  state.globalObj   = globalObj;
  state.chatGames   = chatGames;
  state.chatPrivate = chatPrivate;
  state.sendKmail   = sendKmail;
  state.participants= [];
  state.fakeAnswers = {};
  state.guesses     = {};

  if (!utils.checkAndDeductFunds(host, prize, globalObj)) {
    chatPrivate(host, "Insufficient hosting funds.");
    state.active = false;
    return false;
  }

  state.ticketItem = utils.putTicketInStore(10000);
  chatGames("/games Decoy’s Dilemma by " + host + ": buy tickets for next " + utils.GAME_TIME + "m.");

  // schedule collectPlayers with 5s buffer after entry
  state.timer = new utils.Timer();
  state.timer.schedule(new utils.TimerTask({
    run: function() { collectPlayers(fetchQnA); }
  }), utils.GAME_TIME * 60 * 1000 + 5000);

  return true;
}

function collectPlayers(fetchQnA) {
  state.participants = utils.getUniqueBuyers();
  try { takeShop(state.ticketItem); } catch(e){}

  if (state.participants.length < 3) {
    state.chatGames("/games <Error> need at least 3 players. Cancelled.");
    cleanup();
    return;
  }

  // fetch Q&A
  var qa = { question:"", realAnswer:"" };
  try { qa = fetchQnA(); } catch(e) {}
  state.question   = qa.question;
  state.realAnswer = qa.realAnswer;

  state.chatGames("/games QUESTION: " + state.question);
  state.participants.forEach(function(p){
    state.chatPrivate(p, "Please PM me your Decoy answer within 2 minutes.");
  });

  // schedule voting with 5s buffer after fake phase
  state.timer.schedule(new utils.TimerTask({
    run: beginVoting
  }), 2 * 60 * 1000 + 5000);
}

function handleKmail(sender, body) {
  var lc = sender.toLowerCase();
  if (!state.active || !state.participants.includes(lc)) return;
  if (state.fakeAnswers[lc]) {
    state.chatPrivate(sender, "You already submitted your answer.");
    return;
  }
  state.fakeAnswers[lc] = body.trim();
}

function beginVoting() {
  // ensure every participant has an entry
  state.participants.forEach(function(p){
    if (!state.fakeAnswers[p]) state.fakeAnswers[p] = "(no answer submitted)";
  });

  var list = [state.realAnswer].concat(Object.values(state.fakeAnswers));
  list = Array.from(new Set(list));
  state.answers = list.sort(function(){return Math.random()-0.5;});

  var msg = "/games VOTE! Type `guess <#>` for the real answer: ";
  state.answers.forEach(function(a,i){
    msg += "["+(i+1)+"] "+a+"  ";
  });
  state.chatGames(msg);

  // schedule finalize with 5s buffer after voting
  state.timer.schedule(new utils.TimerTask({
    run: finalizeDecoy
  }), 2 * 60 * 1000 + 5000);
}

function handleChat(sender, text) {
  var m = text.match(/^guess\s+(\d+)/i);
  var lc = sender.toLowerCase();
  if (!state.active || !m || !state.participants.includes(lc)) return;
  var idx = parseInt(m[1],10) - 1;
  if (idx >= 0 && idx < state.answers.length) {
    state.guesses[lc] = idx;
    state.chatPrivate(sender, "Registered guess #" + (idx+1) + ".");
  }
}

function finalizeDecoy() {
  var pts = {};
  state.participants.forEach(function(p){ pts[p]=0; });
  Object.entries(state.guesses).forEach(function([p,idx]){
    if (state.answers[idx] === state.realAnswer) pts[p]+=2;
  });
  Object.entries(state.fakeAnswers).forEach(function([p,f]){
    Object.entries(state.guesses).forEach(function([voter,idx]){
      if (state.answers[idx] === f) pts[p]++;
    });
  });

  var winners = state.participants.map(function(p){ return {player:p, points: pts[p]}; });
  winners.sort(function(a,b){ return b.points - a.points; });

  utils.awardPrizes(winners, state.prize, state.chatGames, state.sendKmail, state.globalObj);

  // bump stats
  state.globalObj.gamesCount = (state.globalObj.gamesCount || 0) + 1;
  bufferToFile(JSON.stringify(state.globalObj), "./ggamesGlobalObj.json");

  cleanup();
}

function cleanup() {
  if (state.timer) state.timer.cancel();
  // reset all state
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
}

module.exports = {
  isActive,
  startDecoy,
  handleKmail,
  handleChat
};