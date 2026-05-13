class Poster {
  constructor(bot, settings) {
    this.bot = bot;
    this.settings = settings;
  }

  async sendPost(post, status = 'auto') {
    const mode = this.settings.get('mode');
    const showImage = this.settings.get('show_image');
    const tutorialLink = this.settings.get('tutorial_link');
    const channelId = this.settings.get('channel_id');

    try {
      if (mode === 'button') {
        // Button Mode
        const caption = post.title;
        const keyboard = [
          [{ text: '📥 DOWNLOAD', url: post.link }],
          [{ text: '👉 Download Tutorial 👈', url: tutorialLink }]
        ];

        if (showImage === 'true' && post.imageUrl) {
          await this.bot.sendPhoto(channelId, post.imageUrl, {
            caption: caption,
            reply_markup: { inline_keyboard: keyboard }
          });
        } else {
          await this.bot.sendMessage(channelId, caption, {
            reply_markup: { inline_keyboard: keyboard }
          });
        }
      } else {
        // Quote Mode
        const caption = `${post.title}\n\nLink -\n>${post.link}\n\n👉 Download Tutorial 👈\n>${tutorialLink}`;

        if (showImage === 'true' && post.imageUrl) {
          await this.bot.sendPhoto(channelId, post.imageUrl, {
            caption: caption,
            parse_mode: 'Markdown'
          });
        } else {
          await this.bot.sendMessage(channelId, caption, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          });
        }
      }

      // Log the post
      this.settings.addPostLog(post.blogId, post.title, post.link, status);
      console.log(`✅ Posted: ${post.title}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to post: ${post.title}`, error.message);
      return false;
    }
  }
}

module.exports = Poster;
