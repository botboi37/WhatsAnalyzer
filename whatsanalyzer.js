const fs = require("fs");

const C = require("./color");


const MESSAGE_TYPE_TEXT     = 0;
const MESSAGE_TYPE_GIF      = 1;
const MESSAGE_TYPE_IMAGE    = 2;
const MESSAGE_TYPE_STICKER  = 3;
const MESSAGE_TYPE_DELETED  = 4;
const MESSAGE_TYPE_VIDEO    = 5;


function GET_HIGHEST_VALUE (obj) {
    let candidate = null;
    for (let k in obj) {
        if (candidate == null || obj[k] > obj[candidate]) candidate = k;
        else continue;
    }
    return candidate;
}



function editLastLine(ntx) {
    process.stdout.cursorTo(0);
    process.stdout.write(ntx);
    return true;
}

function parseMoment(tstr) {
    let _y, _m, _d, _h, _M, _s;

    _d = tstr.substring(0, 2);
    if (_d.endsWith("/")) _d = tstr.substring(0, 1);

    _m = tstr.substring(1 + _d.length, (2 + _d.length) + 1);
    if (_m.endsWith("/")) _m = tstr.substring(1 + _d.length, (2 + _d.length));

    _y = tstr.substring((2 + _d.length) + _m.length, (2 + _m.length) + (_d.length + _m.length)).padStart(4, "20");

    _s = tstr.substring(tstr.length - 2, tstr.length);
    _M = tstr.substring(tstr.length - 5, tstr.length - 3);
    _h = tstr.substring(tstr.length - 8, tstr.length - 6);

    return {
        "year": parseInt(_y),
        "month": parseInt(_m),
        "day": parseInt(_d),
        "hour": parseInt(_h),
        "minute": parseInt(_M),
        "second": parseInt(_s),
    }
}

function parseParticipants(msgs) {
    let res = {
        "users": [],
        "count": {},
        "text": {},
        "textT": 0,
        "del": {},
        "delT": 0,
        "image": {},
        "imageT": 0,
        "video": {},
        "videoT": 0,
        "gif": {},
        "gifT": 0,
        "sticker": {},
        "stickerT": 0
    }
    for (let m in msgs) {        
        if (!res.users.includes(msgs[m].sender)) {
            res.users.push(msgs[m].sender);

            res.count[msgs[m].sender] = 0;
            res.text[msgs[m].sender] = 0;
            res.del[msgs[m].sender] = 0;
            res.image[msgs[m].sender] = 0;
            res.video[msgs[m].sender] = 0;
            res.gif[msgs[m].sender] = 0;
            res.sticker[msgs[m].sender] = 0;
        }

        res.count[msgs[m].sender]++;

        if (msgs[m].type == MESSAGE_TYPE_TEXT)          res.textT++;
        else if (msgs[m].type == MESSAGE_TYPE_IMAGE)    res.imageT++;
        else if (msgs[m].type == MESSAGE_TYPE_GIF)      res.gifT++;
        else if (msgs[m].type == MESSAGE_TYPE_STICKER)  res.stickerT++;
        else if (msgs[m].type == MESSAGE_TYPE_DELETED)  res.delT++;
        else if (msgs[m].type == MESSAGE_TYPE_VIDEO)    res.videoT++;

        if (msgs[m].type == MESSAGE_TYPE_TEXT)          res.text[msgs[m].sender]++;
        else if (msgs[m].type == MESSAGE_TYPE_IMAGE)    res.image[msgs[m].sender]++;
        else if (msgs[m].type == MESSAGE_TYPE_GIF)      res.gif[msgs[m].sender]++;
        else if (msgs[m].type == MESSAGE_TYPE_STICKER)  res.sticker[msgs[m].sender]++;
        else if (msgs[m].type == MESSAGE_TYPE_DELETED)  res.del[msgs[m].sender]++;
        else if (msgs[m].type == MESSAGE_TYPE_VIDEO)    res.video[msgs[m].sender]++;
    }

    return res;
}

