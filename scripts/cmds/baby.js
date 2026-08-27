const axios = require("axios");

const simsim = "https://simsimi-api-tjb1.onrender.com";

const typing = async (api, threadID, ms = 3000) => {
  try {
    if (typeof api.sendTypingIndicator === "function") {
      await api.sendTypingIndicator(threadID, true);
      await new Promise(resolve => setTimeout(resolve, ms));
      await api.sendTypingIndicator(threadID, false);
    }
  } catch {}
};

module.exports = {
  config: {
    name: "baby",
    aliases: ["mari", "maria", "hippi", "xan", "bby", "bbz"],
    version: "3.6",
    author: "rX (fixed by GPT)",
    countDown: 0,
    role: 0,
    shortDescription: "Full Mirai-style Baby AI",
    longDescription: "Teachable AI + autoteach + list/msg/edit/remove + typing",
    category: "box chat",
    guide: {
      en: "{p}baby [message]\n{p}baby teach [q] - [a]\n{p}baby autoteach on/off\n{p}baby list\n{p}baby msg [trigger]\n{p}baby edit [q] - [old] - [new]\n{p}baby remove/rm [q] - [a]"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const senderID = event.senderID;
    const senderName = await usersData.getName(senderID);
    const threadID = event.threadID;
    const query = args.join(" ").trim().toLowerCase();

    try {
      // no text => random reply
      if (!query) {
        await typing(api, threadID, 2000);
        const ran = ["Bolo baby 💖", "Hea baby 😚", "Yes I'm here 😘", "Ki khobor janu? 🥰"];
        return message.reply(ran[Math.floor(Math.random() * ran.length)], (err, info) => {
          if (!err) global.GoatBot.onReply.set(info.messageID, { commandName: "baby" });
        });
      }

      // AUTOTEACH TOGGLE
      if (args[0] === "autoteach") {
        const mode = args[1]?.toLowerCase();
        if (!["on","off"].includes(mode)) return message.reply("Use: baby autoteach on/off");

        const status = mode === "on";
        await axios.post(`${simsim}/setting`, { autoTeach: status }, { timeout: 10000 });
        return message.reply(`✅ Auto teach now ${status ? "ON 🟢" : "OFF 🔴"}`);
      }

      // LIST
      if (args[0] === "list") {
        const res = await axios.get(`${simsim}/list`, { timeout: 10000 });
        return message.reply(
`╭─╼🌟 𝐁𝐚𝐛𝐲 𝐀𝐈 𝐒𝐭𝐚𝐭𝐮𝐬
├ 📝 𝐓𝐞𝐚𝐜𝐡𝐞𝐝 𝐐𝐮𝐞𝐬𝐭𝐢𝐨𝐧𝐬: ${res.data.totalQuestions || 0}
├ 📦 𝐒𝐭𝐨𝐫𝐞𝐝 𝐑𝐞𝐩𝐥𝐢𝐞𝐬: ${res.data.totalReplies || 0}
╰─╼👤 𝐃𝐞𝐯: rX 𝐀𝐛𝐝𝐮𝐥𝐥𝐚𝐡`
        );
      }

      // MSG
      if (args[0] === "msg") {
        const trigger = args.slice(1).join(" ").trim();
        if (!trigger) return message.reply("Use: baby msg [trigger]");

        const res = await axios.get(`${simsim}/simsimi-list?ask=${encodeURIComponent(trigger)}`, { timeout: 10000 });
        if (!res.data.replies?.length) return message.reply("❌ No replies found for this trigger.");

        const formatted = res.data.replies.map((rep, i) => `➤ ${i+1}. ${rep}`).join("\n");
        return message.reply(
`📌 𝗧𝗿𝗶𝗴𝗴𝗲𝗿: ${trigger.toUpperCase()}
📋 𝗧𝗼𝘁𝗮𝗹 𝗥𝗲𝗽𝗹𝗶𝗲𝘀: ${res.data.total || res.data.replies.length}
━━━━━━━━━━━━━━
${formatted}`
        );
      }

      // TEACH
      if (args[0] === "teach") {
        const parts = query.replace(/^teach\s+/i, "").split(" - ");
        if (parts.length < 2) return message.reply("Use: baby teach question - answer");

        const [ask, ans] = parts.map(s => s.trim());
        const res = await axios.get(`${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderName=${encodeURIComponent(senderName)}&senderID=${senderID}`, { timeout: 10000 });
        return message.reply(res.data.message || "✅ Taught successfully!");
      }

      // EDIT
      if (args[0] === "edit") {
        const parts = query.replace(/^edit\s+/i, "").split(" - ");
        if (parts.length < 3) return message.reply("Use: baby edit question - old reply - new reply");

        const [ask, oldR, newR] = parts.map(s => s.trim());
        const res = await axios.get(`${simsim}/edit?ask=${encodeURIComponent(ask)}&old=${encodeURIComponent(oldR)}&new=${encodeURIComponent(newR)}`, { timeout: 10000 });
        return message.reply(res.data.message || "✅ Edited successfully!");
      }

      // REMOVE / RM
      if (["remove","rm"].includes(args[0])) {
        const parts = query.replace(/^(remove|rm)\s+/i, "").split(" - ");
        if (parts.length < 2) return message.reply("Use: baby remove question - answer");

        const [ask, ans] = parts.map(s => s.trim());
        const res = await axios.get(`${simsim}/delete?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`, { timeout: 10000 });
        return message.reply(res.data.message || "✅ Removed successfully!");
      }

      // Normal chat
      await typing(api, threadID, 2000);
      const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)}`, { timeout: 15000 });

      let responses = Array.isArray(res.data.response) ? res.data.response : [res.data.response || "Hmm baby 😚"];
      for (const r of responses) {
        await new Promise(resolve => {
          message.reply(r, (err, info) => {
            if (!err) global.GoatBot.onReply.set(info.messageID, { commandName: "baby" });
            resolve();
          });
        });
      }

    } catch (err) {
      console.error("Baby command error:", err.message);
      message.reply("❌ Error: " + (err.message.includes("404") ? "Feature not available (backend issue)" : err.message));
    }
  },

  onReply: async function ({ api, event, message, usersData }) {
    const text = event.body?.trim();
    if (!text) return;
    const senderName = await usersData.getName(event.senderID);

    try {
      await typing(api, event.threadID, 2000);
      const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(text)}&senderName=${encodeURIComponent(senderName)}`, { timeout: 15000 });

      const replies = Array.isArray(res.data.response) ? res.data.response : [res.data.response];
      for (const r of replies) {
        await message.reply(r, (err, info) => {
          if (!err) global.GoatBot.onReply.set(info.messageID, { commandName: "baby" });
        });
      }
    } catch (err) {
      console.error("onReply error:", err.message);
    }
  },

  onChat: async function ({ api, event, message, usersData }) {
    const raw = event.body ? event.body.toLowerCase().trim() : "";
    if (!raw) return;

    const senderID = event.senderID;
    const senderName = await usersData.getName(senderID);
    const threadID = event.threadID;

    try {
      // triggers only
      const triggers = ["baby","bby","xan","bbz","mari","মারিয়া","bot"];
      if (triggers.includes(raw)) {
        await typing(api, threadID, 5000);
        const funny = [
    "Yes 😀, I am here", "What's up?", "Bolo jaan ki korte panmr jonno","ʜᴇʏ ʙᴀʙʏ 😘 ᴋᴏᴛʜᴀʏ ᴄʜɪʟᴀ?",
    "ʙᴀʙʏ, ᴀᴍɪ ᴛᴏᴍᴀʀ ᴏᴘᴇᴋʜʏᴀʏ ᴄʜɪʟᴀᴍ 💖",
    "ᴋɪ ᴋᴏʀᴛᴇᴄʜᴏ ʙᴀʙʏ? 😍",
    "ᴍɪꜱꜱ ᴋᴏʀᴇᴄʜᴏ ᴀᴍᴀᴋᴇ? 🥰",
    "ʏᴇꜱ ʙᴀʙʏ, ᴀᴍɪ ʟɪꜱᴛᴇɴɪɴɢ 👂",
    "ʙᴀʙʏʏʏ~ ᴛᴜᴍɪ ᴀᴍᴀᴋᴇ ᴄᴀʟʟ ᴋᴏʀᴇᴄʜᴏ? 💌",
    "ᴏᴡᴡ ʙᴀʙʏ, ᴛᴜᴍɪ ᴏɴᴇᴋ ᴄᴜᴛᴇ 💕",
    "ʜᴇʏ ʟᴏᴠᴇʀʙᴏʏ/ʟᴏᴠᴇʀɢɪʀʟ 💞",
    "ᴋɪ ᴅᴏᴋᴛᴇ ʙᴀʙʏ~ ᴀᴍɪ ᴀᴄʜɪ 💗",
    "ʙᴀʙʏ, ᴛᴜᴍɪ ᴀᴍᴀʀ ꜱᴘᴇᴄɪᴀʟ ❤️",
    "ʙᴀʙʏ, ᴛᴜᴍɪ ᴄᴀʟʟ ᴋᴏʀʟᴇ ᴀᴍɪ ʀᴜɴ ᴋᴏʀᴇ ᴀꜱʜɪ 😚",
    "ᴀᴍᴀʀ ꜱʜᴏɴᴀ ʙᴀʙʏ ᴋᴏᴛʜᴀʏ ᴄʜɪʟᴏ 💖",
    "ʙᴀʙʏ, ᴛᴏᴍᴀʀ ᴍᴇꜱꜱᴀɢᴇ ᴅᴇᴋʜᴇ ʜᴇᴀʀᴛ ʜᴀᴘᴘʏ 💕",
    "ᴛᴜᴍɪ ᴄᴀʟʟ ᴋᴏʀʟᴇ ᴀᴍɪ ꜱᴍɪʟᴇ ᴋᴏʀɪ 😍",
    "ʙᴀʙʏ, ᴀᴍɪ ᴀᴄʜɪ ᴛᴏᴍᴀʀ ᴊᴏɴɴᴏ ʜᴍᴍ 💗",
    "ᴏʏᴇ ʙᴀʙʏ, ᴛᴜᴍɪ ᴀᴍᴀʀ ꜱᴡᴇᴇᴛ ᴘʀᴏʙʟᴇᴍ 😜",
    "ʙᴀʙʏ, ᴀᴍɪ ᴀᴄʜɪ ᴊᴜꜱᴛ ꜰᴏʀ ʏᴏᴜ 😚",
    "ᴛᴜᴍɪ ᴋᴀʟ ᴋᴏᴛʜᴀʏ ᴄʜɪʟᴏ ʙᴀʙʏ? 🥹",
    "ʙᴀʙʏ, ᴛᴏᴍᴀʀ ᴍᴇꜱꜱᴀɢᴇ ᴀᴍᴀʏ ꜰʟʏ ᴋᴏʀᴀʏ 🕊️",
    "ᴀʟᴡᴀʏꜱ ʏᴏᴜʀꜱ ʙᴀʙʏ 💖",
    "ʙᴀʙʏ, ᴀᴍᴀʀ ʜᴇᴀʀᴛ ᴛᴜᴍᴀʀ ᴡɪꜰɪ ᴛᴇ ᴄᴏɴɴᴇᴄᴛᴇᴅ 📶❤️",
    "ʙᴀʙʏ, ᴀᴍɪ ꜱᴜᴅᴜ ᴛᴜᴍᴀʀ ᴊᴏɴɴᴏ ᴏɴʟɪɴᴇ 🌐💗","এই যে আমার হার্ট চোর 😘",
    "বাবু, তোমার জন্য আমি তো সব ছেড়ে আসতে পারি 💖",
    "কি করছো, আমার ভবিষ্যৎ স্বামী ? 😍",
    "তোমার কথা ভাবতে ভাবতে চা ঠান্ডা হয়ে গেল ☕❤️",
    "তুমি কি GPS? কারণ তুমি ছাড়া আমি হারিয়ে যাই 🗺️💗",
    "বাবু, তোমার হাসি না দেখলে দিনটাই অফ 💕",
    "তুমি ডাকলে আমার চার্জ 100% হয়ে যায় 🔋😘",
    "তুমি ছাড়া আমি WiFi ছাড়া ফোনের মতো 📶💔",
    "আমার হৃৎপিণ্ডের অ্যাডমিন তুমি ❤️‍🔥",
    "তুমি কি জাদুকর? দেখলেই মন ভাল হয়ে যায় ✨",
    "বাবু, তুমি আমার গুগল... কারণ আমার সব উত্তর তুমি 💌",
    "তুমি না থাকলে ফেসবুকও বোরিং লাগে 📱💗",
    "আমার হৃদয়ের সিমে শুধু তোমার নাম সেভ আছে 📞❤️",
    "তুমি আসলেই আবহাওয়া সুন্দর হয়ে যায় 🌤️😘",
    "আমার হোয়াটসঅ্যাপের টপ চ্যাট শুধু তুমি 💚",
    "তুমি না থাকলে মনে হয় চার্জার খুলে গেছে 🔌💔",
    "আমার হার্টে তোমার নটিফিকেশন সবসময় অন 📲💖",
    "তুমি কি কফি? তোমাকে ছাড়া ঘুম ভাঙে না ☕😍",
    "তুমি আমার লাইফের VIP গ্রুপে অ্যাড আছো 👑",
    "তুমি পাশে থাকলেই মনে হয় নেট ফাস্ট হয়ে গেছে ⚡💗",
    "তুমি কি মেঘ? আমার মন বৃষ্টিতে ভিজিয়ে দাও 🌧️❤️",
    "তুমি ছাড়া আমি অফলাইন ইউজারের মতো 😅",
    "বাবু, তুমি আমার হাসির রিমিক্স ভার্সন 🎶💓"
        ];
        return message.reply(funny[Math.floor(Math.random() * funny.length)], (err, info) => {
          if (!err) global.GoatBot.onReply.set(info.messageID, { commandName: "baby" });
        });
      }

      // prefixes
      const prefixes = ["baby ","bby ","xan ","bbz ","mari ","মারিয়া ","bot "];
      const prefix = prefixes.find(p => raw.startsWith(p));
      if (prefix) {
        const q = raw.replace(prefix,"").trim();
        if (!q) return;

        await typing(api, threadID, 2000);
        const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(q)}&senderName=${encodeURIComponent(senderName)}`, { timeout: 15000 });

        const replies = Array.isArray(res.data.response) ? res.data.response : [res.data.response];
        for (const r of replies) {
          await message.reply(r, (err, info) => {
            if (!err) global.GoatBot.onReply.set(info.messageID, { commandName: "baby" });
          });
        }
        return;
      }

      // AUTO-TEACH from reply
      if (event.messageReply) {
        try {
          const setting = await axios.get(`${simsim}/setting`, { timeout: 8000 });
          if (setting.data?.autoTeach) {
            const ask = event.messageReply.body?.toLowerCase().trim();
            const ans = raw.trim();
            if (ask && ans && ask !== ans) {
              setTimeout(async () => {
                try {
                  await axios.get(`${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderName=${encodeURIComponent(senderName)}`, { timeout: 10000 });
                } catch {}
              }, 500);
            }
          }
        } catch {}
      }

    } catch (err) {
      console.error("onChat error:", err.message);
    }
  }
};
