const {json,requireAdmin,github}=require("./_lib");

const REPO="echscoregroup/echs-help-24x7";
const BRANCH="HH-WEBSITE-PUBLISHING-TEST-1.0.4";
const FILES={
  videos:"hh-video-library.json",
  situation:"hh-situation-solution.json"
};
function validOrigin(req){
  const origin=req.headers.origin;
  if(!origin)return req.method==="GET";
  try{return new URL(origin).host===String(req.headers.host||"").split(":")[0] || new URL(origin).host===String(req.headers.host||"");}
  catch{return false;}
}
function validPayload(type,data){
  if(type==="videos"){
    return Array.isArray(data)&&data.length<=200&&data.every(c=>c&&typeof c.category==="string"&&c.category.trim()&&Array.isArray(c.rows)&&c.rows.length<=500&&c.rows.every(v=>v&&typeof v.number==="string"&&typeof v.title==="string"&&/^https:\/\//i.test(v.url||"")));
  }
  return type==="situation"&&data&&Array.isArray(data.videos)&&Array.isArray(data.pdfs)&&data.videos.length<=500&&data.pdfs.length<=200&&data.videos.every(v=>v&&typeof v.number==="string"&&typeof v.title==="string"&&/^https:\/\//i.test(v.url||""))&&data.pdfs.every(p=>p&&typeof p.id==="string"&&typeof p.title==="string"&&typeof p.fileName==="string"&&(p.fileUrl===""||/^https:\/\//i.test(p.fileUrl||"")));
}
module.exports=async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", process.env.PUBLIC_SITE_ORIGIN||"*");
  res.setHeader("Vary","Origin");
  res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(204).end();
  const type=String(req.query.type||"");
  if(!Object.prototype.hasOwnProperty.call(FILES,type))return json(res,400,{ok:false,error:"Unknown publishing area."});
  if(req.method==="GET"){
    try{
      const url="https://raw.githubusercontent.com/"+REPO+"/"+encodeURIComponent(BRANCH)+"/"+FILES[type];
      const r=await fetch(url,{headers:{"Cache-Control":"no-cache"}});
      if(r.status===404)return json(res,200,{ok:true,found:false});
      if(!r.ok)throw new Error("Published content could not be read.");
      const data=await r.json();
      return json(res,200,{ok:true,found:true,data});
    }catch(e){return json(res,502,{ok:false,error:e.message});}
  }
  if(req.method!=="POST")return res.status(405).end();
  if(!validOrigin(req))return json(res,403,{ok:false,error:"Request origin not permitted."});
  const admin=requireAdmin(req,res);if(!admin)return;
  try{
    const data=req.body&&req.body.data;
    if(!validPayload(type,data))return json(res,400,{ok:false,error:"The submitted publishing data is incomplete or invalid."});
    const path="/repos/"+REPO+"/contents/"+FILES[type];
    let existing=null;
    try{existing=await github(path+"?ref="+encodeURIComponent(BRANCH),admin.token);}catch(e){if(!/not found/i.test(e.message))throw e;}
    const body={message:"Publish "+(type==="videos"?"Video Library":"Situation–Solution")+" website content",content:Buffer.from(JSON.stringify(data,null,2)+"\n").toString("base64"),branch:BRANCH};
    if(existing&&existing.sha)body.sha=existing.sha;
    const result=await github(path,admin.token,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    return json(res,200,{ok:true,commit:result.commit&&result.commit.html_url});
  }catch(e){return json(res,502,{ok:false,error:"Publishing failed: "+e.message});}
};
