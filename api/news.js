const {json,requireAdmin,github}=require("./_lib");
const repo=process.env.GITHUB_REPOSITORY||"echscoregroup/echs-help-24x7";
const branch=process.env.GITHUB_BRANCH||"2.0-development";
const path="/repos/"+repo+"/contents/news-data.json";
module.exports=async(req,res)=>{
  if(req.method!=="POST")return res.status(405).end();
  const admin=requireAdmin(req,res);if(!admin)return;
  try{
    let raw=await github(path+"?ref="+encodeURIComponent(branch),admin.token);
    let current={schemaVersion:"2.0",items:[]};
    try{current=JSON.parse(Buffer.from(raw.content,"base64").toString("utf8"));}catch{}
    if(!current||!Array.isArray(current.items))current={schemaVersion:"2.0",items:[]};
    const {date,headline,body}=req.body||{};
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||"")))return json(res,400,{ok:false,error:"Enter a valid news date."});
    const [y,m,d]=date.split("-").map(Number);const dt=new Date(Date.UTC(y,m-1,d));
    if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)return json(res,400,{ok:false,error:"Enter a valid calendar date."});
    if(typeof headline!=="string"||!headline.trim()||headline.length>180)return json(res,400,{ok:false,error:"Enter a headline of up to 180 characters."});
    if(typeof body!=="string"||!body.trim()||body.length>5000)return json(res,400,{ok:false,error:"Enter news content of up to 5,000 characters."});
    const item={id:crypto.randomUUID(),date,headline:headline.trim(),body:body.trim(),status:"published",publishedAt:new Date().toISOString()};
    current.items.unshift(item);
    current.items.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const content=Buffer.from(JSON.stringify({schemaVersion:"2.0",items:current.items},null,2)+"\n").toString("base64");
    const result=await github(path,admin.token,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"Publish website news: "+item.headline,content,sha:raw.sha,branch})});
    return json(res,200,{ok:true,item,commit:result.commit&&result.commit.html_url});
  }catch(e){return json(res,502,{ok:false,error:"News was not published. "+e.message});}
};