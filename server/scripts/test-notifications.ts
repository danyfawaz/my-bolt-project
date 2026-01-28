import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_USER_ID = 'd0d7d63a-5e4b-4ec0-9ef6-19585532bd03';

async function runTests() {
  console.log('\n🧪 NOTIFICATION SYSTEM TEST SUITE\n');
  console.log('=' .repeat(50));

  // Test 1: Create a notification directly
  console.log('\n📌 Test 1: Create notification directly in DB');
  const { data: notification, error: notifError } = await supabase
    .from('notifications')
    .insert({
      recipient_id: TEST_USER_ID,
      event_type: 'TASK_ASSIGNED',
      resource_ref: 'task:a0000000-0000-0000-0000-000000000001',
      metadata: { taskTitle: 'Test Task from Script' },
      state: 'unread',
    })
    .select()
    .single();

  if (notifError) {
    console.log('❌ Failed:', notifError.message);
  } else {
    console.log('✅ Created notification:', notification.id);
  }

  // Test 2: Check notification preferences table exists
  console.log('\n📌 Test 2: Check notification_preferences table');
  const { data: prefs, error: prefsError } = await supabase
    .from('notification_preferences')
    .select('*')
    .limit(1);

  if (prefsError) {
    console.log('❌ Failed:', prefsError.message);
  } else {
    console.log('✅ Preferences table exists, rows:', prefs?.length || 0);
  }

  // Test 3: Insert user preferences
  console.log('\n📌 Test 3: Create user preferences');
  const { data: newPrefs, error: newPrefsError } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: TEST_USER_ID,
      channels_enabled: { in_app: true, email: true, push: false },
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      sound_enabled: true,
      sound_volume: 75,
    })
    .select()
    .single();

  if (newPrefsError) {
    console.log('❌ Failed:', newPrefsError.message);
  } else {
    console.log('✅ Created preferences for user');
    console.log('   - Quiet hours:', newPrefs.quiet_hours_enabled ? 'ON' : 'OFF');
    console.log('   - Sound volume:', newPrefs.sound_volume + '%');
  }

  // Test 4: Create multiple notifications (batch)
  console.log('\n📌 Test 4: Create batch notifications');
  const batchNotifications = [
    { recipient_id: TEST_USER_ID, event_type: 'TASK_OVERDUE', metadata: { taskTitle: 'Overdue Task' }, state: 'unread' },
    { recipient_id: TEST_USER_ID, event_type: 'DELIVERABLE_SUBMITTED', metadata: { deliverableTitle: 'Design Doc' }, state: 'unread' },
    { recipient_id: TEST_USER_ID, event_type: 'COMMENT_ADDED', metadata: { taskTitle: 'Review PR' }, state: 'unread' },
  ];

  const { data: batchResult, error: batchError } = await supabase
    .from('notifications')
    .insert(batchNotifications)
    .select();

  if (batchError) {
    console.log('❌ Failed:', batchError.message);
  } else {
    console.log('✅ Created', batchResult?.length, 'notifications');
  }

  // Test 5: Read all notifications for user
  console.log('\n📌 Test 5: Read all notifications for user');
  const { data: allNotifs, error: readError } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', TEST_USER_ID)
    .order('created_at', { ascending: false });

  if (readError) {
    console.log('❌ Failed:', readError.message);
  } else {
    console.log('✅ Found', allNotifs?.length, 'notifications');
    allNotifs?.slice(0, 5).forEach((n, i) => {
      console.log(`   ${i + 1}. [${n.state}] ${n.event_type} - ${n.metadata?.taskTitle || n.metadata?.deliverableTitle || 'N/A'}`);
    });
  }

  // Test 6: Mark notification as read
  console.log('\n📌 Test 6: Mark notification as read');
  if (notification) {
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ state: 'read' })
      .eq('id', notification.id);

    if (updateError) {
      console.log('❌ Failed:', updateError.message);
    } else {
      console.log('✅ Marked notification as read');
    }
  }

  // Test 7: Test notification deliveries table
  console.log('\n📌 Test 7: Log delivery to notification_deliveries');
  if (notification) {
    const { error: deliveryError } = await supabase
      .from('notification_deliveries')
      .insert({
        notification_id: notification.id,
        channel: 'in_app',
        success: true,
        delivered_at: new Date().toISOString(),
      });

    if (deliveryError) {
      console.log('❌ Failed:', deliveryError.message);
    } else {
      console.log('✅ Logged delivery record');
    }
  }

  // Test 8: Count unread notifications
  console.log('\n📌 Test 8: Count unread notifications');
  const { count, error: countError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', TEST_USER_ID)
    .eq('state', 'unread');

  if (countError) {
    console.log('❌ Failed:', countError.message);
  } else {
    console.log('✅ Unread count:', count);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🎉 All tests completed!\n');

  // Summary
  console.log('📊 SUMMARY');
  console.log('-'.repeat(30));
  console.log('Supabase URL:', process.env.SUPABASE_URL);
  console.log('Test User ID:', TEST_USER_ID);
  console.log('Total notifications:', allNotifs?.length || 0);
  console.log('Unread:', count || 0);
  console.log('\n🔗 Open Supabase Studio: http://127.0.0.1:54323');
  console.log('🔗 Open App: http://localhost:5174\n');
}

runTests().catch(console.error);
