const crypto = require("node:crypto");

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
function cookie(res, name, value, maxAge) {
  res.setHeader("Set-Cookie", name+"="+value+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+maxAge);
}
function clearCookie(res,name){res.setHeader("Set-Cookie",name+"=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");}
function secret(){if(!process.env.SESSION_SECRET)throw new Error("SESSION_SECRET is not configured");return crypto.createHash("sha256").update(process.env.SESSION_SECRET).digest();}
function seal(value){
  const iv=crypto.randomBytes(12),c=crypto.createCipheriv("aes-256-gcm",secret(),iv);
  const encrypted=Buffer.concat([c.update(JSON.stringify(value),"utf8"),c.final()]);
  return [iv.toString("base64url"),c.getAuthTag().toString("base64url"),encrypted.toString("base64url")].join(".");
}
function unseal(value){
  const [iv,tag,data]=String(value||"").split(".");
  if(!iv||!tag||!data) return null;
  try{const d=crypto.createDecipheriv("aes-256-gcm",secret(),Buffer.from(iv,"base64url"));d.setAuthTag(Buffer.from(tag,"base64url"));return JSON.parse(Buffer.concat([d.update(Buffer.from(data,"base64url")),d.final()]).toString("utf8"));}catch{return null;}
}
function session(req){const raw=(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("hh_admin_session="));return raw?unseal(raw.slice("hh_admin_session=".length)):null;}
function requireAdmin(req,res){
  const s=session(req);
  if(!s||!s.token||s.login!==String(process.env.ADMIN_GITHUB_LOGIN||"").toLowerCase()||s.exp<Date.now()) {json(res,401,{ok:false,error:"Please sign in with the authorised administrator account."});return null;}
  return s;
}
async function github(path,token,options={}){
  const r=await fetch("https://api.github.com"+path,{...options,headers:{Accept:"application/vnd.github+json",Authorization:"Bearer "+token,"X-GitHub-Api-Version":"2022-11-28",...(options.headers||{})}});
  const body=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(body.message||("GitHub request failed: "+r.status));
  return body;
}
module.exports={json,cookie,clearCookie,seal,session,requireAdmin,github};