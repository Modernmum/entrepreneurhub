// Test Blog Comment Analyzer
require('dotenv').config();

async function testBlogComments() {
  console.log('\n🚀 Testing Blog Comment Analyzer\n');

  try {
    const blogAnalyzer = require('../services/blog-comment-analyzer');

    console.log('Test: Analyze Blog Comments for Questions');
    console.log('─'.repeat(50));

    const comments = await blogAnalyzer.getAllComments();

    console.log(`\n✅ Found ${comments.length} relevant comments\n`);

    // Display all comments found
    comments.forEach((comment, index) => {
      console.log(`${index + 1}. "${comment.text.substring(0, 150)}..."`);
      console.log(`   Author: ${comment.author}`);
      console.log(`   Blog: ${comment.blogName}`);
      console.log(`   Article: ${comment.articleTitle}`);
      console.log(`   Business Area: ${comment.businessArea}`);
      console.log(`   Urgency: ${comment.urgency}`);
      console.log(`   Fit Score: ${comment.fitScore}/10`);
      if (comment.painPoints) {
        console.log(`   Pain Points: ${comment.painPoints.substring(0, 100)}...`);
      }
      console.log(`   URL: ${comment.articleUrl}`);
      console.log('');
    });

    // Summary by blog
    const byBlog = comments.reduce((acc, c) => {
      acc[c.blogName] = (acc[c.blogName] || 0) + 1;
      return acc;
    }, {});

    console.log('Comments by Blog:');
    console.log('─'.repeat(50));
    Object.entries(byBlog).forEach(([blog, count]) => {
      console.log(`  ${blog}: ${count}`);
    });

    // Summary by business area
    const byArea = comments.reduce((acc, c) => {
      acc[c.businessArea] = (acc[c.businessArea] || 0) + 1;
      return acc;
    }, {});

    console.log('\nComments by Business Area:');
    console.log('─'.repeat(50));
    Object.entries(byArea).forEach(([area, count]) => {
      console.log(`  ${area}: ${count}`);
    });

    console.log('\n✅ Blog comment analyzer test complete!\n');

    if (comments.length === 0) {
      console.log('ℹ️  Note: Many blogs block scraping or use JavaScript-rendered comments.');
      console.log('   This is expected. The system will work best with blogs that allow scraping.\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testBlogComments();
