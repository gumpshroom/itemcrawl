// Test suite for ticket validation logic
// This simulates the ticket selection and winner validation without requiring the full KolMafia environment

console.log("=== TICKET VALIDATION TESTS ===\n");

// Mock shop log entries to simulate different scenarios
var mockShopLogs = {
    // Normal case - all tickets match
    normalGame: [
        " 14:20:15 alice bought 1 (frozen danish)",
        " 14:20:16 bob bought 1 (frozen danish)", 
        " 14:20:17 charlie bought 1 (frozen danish)",
        " 14:20:18 roxue bought 1 (frozen danish)"
    ],
    
    // Problem case - mixed tickets from previous games
    mixedTickets: [
        " 14:20:15 alice bought 1 (frozen danish)",     // old game ticket
        " 14:20:16 bob bought 1 (game grid ticket)",    // current game ticket
        " 14:20:17 charlie bought 1 (game grid ticket)", // current game ticket
        " 14:20:18 dave bought 1 (game grid ticket)"    // current game ticket
    ],
    
    // Edge case - no valid tickets for current game
    noValidTickets: [
        " 14:20:15 alice bought 1 (frozen danish)",
        " 14:20:16 bob bought 1 (frozen danish)",
        " 14:20:17 charlie bought 1 (red drunki-bear)",
        " 14:20:18 dave bought 1 (red drunki-bear)"
    ]
};

// Current implementation (buggy version)
function selectWinnerOriginal(shopLog, gameSize, currentGameTicket) {
    var winnerIndex = Math.floor(Math.random() * gameSize) + 1;
    var match = shopLog[winnerIndex - 1].match(/ (\d\d:\d\d:\d\d) (.*) bought (\d*) \((.*)\)/);
    
    if (!match) return null;
    
    return {
        winner: match[2],
        boughtTime: match[1],
        ticketName: match[4],
        quantity: match[3],
        isValidTicket: match[4] === currentGameTicket // This validation is missing in original code
    };
}

// Proposed fixed implementation
function selectWinnerFixed(shopLog, gameSize, currentGameTicket) {
    // Find all entries with the current game's ticket
    var validEntries = [];
    for (var i = 0; i < shopLog.length; i++) {
        var match = shopLog[i].match(/ (\d\d:\d\d:\d\d) (.*) bought (\d*) \((.*)\)/);
        if (match && match[4] === currentGameTicket) {
            validEntries.push({
                index: i,
                winner: match[2],
                boughtTime: match[1],
                ticketName: match[4],
                quantity: match[3]
            });
        }
    }
    
    // If no valid entries found, return null (game should handle this)
    if (validEntries.length === 0) {
        return null;
    }
    
    // Select random winner from valid entries only
    var randomValidIndex = Math.floor(Math.random() * validEntries.length);
    var selectedEntry = validEntries[randomValidIndex];
    
    return {
        winner: selectedEntry.winner,
        boughtTime: selectedEntry.boughtTime,
        ticketName: selectedEntry.ticketName,
        quantity: selectedEntry.quantity,
        isValidTicket: true,
        validEntriesCount: validEntries.length
    };
}

// Test function
function runTest(testName, shopLog, currentGameTicket, expectedValid) {
    console.log("TEST: " + testName);
    console.log("Current game ticket: " + currentGameTicket);
    console.log("Shop log entries:");
    shopLog.forEach(function(entry, index) {
        console.log("  " + (index + 1) + ":" + entry);
    });
    
    console.log("\nOriginal implementation results:");
    for (var i = 0; i < 5; i++) {
        var result = selectWinnerOriginal(shopLog, shopLog.length, currentGameTicket);
        if (result) {
            console.log("  Winner: " + result.winner + ", Ticket: " + result.ticketName + 
                       ", Valid: " + result.isValidTicket);
        }
    }
    
    console.log("\nFixed implementation results:");
    for (var i = 0; i < 5; i++) {
        var result = selectWinnerFixed(shopLog, shopLog.length, currentGameTicket);
        if (result) {
            console.log("  Winner: " + result.winner + ", Ticket: " + result.ticketName + 
                       ", Valid: " + result.isValidTicket + 
                       ", Valid entries: " + result.validEntriesCount);
        } else {
            console.log("  No valid winner found (correct behavior for edge case)");
        }
    }
    
    console.log("\n" + "=".repeat(60) + "\n");
}

// Run tests
runTest("Normal Game (all tickets match)", 
        mockShopLogs.normalGame, 
        "frozen danish", 
        true);

runTest("Mixed Tickets (reproduces bug)", 
        mockShopLogs.mixedTickets, 
        "game grid ticket", 
        true);

runTest("No Valid Tickets (edge case)", 
        mockShopLogs.noValidTickets, 
        "game grid ticket", 
        false);

console.log("=== TEST ANALYSIS ===");
console.log("Original implementation: Can select winners with wrong tickets");
console.log("Fixed implementation: Only selects winners with correct tickets");
console.log("The fix ensures ticket validation and prevents reuse across games");

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        selectWinnerFixed: selectWinnerFixed,
        selectWinnerOriginal: selectWinnerOriginal
    };
}