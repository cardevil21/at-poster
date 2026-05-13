const RssParser = require('rss-parser');
const Poster = require('./poster');

class RssChecker {
  constructor(bot, settings) {
    this.bot = bot;
    this.settings = settings;
    this.parser = new RssParser({
      customFields: {
        item: ['media:content', 'media:thumbnail']
      }
    });
    this.interval = null;
    this.poster = new Poster(bot, settings);
  }

  start() {
    const intervalMinutes = parseInt(this.settings.get('check_interval')) || 5;
    const ms = intervalMinutes * 60 * 1000;
    
    console.log(`🔄 RSS Checker started - Every ${intervalMinutes} minutes`);
    
    // Check immediately on start
    this.checkFeed();
    
    // Then check periodically
    this.interval = setInterval(() => this.checkFeed(), ms);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async checkNow() {
    await this.checkFeed();
  }

  async checkFeed() {
    try {
      const blogUrl = this.settings.get('blog_url');
      const feedUrl = `${blogUrl}/feeds/posts/default?alt=rss&max-results=10`;
      
      console.log(`🔍 Checking RSS: ${feedUrl}`);
      
      const feed = await this.parser.parseURL(feedUrl);
      
      if (!feed || !feed.items || feed.items.length === 0) {
        console.log('📭 No items in feed');
        return;
      }

      let newPosts = 0;
      
      for (const item of feed.items) {
        const blogId = item.guid || item.link;
        
        // Check if already posted
        if (this.settings.isPosted(blogId)) {
          continue;
        }

        newPosts++;
        
        // Extract image
        let imageUrl = null;
        if (item['media:content'] && item['media:content'].$) {
          imageUrl = item['media:content'].$.url;
        } else if (item.content) {
          const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/);
          if (imgMatch) imageUrl = imgMatch[1];
        }

        const post = {
          blogId: blogId,
          title: item.title,
          link: item.link,
          imageUrl: imageUrl,
          excerpt: item.contentSnippet?.substring(0, 200) || '',
          pubDate: item.pubDate
        };

        const postMode = this.settings.get('post_mode');
        
        if (postMode === 'auto') {
          // Auto post to channel
          await this.poster.sendPost(post, 'auto');
          console.log(`🟢 Auto posted: ${post.title}`);
        } else {
          // Manual mode - add to pending
          this.settings.addPendingPost(post);
          
          // Notify admin
          const adminId = process.env.ADMIN_ID || '7406197326';
          await this.bot.sendMessage(adminId, 
            `📬 *New Post Pending*\n\n📌 ${post.title}\n\nUse /setup to approve`,
            { parse_mode: 'Markdown' }
          );
          console.log(`🟡 Pending approval: ${post.title}`);
        }
      }

      if (newPosts > 0) {
        console.log(`📊 Found ${newPosts} new post(s)`);
      }

      // Update last check time
      this.settings.set('last_check', Date.now().toString());
      
    } catch (error) {
      console.error('❌ RSS Check Error:', error.message);
    }
  }
}

module.exports = RssChecker;
