const { userStates } = require('../bot');

class MenuHandler {
  constructor(bot, settings) {
    this.bot = bot;
    this.settings = settings;
  }

  // ============ MAIN MENU ============
  async sendMainMenu(chatId) {
    const stats = this.settings.getStats();
    const mode = this.settings.get('mode');
    const postMode = this.settings.get('post_mode');
    
    const text = `🤖 *ANIMETHIC POSTER BOT*

📊 *Today's Stats*
• Total: ${stats.todayTotal} posts
• Auto: ${stats.todayAuto} | Manual: ${stats.todayManual}
• Pending: ${stats.pending}

⚙️ *Current Settings*
• Mode: ${mode === 'quote' ? '📝 Quote' : '🔘 Button'}
• Post: ${postMode === 'auto' ? '🟢 Auto' : '🟡 Manual'}
• Interval: ${this.settings.get('check_interval')} mins

━━━━━━━━━━━━━━━━━━━━`;

    const keyboard = [
      [
        { text: '🎨 Post Style', callback_data: 'menu_style' },
        { text: '⚡ Post Mode', callback_data: 'menu_post_mode' }
      ],
      [
        { text: '🖼️ Image Setting', callback_data: 'menu_image' },
        { text: '⏱️ Interval', callback_data: 'menu_interval' }
      ],
      [
        { text: '🔗 Tutorial Link', callback_data: 'menu_tutorial' },
        { text: '🌐 Blog URL', callback_data: 'menu_blog' }
      ],
      [
        { text: '📋 Recent Logs', callback_data: 'menu_logs' },
        { text: '📊 Full Stats', callback_data: 'menu_stats' }
      ],
      [
        { text: '⏳ Pending Posts', callback_data: 'menu_pending' },
        { text: '🔄 Force Check', callback_data: 'menu_force_check' }
      ],
      [
        { text: '❌ Close Menu', callback_data: 'menu_close' }
      ]
    ];

    await this.bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  // ============ CALLBACK HANDLER ============
  async handleCallback(chatId, data, messageId) {
    switch (data) {
      // Main Menu Navigation
      case 'menu_style':
        await this.showStyleMenu(chatId, messageId);
        break;
      case 'menu_post_mode':
        await this.showPostModeMenu(chatId, messageId);
        break;
      case 'menu_image':
        await this.showImageMenu(chatId, messageId);
        break;
      case 'menu_interval':
        await this.showIntervalMenu(chatId, messageId);
        break;
      case 'menu_tutorial':
        await this.showTutorialMenu(chatId, messageId);
        break;
      case 'menu_blog':
        await this.showBlogMenu(chatId, messageId);
        break;
      case 'menu_logs':
        await this.showLogs(chatId, messageId);
        break;
      case 'menu_stats':
        await this.showStats(chatId, messageId);
        break;
      case 'menu_pending':
        await this.showPendingPosts(chatId, messageId);
        break;
      case 'menu_force_check':
        await this.forceCheck(chatId);
        break;
      case 'menu_close':
        await this.bot.deleteMessage(chatId, messageId);
        break;
      case 'back_main':
        await this.sendMainMenu(chatId);
        await this.bot.deleteMessage(chatId, messageId);
        break;

      // Style Settings
      case 'style_quote':
        this.settings.set('mode', 'quote');
        await this.bot.answerCallbackQuery({ callback_query_id: data, text: '✅ Quote Mode Activated!' });
        await this.showStyleMenu(chatId, messageId);
        break;
      case 'style_button':
        this.settings.set('mode', 'button');
        await this.bot.answerCallbackQuery({ callback_query_id: data, text: '✅ Button Mode Activated!' });
        await this.showStyleMenu(chatId, messageId);
        break;

      // Post Mode Settings
      case 'postmode_auto':
        this.settings.set('post_mode', 'auto');
        await this.bot.answerCallbackQuery({ callback_query_id: data, text: '🟢 Auto Post Mode ON' });
        await this.showPostModeMenu(chatId, messageId);
        break;
      case 'postmode_manual':
        this.settings.set('post_mode', 'manual');
        await this.bot.answerCallbackQuery({ callback_query_id: data, text: '🟡 Manual Approval Mode ON' });
        await this.showPostModeMenu(chatId, messageId);
        break;

      // Image Settings
      case 'image_on':
        this.settings.set('show_image', 'true');
        await this.showImageMenu(chatId, messageId);
        break;
      case 'image_off':
        this.settings.set('show_image', 'false');
        await this.showImageMenu(chatId, messageId);
        break;

      // Interval Settings
      case 'interval_1': this.settings.set('check_interval', '1'); await this.showIntervalMenu(chatId, messageId); break;
      case 'interval_5': this.settings.set('check_interval', '5'); await this.showIntervalMenu(chatId, messageId); break;
      case 'interval_10': this.settings.set('check_interval', '10'); await this.showIntervalMenu(chatId, messageId); break;
      case 'interval_30': this.settings.set('check_interval', '30'); await this.showIntervalMenu(chatId, messageId); break;

      // Tutorial Link
      case 'tutorial_edit':
        userStates.set(chatId, { action: 'edit_tutorial' });
        await this.bot.sendMessage(chatId, '📝 Send me the new tutorial link:\n\nExample: https://t.me/animethic2/195');
        break;
      case 'tutorial_reset':
        this.settings.set('tutorial_link', 'https://t.me/animethic2/195');
        await this.showTutorialMenu(chatId, messageId);
        break;

      // Blog URL
      case 'blog_edit':
        userStates.set(chatId, { action: 'edit_blog' });
        await this.bot.sendMessage(chatId, '📝 Send me the new blog URL:\n\nExample: https://www.animethic.in');
        break;

      // Pending Posts
      case 'pending_approve_all':
        await this.approveAllPending(chatId, messageId);
        break;
      case 'pending_reject_all':
        await this.rejectAllPending(chatId, messageId);
        break;

      default:
        // Handle approve/reject for specific posts
        if (data.startsWith('approve_')) {
          const blogId = data.replace('approve_', '');
          await this.approvePost(chatId, blogId, messageId);
        } else if (data.startsWith('reject_')) {
          const blogId = data.replace('reject_', '');
          await this.rejectPost(chatId, blogId, messageId);
        }
        break;
    }
  }

  // ============ SUB MENUS ============

  async showStyleMenu(chatId, messageId) {
    const currentMode = this.settings.get('mode');
    const text = `🎨 *Post Style Settings*

Current: ${currentMode === 'quote' ? '📝 Quote Mode' : '🔘 Button Mode'}

*Quote Mode:* Links show as Telegram quote blocks
*Button Mode:* Links show as clickable buttons`;

    const keyboard = [
      [
        { 
          text: `${currentMode === 'quote' ? '✅ ' : ''}📝 Quote Mode`, 
          callback_data: 'style_quote' 
        }
      ],
      [
        { 
          text: `${currentMode === 'button' ? '✅ ' : ''}🔘 Button Mode`, 
          callback_data: 'style_button' 
        }
      ],
      [{ text: '🔙 Back', callback_data: 'back_main' }]
    ];

    await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  async showPostModeMenu(chatId, messageId) {
    const currentMode = this.settings.get('post_mode');
    const text = `⚡ *Post Mode Settings*

Current: ${currentMode === 'auto' ? '🟢 Auto Post' : '🟡 Manual Approval'}

*Auto:* Posts automatically go to channel
*Manual:* You approve each post before it goes`;

    const keyboard = [
      [
        { 
          text: `${currentMode === 'auto' ? '✅ ' : ''}🟢 Auto Post`, 
          callback_data: 'postmode_auto' 
        }
      ],
      [
        { 
          text: `${currentMode === 'manual' ? '✅ ' : ''}🟡 Manual Approval`, 
          callback_data: 'postmode_manual' 
        }
      ],
      [{ text: '🔙 Back', callback_data: 'back_main' }]
    ];

    await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  async showImageMenu(chatId, messageId) {
    const showImage = this.settings.get('show_image');
    const text = `🖼️ *Image Display Setting*

Current: ${showImage === 'true' ? '✅ ON' : '❌ OFF'}`;

    const keyboard = [
      [
        { 
          text: `${showImage === 'true' ? '✅ ' : ''}Show Image`, 
          callback_data: 'image_on' 
        }
      ],
      [
        { 
          text: `${showImage === 'false' ? '✅ ' : ''}Hide Image`, 
          callback_data: 'image_off' 
        }
      ],
      [{ text: '🔙 Back', callback_data: 'back_main' }]
    ];

    await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  async showIntervalMenu(chatId, messageId) {
    const current = this.settings.get('check_interval');
    const text = `⏱️ *RSS Check Interval*

Current: Every ${current} minute(s)`;

    const intervals = ['1', '5', '10', '30'];
    const keyboard = intervals.map(i => ([
      { 
        text: `${current === i ? '✅ ' : ''}Every ${i} min`, 
        callback_data: `interval_${i}` 
      }
    ]));
    keyboard.push([{ text: '🔙 Back', callback_data: 'back_main' }]);

    await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  async showTutorialMenu(chatId, messageId) {
    const tutorialLink = this.settings.get('tutorial_link');
    const text = `🔗 *Tutorial Link Setting*

Current: ${tutorialLink}`;

    const keyboard = [
      [{ text: '✏️ Edit Link', callback_data: 'tutorial_edit' }],
      [{ text: '🔄 Reset to Default', callback_data: 'tutorial_reset' }],
      [{ text: '🔙 Back', callback_data: 'back_main' }]
    ];

    await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
      disable_web_page_preview: true
    });
  }

  async showBlogMenu(chatId, messageId) {
    const blogUrl = this.settings.get('blog_url');
    const text = `🌐 *Blog URL Setting*

Current: ${blogUrl}

RSS Feed: ${blogUrl}/feeds/posts/default`;

    const keyboard = [
      [{ text: '✏️ Edit Blog URL', callback_data: 'blog_edit' }],
      [{ text: '🔙 Back', callback_data: 'back_main' }]
    ];

    await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  async showLogs(chatId, messageId) {
    const logs = this.settings.getRecentLogs(10);
    let text = `📋 *RECENT POST LOGS*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (logs.length === 0) {
      text += 'No posts yet.';
    } else {
      logs.forEach(log => {
        const emoji = log.status === 'auto' ? '🟢' : log.status === 'manual' ? '🟡' : '❌';
        text += `${emoji} ${log.title?.substring(0, 50)}\n`;
        text += `   ${new Date(log.posted_at).toLocaleString()}\n\n`;
      });
    }

    const keyboard = [[{ text: '🔙 Back', callback_data: 'back_main' }]];

    await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  async showStats(chatId, messageId) {
    const stats = this.settings.getStats();
    const allSettings = this.settings.getAll();
    
    const text = `📊 *FULL STATISTICS*

📈 *Today*
• Total Posts: ${stats.todayTotal}
• Auto Posted: ${stats.todayAuto}
• Manual Posted: ${stats.todayManual}

⏳ *Pending Approval:* ${stats.pending}

⚙️ *Current Configuration*
• Style: ${allSettings.mode === 'quote' ? 'Quote' : 'Button'}
• Post Mode: ${allSettings.post_mode === 'auto' ? 'Auto' : 'Manual'}
• Image: ${allSettings.show_image === 'true' ? 'ON' : 'OFF'}
• Check Every: ${allSettings.check_interval} mins
• Blog: ${allSettings.blog_url}`;

    const keyboard = [[{ text: '🔙 Back', callback_data: 'back_main' }]];

    await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
      disable_web_page_preview: true
    });
  }

  async showPendingPosts(chatId, messageId) {
    const pending = this.settings.getPendingPosts();
    let text = `⏳ *PENDING APPROVAL POSTS*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (pending.length === 0) {
      text += '✅ No pending posts!';
    } else {
      pending.forEach(post => {
        text += `📌 ${post.title?.substring(0, 60)}\n`;
        text += `   ${new Date(post.created_at).toLocaleString()}\n\n`;
      });
    }

    const keyboard = [];
    
    if (pending.length > 0) {
      const postButtons = pending.map(post => ([
        { text: `✅ ${post.title?.substring(0, 20)}...`, callback_data: `approve_${post.blog_id}` },
        { text: '❌', callback_data: `reject_${post.blog_id}` }
      ]));
      keyboard.push(...postButtons);
      keyboard.push([
        { text: '✅ Approve All', callback_data: 'pending_approve_all' },
        { text: '❌ Reject All', callback_data: 'pending_reject_all' }
      ]);
    }
    
    keyboard.push([{ text: '🔙 Back', callback_data: 'back_main' }]);

    await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  async forceCheck(chatId) {
    await this.bot.sendMessage(chatId, '🔄 Force checking RSS feed...');
    // Import and call RSS checker
    const RssChecker = require('./rssChecker');
    const checker = new RssChecker(this.bot, this.settings);
    await checker.checkNow();
    await this.bot.sendMessage(chatId, '✅ Force check completed!');
  }

  async approvePost(chatId, blogId, messageId) {
    const pending = this.settings.getPendingPosts();
    const post = pending.find(p => p.blog_id === blogId);
    
    if (post) {
      const Poster = require('./poster');
      const poster = new Poster(this.bot, this.settings);
      await poster.sendPost(post, 'manual');
      this.settings.removePendingPost(blogId);
      await this.bot.sendMessage(chatId, `✅ Approved: ${post.title}`);
    }
    
    await this.showPendingPosts(chatId, messageId);
  }

  async rejectPost(chatId, blogId, messageId) {
    this.settings.removePendingPost(blogId);
    this.settings.addPostLog(blogId, 'Rejected Post', '', 'rejected');
    await this.bot.sendMessage(chatId, '❌ Post rejected');
    await this.showPendingPosts(chatId, messageId);
  }

  async approveAllPending(chatId, messageId) {
    const pending = this.settings.getPendingPosts();
    const Poster = require('./poster');
    const poster = new Poster(this.bot, this.settings);
    
    for (const post of pending) {
      await poster.sendPost(post, 'manual');
      this.settings.removePendingPost(post.blog_id);
    }
    
    await this.bot.sendMessage(chatId, `✅ All ${pending.length} posts approved!`);
    await this.showPendingPosts(chatId, messageId);
  }

  async rejectAllPending(chatId, messageId) {
    const pending = this.settings.getPendingPosts();
    for (const post of pending) {
      this.settings.addPostLog(post.blog_id, post.title, '', 'rejected');
      this.settings.removePendingPost(post.blog_id);
    }
    
    await this.bot.sendMessage(chatId, `❌ All ${pending.length} posts rejected!`);
    await this.showPendingPosts(chatId, messageId);
  }

  async handleTextInput(chatId, state, text) {
    if (state.action === 'edit_tutorial') {
      this.settings.set('tutorial_link', text);
      await this.bot.sendMessage(chatId, `✅ Tutorial link updated to:\n${text}`);
      await this.sendMainMenu(chatId);
    } else if (state.action === 'edit_blog') {
      this.settings.set('blog_url', text);
      await this.bot.sendMessage(chatId, `✅ Blog URL updated to:\n${text}`);
      await this.sendMainMenu(chatId);
    }
  }
}

module.exports = MenuHandler;
