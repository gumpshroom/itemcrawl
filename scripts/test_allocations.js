// Test suite for allocation logic
// This simulates the allocation functions without requiring the full KolMafia environment

// Mock data and functions for testing
var mockGlobalObj = {
    donorTable: {
        "testuser1": { total: 1000000, allocated: 750000 },
        "testuser2": { total: 500000, allocated: 375000 },
        "ggar": { total: 2000000, allocated: 1500000 }
    },
    publicPool: 300000,
    jackpot: 200000,
    gamesCount: 100,
    jackpotStreak: 5
};

var mockMyMeat = 2500000; // Bot has 2.5M meat

function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function calculateTotalAllocations() {
    var totalUserAllocations = 0;
    for (var user in mockGlobalObj.donorTable) {
        totalUserAllocations += mockGlobalObj.donorTable[user].allocated || 0;
    }
    return {
        totalUserAllocations: totalUserAllocations,
        publicPool: mockGlobalObj.publicPool || 0,
        jackpot: mockGlobalObj.jackpot || 0,
        grandTotal: totalUserAllocations + (mockGlobalObj.publicPool || 0) + (mockGlobalObj.jackpot || 0)
    };
}

function generateAllocationReport() {
    var totals = calculateTotalAllocations();
    var currentMeat = mockMyMeat;
    var report = "=== MEAT ALLOCATION REPORT ===\n\n";
    
    // User allocations
    report += "USER ALLOCATIONS:\n";
    var userCount = 0;
    for (var user in mockGlobalObj.donorTable) {
        var allocation = mockGlobalObj.donorTable[user].allocated || 0;
        var total = mockGlobalObj.donorTable[user].total || 0;
        report += "- " + user + ": " + numberWithCommas(allocation) + " meat (donated: " + numberWithCommas(total) + ")\n";
        userCount++;
    }
    
    if (userCount === 0) {
        report += "- No users with allocations\n";
    }
    
    report += "\nSUMMARY:\n";
    report += "- Total User Allocations: " + numberWithCommas(totals.totalUserAllocations) + " meat\n";
    report += "- Public Pool: " + numberWithCommas(totals.publicPool) + " meat\n";
    report += "- Jackpot: " + numberWithCommas(totals.jackpot) + " meat\n";
    report += "- Grand Total Allocated: " + numberWithCommas(totals.grandTotal) + " meat\n";
    report += "- Bot's Actual Meat: " + numberWithCommas(currentMeat) + " meat\n";
    report += "- Available Meat: " + numberWithCommas(Math.max(0, currentMeat - totals.grandTotal)) + " meat\n";
    
    // Check if adjustment needed
    if (totals.grandTotal > currentMeat) {
        var difference = totals.grandTotal - currentMeat;
        report += "\n!!! ALLOCATION EXCEEDS BOT MEAT !!!\n";
        report += "Overage: " + numberWithCommas(difference) + " meat\n";
        
        // Adjust ggar's allocation
        if (!mockGlobalObj.donorTable["ggar"]) {
            mockGlobalObj.donorTable["ggar"] = { total: 0, allocated: 0 };
        }
        
        var ggarOldAllocation = mockGlobalObj.donorTable["ggar"].allocated || 0;
        var adjustment = Math.min(difference, Math.max(0, ggarOldAllocation));
        
        if (adjustment > 0) {
            mockGlobalObj.donorTable["ggar"].allocated -= adjustment;
            report += "Adjusting ggar's allocation: -" + numberWithCommas(adjustment) + " meat\n";
            report += "ggar's new allocation: " + numberWithCommas(mockGlobalObj.donorTable["ggar"].allocated) + " meat\n";
        }
        
        if (adjustment < difference) {
            report += "WARNING: Could not fully adjust difference!\n";
            report += "Remaining overage: " + numberWithCommas(difference - adjustment) + " meat\n";
            report += "This indicates a serious allocation problem that needs manual review.\n";
        }
    } else {
        report += "\nAllocation status: ✓ OK (within bot meat limits)\n";
    }
    
    var ggarAllocation = mockGlobalObj.donorTable["ggar"] ? mockGlobalObj.donorTable["ggar"].allocated : 0;
    report += "\nggar's current allocation: " + numberWithCommas(ggarAllocation) + " meat";
    
    if (ggarAllocation < 0) {
        report += " (NEGATIVE - needs attention!)";
    }
    
    return report;
}

// Test cases
console.log("=== ALLOCATION SYSTEM TESTS ===\n");

console.log("TEST 1: Normal allocation (within limits)");
var report1 = generateAllocationReport();
console.log(report1);

console.log("\n" + "=".repeat(60) + "\n");

console.log("TEST 2: Over-allocation requiring adjustment");
// Simulate over-allocation
mockGlobalObj.donorTable["testuser1"].allocated = 2000000; // Increase allocation
mockMyMeat = 2000000; // Reduce bot meat
var report2 = generateAllocationReport();
console.log(report2);

console.log("\n" + "=".repeat(60) + "\n");

console.log("TEST 3: Ggar hosting deduction simulation");
// Test ggar hosting with sufficient funds
var hostingPrize = 100000;
var playerAmount = Math.floor(hostingPrize * 0.9); // 90k to winner
var ggarBefore = mockGlobalObj.donorTable["ggar"].allocated;

console.log("ggar allocation before hosting: " + numberWithCommas(ggarBefore));
console.log("Hosting " + numberWithCommas(hostingPrize) + " meat game...");

if (ggarBefore >= hostingPrize) {
    mockGlobalObj.donorTable["ggar"].allocated -= playerAmount;
    console.log("✓ Game hosted successfully");
    console.log("Player receives: " + numberWithCommas(playerAmount) + " meat");
    console.log("ggar allocation after hosting: " + numberWithCommas(mockGlobalObj.donorTable["ggar"].allocated));
} else {
    console.log("✗ Cannot host - insufficient allocation");
    console.log("Needed: " + numberWithCommas(hostingPrize) + ", Has: " + numberWithCommas(ggarBefore));
}

console.log("\n" + "=".repeat(60) + "\n");

console.log("TEST 4: Final allocation report");
var finalReport = generateAllocationReport();
console.log(finalReport);

console.log("\n=== ALL TESTS COMPLETED ===");

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        calculateTotalAllocations: calculateTotalAllocations,
        generateAllocationReport: generateAllocationReport,
        numberWithCommas: numberWithCommas
    };
}