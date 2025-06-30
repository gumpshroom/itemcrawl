//const km = require("kolmafia");
Object.assign(globalThis, require("kolmafia"));
var oldData = fileToBuffer("./nearExtinct.json")
var nearExtinct = oldData ? JSON.parse(oldData) : {}

var start = parseInt(fileToBuffer("./searchedIndex.txt"))
if (start)
    print("Starting from " + start)
if (!start || start < 0)
    start = 1
for (var i = start; i <= 3799000; i++) {
    if (i % 1000 == 0) {
        print("-----FINISHED #" + i + "-----")
    }
    var res = getMallStore(i)
    bufferToFile(toString(i), "./searchedIndex.txt")
    if (res) {
        //print("No store found for player " + i)
    }
}


function getPlayerName(playerID) {
    var profile = visitUrl("showplayer.php?who=" + playerID);
    if (profile.includes("<td>Sorry, this player could not be found.</td>")) {
        return null;
    }
    var playerName
    var matchName = createMatcher("<b>([^<]+)</b> \\(#" + playerID + "\\)<br>", playerProfile)
    if (matchName.find()) {
        playerName = matchName.group(1);
    }
    return playerName
}

function getMallStore(playerID) {
    var store = visitUrl("mallstore.php?whichstore=" + playerID);
    
    //var inventory = {}
    if (!store.includes("999,999,999 Meat")) {
        return "no items of interest"
    }
    //bufferToFile(store, "./store.txt")
    print("Store has max price! " + playerID);
    var priceList = store.match(/<td valign=center><b>([^<]*)<\/b> \(([^<]*)\) [^<]*<\/td><td>999,999,999 Meat<\/td>/gm)
    if (!priceList) { 
        bufferToFile(store, "./store.txt")
        print("something went wrong?")
        return 
    }
    //print(priceList.join("\n"))
    for (var i = 0; i < priceList.length; i++) {
        var match = priceList[i].match(/<td valign=center><b>([^<]*)<\/b> \(([^<]*)\) [^<]*<\/td><td>999,999,999 Meat<\/td>/)
        var item = match[1]
        var qty = match[2]
        if (mallPrice(toItem(item)) == -1) {
            if (nearExtinct[item] == null) {
                nearExtinct[item] = []
            }
            nearExtinct[item].push(playerID)
                
            print("New item found: " + item + " at store with qty " + qty)
                if (!bufferToFile(JSON.stringify(nearExtinct), "./nearExtinct.json")) {
                    abort("failed to write to file")
                }
            
        }
    }

    return null
}