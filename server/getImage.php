<?php
$i=mt_rand(1,3);
$fileName='p'.$i.'.jpg';
header('Content-type:image/png');
echo file_get_contents('images/'.$fileName);
?>
