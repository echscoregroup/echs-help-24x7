const crypto=require("node:crypto");
module.exports=(req,res)=>{
  if(req.method!=="GET")return res.status(405).end();
  const {GITHUB_APP_CLIENT_ID,APP_BASE_URL}=process.env;
  if(!GITHUB_APP_CLIENT_ID||!APP_BASE_URL)return res.status(503).send("Administrator sign-in is not configured yet.");
  const state=crypto.randomBytes(24).toString("hex");
  res.setHeader("Set-Cookie","hh_oauth_state="+state+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600");
  const u=new URL("https://github.com/login/oauth/authorize");
  u.searchParams.set("client_id",GITHUB_APP_CLIENT_ID);
  u.searchParams.set("redirect_uri",APP_BASE_URL.replace(/\/$/,"")+"/api/auth/callback");
  u.searchParams.set("state",state);
  u.searchParams.set("allow_signup","false");
  res.status(302).setHeader("Location",u.toString()).end();
};