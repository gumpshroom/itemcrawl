// Integration test to verify the leaderboard command is properly integrated
// This simulates a user calling the leaderboard command

// Mock KolMafia functions
function chatPrivate(user, message) {
    console.log(`[Chat to ${user}]: ${message}`);
}

function kmail(to, message, meat, subject) {
    console.log(`[KMail to ${to}]`);
    console.log(`Subject: ${subject}`);
    console.log(`Message:\n${message}`);
    console.log(`Meat attached: ${meat}`);
    return true;
}

function myMeat() {
    return 10000000;
}

// Mock global object
globalThis.chatPrivate = chatPrivate;
globalThis.kmail = kmail;
globalThis.myMeat = myMeat;

// Load the chatbot module
var chatbot;
try {
    chatbot = require('./chatbot.js');
    console.log("✓ Chatbot module loaded successfully\n");
} catch(e) {
    console.log("✗ Failed to load chatbot module:");
    console.log(e);
    process.exit(1);
}

// Test data setup
console.log("=== INTEGRATION TEST: LEADERBOARD COMMAND ===\n");

console.log("TEST 1: User requests leaderboard help");
console.log("Command: 'leaderboard help'\n");
try {
    chatbot.main("testuser", "leaderboard help");
    console.log("✓ Help command executed successfully\n");
} catch(e) {
    console.log("✗ Error:", e.message);
}

console.log("=".repeat(60) + "\n");

console.log("TEST 2: User requests leaderboard");
console.log("Command: 'leaderboard'\n");
try {
    chatbot.main("testuser", "leaderboard");
    console.log("\n✓ Leaderboard command executed successfully\n");
} catch(e) {
    console.log("✗ Error:", e.message);
}

console.log("=".repeat(60) + "\n");

console.log("TEST 3: User requests general help (should include leaderboard)");
console.log("Command: 'help'\n");
try {
    chatbot.main("testuser", "help");
    console.log("✓ Help command executed successfully\n");
} catch(e) {
    console.log("✗ Error:", e.message);
}

console.log("\n=== INTEGRATION TESTS COMPLETED ===");
