#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkResults() {
  const { data: tests } = await supabase
    .from('bot_test_results')
    .select('*')
    .eq('client_id', '28022115-e4de-4c8c-90c8-43dcae10042a');

  console.log('\n📊 Test Results for Maggie Forbes:');
  console.log(`Found ${tests?.length || 0} test results\n`);

  if (tests && tests.length > 0) {
    tests.forEach(test => {
      console.log(`- ${test.persona_name}: ${test.overall_rating}/10 (${new Date(test.test_date).toLocaleString()})`);
    });
  }
}

checkResults();
