//const km = require("kolmafia");
Object.assign(globalThis, require("kolmafia"));
var nearExtinct = {}
var start = parseInt(fileToBuffer("./searchedIndex.txt"))
if (!start || start < 0)
    start = 132000
for (var i = start; i <= 3700000; i++) {
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
    if (store.match(/<td>.* does not have a store in the Mall\.<\/td>/g)) {
        //print("No store found for player " + playerID)
        return "no store found"
    }
    print("Store found for player " + playerID);
    //var inventory = {}
    if (!store.includes("999,999,999 Meat")) {
        return "no items of interest"
    }
    var priceList = store.match(/<td valign=center>\s*<b>(.*)<\/b>\s*\(.*\)\s*<\/td>\s*<td>999,999,999 Meat<\/td>/gm)
    if (!priceList) { return }
    print(priceList.length)
    for (var i = 0; i < priceList.length; i++) {
        var match = priceList[i].match(/<td valign=center>\s*<b>(.*)<\/b>\s*\(.*\)\s*<\/td>\s*<td>999,999,999 Meat<\/td>/)
        var item = match[1]
        if (mallPrice(toItem(item)) == -1) {
            if (nearExtinct[item] == null) {
                nearExtinct[item] = []
                print("New item found: " + item + " at store " + playerID)
                var output = ""
                for (var item in nearExtinct) {
                    output += item + " : " + nearExtinct[item].toString() + "\n"
                }
                if (!bufferToFile(output, "./nearExtinct.txt")) {
                    abort("failed to write to file")
                }
            }
            nearExtinct[item].push(playerID)
        }
    }

    return null
}