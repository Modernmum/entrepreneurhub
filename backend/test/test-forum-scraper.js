// Test Forum Scraper
require('dotenv').config();

async function testForumScraper() {
  console.log('\n🚀 Testing Forum Scraper System\n');

  try {
    const forumScraper = require('../services/forum-scraper');

    console.log('Test 1: Scrape Forums for Questions');
    console.log('─'.repeat(50));

    const posts = await forumScraper.getQuestionsToday();

    console.log(`\n✅ Found ${posts.length} recent forum posts\n`);

    // Display top 10
    const top10 = posts.slice(0, 10);

    top10.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`);
      console.log(`   Subreddit: r/${post.subreddit}`);
      console.log(`   Author: u/${post.author}`);
      console.log(`   Business Area: ${post.businessArea}`);
      console.log(`   Urgency: ${post.urgency}`);
      console.log(`   Fit Score: ${post.fitScore}/10`);
      console.log(`   Engagement: ${post.score} upvotes, ${post.numComments} comments`);
      if (post.painPoints) {
        console.log(`   Pain Points: ${post.painPoints.substring(0, 100)}...`);
      }
      console.log(`   URL: ${post.url}`);
      console.log('');
    });

    // Summary by subreddit
    const bySubreddit = posts.reduce((acc, post) => {
      acc[post.subreddit] = (acc[post.subreddit] || 0) + 1;
      return acc;
    }, {});

    console.log('Posts by Subreddit:');
    console.log('─'.repeat(50));
    Object.entries(bySubreddit).forEach(([sub, count]) => {
      console.log(`  r/${sub}: ${count}`);
    });

    // Summary by business area
    const byArea = posts.reduce((acc, post) => {
      acc[post.businessArea] = (acc[post.businessArea] || 0) + 1;
      return acc;
    }, {});

    console.log('\nPosts by Business Area:');
    console.log('─'.repeat(50));
    Object.entries(byArea).forEach(([area, count]) => {
      console.log(`  ${area}: ${count}`);
    });

    console.log('\n✅ Forum scraper test complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testForumScraper();
