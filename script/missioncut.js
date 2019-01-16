var vu=new Vue({
    el: '#app',
    data:{
        search:{
            listType: 'doing'   //doing,finished
        },
        username: '',
        UI:{
            listHeight: 100,
            bottomListHeight: 100,
            len: 0,
            perLen: 10,
            direction: 'right'
        },
        editObject: '',
        mission: [], //任务细分数组，ajax直接返回
        missionKey: {}, //bolt_id与数组index对应关系
        clothDetails: {}  //布匹的裁剪任务，以bolt_no作为索引，结构 defects[疵点列表数组] cutouts[事件记录数组] splits[裁剪分段数组] list[以bolt_id作为索引的对象，值为splits的数组index] first[起始裁剪bolt_id] viewObj[当前查看的分段信息] product[对应的商品编号]
    },
    computed:{
        getMark: function(){
            var loopCount=Math.ceil(this.UI.len/this.UI.perLen);
            var result=[];
            for (var i=0; i<loopCount; i++){
                result.push(i*this.UI.perLen);
            }
            result.push(this.UI.len);
            return result;
        }
    },
    methods:{
        getList: function(){  //获得任务列表
            ajax.send({
                url: PATH.missionCut,
                data:{status: this.search.listType},
                success:function(data){
                    dialog.close('loading');
                    vu.mission=[];
                    for (var i=0; i<data.length; i++){
                        DFG.solve('cutlist', data[i]);
                        vu.mission.push(data[i]);
                        vu.missionKey[data[i]['bolt_id']]=i;
                    }
                }
            });
        },
        //bid 每个裁剪分段的编号 bno 每个布匹的编号
        openDetails: function(bid){
            var keyStr=this.mission[this.missionKey[bid]].bolt_no;
            var dialogConfig={
                openCallback: function(){
                    setTimeout(function(){
                        vu.redrawCloth();
                        vu.redrawClothBlock();
                    },100);
                },
                closeCallback: function(){
                    vu.editObject='';
                }
            };
            if (this.clothDetails[keyStr]!==undefined){
                this.editObject=this.clothDetails[keyStr];
                this.setViewObject(this.editObject, bid);
                this._setColthLen();
                dialog.open('opDetails',dialogConfig);
            }else{
                ajax.send({
                    url: PATH.missionCutDetails,
                    data:{bolt_id: bid},
                    success:function(data){
                        dialog.close('loading');
                        var keyStr=data.bolt_no;
                        var bidStr=data.bolt_id;
                        vu._solveCutData(keyStr, data);
                        vu.editObject=vu.clothDetails[keyStr];
                        vu.setViewObject(vu.editObject, bidStr);
                        vu._setColthLen();
                        dialog.open('opDetails',dialogConfig);
                    }
                });
            }
        },
        _solveCutData: function(key, data){  //按详细信息加工成可界面处理数据
            var temp=this.clothDetails[key], i;
            if (!temp) temp=this.clothDetails[key]={};
            temp.defects=data.defects;
            temp.cutouts=data.cutouts;
            temp.splits=data.splits;
            temp.list={};
            temp.first='';
            temp.viewObj='';
            if (temp.splits.length>0) temp.first=temp.splits[0].bolt_id;
            for (i=0; i<temp.splits.length; i++){
                temp.list[temp.splits[i].bolt_id]=i;
            }
            var index=this.missionKey[data.bolt_id];
            temp.product=this.mission[index].product_code;
            temp.bolt=this.mission[index].bolt_no;
            temp.position=this.mission[index].position;
        },
        setViewObject: function(nowObject, bid){  //设置当前查看的分段点信息
            if (bid) {
                nowObject.viewObj = nowObject.splits[nowObject.list[bid]];
            }else{
                nowObject.viewObj = nowObject.splits[nowObject.list[nowObject.first]];
            }
        },
        _setColthLen: function(){   //设置用于显示的当前布长
            if (this.editObject){
                var first=this.editObject.first;
                if (first){
                    var index=this.editObject.list[first];
                    this.UI.len=this.editObject.splits[index].current_length;
                    return;
                }
            }
            this.UI.len=0;
        },
        getTypeString: function(itemObject){   //获得当前裁剪端的分类名称
            if (itemObject.order){
                return 'customer';
            }else if(itemObject.defect_type && itemObject.defect_type.indexOf('瑕疵')>=0){
                return 'flaw';
            }else{
                return 'normal';
            }
        },
        askFinish: function(){
            //检测完整性
            dialog.open('information',{
                content: '是否完成当前裁剪操作？',
                closeCallback: function(id, dialogType, buttonType){
                    if (buttonType==='sure') vu.doFinish();
                }
            });
        },
        doFinish: function(){
            ajax.send({
                url: PATH.missionCutFinished,
                method: 'post',
                data:{bolt_id: vu.editObject.viewObj.bolt_id},
                success:function(data){
                    dialog.close('loading');
                    //删除任务列表中的对应项
                    var id=vu.editObject.viewObj.bolt_id;
                    var index=vu.missionKey[id];
                    vu.mission.splice(index,1);
                    //delete vu.missionKey[id];
                    if (data.splits.length===0){
                        dialog.open('information',{
                            content: '当前布匹上的裁剪任务已经全部处理完毕!',
                            closeCallback: function(){
                                dialog.close('opDetails');
                            }
                        });
                        return;
                    }
                    var keyStr=data.bolt_no;
                    var bidStr=data.bolt_id;
                    vu._solveCutData(keyStr, data);
                    vu.editObject=vu.clothDetails[keyStr];
                    vu.setViewObject(vu.editObject, '');
                    vu._setColthLen();
                    dialog.open('resultShow',{content:'当前裁剪操作已成功！'});
                    //重新绘制概览图
                    setTimeout(function(){
                        vu.redrawCloth();
                        vu.redrawClothBlock();
                    },100);
                }
            });
        },
        tableRowClassName: function({row, rowIndex}){
            if (row.id===this.nowEdit){
                return 'sel';
            }else{
                return '';
            }
        },
        redrawCloth: function(){  //绘制布匹概览
            var len=$('#cloth').width()-1;
            var pm=len/this.UI.len;
            var tempArray=$('#ruler span');
            var direction=this.UI.direction;
            var i,pos1,pos2,widthNum;
            for (i=0; i<tempArray.length; i++){
                pos1=$(tempArray[i]).attr('pos');
                $(tempArray[i]).css(direction, pm*pos1);
            }
            tempArray=$('#cloth .flaw');
            for (i=0; i<tempArray.length; i++){
                pos1=$(tempArray[i]).attr('start');
                pos2=$(tempArray[i]).attr('end');
                widthNum=(pos2-pos1)*pm || 1;
                $(tempArray[i]).css(direction, pm*pos1).css('width', widthNum);
            }
        },
        redrawClothBlock: function(){   //绘制当前裁剪块
            if (!this.editObject) return;
            var len=$('#cloth').width()-1;
            var pm=len/this.UI.len;
            var i, start=0, widthNum;
            for (i=0; i<this.editObject.splits.length; i++){
                if (this.editObject.splits[i].bolt_id===this.editObject.viewObj.bolt_id){
                    break;
                }
                start+=this.editObject.splits[i].cut_length;
            }
            widthNum=this.editObject.viewObj.cut_length*pm || 1;
            $('#cloth .nowBlock').css(this.UI.direction, start*pm).css('width', widthNum);
            $('#cloth .clip').css(this.UI.direction, start*pm+widthNum);
        }
    },
    beforeMount: function () {
        var temp=JSON.parse(localStorage.getItem(CFG.admin));
        this.username=temp.name;
    }
});

var dialog=relaxDialog();
var ajax=relaxAJAX({
    type: 'get',
    contentType: CFG.JDTYPE,
    formater: CFG.ajaxFormater,
    checker: CFG.ajaxReturnDo,
    before: function(){
        dialog.open('loading');
    },
    error: function(code, msg){
        dialog.close('loading');
        dialog.open('information',{content:msg});
    }
});

$(function(){
    var timeID, body=$('body');
    $(window).resize(function(){
        if (timeID){
            clearTimeout(timeID);
            timeID='';
        }
        timeID=setTimeout(function(){
            fitUI();
        },100);
    });
    fitUI('first');
    vu.getList();

    function fitUI(flag){
        var H=body.height();
        vu.UI.listHeight=H-70;
        vu.UI.bottomListHeight=H-615;
        if (flag===undefined){
            vu.redrawCloth();
            vu.redrawClothBlock();
        }
    }
});
