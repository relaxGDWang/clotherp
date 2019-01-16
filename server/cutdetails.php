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
		case 60:
			$out='{"success":true,"data":{"bolt_id":66,"bolt_no":"190116-A53HAXAG-2","current_length":80,"cut_length":16,"status":"\u5206\u914d","defect_type":null,"defects":[{"bolt_id":60,"start":0,"end":13,"length":13,"type":"\u7455\u75b5\u70b9"},{"bolt_id":61,"start":13,"end":38,"length":25,"type":"\u7455\u75b5\u70b9"}],"cutouts":[],"splits":[{"bolt_id":60,"bolt_no":"190116-A53HAXAG-2-1","current_length":80,"cut_length":13,"status":"\u5206\u914d","defect_type":"\u7455\u75b5\u70b9","order":"","order_length":"","purchaser":""},{"bolt_id":61,"bolt_no":"190116-A53HAXAG-2-1","current_length":80,"cut_length":25,"status":"\u5206\u914d","defect_type":"\u7455\u75b5\u70b9","order":"","order_length":"","purchaser":""},{"bolt_id":66,"bolt_no":"190116-A53HAXAG-2-3","current_length":80,"cut_length":16,"status":"\u5206\u914d","defect_type":null,"order":"201901162634","order_length":16,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":69,"bolt_no":"190116-A53HAXAG-2-4","current_length":80,"cut_length":1,"status":"\u5206\u914d","defect_type":null,"order":"201901162634","order_length":1,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":70,"bolt_no":"190116-A53HAXAG-2-5","current_length":80,"cut_length":6,"status":"\u5206\u914d","defect_type":null,"order":"201901167465","order_length":6,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":73,"bolt_no":"190116-A53HAXAG-2-6","current_length":80,"cut_length":0,"status":"\u5206\u914d","defect_type":null,"order":"201901169488","order_length":0,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":82,"bolt_no":"190116-A53HAXAG-2-7","current_length":80,"cut_length":2,"status":"\u5206\u914d","defect_type":null,"order":"201901165611","order_length":2,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"}],"order_length":16,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},"message":"success"}';
			break;
		case 67:
			$out='{"success":true,"data":{"bolt_id":67,"bolt_no":"190116-HANAU93N-3","current_length":80,"cut_length":16,"status":"\u5206\u914d","defect_type":null,"defects":[{"bolt_id":48,"start":0,"end":23,"length":23,"type":"\u7455\u75b5\u70b9"},{"bolt_id":49,"start":23,"end":36,"length":13,"type":"\u7455\u75b5\u70b9"}],"cutouts":[],"splits":[{"bolt_id":48,"bolt_no":"190116-HANAU93N-3-1","length":23,"order":""},{"bolt_id":49,"bolt_no":"190116-HANAU93N-3-1","length":13,"order":""},{"bolt_id":67,"bolt_no":"190116-HANAU93N-3-3","length":16,"order":"201901162634"},{"bolt_id":83,"bolt_no":"190116-HANAU93N-3-4","length":5,"order":"201901165611"},{"bolt_id":84,"bolt_no":"190116-HANAU93N-3-5","length":4,"order":"201901162977"}],"order_length":16,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},"message":"success"}';
			break;
		default:
			$out='{"success":true,"data":{"bolt_id":66,"bolt_no":"190116-A53HAXAG-2","current_length":80,"cut_length":16,"status":"\u5206\u914d","defect_type":null,"defects":[{"bolt_id":60,"start":0,"end":13,"length":13,"type":"\u7455\u75b5\u70b9"},{"bolt_id":61,"start":13,"end":38,"length":25,"type":"\u7455\u75b5\u70b9"}],"cutouts":[],"splits":[{"bolt_id":60,"bolt_no":"190116-A53HAXAG-2-1","current_length":80,"cut_length":13,"status":"\u5206\u914d","defect_type":"\u7455\u75b5\u70b9","order":"","order_length":"","purchaser":""},{"bolt_id":61,"bolt_no":"190116-A53HAXAG-2-1","current_length":80,"cut_length":25,"status":"\u5206\u914d","defect_type":"\u7455\u75b5\u70b9","order":"","order_length":"","purchaser":""},{"bolt_id":66,"bolt_no":"190116-A53HAXAG-2-3","current_length":80,"cut_length":16,"status":"\u5206\u914d","defect_type":null,"order":"201901162634","order_length":16,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":69,"bolt_no":"190116-A53HAXAG-2-4","current_length":80,"cut_length":1,"status":"\u5206\u914d","defect_type":null,"order":"201901162634","order_length":1,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":70,"bolt_no":"190116-A53HAXAG-2-5","current_length":80,"cut_length":6,"status":"\u5206\u914d","defect_type":null,"order":"201901167465","order_length":6,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":73,"bolt_no":"190116-A53HAXAG-2-6","current_length":80,"cut_length":0,"status":"\u5206\u914d","defect_type":null,"order":"201901169488","order_length":0,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},{"bolt_id":82,"bolt_no":"190116-A53HAXAG-2-7","current_length":80,"cut_length":2,"status":"\u5206\u914d","defect_type":null,"order":"201901165611","order_length":2,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"}],"order_length":16,"purchaser":"\u6b27\u96c5\u5899\u5e03\u6709\u9650\u516c\u53f8"},"message":"success"}';
	}
}
if (is_string($out)){
	echo $out;
}else{
	echo json_encode($out);
}
?>