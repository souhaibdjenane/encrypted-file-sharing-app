// test-fetch.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdnfgkmwfpwjguopmpeu.supabase.co'
const supabaseKey = 'sb_publishable_rb88kkH7fyNsbPiNtcvxXQ_5UvU8F3E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  // We don't have a user session in this script, so we will just try to fetch anonymously.
  // We want to see if the syntax `*, file_keys!inner(wrapped_key)` is valid.
  const { data, error } = await supabase
    .from('files')
    .select('*, file_keys!inner(wrapped_key)')
    .limit(1)

  if (error) {
    console.error('FETCH ERROR:', error)
  } else {
    console.log('FETCH SUCCESS:', data)
  }
}

test()
