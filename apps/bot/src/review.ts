// Candidate credential remains in this page's memory; no credential is embedded in its source.
const script = `
let credential = '', selected = null, urls = [];
const el = id => document.getElementById(id);
function clearPackage() { selected = null; for (const u of urls) URL.revokeObjectURL(u); urls = []; el('details').replaceChildren(); el('approve').disabled = true; el('reject').disabled = true; }
async function api(path, body) {
 const response = await fetch(path, {method:body ? 'POST' : 'GET', cache:'no-store', headers:{Authorization:'Bearer '+credential,'Content-Type':'application/json'}, ...(body ? {body:JSON.stringify(body)} : {})});
 const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to load review'); return data;
}
function line(label, value) { const p = document.createElement('p'); const b = document.createElement('strong'); b.textContent=label+': '; p.append(b,document.createTextNode(String(value ?? ''))); el('details').append(p); }
async function show(id) {
 clearPackage(); const data = await api('/approval/packages/'+encodeURIComponent(id)); const p = data.package, s=p.snapshot;
 line('Company',s.company); line('Role',s.title); line('Recipient',s.toEmail); line('Subject',s.subject); line('Exact message',s.text); line('Version',p.version); line('State',p.state); line('Digest',p.digest);
 for (const a of s.attachments) { const bytes=Uint8Array.from(atob(a.contentBase64), c=>c.charCodeAt(0)); const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})); urls.push(url); const frame=document.createElement('iframe'); frame.src=url; frame.title=a.filename; const label=document.createElement('p'); label.textContent=a.filename; el('details').append(label,frame); }
 line('Audit',JSON.stringify(data.audit,null,2)); selected=p; el('approve').disabled=p.state!=='PENDING'; el('reject').disabled=p.state!=='PENDING';
}
async function refresh() {
 const data=await api('/approval/packages'); el('queue').replaceChildren();
 el('notice').textContent=data.employerSendingEnabled ? 'Approval records your decision. This page never sends an application.' : 'Employer email sending is disabled. Approval records your decision only.';
 for (const p of data.packages) { const b=document.createElement('button');b.textContent=p.company+' — '+p.title+' — v'+p.version+' — '+p.state;b.onclick=()=>show(p.id).catch(fail);el('queue').append(b); }
 if (!data.packages.length) el('queue').textContent='No packages are available in this service. Local chat packets are separate until imported.';
}
function fail(e) { el('status').textContent=e.message; }
el('login').onclick=async()=>{credential=el('credential').value;el('credential').value='';try {await refresh();el('status').textContent='Signed in for this page session.'; const id=new URLSearchParams(location.search).get('packageId');if(id) await show(id);}catch(e){credential='';clearPackage();el('queue').replaceChildren();fail(e);}};
el('logout').onclick=()=>{credential='';clearPackage();el('queue').replaceChildren();el('status').textContent='Signed out.';};
for (const decision of ['approve','reject']) el(decision).onclick=async()=>{if(!selected)return;const p=selected;el('approve').disabled=true;el('reject').disabled=true;try {await api('/approval/packages/'+encodeURIComponent(p.id)+'/decision',{digest:p.digest,decision});await refresh();await show(p.id);el('status').textContent='Decision recorded. No application sent.';}catch(e){clearPackage();fail(e);}};
`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Maurice's application review</title><style>body{font:17px system-ui;max-width:1000px;margin:40px auto;padding:16px;background:#fafafa;color:#17202a}input,button{font:inherit;padding:12px;margin:5px}#queue button{display:block;text-align:left}p{white-space:pre-wrap;overflow-wrap:anywhere}iframe{width:100%;height:700px;border:1px solid #999}button:disabled{opacity:.5}</style></head><body><h1>Maurice's application review</h1><p>Review the recipient, message and both documents before recording a decision. Changed packages require a new decision.</p><label for="credential">Your private candidate credential</label><input type="password" id="credential" autocomplete="off"><button id="login">Sign in</button><button id="logout">Sign out</button><p role="status" id="status"></p><p id="notice"></p><h2>Packages</h2><div id="queue"></div><h2>Selected package</h2><div id="details"></div><button id="approve" disabled>Approve this exact version</button><button id="reject" disabled>Reject this version</button><script>${script}</script></body></html>`;
export const reviewPage = { html, script };
