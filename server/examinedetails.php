<?php
//sleep(1);
header("Content-Type:application/json; charset=utf-8");

$out=array(
    'success'=>true,
    'message'=>'',
    'data'=>array(),
);

if (!isset($_GET['bolt_id'])){
	$out['success']=false;
	$out['message']='缺少编号信息';
}else{
	$id=$_GET['bolt_id'];
	switch($id){
		case 2:
			$out='{"success":true,"data":{"bolt_id":2,"init_bolt_id":2,"bolt_no":"190118-AMX12312-2","current_length":80,"cut_length":80,"status":"\u5df2\u5165\u5e93","position":"1#-01, 1#-02","craft":"\u751f\u80da\u5e03","defect_type":null,"defect_label":null,"defects":[],"cutouts":[],"splits":[]},"message":"success"}';
			break;
		case 3:
			$out='{"success":true,"data":{"bolt_id":3,"init_bolt_id":3,"bolt_no":"190118-HANAU93N-1","current_length":80,"cut_length":80,"status":"\u5df2\u5165\u5e93","position":"1#-03, 2#-01","craft":"\u751f\u80da\u5e03","defect_type":null,"defect_label":null,"defects":[],"cutouts":[],"splits":[]},"message":"success"}';
			break;
		case 4:
			$out='{"success":true,"data":{"bolt_id":4,"init_bolt_id":4,"bolt_no":"190118-HANAU93N-2","current_length":80,"cut_length":55,"status":"\u5df2\u5165\u5e93","position":"1#-03, 2#-01","craft":"\u751f\u80da\u5e03","defect_type":null,"defect_label":null,"defects":[{"bolt_id":12,"start":0,"end":25,"length":25,"defect_type":"dot","defect_label":"\u7455\u75b5\u70b9"}],"cutouts":[],"splits":[{"bolt_id":12,"bolt_no":"190118-HANAU93N-2-1","current_length":80,"cut_length":25,"status":"\u5206\u914d","defect_type":"\u7455\u75b5\u70b9","order":"","order_length":"","purchaser":""}]},"message":"success"}';
			break;
		default:
			$out['success']=false;
			$out['message']='没有找到任务的详细信息数据';
	}
}
if (is_string($out)){
	echo $out;
}else{
	echo json_encode($out);
}
?>