// Simple test script for allocation logic
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
    for (var user in mockGlobalObj.donorTable) {
        var allocation = mockGlobalObj.donorTable[user].allocated || 0;
        report += "- " + user + ": " + numberWithCommas(allocation) + " meat\n";
    }
    
    report += "\nSUMMARY:\n";
    report += "- Total User Allocations: " + numberWithCommas(totals.totalUserAllocations) + " meat\n";
    report += "- Public Pool: " + numberWithCommas(totals.publicPool) + " meat\n";
    report += "- Jackpot: " + numberWithCommas(totals.jackpot) + " meat\n";
    report += "- Grand Total Allocated: " + numberWithCommas(totals.grandTotal) + " meat\n";
    report += "- Bot's Actual Meat: " + numberWithCommas(currentMeat) + " meat\n";
    
    // Check if adjustment needed
    if (totals.grandTotal > currentMeat) {
        var difference = totals.grandTotal - currentMeat;
        report += "\n!!! ALLOCATION EXCEEDS BOT MEAT !!!\n";
        report += "Difference: " + numberWithCommas(difference) + " meat\n";
        
        // Adjust ggar's allocation
        if (!mockGlobalObj.donorTable["ggar"]) {
            mockGlobalObj.donorTable["ggar"] = { total: 0, allocated: 0 };
        }
        
        var ggarOldAllocation = mockGlobalObj.donorTable["ggar"].allocated || 0;
        var adjustment = Math.min(difference, ggarOldAllocation);
        mockGlobalObj.donorTable["ggar"].allocated -= adjustment;
        
        report += "Adjusting ggar's allocation by -" + numberWithCommas(adjustment) + " meat\n";
        report += "ggar's new allocation: " + numberWithCommas(mockGlobalObj.donorTable["ggar"].allocated) + " meat\n";
        
        if (adjustment < difference) {
            report += "WARNING: Could not fully adjust (ggar allocation insufficient)\n";
            report += "Remaining difference: " + numberWithCommas(difference - adjustment) + " meat\n";
        }
    } else {
        report += "\nAllocation status: OK (within bot meat limits)\n";
    }
    
    var ggarAllocation = mockGlobalObj.donorTable["ggar"] ? mockGlobalObj.donorTable["ggar"].allocated : 0;
    report += "\nggar's current allocation: " + numberWithCommas(ggarAllocation) + " meat";
    
    return report;
}

// Test cases
console.log("=== TEST 1: Normal allocation (within limits) ===");
var report1 = generateAllocationReport();
console.log(report1);

console.log("\n\n=== TEST 2: Over-allocation requiring adjustment ===");
// Simulate over-allocation
mockGlobalObj.donorTable["testuser1"].allocated = 2000000; // Increase allocation
mockMyMeat = 2000000; // Reduce bot meat
var report2 = generateAllocationReport();
console.log(report2);

console.log("\n\n=== TEST 3: Ggar hosting deduction simulation ===");
// Simulate ggar hosting a 100k game
var ggarBefore = mockGlobalObj.donorTable["ggar"].allocated;
console.log("ggar allocation before hosting: " + numberWithCommas(ggarBefore));
mockGlobalObj.donorTable["ggar"].allocated -= 90000; // 90k to winner (100k prize * 0.9)
console.log("ggar allocation after hosting 100k game: " + numberWithCommas(mockGlobalObj.donorTable["ggar"].allocated));
console.log("Deduction: " + numberWithCommas(90000) + " meat");

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        calculateTotalAllocations: calculateTotalAllocations,
        generateAllocationReport: generateAllocationReport,
        numberWithCommas: numberWithCommas
    };
}