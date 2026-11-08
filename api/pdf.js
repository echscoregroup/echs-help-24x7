const crypto=require("node:crypto");
module.exports.config={api:{bodyParser:{sizeLimit:"6mb"}}};
const {json,requireAdmin,github}=require("./_lib");
const REPO="echscoregroup/echs-help-24x7";
const BRANCH="HH-WEBSITE-PUBLISHING-TEST-1.0.4";
function safeName(name){return String(name||"guide.pdf").normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(-100)||"guide.pdf";}
module.exports=async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin",process.env.PUBLIC_SITE_ORIGIN||"*");
  res.setHeader("Vary","Origin");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).end();
  const origin=req.headers.origin;
  if(origin){try{if(new URL(origin).host!==String(req.headers.host||"").split(":")[0]&&new URL(origin).host!==String(req.headers.host||""))return json(res,403,{ok:false,error:"Request origin not permitted."});}catch{return json(res,403,{ok:false,error:"Request origin not permitted."});}}
  const admin=requireAdmin(req,res);if(!admin)return;
  try{
    const {fileName,contentBase64}=req.body||{};
    if(typeof contentBase64!=="string"||!/^JVBERi0/.test(contentBase64))return json(res,400,{ok:false,error:"Select a valid PDF file."});
    const bytes=Buffer.from(contentBase64,"base64");
    if(bytes.length<8||bytes.length>4*1024*1024||bytes.subarray(0,5).toString()!=="%PDF-")return json(res,400,{ok:false,error:"PDF must be valid and no larger than 4 MB."});
    const name=Date.now()+"-"+crypto.randomBytes(4).toString("hex")+"-"+safeName(fileName);
    const path="published-files/"+name;
    const result=await github("/repos/"+REPO+"/contents/"+path,admin.token,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"Publish Situation–Solution PDF: "+name,content:bytes.toString("base64"),branch:BRANCH})});
    const fileUrl="https://raw.githubusercontent.com/"+REPO+"/"+encodeURIComponent(BRANCH)+"/"+path;
    return json(res,200,{ok:true,fileName:name,fileUrl,commit:result.commit&&result.commit.html_url});
  }catch(e){return json(res,502,{ok:false,error:"PDF upload failed: "+e.message});}
};
