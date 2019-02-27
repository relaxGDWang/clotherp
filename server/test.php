<?php
sleep(1);
header("Content-Type:application/json; charset=utf-8");
$type=$_POST['type'];
$out=array(
    'success'=>true,
    'message'=>'',
    'data'=>array(),
);

$dataList=array();
$dataList[0]=array(
	'no'=>'001',
	'sex'=>'male',
	'name'=>'relax Wang'
);
$dataList[1]=array(
	'no'=>'002',
	'sex'=>'female',
	'name'=>'pan Gu'
);
$dataList[2]=array(
	'no'=>'003',
	'sex'=>'female',
	'name'=>'pay Shell'
);

if ($type==='list'){
	$out['data']=$dataList;
}else if($type==='del'){
	$no=$_POST['no'];
	$count=-1;
	$result=array();
	for ($i=0; $i<count($dataList); $i++){
		if ($dataList[$i]['no']!==$no){
			$count++;
			$result[$count]=$dataList[$i];
		}
	}
	$out['data']=$result;
}
echo json_encode($out);
?>
