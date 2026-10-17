import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { openDb } from '../dist/db.js';
import { installApprovalService } from '../dist/approval.js';
const policy = JSON.parse(fs.readFileSync('../../config/double-offer/maurice.policy.json'));
const operator = 'o'.repeat(40), candidate = 'c'.repeat(40);
async function setup(t, overrides = {}) {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'approval-'));
 const db = openDb(dir); const sent = [];
 const app = express(); app.use(express.json());
 installApprovalService(app, db, { botToken: operator, candidateToken: candidate, policy, allowEmployerSend:true, reviewUrl: 'https://review.example/review', send: async m => { sent.push(m); }, ...overrides });
 const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening',r));
 t.after(async () => { await new Promise(r => server.close(r)); db.close(); fs.rmSync(dir, {recursive:true,force:true}); });
 const html = path.join(dir,'doc.html'), pdf = path.join(dir,'doc.pdf');
 fs.writeFileSync(html, '<html><body>'+ 'Verified candidate professional experience and qualifications. '.repeat(8) + '</body></html>');
 fs.writeFileSync(pdf, '%PDF-1.7\n'+'approved document content '.repeat(10));
 db.prepare("INSERT INTO jobs(id,created_at,updated_at,status,company,title) VALUES ('j','now','now','GENERATED','Acme','Engineer')").run();
 db.prepare("INSERT INTO documents VALUES ('d','j','now','tech',?,?,?,?)").run(html,pdf,html,pdf);
 const request = async (url, body, token=operator, method='POST') => { const r = await fetch(`http://127.0.0.1:${server.address().port}${url}`,{method, headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, ...(body === undefined ? {} : {body:JSON.stringify(body)})}); return {status:r.status, body: r.headers.get('content-type')?.includes('application/json') ? await r.json() : await r.text()}; };
 const create = async (extra={}) => request('/approval/packages',{candidateId:'maurice',jobId:'j',documentId:'d',requisitionId:'req-1',toEmail:'hiring@example.com',subject:'Application for Engineer',text:'Please review my attached resume and cover letter for the Engineer position at Acme.',...extra});
 const decide = (p,decision='approve',token=candidate) => request(`/approval/packages/${p.id}/decision`,{digest:p.digest,decision},token);
 return {db,sent,request,create,decide,html,pdf};
}
test('candidate identity, separate authentication, pending validation, and notification',async t=>{
 const x=await setup(t);
 assert.equal((await x.create({candidateId:'someone-else'})).status,400);
 assert.equal((await x.request('/approval/packages',{},candidate)).status,401);
 assert.equal((await x.request('/approval/packages/missing/notify',{})).status,409);
 assert.equal(x.sent.length,0);
 fs.writeFileSync(x.html,'<p>Cover letters are generated on-demand in v2.</p>');
 assert.equal((await x.create()).status,409);
 fs.writeFileSync(x.html,'<p>'+'Verified substantive professional qualifications. '.repeat(8)+'</p>');
 const p=(await x.create()).body.package;
 assert.equal((await x.request(`/approval/packages/${p.id}`,undefined,operator,'GET')).status,401);
 assert.equal((await x.request(`/approval/packages/${p.id}`,undefined,candidate,'GET')).status,200);
 assert.equal((await x.decide(p,'approve',operator)).status,401);
 assert.equal((await x.request(`/approval/packages/${p.id}/notify`,{})).status,200);
 assert.equal(x.sent[0].to,'mrthomaslmg@gmail.com');
 assert.equal(x.sent[0].text.includes(candidate),false);
 assert.equal((await x.request(`/approval/packages/${p.id}/notify`,{})).status,409);
 assert.throws(()=>x.db.prepare("DELETE FROM approval_audit").run(),/append_only/);
});
test('hard gate, rejection, supersession and exact immutable approved payload',async t=>{
 const x=await setup(t);
 assert.equal((await x.request('/apply/email',{jobId:'j',toEmail:'hiring@example.com'})).status,403);
 const p=(await x.create()).body.package;
 assert.equal((await x.request('/apply/email',{packageId:p.id})).status,403);
 assert.equal((await x.decide(p,'reject')).status,200);
 assert.equal((await x.request('/apply/email',{packageId:p.id})).status,403);
 const p2=(await x.create()).body.package; await x.decide(p2);
 const p3=(await x.create()).body.package;
 assert.equal(p3.version,3);
 assert.equal((await x.request('/apply/email',{packageId:p2.id})).status,403);
 assert.equal((await x.request(`/approval/packages/${p3.id}/decision`,{digest:'bad',decision:'approve'},candidate)).status,409);
 await x.decide(p3);
 assert.equal((await x.request('/apply/email',{packageId:p3.id,toEmail:'other@example.com'})).status,403);
 fs.writeFileSync(x.pdf,'modified after approval');
 assert.throws(()=>x.db.prepare("UPDATE application_packages SET snapshot_json='{}' WHERE id=?").run(p3.id),/immutable_package/);
 const results=await Promise.all([x.request('/apply/email',{packageId:p3.id}),x.request('/apply/email',{packageId:p3.id})]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,403]);
 assert.equal(x.sent.length,1);
 assert.equal(x.sent[0].to,'hiring@example.com');
 assert.equal(Buffer.from(x.sent[0].attachments[0].contentBase64,'base64').toString().startsWith('%PDF-'),true);
 assert.equal((await x.create()).status,409);
});
test('mail failure is uncertain and cannot be resent or replaced',async t=>{
 const x=await setup(t,{send:async()=>{throw new Error('timeout');}});
 const p=(await x.create()).body.package; await x.decide(p);
 assert.equal((await x.request('/apply/email',{packageId:p.id})).status,502);
 assert.equal((await x.request('/apply/email',{packageId:p.id})).status,403);
 assert.equal((await x.create()).status,409);
 assert.equal(x.db.prepare('SELECT state FROM application_packages WHERE id=?').get(p.id).state,'SUBMISSION_UNCERTAIN');
});
test('missing or shared candidate credentials fail closed',async t=>{
 const x=await setup(t,{candidateToken:operator});
 assert.equal((await x.create()).status,401);
 assert.equal((await x.request('/approval/packages/x/decision',{},operator)).status,401);
});
test('duplicates across job records cannot both be approved',async t=>{
 const x=await setup(t);
 const p=(await x.create()).body.package;
 x.db.prepare("INSERT INTO jobs(id,created_at,updated_at,status,company,title) VALUES ('j2','now','now','GENERATED',' acme ','Engineer')").run();
 x.db.prepare("INSERT INTO documents SELECT 'd2','j2',created_at,base_resume,resume_html_path,resume_pdf_path,cover_html_path,cover_pdf_path FROM documents WHERE id='d'").run();
 const p2=(await x.create({jobId:'j2',documentId:'d2'})).body.package;
 assert.equal((await x.decide(p)).status,200);
 assert.equal((await x.decide(p2)).status,409);
 assert.equal(x.sent.length,0);
});
test('invalid PDFs, placeholder resume, missing auth and unsafe notification URL are blocked',async t=>{
 const x=await setup(t,{reviewUrl:'http://review.example'});
 assert.equal((await x.request('/approval/packages',{},'')).status,401);
 fs.writeFileSync(x.pdf,'not a PDF'.repeat(20));
 assert.equal((await x.create()).status,409);
 fs.writeFileSync(x.pdf,'%PDF-1.7\n'+'verified document '.repeat(12));
 fs.writeFileSync(x.html,'<p>'+'placeholder resume '.repeat(12)+'</p>');
 assert.equal((await x.create()).status,409);
 fs.writeFileSync(x.html,'<p>'+'Verified substantive candidate experience. '.repeat(12)+'</p>');
 const p=(await x.create()).body.package;
 assert.equal((await x.request(`/approval/packages/${p.id}/notify`,{})).status,503);
 assert.equal(x.sent.length,0);
});
test('interrupted claims remain uncertain on service restart',async t=>{
 const x=await setup(t);
 const p=(await x.create()).body.package; await x.decide(p);
 x.db.prepare("UPDATE application_packages SET state='SENDING' WHERE id=?").run(p.id);
 installApprovalService(express(),x.db,{botToken:operator,candidateToken:candidate,policy,reviewUrl:'https://review.example',send:async()=>{throw new Error('must not send');}});
 assert.equal((await x.request('/apply/email',{packageId:p.id})).status,403);
 assert.equal(x.db.prepare('SELECT state FROM application_packages WHERE id=?').get(p.id).state,'SUBMISSION_UNCERTAIN');
});
test('notification timeout is recorded without automatic retry',async t=>{
 let attempts=0;
 const x=await setup(t,{send:async()=>{attempts++;throw new Error('timeout');}});
 const p=(await x.create()).body.package;
 assert.equal((await x.request(`/approval/packages/${p.id}/notify`,{})).status,502);
 assert.equal((await x.request(`/approval/packages/${p.id}/notify`,{})).status,409);
 assert.equal(attempts,1);
});

