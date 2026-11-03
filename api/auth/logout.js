const {json,clearCookie}=require("../_lib");
module.exports=(req,res)=>{
  if(req.method!=="POST")return res.status(405).end();
  clearCookie(res,"hh_admin_session");
  return json(res,200,{ok:true});
};