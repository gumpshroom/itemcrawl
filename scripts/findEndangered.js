//const km = require("kolmafia");
Object.assign(globalThis, require("kolmafia"));
var nearExtinct = {}
for (var i = 52900; i <= 3700000; i++) {
    var res = getMallStore(i)
}
var output = ""
for (var item in nearExtinct) {
    output += item + " : " + nearExtinct[item].toString() + "\n"
}
if (!bufferToFile(output, "/home/runner/kmafia/nearExtinct.txt")) {
    abort("failed to write to file")
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
    if (store.match(/<td valign=center>\s*<b>(.*)<\/b>\s*\((.*)\)\s*<\/td>\s*<td>999,999,999 Meat<\/td>/g)) {
        //print("No store found for player " + playerID)
        return null
    }
    print("Store found for player " + playerID);
    //var inventory = {}
    var priceList = store.match(/<td valign=center>\s*<b>(.*)<\/b>\s*\((.*)\)\s*<\/td>\s*<td>999,999,999 Meat<\/td>/gm)
    if (!priceList) {return}
    for (var i = 0; i < priceList.length; i++) {
        var match = priceList[i].match(/<td valign=center>\s*<b>(.*)<\/b>\s*\((.*)\)\s*<\/td>\s*<td>999,999,999 Meat<\/td>/)
        var item = match[1]


            if (mallPrice(toItem(item)) == -1) {
                if (nearExtinct[item] == null) {
                    nearExtinct[item] = []
                    print("New item found: " + item + " at store " + playerID)
                }
                nearExtinct[item].push(playerID)
            }
        
    }
    return null
}