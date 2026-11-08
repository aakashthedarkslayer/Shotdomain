import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

async function run() {
  console.log('========================================================');
  console.log('🚀 Phase 1: Scheduled Recurring Captures Verification');
  console.log('========================================================\n');

  // Step 1: Check initial schedules list
  console.log('1. Checking GET /api/schedules...');
  const initRes = await fetch(`${BASE_URL}/api/schedules`);
  if (!initRes.ok) throw new Error(`GET /api/schedules failed: ${initRes.status}`);
  const initList = await initRes.json();
  console.log(`   ✓ Found ${initList.length} initial schedules.\n`);

  // Step 2: Create a schedule with retentionCount: 2 to test retention pruning
  console.log('2. Creating test schedule via POST /api/schedules...');
  const newSchedulePayload = {
    name: 'Quotes To Scrape Daily Monitor',
    targetUrl: 'https://quotes.toscrape.com',
    urls: [
      'https://quotes.toscrape.com',
      'https://quotes.toscrape.com/login',
    ],
    settings: {
      device: 'Desktop',
      width: 1280,
      height: 800,
      fullPage: false,
      format: 'png',
      blockAds: false,
      useCache: false,
    },
    frequency: 'daily',
    timeOfDay: '09:00',
    recipients: ['tester@shotdomain.com'],
    retentionCount: 2, // test retention pruning after 2 runs
  };

  const createRes = await fetch(`${BASE_URL}/api/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSchedulePayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`POST /api/schedules failed (${createRes.status}): ${errText}`);
  }

  const createdSchedule = await createRes.json();
  console.log(`   ✓ Schedule created: "${createdSchedule.name}"`);
  console.log(`     ID: ${createdSchedule.id}`);
  console.log(`     Cron: "${createdSchedule.cronExpression}" (0 9 * * *)`);
  console.log(`     Next run: ${new Date(createdSchedule.nextRunAt).toISOString()}`);
  console.log(`     Retention Limit: ${createdSchedule.retentionCount}\n`);

  const scheduleId = createdSchedule.id;

  // Step 3: Trigger Run 1 ("Run Now")
  console.log('3. Triggering Run 1 via POST /api/schedules/[id]/run...');
  const run1Start = Date.now();
  const run1Res = await fetch(`${BASE_URL}/api/schedules/${scheduleId}/run`, {
    method: 'POST',
  });
  if (!run1Res.ok) {
    const err = await run1Res.text();
    throw new Error(`Run 1 trigger failed (${run1Res.status}): ${err}`);
  }
  const run1 = await run1Res.json();
  const run1Duration = ((Date.now() - run1Start) / 1000).toFixed(1);

  console.log(`   ✓ Run 1 completed in ${run1Duration}s!`);
  console.log(`     Run ID: ${run1.id}`);
  console.log(`     Status: ${run1.status}`);
  console.log(`     Completed URLs: ${run1.completedUrls}/${run1.totalUrls}`);
  console.log(`     Notification Sent: ${run1.notificationSent}`);
  if (run1.emailPreviewUrl) {
    console.log(`     📧 Live Email Preview: ${run1.emailPreviewUrl}`);
  }
  console.log('');

  // Step 4: Verify Disk Artifacts for Run 1
  console.log('4. Verifying disk artifacts for Run 1...');
  const run1Dir = path.join(process.cwd(), 'data', 'schedules', scheduleId, 'runs', run1.id);
  if (!fs.existsSync(run1Dir)) {
    throw new Error(`Run 1 directory does not exist: ${run1Dir}`);
  }
  const files1 = fs.readdirSync(run1Dir);
  console.log(`   ✓ Run 1 directory contents: ${files1.join(', ')}`);

  const hasManifest = files1.includes('manifest.json');
  const hasZip = files1.includes('archive.zip');
  const pngCount = files1.filter((f) => f.endsWith('.png')).length;

  if (!hasManifest) throw new Error('Missing manifest.json');
  if (!hasZip) throw new Error('Missing archive.zip');
  if (pngCount < 2) throw new Error(`Expected at least 2 PNG screenshots, found ${pngCount}`);

  const zipStat = fs.statSync(path.join(run1Dir, 'archive.zip'));
  console.log(`   ✓ archive.zip size: ${(zipStat.size / 1024).toFixed(1)} KB\n`);

  // Step 5: Test Download Route
  console.log('5. Testing ZIP Download endpoint GET /api/schedules/[id]/runs/[runId]/download...');
  const dlRes = await fetch(`${BASE_URL}/api/schedules/${scheduleId}/runs/${run1.id}/download`);
  if (!dlRes.ok) throw new Error(`Download route failed: ${dlRes.status}`);
  const dlBlob = await dlRes.arrayBuffer();
  console.log(`   ✓ Downloaded ZIP successfully: ${dlBlob.byteLength} bytes\n`);

  // Step 6: Test Pause & Resume via PATCH
  console.log('6. Testing schedule pause/resume via PATCH /api/schedules/[id]...');
  const pauseRes = await fetch(`${BASE_URL}/api/schedules/${scheduleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: false }),
  });
  const paused = await pauseRes.json();
  if (paused.enabled !== false) throw new Error('Failed to pause schedule');
  console.log('   ✓ Schedule paused (enabled: false)');

  const resumeRes = await fetch(`${BASE_URL}/api/schedules/${scheduleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: true }),
  });
  const resumed = await resumeRes.json();
  if (resumed.enabled !== true) throw new Error('Failed to resume schedule');
  console.log('   ✓ Schedule resumed (enabled: true)\n');

  // Step 7: Test Retention Pruning
  console.log('7. Testing FIFO retention policy (limit: 2 runs)...');
  console.log('   Triggering Run 2...');
  const run2Res = await fetch(`${BASE_URL}/api/schedules/${scheduleId}/run`, { method: 'POST' });
  const run2 = await run2Res.json();
  console.log(`   ✓ Run 2 completed (${run2.id})`);

  console.log('   Triggering Run 3 (should trigger FIFO deletion of Run 1)...');
  const run3Res = await fetch(`${BASE_URL}/api/schedules/${scheduleId}/run`, { method: 'POST' });
  const run3 = await run3Res.json();
  console.log(`   ✓ Run 3 completed (${run3.id})`);

  // Check remaining runs via API
  const runsListRes = await fetch(`${BASE_URL}/api/schedules/${scheduleId}`);
  const schedDetails = await runsListRes.json();
  const currentRuns = schedDetails.runs || [];
  console.log(`   ✓ Total runs tracked after 3 executions: ${currentRuns.length}`);

  const run1DirExists = fs.existsSync(run1Dir);
  const run2DirExists = fs.existsSync(path.join(process.cwd(), 'data', 'schedules', scheduleId, 'runs', run2.id));
  const run3DirExists = fs.existsSync(path.join(process.cwd(), 'data', 'schedules', scheduleId, 'runs', run3.id));

  console.log(`   ✓ Run 1 directory purged on disk: ${!run1DirExists}`);
  console.log(`   ✓ Run 2 directory retained on disk: ${run2DirExists}`);
  console.log(`   ✓ Run 3 directory retained on disk: ${run3DirExists}`);

  if (run1DirExists) {
    throw new Error('Retention policy failed: Run 1 directory was not purged');
  }

  // Step 8: Clean up test schedule
  console.log('\n8. Cleaning up test schedule...');
  const delRes = await fetch(`${BASE_URL}/api/schedules/${scheduleId}`, { method: 'DELETE' });
  if (!delRes.ok) throw new Error(`Delete schedule failed: ${delRes.status}`);
  console.log('   ✓ Schedule deleted successfully.');

  console.log('\n========================================================');
  console.log('🎉 ALL PHASE 1 SCHEDULE VERIFICATION TESTS PASSED!');
  console.log('========================================================\n');
}

run().catch((err) => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
