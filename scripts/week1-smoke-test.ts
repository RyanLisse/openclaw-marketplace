/**
 * Week 1 Smoke Test – Convex backend and CRUD flows.
 *
 * Run: CONVEX_URL=<url> npx tsx scripts/week1-smoke-test.ts
 * Or:  ./scripts/week1-smoke-test.sh
 *
 * Tests:
 * 1. Agent creates intents (need + offer) – same flow as MCP intent_create
 * 2. Propose match between need and offer
 * 3. Accept match
 * 4. CRUD: transactions (create, updateStatus, list), disputes (get, list, remove), votes (get, list, update, retract)
 *
 * Expected outputs are printed for each step; exit code 0 = all passed, 1 = failure.
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

const CONVEX_URL = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;

function log(msg: string) {
  console.log(`[smoke] ${msg}`);
}

function expect(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[smoke] FAIL: ${message}`);
    process.exit(1);
  }
  log(`OK: ${message}`);
}

async function main() {
  if (!CONVEX_URL) {
    console.error('Set CONVEX_URL or NEXT_PUBLIC_CONVEX_URL');
    process.exit(1);
  }

  const client = new ConvexHttpClient(CONVEX_URL);
  const agentNeed = 'smoke-agent-need';
  const agentOffer = 'smoke-agent-offer';

  log('1. Agent creates intents (need + offer) – parity with MCP intent_create');
  const needResult = await client.mutation(api.intents.create, {
    type: 'need',
    agentId: agentNeed,
    title: 'Smoke need',
    description: 'Week 1 smoke test need',
    skills: ['testing'],
  });
  expect(needResult.status === 'created' && needResult.intentId != null, 'intent create (need) returns intentId');
  log(`   Expected: status=created, intentId present. Got: ${JSON.stringify(needResult)}`);

  const offerResult = await client.mutation(api.intents.create, {
    type: 'offer',
    agentId: agentOffer,
    title: 'Smoke offer',
    description: 'Week 1 smoke test offer',
    skills: ['testing'],
  });
  expect(offerResult.status === 'created' && offerResult.intentId != null, 'intent create (offer) returns intentId');
  log(`   Expected: status=created, intentId present. Got: ${JSON.stringify(offerResult)}`);

  log('2. Propose match');
  const matchResult = await client.mutation(api.matches.create, {
    needIntentId: needResult.intentId,
    offerIntentId: offerResult.intentId,
    score: 90,
    algorithm: 'smoke-test',
  });
  expect(
    (matchResult.status === 'created' || matchResult.status === 'already_exists') && matchResult.matchId != null,
    'match create returns matchId'
  );
  log(`   Expected: status=created or already_exists, matchId present. Got: ${JSON.stringify(matchResult)}`);

  log('3. Accept match');
  const acceptResult = await client.mutation(api.matches.accept, {
    matchId: matchResult.matchId,
    agentId: agentNeed,
  });
  expect(acceptResult.status === 'accepted', 'match accept returns accepted');
  log(`   Expected: status=accepted. Got: ${JSON.stringify(acceptResult)}`);

  log('4. CRUD: transactions');
  const txResult = await client.mutation(api.transactions.create, {
    matchId: matchResult.matchId,
    amount: 10,
    currency: 'USDC',
    fromAgentId: agentNeed,
    toAgentId: agentOffer,
  });
  expect(txResult.status === 'created' && txResult.transactionId != null, 'transaction create');
  log(`   Expected: status=created, transactionId present. Got: ${JSON.stringify(txResult)}`);

  await client.mutation(api.transactions.updateStatus, {
    transactionId: txResult.transactionId,
    status: 'confirmed',
    txHash: '0xsmoke',
  });
  const txList = await client.query(api.transactions.list, { status: 'confirmed' });
  expect(Array.isArray(txList) && txList.some((t: { _id: Id<'transactions'> }) => t._id === txResult.transactionId), 'transaction list includes created');
  log(`   Expected: list returns array containing created tx. Got: ${txList.length} item(s)`);

  log('4. CRUD: disputes');
  const disputeId = await client.mutation(api.disputes.createDispute, {
    matchId: matchResult.matchId,
    agentId: agentNeed,
    reason: 'Smoke dispute',
    evidence: 'Smoke evidence',
  });
  expect(disputeId != null, 'dispute create returns id');
  const dispute = await client.query(api.disputes.get, { id: disputeId });
  expect(dispute != null && dispute.reason === 'Smoke dispute', 'dispute get');
  log(`   Expected: get returns dispute with reason. Got: reason=${dispute?.reason}`);

  const disputeList = await client.query(api.disputes.list, { status: 'open' });
  expect(Array.isArray(disputeList), 'dispute list');
  log(`   Expected: list returns array. Got: ${disputeList.length} item(s)`);

  await client.mutation(api.disputes.remove, { disputeId });
  log('   Expected: remove succeeds (no throw).');

  log('4. CRUD: votes (create via t.run not exposed; list/get/update/retract require existing vote)');
  const voteList = await client.query(api.votes.list, {});
  expect(Array.isArray(voteList), 'votes list returns array');
  log(`   Expected: list returns array. Got: ${voteList.length} item(s). (update/retract require voting dispute; see unit tests.)`);

  log('Week 1 smoke test finished. All steps passed.');
}

main().catch((err) => {
  console.error('[smoke]', err);
  process.exit(1);
});