test('web-form routes are absent and invalid candidate policy fails startup',async t=>{
 const x=await setup(t);
 assert.equal((await x.request('/apply/web',{})).status,404);
 assert.throws(()=>installApprovalService(express(),x.db,{botToken:operator,candidateToken:candidate,policy:{...policy,candidate_id:'other'},reviewUrl:'https://review.example',send:async()=>{}}),/Invalid Maurice/);
});
test('missing candidate credentials fail closed for both roles',async t=>{
 const x=await setup(t,{candidateToken:''});
 assert.equal((await x.create()).status,401);
 assert.equal((await x.request('/approval/packages/x/decision',{},candidate)).status,401);
});

test('sending kill switch preserves approved queue and sends nothing',async t=>{
 const x=await setup(t,{allowEmployerSend:false});const p=(await x.create()).body.package;await x.decide(p);
 assert.equal((await x.request('/apply/email',{packageId:p.id})).status,503);
 assert.equal(x.db.prepare('SELECT state FROM application_packages WHERE id=?').get(p.id).state,'APPROVED');assert.equal(x.sent.length,0);
});
test('candidate review client lists packages only with candidate authentication',async t=>{
 const x=await setup(t);const p=(await x.create()).body.package;
 assert.equal((await x.request('/approval/packages',undefined,operator,'GET')).status,401);
 const list=await x.request('/approval/packages',undefined,candidate,'GET');assert.equal(list.body.packages[0].id,p.id);assert.equal(list.body.packages[0].snapshot,undefined);
 const page=await x.request('/review',undefined,'','GET');assert.equal(page.status,200);assert.equal(page.body.includes(candidate),false);assert.equal(page.body.includes('localStorage'),false);
 assert.equal(x.sent.length,0);
});
test('employment system references are rejected in messages and documents',async t=>{
 const x=await setup(t);assert.equal((await x.create({text:'I built job-search-agent to automate my job search. Please review my attached application.'})).status,409);
 fs.writeFileSync(x.html,'<p>'+ 'Professional experience with Double Offer OS. '.repeat(8)+'</p>');assert.equal((await x.create()).status,409);assert.equal(x.sent.length,0);
});