function buildMessageTable(parts, totalMsg) {
    let res = [];

    // userMaxSpacing = longest username + 5 characters;
    // deepcopies array first so sorting doesn’t mutate original
    let copy = JSON.parse(JSON.stringify(parts.users));
    copy.sort((a, b) => { return b.length - a.length });
    let userMaxSpacing = copy[0].length + 5;

    parts.users.sort((a, b) => {
        return parts.count[b] - parts.count[a];
    });

    res.push(`User${" ".repeat(userMaxSpacing - "User".length)}Messages${" ".repeat(10 - "Messages".length)}\
Text${" ".repeat(10 - "Deleted".length)}Deleted${" ".repeat(10 - "Text".length)}\
Image${" ".repeat(10 - "Image".length)}Video${" ".repeat(10 - "Video".length)}GIF${" ".repeat(10 - "GIF".length)}Sticker`);

    for (let u of parts.users) {
        res.push(`${C.fgYellow}${u}${C.reset}\
${" ".repeat(userMaxSpacing - u.length)}\
${C.fgCyan}${parts.count[u].toLocaleString("en")}${C.reset}\
${" ".repeat(10 - parts.count[u].toLocaleString("en").length)}\
${C.fgCyan}${parts.text[u].toLocaleString("en")}${C.reset}\
${" ".repeat(10 - parts.text[u].toLocaleString("en").length)}\
${C.fgCyan}${parts.del[u].toLocaleString("en")}${C.reset}\
${" ".repeat(10 - parts.del[u].toLocaleString("en").length)}\
${C.fgCyan}${parts.image[u].toLocaleString("en")}${C.reset}\
${" ".repeat(10 - parts.image[u].toLocaleString("en").length)}\
${C.fgCyan}${parts.video[u].toLocaleString("en")}${C.reset}\
${" ".repeat(10 - parts.video[u].toLocaleString("en").length)}\
${C.fgCyan}${parts.gif[u].toLocaleString("en")}${C.reset}\
${" ".repeat(10 - parts.gif[u].toLocaleString("en").length)}\
${C.fgCyan}${parts.sticker[u].toLocaleString("en")}${C.reset}`);
    }

    res.push("");
    res.push(`Total ${C.fgGreen}${parts.users.length.toLocaleString("en")}${C.reset} users, ${C.fgGreen}${totalMsg.toLocaleString("en")}${C.reset} messages\
 (${C.fgGreen}${parts.textT.toLocaleString("en")}${C.reset} text,\
 ${C.fgGreen}${parts.delT.toLocaleString("en")}${C.reset} deleted,\
 ${C.fgGreen}${parts.imageT.toLocaleString("en")}${C.reset} image,\
 ${C.fgGreen}${parts.videoT.toLocaleString("en")}${C.reset} video,\
 ${C.fgGreen}${parts.gifT.toLocaleString("en")}${C.reset} GIF,\
 ${C.fgGreen}${parts.stickerT.toLocaleString("en")}${C.reset} sticker)`);
    
    return res.join("\n");
}

