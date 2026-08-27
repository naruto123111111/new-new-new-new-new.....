const axios = require('axios');

const baseApiUrl = async () => {
  const base = await axios.get(`https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`);
  return base.data.api;
};

module.exports = {
  config: {
    name: "baby",
    version: "7.0.0",
    author: "dipto",
    role: 0,
    shortDescription: "Chatbot baby",
    longDescription: "teach, edit, list, remove and chat with baby",
    category: "chat",
    guide: {
      en: "[anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2]...\nteach react [YourMessage] - [react1], [react2]...\nremove [YourMessage]\nrm [YourMessage] - [index]\nmsg [YourMessage]\nlist OR list all\nedit [YourMessage] - [NewMessage]"
    }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    try {
      const link = `${await baseApiUrl()}/baby`;
      const dipto = args.join(" ").toLowerCase();
      const uid = event.senderID;

      if (!args[0]) {
        const ran = ["Bolo baby", "hum", "type help baby", "type !baby hi"];
        return message.reply(ran[Math.floor(Math.random() * ran.length)]);
      }

      // REMOVE
      if (args[0] === 'remove') {
        const fina = dipto.replace("remove ", "");
        const respons = await axios.get(`${link}?remove=${encodeURIComponent(fina)}&senderID=${uid}`);
        return message.reply(respons.data.message);
      }

      // REMOVE by index
      if (args[0] === 'rm' && dipto.includes('-')) {
        const [fi, f] = dipto.replace("rm ", "").split(' - ');
        const respons = await axios.get(`${link}?remove=${encodeURIComponent(fi)}&index=${f}`);
        return message.reply(respons.data.message);
      }

      // LIST
      if (args[0] === 'list') {
        if (args[1] === 'all') {
          const res = await axios.get(`${link}?list=all`);
          const data = res.data.teacher.teacherList || [];
          const teachers = await Promise.all(data.map(async (item) => {
            const number = Object.keys(item)[0];
            const value = item[number];
            const name = await usersData.getName(number) || "unknown";
            return { name, value };
          }));
          teachers.sort((a, b) => b.value - a.value);
          const output = teachers.map((teacher, index) => `${index + 1}/ ${teacher.name}: ${teacher.value}`).join('\n');
          return message.reply(`Total Teach = ${data.length}\n\n👑 | List of Teachers of baby\n${output}`);
        } else {
          const respo = await axios.get(`${link}?list=all`);
          const data = respo.data.teacher.teacherList || [];
          return message.reply(`Total Teach = ${data.length}`);
        }
      }

      // MESSAGE
      if (args[0] === 'msg' || args[0] === 'message') {
        const fuk = dipto.replace(/^(msg|message) /, "");
        const respo = await axios.get(`${link}?list=${encodeURIComponent(fuk)}`);
        return message.reply(`Message ${fuk} = ${respo.data.data}`);
      }

      // EDIT
      if (args[0] === 'edit') {
        const [oldMsg, newMsg] = dipto.replace("edit ", "").split(' - ');
        if (!oldMsg || !newMsg) {
          return message.reply('❌ | Invalid format! Use edit [YourMessage] - [NewReply]');
        }
        const res = await axios.get(`${link}?edit=${encodeURIComponent(oldMsg)}&replace=${encodeURIComponent(newMsg)}`);
        return message.reply(`✅ Changed: ${res.data.message}`);
      }

      // TEACH normal
      if (args[0] === 'teach' && args[1] !== 'amar' && args[1] !== 'react') {
        const [comd, command] = dipto.split(' - ');
        const final = comd.replace("teach ", "");
        if (!command || command.length < 2) {
          return message.reply('❌ | Invalid format! Use [YourMessage] - [Reply1], [Reply2]...');
        }
        const re = await axios.get(`${link}?teach=${encodeURIComponent(final)}&reply=${encodeURIComponent(command)}&senderID=${uid}`);
        const name = await usersData.getName(re.data.teacher) || "unknown";
        return message.reply(`✅ Replies added: ${re.data.message}\nTeacher: ${name}\nTeachs: ${re.data.teachs}`);
      }

      // TEACH intro
      if (args[0] === 'teach' && args[1] === 'amar') {
        const [comd, command] = dipto.split(' - ');
        const final = comd.replace("teach ", "");
        if (!command || command.length < 2) {
          return message.reply('❌ | Invalid format! Use teach amar [YourMessage] - [Reply]');
        }
        const re = await axios.get(`${link}?teach=${encodeURIComponent(final)}&senderID=${uid}&reply=${encodeURIComponent(command)}&key=intro`);
        return message.reply(`✅ Replies added ${re.data.message}`);
      }

      // TEACH react
      if (args[0] === 'teach' && args[1] === 'react') {
        const [comd, command] = dipto.split(' - ');
        const final = comd.replace("teach react ", "");
        if (!command || command.length < 1) {
          return message.reply('❌ | Invalid format! Use teach react [YourMessage] - [react1], [react2]...');
        }
        const re = await axios.get(`${link}?teach=${encodeURIComponent(final)}&react=${encodeURIComponent(command)}`);
        return message.reply(`✅ Reacts added ${re.data.message}`);
      }

      // Special keyword
      if (['amar name ki', 'amr nam ki', 'amar nam ki', 'amr name ki'].some(phrase => dipto.includes(phrase))) {
        const response = await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`);
        return message.reply(response.data.reply);
      }

      // DEFAULT CHAT
      const a = (await axios.get(`${link}?text=${encodeURIComponent(dipto)}&senderID=${uid}&font=1`)).data.reply;
      const res = await message.reply(a);
      
      global.GoatBot.onReply.set(res.messageID, {
        commandName: this.config.name,
        author: event.senderID
      });

    } catch (e) {
      return message.reply(`Error: ${e.message}`);
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    try {
      if (event.type === "message_reply") {
        const reply = event.body.toLowerCase();
        if (isNaN(reply)) {
          const b = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(reply)}&senderID=${event.senderID}&font=1`)).data.reply;
          const res = await message.reply(b);
          
          global.GoatBot.onReply.set(res.messageID, {
            commandName: this.config.name,
            author: event.senderID
          });
        }
      }
    } catch (err) {
      return message.reply(`Error: ${err.message}`);
    }
  },

  onChat: async function ({ api, event, message }) {
    try {
      const body = event.body ? event.body.toLowerCase() : "";
      if (body.startsWith("baby") || body.startsWith("bby") || body.startsWith("janu")) {
        const arr = body.replace(/^\S+\s*/, "");
        if (!arr) {
          const res = await message.reply("Yes😀, I am here");
          return global.GoatBot.onReply.set(res.messageID, {
            commandName: this.config.name,
            author: event.senderID
          });
        }
        const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}&font=1`)).data.reply;
        const res = await message.reply(a);
        
        global.GoatBot.onReply.set(res.messageID, {
          commandName: this.config.name,
          author: event.senderID
        });
      }
    } catch (err) {
      return message.reply(`Error: ${err.message}`);
    }
  }
};
