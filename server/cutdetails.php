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
	$out['message']='缺少必要的参数';
}else{
	$id=$_GET['bolt_id'];
	switch($id){
		case 150:
			$out='{"success":true,"data":{"bolt_id":150,"init_bolt_id":30,"bolt_no":"190119-HANAU93N-9","current_length":80,"cut_length":5.1,"status":"\u5206\u914d","position":"1#-03, 2#-01","craft":"\u590d\u5408","defect_type":null,"defect_label":null,"defects":[{"bolt_id":63,"start":0,"end":12,"length":12,"defect_type":"dot","defect_label":"\u7455\u75b5\u70b9"},{"bolt_id":64,"start":12,"end":57,"length":25.7,"defect_type":"dot","defect_label":"\u7455\u75b5\u70b9"}],"cutouts":[],"splits":[{"bolt_id":63,"bolt_no":"190119-HANAU93N-9-1","current_length":80,"cut_length":12,"status":"\u5206\u914d","status_code":"cut","defect_type":"\u7455\u75b5\u70b9","order":"","order_length":"","purchaser":""},{"bolt_id":135,"bolt_no":"190119-HANAU93N-9-2-1","current_length":80,"cut_length":6.1,"status":"\u5206\u914d","status_code":"cut","defect_type":null,"order":"201901197252","order_length":6,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":138,"bolt_no":"190119-HANAU93N-9-2-2","current_length":80,"cut_length":8.1,"status":"\u5206\u914d","status_code":"cut","defect_type":null,"order":"201901191795","order_length":8,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":150,"bolt_no":"190119-HANAU93N-9-2-3","current_length":80,"cut_length":5.1,"status":"\u5206\u914d","status_code":"cut","defect_type":null,"order":"201901197443","order_length":5,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":64,"bolt_no":"190119-HANAU93N-9-2","current_length":80,"cut_length":25.7,"status":"\u5206\u914d","status_code":"cut","defect_type":"\u7455\u75b5\u70b9","order":"","order_length":"","purchaser":""},{"bolt_id":100,"bolt_no":"190119-HANAU93N-9-3","current_length":80,"cut_length":6.1,"status":"\u5206\u914d","status_code":"cut","defect_type":null,"order":"201901199687","order_length":6,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":123,"bolt_no":"190119-HANAU93N-9-4","current_length":80,"cut_length":1.1,"status":"\u5206\u914d","status_code":"cut","defect_type":null,"order":"201901198782","order_length":1,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"}],"order_length":5,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},"message":"success"}';
			break;
		default:
			$out['success']=false;
			$out['message']='无法找到该任务的详情';
	}
}
if (is_string($out)){
	echo $out;
}else{
	echo json_encode($out);
}
?>