function buildWordTable(parts, msg) {
    let res = [];

    let word = {},
        wordT = 0;

    let mKeys = Object.keys(msg);
    let lastProg = null;
    for (let mKeyIndex = 0; mKeyIndex < mKeys.length; mKeyIndex++) {
        let nl = C.fgCyan + "wait" + C.reset + " Analyzing words... " + Math.round(((mKeyIndex + 1) / mKeys.length) * 100) + "%";
        if (lastProg != nl) {
            lastProg = nl;
            editLastLine(nl);
        }
        let m = mKeys[mKeyIndex];
        if (!Object.keys(word).includes(msg[m].sender)) word[msg[m].sender] = {};
        if (msg[m].type != MESSAGE_TYPE_TEXT) continue;
        let msgWords = msg[m].content.split(" ");
        for (let w of msgWords) {
            if (w.match(/^[^a-zA-Z]+$/)) continue;
            if (w.match(/^http(s?):\/\//)) continue;
            if (!Object.keys(word[msg[m].sender]).includes(w)) word[msg[m].sender][w] = 0;
            word[msg[m].sender][w]++;
            wordT++;
        }
    }


    let most = {},
        avg = {};
    for (let sender in word) {
        let mostWord = GET_HIGHEST_VALUE(word[sender]);
        
        most[sender] = {
            "word": mostWord,
            "amt": word[sender][mostWord]
        }
    }    

    // userMaxSpacing = longest username + 5 characters;
    // deepcopies array first so sorting doesn’t mutate original
    let copy = JSON.parse(JSON.stringify(parts.users));
    copy.sort((a, b) => { return b.length - a.length });
    let userMaxSpacing = copy[0].length + 5;

    parts.users.sort((a, b) => {
        let totalWordsA = 0,
            totalWordsB = 0;

        for (let w in word[a]) totalWordsA += word[a][w];
        avg[a] = totalWordsA / parts.count[a];

        for (let w in word[b]) totalWordsB += word[b][w];
        avg[b] = totalWordsB / parts.count[b];

        return avg[b] - avg[a];
    });

    res.push(`User${" ".repeat(userMaxSpacing - "User".length)}Most used${" ".repeat(25 - "Most used".length)}\
Avg words/message`);

    for (let u of parts.users) {
        res.push(`${C.fgYellow}${u}${C.reset}\
${" ".repeat(userMaxSpacing - u.length)}\
${C.fgCyan}${most[u].word} (${most[u].amt.toLocaleString("en")}x)${C.reset}\
${" ".repeat(25 - `${most[u].word} (${most[u].amt.toLocaleString("en")}x)`.length)}\
${C.fgCyan}${avg[u].toFixed(3)}${C.reset}`);
    }

    res.push("");
    res.push(`Total ${C.fgGreen}${wordT.toLocaleString("en")}${C.reset} words`);
    
    return res.join("\n");
}

void function main() {
    var argv = process.argv;

    if (argv.length < 3) {
        console.log(`${C.fgRed}error${C.reset} Argument required: <path to export file>`);
        return process.exit(0);
    }

    let cpath = argv[2];
    console.log(`${C.fgCyan}wait${C.reset} Accessing file '${cpath}'...`);
    fs.access(cpath, fs.constants.R_OK, (e) => {
        if (e) {
            console.log(`${C.fgRed}error${C.reset} Cannot access file '${argv[2]}'`);
            return process.exit(0);
        } else if (!fs.lstatSync(cpath).isFile()) {
            console.log(`${C.fgRed}error${C.reset} '${argv[2]}' is not a file`);
            return process.exit(0);
        } else {
            console.log(`${C.fgGreen}ok${C.reset} Done\n`);

            let content = fs.readFileSync(cpath, "utf8");
    
            process.stdout.write(`${C.fgCyan}wait${C.reset} Parsing export... 0%`);
            let lines = content.match(/[^\r\n]+/g);
    
            let failed = null,
                lastProg = "";
    
            let MESSAGES = [],
                SAMEMESSAGE = [];
    
            for (let li = 0; li < lines.length; li++) {
                let l = lines[li];
    
                let nl = C.fgCyan + "wait" + C.reset + " Parsing export... " + Math.round(((li + 1) / lines.length) * 100) + "%";
                if (nl != lastProg) {
                    lastProg = nl;
                    editLastLine(nl);
                }

                if (SAMEMESSAGE.includes(li)) continue;

                l = l.replace(/‎/gi, "");
    
                if (!l.match(/^(‎?)\[([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{1,2}), ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})\] (.+): (‎?)(.+)$/)) {
                    if (!l.match(/(‎?)^\[([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{1,2}), ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})\] (.+) created this group$/)
                        && !l.match(/(‎?)^\[([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{1,2}), ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})\] You were added$/)
                        && !l.match(/(‎?)^\[([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{1,2}), ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})\] (.+) added (.+)$/)
                        && !l.match(/(‎?)^\[([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{1,2}), ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})\] (.+) left$/)) {
                            failed = li + 1;
                            break;
                    } else continue;
                 }
                else {
                    let _t, _d, _p, _s, _a, _c, _m;
    
                    _t = l.substring(1, l.indexOf("]"));
                    _s = l.substring(l.indexOf("] ") + "] ".length, l.indexOf(": "));
                    _c = l.substring(l.indexOf(_s) + _s.length + 2, l.length);

                    if (_c == "Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.") continue;

                    switch(_c) {
                        case "image omitted":
                            _a = MESSAGE_TYPE_IMAGE;
                        break;

                        case "sticker omitted":
                            _a = MESSAGE_TYPE_STICKER;
                        break;

                        case "GIF omitted":
                            _a = MESSAGE_TYPE_GIF;
                        break;                        

                        case "You deleted this message.":
                        case "This message was deleted.":
                            _a = MESSAGE_TYPE_DELETED;
                        break;

                        case "video omitted":
                            _a = MESSAGE_TYPE_VIDEO;
                        break;

                        default:
                            _a = MESSAGE_TYPE_TEXT;
                        break;
                    }

                    let extender = li;
                    while (lines.length > extender + 1
                        && !lines[extender + 1].match(/^(‎?)\[([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{1,2}), ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})\] (.+): (‎?)(.+)$/)) {
                            SAMEMESSAGE.push(extender + 1);
                            extender++;
                    }

                    _d = new Date(),
                    _p = parseMoment(_t);

                    _d.setFullYear(_p.year, _p.month - 1, _p.day);
                    _d.setHours(_p.hour, _p.minute, _p.second);

                    _m = {
                        "sender": _s,
                        "type": _a,
                        "content": _c,
                        "ts": _d
                    }

                    MESSAGES.push(_m);
                }
            }
            if (failed) {
                console.log(`\n${C.fgRed}error${C.reset} File is not a valid WhatsApp export file (line ${failed} is invalid)`);
                return process.exit(0);
            }
            console.log(`\n${C.fgGreen}ok${C.reset} Done\n`);

            console.log(`${C.fgCyan}wait${C.reset} Analyzing users...`);
            let finalAnalytics = [];
            let parts = parseParticipants(MESSAGES);
            finalAnalytics.push(`${C.fgGrey}MESSAGES${C.reset}\n\n${buildMessageTable(parts, Object.keys(MESSAGES).length)}`);
            console.log(`${C.fgGreen}ok${C.reset} Done\n`);

            process.stdout.write(`${C.fgCyan}wait${C.reset} Analyzing words... 0%`);
            finalAnalytics.push(`\n\n${C.fgGrey}WORDS${C.reset}\n\n${buildWordTable(parts, MESSAGES)}`);
            console.log(`\n${C.fgGreen}ok${C.reset} Done\n`);

            console.log("\n\n" + finalAnalytics.join("\n"));
        }
    });
}();