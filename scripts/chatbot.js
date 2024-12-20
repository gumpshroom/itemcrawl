Object.assign(globalThis, require("kolmafia"));
const GAME_TIME = 5; //minutes
var ticketList = ["red drunki-bear", "yellow drunki-bear", "green drunki-bear", "gnocchetti di Nietzsche", "glistening fish meat", "gingerbread nylons", "ghostly ectoplasm", "frozen danish", "frat brats", "expired MRE", "enticing mayolus", "eagle's milk", "crudles", "cream of pointy mushroom soup", "chaos popcorn", "candy carrot", "bowl of prescription candy", "bowl of maggots", "badass pie", "alien sandwich", "small box", "large box", "jumping horseradish", "perfect cosmopolitan", "perfect dark and stormy", "perfect mimosa", "perfect negroni", "perfect old-fashioned", "perfect paloma", "Sacramento wine", "hacked gibson", "red pixel potion", "octolus oculus", "spooky hi mein", "stinky hi mein", "hot hi mein", "cold hi mein", "sleazy hi mein", "zombie", "elemental caipiroska", "perfect ice cube", "golden gum", "snow berries", "Game Grid ticket", "scrumptious reagent", "milk of magnesium", "tiny bottle of absinthe", "Bloody Nora", "llama lama gong", "van key", "tattered scrap of paper", "ice harvest"]
var runningGame = false
var oldData = fileToBuffer("./ggamesGlobalObj.json")
var globalObj = oldData ? JSON.parse(oldData) : {}
globalObj.gamesCount = globalObj.gamesCount ? globalObj.gamesCount : 0
globalObj.donorTable = globalObj.donorTable ? globalObj.donorTable : {"fargblabble": 10000000, "junem": 10000000, "pandamanster": 10000000, "skent": 10000000}
globalObj.jackpotStreak = globalObj.jackpotStreak ? globalObj.jackpotStreak : 0
globalObj.jackpot = globalObj.jackpot ? globalObj.jackpot : 0
function uneffect(str) {
    cliExecute("uneffect " + str)
}
function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
function main(sender, message) {
    if (message.includes("New message received from")) {
        //open package
        var author = message.match(/New message received from (.*)/)[1]
        var prevMeat = myMeat()
        use(Item.get("plain brown wrapper"))
        use(Item.get("less-than-three-shaped box"))
        use(Item.get("exactly-three-shaped box"))
        use(Item.get("chocolate box"))
        use(Item.get("miniature coffin"))
        use(Item.get("solid asbestos box"))
        use(Item.get("solid linoleum box"))
        use(Item.get("solid chrome box"))
        use(Item.get("cryptic puzzle box"))
        use(Item.get("refrigerated biohazard container"))
        use(Item.get("magnetic field"))
        use(Item.get("black velvet box"))
        kmail(author, "yo thanks for helping out!", 0, "yo thanks for helping out!")

        if (author !== "Peace and Love") {
            var msg = visitUrl("messages.php")
            var rgx = /<b>From<\/b>.*?!--([^<]*)--><br><blockquote>(.*?)<\/blockquote>/
            var match = msg.match(rgx)
            print("sending message to ggar")
            if (match) {
                var date = match[1]
                var contents = match[2]
                print(contents)
                print("does the meat match?")
                var meatmatch = contents.match(/>You gain (.*) Meat\.</)
                if (meatmatch) {
                    print("i gotta add stuff to the donor table")
                    if (!globalObj.donorTable[author.toLowerCase()]) { globalObj.donorTable[author.toLowerCase()] = 400000 }
                    var meat = parseInt(meatmatch[1].replace(/,/g, ""))
                    globalObj.donorTable[author.toLowerCase()] += meat;
                }
                contents = contents.replace(/<br>/g, "\n")
                contents = contents.replace(/<.*?>/g, "")
                var replyStr = author + " said at " + date + ":\n" + contents
                kmail("ggar", replyStr, 0, "reply")
            }
        }
        bufferToFile(JSON.stringify(globalObj), "./ggamesGlobalObj.json")

        return
    } else if(message.includes("has hit you") || message.includes("sent you a really") || message.includes("plastered you") || message.includes("has blessed")) {
        var from = message.match(/(.*) has hit you/)[1] || message.match(/(.*) sent you a really/)[1] || message.match(/(.*) plastered you/)[1] || message.match(/(.*) has blessed/)[1]
        chatPrivate(from, "think you funny huh?")
        uneffect("Bruised Jaw")
        uneffect("Harpooned and Marooned")
        uneffect("Unmotivated")
        uneffect("B-b-brr!")
        uneffect("On Safari")
        return
    }
    print("ayo")
    var args = message.split(" ");
    var cmd = args[0];
    args = args.slice(1);

    switch (cmd) {
        case "exec":
            if (sender === "ggar" || toInt(sender) === "3118267") {
                var result = cliExecuteOutput(args.join(" "))
                print(result)
                chatPrivate(sender, result)
            } else {
                chatPrivate(sender, "hey hey hey wait.. you cant tell me what to do...")
            }
            break;
        case "help":
            chatPrivate(sender, "help me add this help message")
            break;
        case "setdonorlevel":
            if (args.length > 1) {
                if (sender === "ggar") {
                    globalObj.donorTable[args.slice(1).join(" ").toLowerCase()] = parseInt(args[0]);
                    bufferToFile(JSON.stringify(globalObj), "./ggamesGlobalObj.json");
                    chatPrivate("ggar", "set " + args.slice(1).join(" ").toLowerCase() + " donor level to " + numberWithCommas(parseInt(args[0])));
                }
            }
            break;
        case "setjackpot":
            if (args.length === 1) {
                if (sender === "ggar") {
                    globalObj.jackpot = parseInt(args[0]);
                    bufferToFile(JSON.stringify(globalObj), "./ggamesGlobalObj.json");
                    chatPrivate("ggar", "set jackpot to " + numberWithCommas(parseInt(args[0])));
                }
            }
            break;
        case "host":
            var prize = parseInt(args[0].slice(0, args[0].length - 1) + args[0].charAt(args[0].length - 1).replace("k", "000").replace("m", "000000"))
            print(myMeat())
            var validPrice = prize && prize > 50000 && prize <= 200000 && (myMeat() - globalObj.jackpot) + 50 >= prize
            if (sender === "ggar" || toInt(sender) === "3118267") {
                validPrice = prize && prize > 50000 && (myMeat() - globalObj.jackpot) + 50 >= prize
            } else if (globalObj.donorTable[sender.toLowerCase()]) {
                //fargblabble, junem, pandamanster
                validPrice = prize && prize > 50000 && prize <= (Math.floor(globalObj.donorTable[sender.toLowerCase()] / 2)) && (myMeat() - globalObj.jackpot) + 50 >= prize
            }
            if (validPrice) { //50 meat for package, if winner in ronin
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
                    chatGames("AR requested by " + sender + " with prize 1d" + numberWithCommas(prize) + " meat !!")
                    var cycles = 0;
                    var gameSize = 10;
                    while (runningGame) {
                        refreshShop();
                        if (Object.keys(getShop()).length === 0) {
                            runningGame = false;
                            //post game handle
                            var shopLog = getShopLog()
                            //print(shopInv)
                            var winnerIndex = Math.floor(Math.random() * gameSize) + 1
                            var match = shopLog[winnerIndex - 1].match(/ (\d\d:\d\d:\d\d) (.*) bought (\d*) \((.*)\)/)
                            var winner = match[2]
                            var boughtTime = match[1]
                            var ticketName = match[4]
                            var amount = Math.floor(Math.random() * prize) + 1
                            var playerAmount = Math.floor(amount * 0.9)
                            var jackpotAmount = amount - playerAmount
                            var msg = "game ended !! rolling 1d" + gameSize + " gives " +  ((gameSize + 1) - winnerIndex) + "..."
                            chatGames(msg)
                            wait(5)
                            globalObj.gamesCount++
                            msg = winner + " bought " + match[3] + " " + ticketName + " at " + boughtTime + " and won " + numberWithCommas(playerAmount) + " meat. "
                            msg += numberWithCommas(jackpotAmount) + " meat has been added to the jackpot, "
                            msg += "rolling 1d" + numberWithCommas(50 - (globalObj.jackpotStreak > 45 ? 45 : globalObj.jackpotStreak)) + " for the jackpot..."
                            globalObj.jackpot += jackpotAmount
                            chatGames(msg)
                            wait(5)
                            var jackpotRoll = Math.floor(Math.random() * (50 - (globalObj.jackpotStreak > 45 ? 45 : globalObj.jackpotStreak))) + 1
                            var jackpotmsg = ""
                            if (jackpotRoll === 1) {
                                globalObj.jackpotStreak = 0
                                jackpotmsg += "rolled a 1!! JACKPOT!! " + numberWithCommas(globalObj.jackpot) + " meat has been won by " + winner + "!!"
                                print(kmail(winner, "you won the jackpot of " + numberWithCommas(globalObj.jackpot) + " meat!!", globalObj.jackpot, '"ggames is the best"'))
                                globalObj.jackpot = 0
                            } else {
                                
                                jackpotmsg += "rolled a " + jackpotRoll + " on a 1d" + numberWithCommas(50 - (globalObj.jackpotStreak > 45 ? 45 : globalObj.jackpotStreak)) + " (payout on 1). pot is now at " + numberWithCommas(globalObj.jackpot) + " meat. the last win was " + numberWithCommas(globalObj.jackpotStreak) + " ggames ago. better luck next time..."
                                globalObj.jackpotStreak++
                            }
                            jackpotmsg += "congrats on ggame #" + numberWithCommas(globalObj.gamesCount) + "!!"
                            chatGames(jackpotmsg)
                            
                            
                            bufferToFile(JSON.stringify(globalObj), "./ggamesGlobalObj.json")
                            //kmail

                            /*if (getPlayerRonin(winner)) {
                                print("Winner in Ronin")
                                
                                sendKmail(winner, "You won the AR hosted by " + sender + " with prize 1d" + prize + " meat !!")
                            } else {
                                cliExecute("csend " + amount + " meat to " + winner + "|you won!!!")
                            }*/
                            print(kmail(winner, "you won ggame #" + numberWithCommas(globalObj.gamesCount) + "!!", playerAmount, '"ggames is the best"'))
                            break
                        }
                        cycles++;
                        wait(5)
                        if (cycles === 12 * GAME_TIME + 1) {
                            chatGames("pulling in 1 minute.")
                        } else if (cycles === 12 * GAME_TIME + 18 + 1) {
                            chatGames("pulling in 30 seconds.")
                        } else if (cycles > 12 * GAME_TIME + 24) {
                            chatGames("pulling tickets.")
                            gameSize = 10 - shopAmount(item)
                            takeShop(item)
                        }
                        
                    }
                } else {
                    chatPrivate(sender, "game already running")
                }
            } else {
                chatPrivate(sender, "i dont have enough meat or the prize amount is invalid. (i have " + numberWithCommas(myMeat()) + " meat)")
            }
            break;
        case "roll":
            if (args && args.length > 0 && args[0].startsWith("1d") && parseInt(args[0].split("d")[1]) && !args[0].includes(" ")) {
                var r = args[0].split("d")[1]
                var roll = parseInt(r.slice(0, r.length - 1) + r.charAt(r.length - 1).replace("k", "000").replace("m", "000000"))
                var result = Math.floor(Math.random() * roll) + 1
                if(message.includes("in games")) {
                    var msg = sender + " rolled " + numberWithCommas(result) + " out of " + numberWithCommas(roll)
                    msg += Math.random() > 0.5 ? ". (._.)-b" : ". :]"
                    chatGames(msg)
                } else {
                    chatPrivate(sender, "you rolled " + numberWithCommas(result) + " out of " + numberWithCommas(roll) + ".")
                }
                
            } else {
                chatPrivate(sender, "sorry i dont support anything other than 1d rolls (in development)")
            }
            break;
        case "restock":
            if (sender === "ggar" || toInt(sender) === "3118267") {
                for (var i = 0; i < ticketList.length; i++) {
                    try {
                        buy(args.length > 0 ? parseInt(args[0]) : 100, Item.get(ticketList[i]))
                        print("bought " + ticketList[i])
                        chatPrivate(sender, "bought " + ticketList[i] + " x" + (args.length > 0 ? parseInt(args[0]) : 100))
                    } catch(e) {
                        print(e)
                    }
                }
            } else {
                chatPrivate(sender, "hey hey hey wait.. you cant tell me what to do...")
            }
            break;
        case "howmuchmeat":
            chatPrivate(sender, "i have " + numberWithCommas(myMeat()) + " meat...")
            break;
        case "breakthebank":
            
            break;
        case "hostlimit":
            var entry = globalObj.donorTable[sender.toLowerCase()]
            if (entry) {
                chatPrivate(sender, "you are allowed to host games of up to " + numberWithCommas(Math.floor(entry / 2)) + " meat..")
            } else {
                chatPrivate(sender, "you are allowed to host games of up to 200,000 meat..")
            }
            break;
        case "howmanygames":
            chatPrivate(sender, "i have hosted " + numberWithCommas(globalObj.gamesCount) + " ggames so far!!")
            break;
        case "jackpot":
            chatPrivate(sender, "the jackpot is currently at " + numberWithCommas(globalObj.jackpot) + " meat and was last won " + numberWithCommas(globalObj.jackpotStreak) + " ggames ago.")
            break;
        case "send":
            if (args.length > 0) {
                if (sender === "ggar" || toInt(sender) === "3118267") {
                    var amt = parseInt(args[0])
                    
                    kmail("ggar", "debug", amt, "debug")
                }
            }
            break;
        case "donor":
            if (args.length > 0) {
                if (sender === "ggar" || toInt(sender) === "3118267") {
                    var donor = args.join(" ")
                    if (globalObj.donorTable[donor.toLowerCase()]) {
                        chatPrivate(sender, donor + " is already a donor with amount " + numberWithCommas(globalObj.donorTable[donor.toLowerCase()]))
                    } else {
                        globalObj.donorTable[donor.toLowerCase()] += 1000000
                        bufferToFile(JSON.stringify(globalObj), "./ggamesGlobalObj.json")
                        chatPrivate(sender, donor + " is now a donor")
                    }
              }
            } else {
                chatPrivate(sender, "please provide a name")
            }
            break;
        case "global":
            if (sender === "ggar" || toInt(sender) === "3118267") {
                print(JSON.stringify(globalObj, null, 4))
                chatPrivate(sender, JSON.stringify(globalObj, null, 4))
                kmail(sender, JSON.stringify(globalObj, null, 4), 0, "debug")
            }
            break;
        default:
            chatPrivate(sender, "??? i dont know that command")
    }
}
function chatGames(msg) {
    //visitUrl("submitnewchat.php?playerid=" + myId() + "&pwd=" + myHash() + "&graf=/games " + msg + "&j=1", false);
    //chatPrivate("ggar", msg)
    chatMacro("/games " + msg)
}
function putShopConfirm(price, limit, qty, item) {
    print(toInt(item))
    return visitUrl("managestore.php?item1=" + toInt(item) + "&price1=" + price + "&qty1=" + qty + "&limit1=" + limit + "&pwd=" + myHash() + "&neveragain=0&priceok=0&action=additem&ajax=1&_=" + Date.now());
}
function getPlayerRonin(name) {
    var profile = visitUrl("showplayer.php?who=" + getPlayerId(name));
    if (profile && profile.includes("<b>(In Ronin)</b>") || profile.includes("<b>(Hardcore)</b>")) {
        return true;
    }
    return false;
}
function kmail(to, message, meat, insidenote) {
    if (meat > myMeat()) {
        return false;
    }
    var reqUrl = "sendmessage.php?pwd=&action=send&towho=" + to + "&message=" + message + "&savecopy=on&sendmeat=" + meat
    print(reqUrl)
    var res = visitUrl(reqUrl);
    if (res.includes("That player cannot receive Meat or items")) {
        print("player cannot receive meat or items. sending gift")
        return visitUrl("town_sendgift.php?pwd=&towho=" + to + "&note=" + message + "&insidenote=" + insidenote + "&whichpackage=1&fromwhere=0&howmany1=1&whichitem1=0&sendmeat=" + meat + "&action=Yep.");
    } else {
        return res
    }
}
module.exports = { main }
