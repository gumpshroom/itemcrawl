Object.assign(globalThis, require("kolmafia"));

var ticketList = ["small box", "large box", "jumping horseradish", "perfect cosmopolitan", "perfect dark and stormy", "perfect mimosa", "perfect negroni", "perfect old-fashioned", "perfect paloma", "Sacramento wine", "hacked gibson", "red pixel potion", "octolus oculus", "spooky hi mein", "stinky hi mein", "hot hi mein", "cold hi mein", "sleazy hi mein", "zombie", "elemental caipiroska", "perfect ice cube", "golden gum", "snow berries", "Game Grid ticket", "scrumptious reagent", "milk of magnesium", "tiny bottle of absinthe", "Bloody Nora", "llama lama gong", "van key", "tattered scrap of paper", "ice harvest"]
var runningGame = false
function main(sender, message) {
    print("ayo")
    var args = message.split(" ");
    var cmd = args[0];
    args = args.slice(1);
    switch (cmd) {
        case "help":
            chatPrivate(sender, "help me add this help message")
            break;
        case "host":
            var prize = parseInt(args[0])
            print(myMeat())
            if (prize && prize > 0 && prize <= 200000 && myMeat() + 50 >= prize) { //50 meat for package, if winner in ronin
                var foundItem = false;
                var item;
                while (!foundItem) {
                    item = Item.get(ticketList[Math.floor(Math.random() * ticketList.length)])
                    if (itemAmount(item) >= 10) {
                        foundItem = true;
                    }
                }
                refreshShop();
                if (!runningGame && Object.keys(getShop()).length === 0) {
                    print(putShopConfirm(100, 1, 10, item));
                    runningGame = true;
                    chatGames("AR requested by " + sender + " with prize 1d" + prize + " meat !!")
                    var cycles = 0;
                    var gameSize = 10;
                    while (runningGame) {
                        refreshShop();
                        if (Object.keys(getShop()).length === 0) {
                            runningGame = false;
                            //post game handle
                            var shopInv = getShopLog()
                            var winner = shopInv[gameSize - Math.floor(Math.random() * shopInv.length)].match(/ \d\d:\d\d:\d\d (.*) bought/)[1]
                            var amount = Math.floor(Math.random() * prize)

                            chatGames("AR ended !! " + winner + " won " + amount + " meat.")

                            //kmail
                        }
                        cycles++;
                        if (cycles > 12) {
                            chatGames("pulling in 1 minute.")
                        } else if (cycles > 18) {
                            chatGames("pulling in 30 seconds.")
                        } else if (cycles > 24) {
                            chatGames("pulling tickets.")
                            takeShop(item)
                        }
                        wait(5)
                    }
                }
            } else {
                chatPrivate(sender, "i dont have enough meat or the prize amount is invalid")
            }
            break;
        case "roll":
            break;
    }
}
function chatGames(msg) {
    //visitUrl("submitnewchat.php?playerid=" + myId() + "&pwd=" + myHash() + "&graf=" + msg + "&j=1");
    chatPrivate("ggar", msg)
}
function getTicketHolders() {
    var shop = getShopLog();
    
}
function putShopConfirm(price, limit, qty, item) {
    print(toInt(item))
    return visitUrl("backoffice.php?pwd=" + myHash() + "&action=additem&price=" + price + "&limit=" + limit + "&quantity=" + qty + "&itemid=" + toInt(item) + "&_=" + Date.now() + "&neveragain=0&ajax=1&priceok=1")
}

module.exports = { main }