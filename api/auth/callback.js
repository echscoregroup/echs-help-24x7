const {json,cookie,clearCookie,seal,github}=require("../_lib");
module.exports=async(req,res)=>{
  if(req.method!=="GET")return res.status(405).end();
  const stateCookie=(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("hh_oauth_state="));
  const expected=stateCookie?stateCookie.slice("hh_oauth_state=".length):"";
  const {code,state,error}=req.query||{};
  clearCookie(res,"hh_oauth_state");
  if(error||!code||!state||!expected||state!==expected)return res.status(400).send("Sign-in was cancelled or could not be verified. Please try again.");
  try{
    const tokenResponse=await fetch("https://github.com/login/oauth/access_token",{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json"},body:JSON.stringify({client_id:process.env.GITHUB_APP_CLIENT_ID,client_secret:process.env.GITHUB_APP_CLIENT_SECRET,code})});
    const tokenData=await tokenResponse.json();
    if(!tokenResponse.ok||!tokenData.access_token)throw new Error("GitHub sign-in did not return an access token.");
    const user=await github("/user",tokenData.access_token);
    const allowed=String(process.env.ADMIN_GITHUB_LOGIN||"").toLowerCase();
    if(!allowed||String(user.login||"").toLowerCase()!==allowed)return res.status(403).send("This GitHub account is not authorised to publish news.");
    cookie(res,"hh_admin_session",seal({token:tokenData.access_token,login:user.login.toLowerCase(),exp:Date.now()+8*60*60*1000}),8*60*60);
    res.status(302).setHeader("Location","/news-admin-secure.html").end();
  }catch(e){res.status(502).send("Administrator sign-in failed: "+e.message);}
};