require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Settings = require('./src/settings');
const MenuHandler = require('./src/menuHandler');
const RssChecker = require('./src/rssChecker');

// Initialize Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Initialize Modules
const settings = new Settings();
const menuHandler = new MenuHandler(bot, settings);
const rssChecker = new RssChecker(bot, settings);

// Admin Check
const ADMIN_ID = process.env.ADMIN_ID;

const isAdmin = (msg) => {
  const userId = msg.from?.id?.toString() || msg.chat?.id?.toString();
  return userId === ADMIN_ID;
};

// ============ COMMANDS ============

bot.onText(/\/start/, async (msg) => {
  if (!isAdmin(msg)) {
    return bot.sendMessage(msg.chat.id, '❌ Unauthorized! Admin only.');
  }
  await menuHandler.sendMainMenu(msg.chat.id);
});

bot.onText(/\/setup/, async (msg) => {
  if (!isAdmin(msg)) return;
  await menuHandler.sendMainMenu(msg.chat.id);
});

// ============ CALLBACK HANDLER ============

bot.on('callback_query', async (query) => {
  if (!isAdmin(query.message)) {
    return bot.answerCallbackQuery(query.id, { text: '❌ Unauthorized!' });
  }
  
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;
  
  await bot.answerCallbackQuery(query.id);
  
  try {
    await menuHandler.handleCallback(chatId, data, messageId);
  } catch (error) {
    console.error('Callback Error:', error);
    bot.sendMessage(chatId, '❌ Error processing request.');
  }
});

// ============ MESSAGE HANDLER (For text input) ============

const userStates = new Map();

bot.on('message', async (msg) => {
  if (!isAdmin(msg)) return;
  if (msg.text?.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const state = userStates.get(chatId);
  
  if (state) {
    await menuHandler.handleTextInput(chatId, state, msg.text);
    userStates.delete(chatId);
  }
});

// Export userStates for menuHandler
module.exports = { userStates, ADMIN_ID };

// ============ START RSS CHECKER ============

rssChecker.start();

console.log('✅ ANIMETHIC POSTER BOT IS RUNNING');
console.log('📱 Admin ID:', ADMIN_ID);
console.log('📢 Channel ID:', process.env.CHANNEL_ID);
console.log('🌐 Blog:', process.env.BLOG_URL);
console.log('⚡ RSS Check Interval:', settings.get('check_interval'), 'mins');
console.log('🎨 Post Mode:', settings.get('mode'));
