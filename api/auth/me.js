const {json,session,clearCookie}=require("../_lib");
module.exports=(req,res)=>{
  if(req.method!=="GET")return res.status(405).end();
  const s=session(req);
  if(!s||s.exp<Date.now()||s.login!==String(process.env.ADMIN_GITHUB_LOGIN||"").toLowerCase()){clearCookie(res,"hh_admin_session");return json(res,200,{authenticated:false});}
  return json(res,200,{authenticated:true,login:s.login});
};