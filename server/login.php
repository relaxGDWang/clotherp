<?php
sleep(1);
header("Content-Type:application/json; charset=utf-8");
$telnumber=$_POST['mobile'];
$password=$_POST['password'];
$out=array(
    'success'=>true,
    'message'=>'',
    'data'=>array(),
);
if ($password!=='123456'){
    $out['success']=false;
    $out['message']="手机号码或者登录密码错误";
}else{
	$out['data']['api_token']='63650187dbe2a41ccb645bc858bd4866';
    $out['data']['mobile']=$telnumber;
	$out['data']['name']='张三丰';
}
echo json_encode($out);
?>
