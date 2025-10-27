// Test suite for leaderboard command
// This simulates the leaderboard function without requiring the full KolMafia environment

// Mock data for testing
var mockGlobalObj = {
    donorTable: {
        "alice": { total: 5000000, allocated: 3750000 },
        "bob": { total: 3000000, allocated: 2250000 },
        "charlie": { total: 2000000, allocated: 1500000 },
        "david": { total: 1500000, allocated: 1125000 },
        "eve": { total: 1000000, allocated: 750000 },
        "frank": { total: 900000, allocated: 675000 },
        "grace": { total: 800000, allocated: 600000 },
        "henry": { total: 700000, allocated: 525000 },
        "iris": { total: 600000, allocated: 450000 },
        "jack": { total: 500000, allocated: 375000 },
        "karen": { total: 400000, allocated: 300000 },
        "larry": { total: 300000, allocated: 225000 },
        "mary": { total: 200000, allocated: 150000 },
        "nancy": { total: 100000, allocated: 75000 },
        "oscar": { total: 50000, allocated: 37500 }
    }
};

function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

// Generate all-time leaderboard for public consumption
function generateLeaderboard() {
    var leaderboard = "ALL-TIME TOP 10 DONORS:\n\n";
    var sortedAllTimeDonors = Object.entries(mockGlobalObj.donorTable).sort((a, b) => ((b[1].total || 0) - (a[1].total || 0)));
    var userCount = 0;
    
    for (var i = 0; i < sortedAllTimeDonors.length; i++) {
        if (userCount >= 10) {
            break;
        }
        var user = sortedAllTimeDonors[i][0];
        var total = sortedAllTimeDonors[i][1].total || 0;
        if (total !== 0) {
            leaderboard += (userCount + 1) + ". " + user + ": " + numberWithCommas(total) + " meat donated\n";
            userCount++;
        }
    }
    
    if (userCount === 0) {
        leaderboard += "No donors yet.\n";
    }
    
    leaderboard += "\nThank you to all our generous donors!";
    return leaderboard;
}

// Test cases
console.log("=== LEADERBOARD COMMAND TESTS ===\n");

console.log("TEST 1: Generate leaderboard with 15 donors (should show top 10)");
var leaderboard1 = generateLeaderboard();
console.log(leaderboard1);

console.log("\n" + "=".repeat(60) + "\n");

console.log("TEST 2: Generate leaderboard with no donors");
mockGlobalObj.donorTable = {};
var leaderboard2 = generateLeaderboard();
console.log(leaderboard2);

console.log("\n" + "=".repeat(60) + "\n");

console.log("TEST 3: Generate leaderboard with 5 donors (should show all 5)");
mockGlobalObj.donorTable = {
    "user1": { total: 5000000, allocated: 3750000 },
    "user2": { total: 3000000, allocated: 2250000 },
    "user3": { total: 2000000, allocated: 1500000 },
    "user4": { total: 1000000, allocated: 750000 },
    "user5": { total: 500000, allocated: 375000 }
};
var leaderboard3 = generateLeaderboard();
console.log(leaderboard3);

console.log("\n" + "=".repeat(60) + "\n");

console.log("TEST 4: Generate leaderboard with some zero-donation users");
mockGlobalObj.donorTable = {
    "donor1": { total: 5000000, allocated: 3750000 },
    "donor2": { total: 3000000, allocated: 2250000 },
    "zerodude": { total: 0, allocated: 0 },
    "donor3": { total: 2000000, allocated: 1500000 }
};
var leaderboard4 = generateLeaderboard();
console.log(leaderboard4);

console.log("\n=== ALL LEADERBOARD TESTS COMPLETED ===");

// Verify the output format
console.log("\n=== VERIFICATION ===");
var lines = leaderboard4.split("\n");
console.log("✓ Leaderboard has " + lines.length + " lines");
console.log("✓ First line: " + lines[0]);
console.log("✓ Last line: " + lines[lines.length - 1]);

// Count how many numbered entries
var numberedEntries = 0;
for (var i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\d+\./)) {
        numberedEntries++;
    }
}
console.log("✓ Number of ranked entries: " + numberedEntries);
console.log("✓ Should be 3 (excluding zero-donation users): " + (numberedEntries === 3 ? "PASS" : "FAIL"));

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        generateLeaderboard: generateLeaderboard,
        numberWithCommas: numberWithCommas
    };
}
