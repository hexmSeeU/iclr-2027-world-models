import test from 'node:test';
import assert from 'node:assert/strict';
import { filterPapers, normalize, validateDataset } from '../search.mjs';
// Test-only fixtures. These are intentionally not included in the public dataset.
const papers = [
 {id:'fixture-one',title:'Learning Visual World Models',paperUrl:'https://openreview.net/forum?id=fixture-one',abstract:'Latent video prediction and planning.',category:'core',tags:['robotics'],relevanceNote:'用于机器人规划的世界模型',status:'submission'},
 {id:'fixture-two',title:'Benchmarking Dynamic Environments',paperUrl:'https://openreview.net/forum?id=fixture-two',abstract:'A benchmark for action-conditioned simulation.',category:'adjacent',tags:['evaluation'],relevanceNote:'评测',status:'submission'}
];
test('normalizes case, Unicode, accents, whitespace and punctuation',()=>assert.equal(normalize('  WÖRLD—Ｍodel  '),'world model'));
test('empty query returns all records',()=>assert.deepEqual(filterPapers(papers),papers));
test('matches exact title case insensitively',()=>assert.deepEqual(filterPapers(papers,'LEARNING VISUAL WORLD MODELS'),[papers[0]]));
test('uses AND across tokens in different searchable fields',()=>assert.deepEqual(filterPapers(papers,'world robotics planning'),[papers[0]]));
test('matches Chinese relevance notes',()=>assert.deepEqual(filterPapers(papers,'机器人'),[papers[0]]));
test('filters relevance and tags',()=>assert.deepEqual(filterPapers(papers,'','adjacent','evaluation'),[papers[1]]));
test('unknown queries return no results',()=>assert.deepEqual(filterPapers(papers,'zzzzmissing'),[]));
test('does not match unsafe object prototype text',()=>assert.deepEqual(filterPapers(papers,'object'),[]));
test('rejects duplicate IDs',()=>assert.throws(()=>validateDataset({metadata:{conference:'ICLR 2027'},papers:[...papers,papers[0]]}),/duplicate/i));
test('rejects noncanonical or unsafe paper URLs',()=>assert.throws(()=>validateDataset({metadata:{conference:'ICLR 2027'},papers:[{...papers[0],paperUrl:'javascript:alert(1)'}]}),/URL/i));
test('accepts verified shape and empty honest dataset',()=>{assert.doesNotThrow(()=>validateDataset({metadata:{conference:'ICLR 2027'},papers}));assert.doesNotThrow(()=>validateDataset({metadata:{conference:'ICLR 2027'},papers:[]}));});
test('verification labels distinguish primary checks from source listings',async()=>{const {verificationLabel}=await import('../search.mjs');assert.equal(typeof verificationLabel,'function');assert.equal(verificationLabel({verifiedConference:true}),'OpenReview 已核验');assert.equal(verificationLabel({verifiedConference:false}),'原站待核验');});
test('topic filter is case insensitive',()=>assert.deepEqual(filterPapers(papers,'','all','ROBOTICS'),[papers[0]]));
